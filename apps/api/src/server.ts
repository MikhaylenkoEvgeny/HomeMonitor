import cookie from "@fastify/cookie";
import cors from "@fastify/cors";
import websocket from "@fastify/websocket";
import Fastify from "fastify";
import { z } from "zod";
import {
  agentMessageSchema,
  cloudAckSchema,
  inviteSchema,
  roleSchema,
  type AgentMessage,
  type HomeEvent,
  type LiveMessage
} from "@homemonitor/types";
import { evaluateAlertRules } from "./alertRules.js";
import { AuthService } from "./auth.js";
import type { ApiConfig } from "./config.js";
import { HomeStore } from "./store.js";
import { sendTelegramAlert } from "./telegram.js";

interface WebSocketLike {
  send(data: string): void;
  close(): void;
  on(event: "message", listener: (data: Buffer | string) => void): void;
  on(event: "close" | "error", listener: () => void): void;
}

export async function buildServer(config: ApiConfig) {
  const app = Fastify({
    logger: {
      level: process.env.LOG_LEVEL ?? "info"
    }
  });
  const store = new HomeStore();
  const auth = new AuthService();
  const liveClients = new Set<WebSocketLike>();

  await auth.seedOwner(config.bootstrapOwnerEmail, config.bootstrapOwnerPassword);

  await app.register(cors, {
    origin: config.webOrigin,
    credentials: true
  });
  await app.register(cookie, {
    secret: config.sessionSecret
  });
  await app.register(websocket);

  app.get("/health", async () => ({
    ok: true,
    service: "homemonitor-api",
    time: new Date().toISOString()
  }));

  app.get("/api/bootstrap/status", async () => ({
    ownerExists: auth.ownerExists()
  }));

  app.post("/api/bootstrap/owner", async (request, reply) => {
    const body = z
      .object({
        email: z.string().email(),
        password: z.string().min(10)
      })
      .parse(request.body);

    const owner = await auth.bootstrapOwner(body.email, body.password);
    return reply.code(201).send(owner);
  });

  app.post("/api/auth/login", async (request, reply) => {
    const body = z
      .object({
        email: z.string().email(),
        password: z.string().min(1)
      })
      .parse(request.body);

    const session = await auth.login(body.email, body.password);
    reply.setCookie("hm_session", session.token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      expires: new Date(session.expiresAt)
    });
    return { role: session.role, expiresAt: session.expiresAt };
  });

  app.get("/api/home", async () => store.snapshot());
  app.get("/api/timeline", async () => ({ events: store.timeline() }));
  app.get("/api/devices", async () => ({ devices: store.listDevices() }));

  app.get("/api/invites", async () => ({ invites: auth.listInvites() }));
  app.post("/api/invites", async (request, reply) => {
    const body = z
      .object({
        email: z.string().email(),
        role: roleSchema
      })
      .parse(request.body);

    const invite = inviteSchema.parse(auth.createInvite(body.email, body.role));
    return reply.code(201).send(invite);
  });

  app.get("/api/notification-settings", async () => ({
    channels: [
      { id: "web", label: "Web", enabled: true },
      { id: "telegram", label: "Telegram", enabled: Boolean(config.telegramBotToken && config.telegramChatId) }
    ]
  }));

  app.get("/live", { websocket: true }, (socket) => {
    const client = socket as unknown as WebSocketLike;
    liveClients.add(client);
    sendLive(client, { type: "snapshot", snapshot: store.snapshot() });

    client.on("close", () => {
      liveClients.delete(client);
    });
    client.on("error", () => {
      liveClients.delete(client);
    });
  });

  app.get("/agent", { websocket: true }, (socket) => {
    const client = socket as unknown as WebSocketLike;
    let authenticated = false;
    let agentId = "unknown-agent";

    client.on("message", (data) => {
      try {
        const message = agentMessageSchema.parse(JSON.parse(data.toString()));
        if (message.type === "hello") {
          if (message.token !== config.agentToken) {
            client.close();
            return;
          }

          authenticated = true;
          agentId = message.agentId;
          app.log.info({ agentId }, "agent connected");
          broadcast({ type: "snapshot.updated", snapshot: store.snapshot() });
          return;
        }

        if (!authenticated) {
          client.close();
          return;
        }

        handleAgentMessage(message);
        sendAck(client, message.sequence, "ok");
      } catch (error) {
        app.log.warn({ error }, "invalid agent message");
        client.close();
      }
    });

    client.on("close", () => {
      app.log.info({ agentId }, "agent disconnected");
    });
  });

  function handleAgentMessage(message: AgentMessage): void {
    if (message.type === "heartbeat") {
      store.applyHeartbeat(message);
    }

    if (message.type === "telemetry.batch") {
      store.applyTelemetry(message.points);
    }

    if (message.type === "event") {
      store.addEvent(message.event);
      maybeNotify(message.event);
      broadcast({ type: "alert", event: message.event });
    }

    const snapshot = store.snapshot();
    const ruleEvents = evaluateAlertRules({
      homeId: snapshot.homeId,
      now: new Date(),
      rooms: snapshot.rooms,
      devices: snapshot.devices
    });
    for (const event of ruleEvents.slice(0, 3)) {
      store.addEvent(event);
      maybeNotify(event);
    }

    broadcast({ type: "snapshot.updated", snapshot: store.snapshot() });
  }

  function maybeNotify(event: HomeEvent): void {
    if (event.severity === "info") {
      return;
    }

    void sendTelegramAlert(
      {
        botToken: config.telegramBotToken,
        chatId: config.telegramChatId
      },
      event
    ).catch((error) => app.log.warn({ error }, "telegram notification failed"));
  }

  function broadcast(message: LiveMessage): void {
    const payload = JSON.stringify(message);
    for (const client of liveClients) {
      try {
        client.send(payload);
      } catch {
        liveClients.delete(client);
      }
    }
  }

  return app;
}

function sendAck(client: WebSocketLike, sequence: number, status: "ok" | "error", reason?: string): void {
  const ack = cloudAckSchema.parse({
    type: "ack",
    sequence,
    receivedAt: new Date().toISOString(),
    status,
    reason
  });
  client.send(JSON.stringify(ack));
}

function sendLive(client: WebSocketLike, message: LiveMessage): void {
  client.send(JSON.stringify(message));
}
