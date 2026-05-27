import WebSocket from "ws";
import type { AgentMessage, Device, TelemetryPoint } from "@homemonitor/types";

const cloudWsUrl = process.env.HOMEMONITOR_CLOUD_WS ?? "ws://127.0.0.1:4000/agent";
const homeId = process.env.HOMEMONITOR_HOME_ID ?? "home-main";
const agentId = process.env.HOMEMONITOR_AGENT_ID ?? "sim-direct-01";
const token = process.env.HOMEMONITOR_AGENT_TOKEN ?? "dev-agent-token";
const intervalMs = Number.parseInt(process.env.HOMEMONITOR_SIM_INTERVAL_MS ?? "1500", 10);
let sequence = 0;

const socket = new WebSocket(cloudWsUrl);

socket.on("open", () => {
  send({
    type: "hello",
    agentId,
    homeId,
    token,
    softwareVersion: "0.1.0",
    capabilities: ["direct-simulator"]
  });

  setInterval(() => {
    const sentAt = new Date().toISOString();
    send({
      type: "heartbeat",
      homeId,
      sequence: nextSequence(),
      sentAt,
      uptimeSec: process.uptime(),
      devices: simulatorDevices({ homeId, agentId }),
      network: {
        transport: "unknown"
      }
    });
    send({
      type: "telemetry.batch",
      sequence: nextSequence(),
      batchId: `sim-${Date.now()}`,
      sentAt,
      points: nextTelemetryBatch({ homeId, agentId })
    });
  }, intervalMs);
});

socket.on("message", (message) => {
  console.log(message.toString());
});

socket.on("error", (error) => {
  console.error(error);
  process.exitCode = 1;
});

function send(message: AgentMessage): void {
  socket.send(JSON.stringify(message));
}

function nextSequence(): number {
  sequence += 1;
  return sequence;
}

function simulatorDevices({ homeId: currentHomeId, agentId: currentAgentId }: { homeId: string; agentId: string }): Device[] {
  return [
    {
      id: currentAgentId,
      homeId: currentHomeId,
      roomId: "hall",
      name: "Direct simulator",
      kind: "simulator",
      status: "online",
      firmwareVersion: "sim-0.1.0",
      signalQuality: 0.86
    }
  ];
}

function nextTelemetryBatch({ homeId: currentHomeId, agentId: currentAgentId }: { homeId: string; agentId: string }): TelemetryPoint[] {
  const ts = new Date().toISOString();
  const active = Math.floor(Date.now() / 12_000) % 2 === 0;
  return [
    point(currentHomeId, "living", currentAgentId, ts, "presence", active ? 1 : 0, active ? 0.91 : 0.55),
    point(currentHomeId, "living", currentAgentId, ts, "motion", active && Math.random() > 0.25 ? 1 : 0, 0.82),
    point(currentHomeId, "living", currentAgentId, ts, "rssi", -52 - Math.random() * 10, 0.74),
    point(currentHomeId, "bedroom", currentAgentId, ts, "presence", active ? 0 : 1, active ? 0.5 : 0.84)
  ];
}

function point(
  currentHomeId: string,
  roomId: string,
  deviceId: string,
  ts: string,
  kind: TelemetryPoint["kind"],
  value: number,
  confidence: number
): TelemetryPoint {
  return {
    homeId: currentHomeId,
    roomId,
    deviceId,
    ts,
    kind,
    value,
    confidence,
    tags: {
      adapter: "direct-simulator"
    }
  };
}
