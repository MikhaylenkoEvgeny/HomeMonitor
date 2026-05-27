import WebSocket from "ws";
import { cloudAckSchema, type AgentMessage } from "@homemonitor/types";
import { loadAgentConfig } from "./config.js";
import { FileOutbox, type QueuedAgentMessage } from "./outbox.js";
import { maybeSyntheticEvent, nextTelemetryBatch, simulatorDevices } from "./simulatorAdapter.js";

const config = loadAgentConfig();
const outbox = FileOutbox.at(config.dataDir);
await outbox.open();

let sequence = 0;
let socket: WebSocket | undefined;
let connected = false;
let reconnectTimer: NodeJS.Timeout | undefined;
const startedAt = Date.now();

sequence = outbox.list().reduce((max, message) => Math.max(max, message.sequence), 0);
connect();

setInterval(() => {
  void produceMessages();
}, config.batchIntervalMs);

async function produceMessages(): Promise<void> {
  const sentAt = new Date().toISOString();
  await enqueueAndFlush({
    type: "heartbeat",
    homeId: config.homeId,
    sequence: nextSequence(),
    sentAt,
    uptimeSec: Math.floor((Date.now() - startedAt) / 1000),
    devices: simulatorDevices(config),
    network: {
      transport: "ethernet"
    }
  });

  await enqueueAndFlush({
    type: "telemetry.batch",
    sequence: nextSequence(),
    batchId: `batch-${Date.now()}`,
    sentAt,
    points: nextTelemetryBatch(config)
  });

  const event = maybeSyntheticEvent(config);
  if (event) {
    await enqueueAndFlush({
      type: "event",
      sequence: nextSequence(),
      event
    });
  }
}

function connect(): void {
  socket = new WebSocket(config.cloudWsUrl);

  socket.on("open", () => {
    connected = true;
    console.log(`Connected to ${config.cloudWsUrl}`);
    send({
      type: "hello",
      agentId: config.agentId,
      homeId: config.homeId,
      token: config.token,
      softwareVersion: "0.1.0",
      capabilities: ["simulator", "offline-outbox", "ack-retry"]
    });
    flush();
  });

  socket.on("message", (raw) => {
    const parsed = cloudAckSchema.safeParse(JSON.parse(raw.toString()));
    if (parsed.success && parsed.data.status === "ok") {
      void outbox.ack(parsed.data.sequence);
    }
  });

  socket.on("close", reconnectSoon);
  socket.on("error", (error) => {
    console.error("Agent connection error", error.message);
    reconnectSoon();
  });
}

function reconnectSoon(): void {
  connected = false;
  if (reconnectTimer) {
    return;
  }

  reconnectTimer = setTimeout(() => {
    reconnectTimer = undefined;
    console.log("Reconnecting to HomeMonitor cloud");
    connect();
  }, 2000);
}

async function enqueueAndFlush(message: QueuedAgentMessage): Promise<void> {
  await outbox.enqueue(message);
  flush();
}

function flush(): void {
  if (!connected || !socket || socket.readyState !== WebSocket.OPEN) {
    return;
  }

  for (const message of outbox.list()) {
    send(message);
  }
}

function send(message: AgentMessage): void {
  socket?.send(JSON.stringify(message));
}

function nextSequence(): number {
  sequence += 1;
  return sequence;
}
