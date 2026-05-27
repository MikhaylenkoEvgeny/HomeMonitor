import { z } from "zod";

export const isoDateSchema = z.string().datetime({ offset: true });

export const roleSchema = z.enum(["owner", "member", "viewer"]);
export type Role = z.infer<typeof roleSchema>;

export const roomKindSchema = z.enum([
  "living",
  "bedroom",
  "kitchen",
  "bathroom",
  "hall",
  "office",
  "lab",
  "other"
]);
export type RoomKind = z.infer<typeof roomKindSchema>;

export const deviceKindSchema = z.enum([
  "esp32-csi",
  "raspberry-pi",
  "ruview-node",
  "simulator",
  "unknown"
]);
export type DeviceKind = z.infer<typeof deviceKindSchema>;

export const deviceStatusSchema = z.enum(["online", "degraded", "offline"]);
export type DeviceStatus = z.infer<typeof deviceStatusSchema>;

export const telemetryKindSchema = z.enum([
  "presence",
  "motion",
  "rssi",
  "breathing_rate",
  "heart_rate",
  "fall_risk",
  "noise_floor",
  "csi_amplitude",
  "device_temperature",
  "device_uptime"
]);
export type TelemetryKind = z.infer<typeof telemetryKindSchema>;

export const eventKindSchema = z.enum([
  "presence_detected",
  "presence_cleared",
  "motion_detected",
  "fall_suspected",
  "device_online",
  "device_offline",
  "rule_triggered",
  "system"
]);
export type EventKind = z.infer<typeof eventKindSchema>;

export const alertSeveritySchema = z.enum(["info", "watch", "urgent"]);
export type AlertSeverity = z.infer<typeof alertSeveritySchema>;

export const roomSchema = z.object({
  id: z.string().min(1),
  homeId: z.string().min(1),
  name: z.string().min(1),
  kind: roomKindSchema,
  floor: z.number().int().default(1)
});
export type Room = z.infer<typeof roomSchema>;

export const deviceSchema = z.object({
  id: z.string().min(1),
  homeId: z.string().min(1),
  roomId: z.string().min(1).optional(),
  name: z.string().min(1),
  kind: deviceKindSchema,
  status: deviceStatusSchema,
  firmwareVersion: z.string().optional(),
  lastSeenAt: isoDateSchema.optional(),
  signalQuality: z.number().min(0).max(1).optional()
});
export type Device = z.infer<typeof deviceSchema>;

export const telemetryPointSchema = z.object({
  id: z.string().min(1).optional(),
  homeId: z.string().min(1),
  roomId: z.string().min(1),
  deviceId: z.string().min(1),
  ts: isoDateSchema,
  kind: telemetryKindSchema,
  value: z.number(),
  unit: z.string().optional(),
  confidence: z.number().min(0).max(1).optional(),
  tags: z.record(z.string(), z.string()).default({})
});
export type TelemetryPoint = z.infer<typeof telemetryPointSchema>;

export const csiObjectRefSchema = z.object({
  bucket: z.string().min(1),
  key: z.string().min(1),
  codec: z.enum(["jsonl.gz", "parquet", "raw"]).default("jsonl.gz"),
  sampleCount: z.number().int().nonnegative(),
  byteSize: z.number().int().nonnegative().optional(),
  sha256: z.string().optional()
});
export type CsiObjectRef = z.infer<typeof csiObjectRefSchema>;

export const homeEventSchema = z.object({
  id: z.string().min(1),
  homeId: z.string().min(1),
  roomId: z.string().min(1).optional(),
  deviceId: z.string().min(1).optional(),
  ts: isoDateSchema,
  kind: eventKindSchema,
  severity: alertSeveritySchema,
  title: z.string().min(1),
  message: z.string().min(1),
  acknowledgedAt: isoDateSchema.optional(),
  metadata: z.record(z.string(), z.unknown()).default({})
});
export type HomeEvent = z.infer<typeof homeEventSchema>;

export const roomStateSchema = z.object({
  room: roomSchema,
  present: z.boolean(),
  motion: z.boolean(),
  lastActivityAt: isoDateSchema.optional(),
  confidence: z.number().min(0).max(1),
  breathingRate: z.number().optional(),
  heartRate: z.number().optional(),
  signalQuality: z.number().min(0).max(1).optional()
});
export type RoomState = z.infer<typeof roomStateSchema>;

export const homeSnapshotSchema = z.object({
  homeId: z.string().min(1),
  generatedAt: isoDateSchema,
  mode: z.enum(["mock", "live"]).default("mock"),
  rooms: z.array(roomStateSchema),
  devices: z.array(deviceSchema),
  activeAlerts: z.array(homeEventSchema),
  recentEvents: z.array(homeEventSchema),
  summary: z.object({
    someoneHome: z.boolean(),
    activeRoomCount: z.number().int().nonnegative(),
    onlineDeviceCount: z.number().int().nonnegative(),
    urgentAlertCount: z.number().int().nonnegative()
  })
});
export type HomeSnapshot = z.infer<typeof homeSnapshotSchema>;

export const agentHelloSchema = z.object({
  type: z.literal("hello"),
  agentId: z.string().min(1),
  homeId: z.string().min(1),
  token: z.string().min(1),
  softwareVersion: z.string().min(1),
  capabilities: z.array(z.string()).default([])
});
export type AgentHello = z.infer<typeof agentHelloSchema>;

export const agentHeartbeatSchema = z.object({
  type: z.literal("heartbeat"),
  homeId: z.string().min(1),
  sequence: z.number().int().positive(),
  sentAt: isoDateSchema,
  uptimeSec: z.number().nonnegative(),
  devices: z.array(deviceSchema),
  network: z
    .object({
      ip: z.string().optional(),
      rssi: z.number().optional(),
      transport: z.enum(["wifi", "ethernet", "unknown"]).default("unknown")
    })
    .default({ transport: "unknown" })
});
export type AgentHeartbeat = z.infer<typeof agentHeartbeatSchema>;

export const telemetryBatchSchema = z.object({
  type: z.literal("telemetry.batch"),
  sequence: z.number().int().positive(),
  batchId: z.string().min(1),
  sentAt: isoDateSchema,
  points: z.array(telemetryPointSchema).min(1),
  csiObject: csiObjectRefSchema.optional()
});
export type TelemetryBatch = z.infer<typeof telemetryBatchSchema>;

export const agentEventSchema = z.object({
  type: z.literal("event"),
  sequence: z.number().int().positive(),
  event: homeEventSchema
});
export type AgentEvent = z.infer<typeof agentEventSchema>;

export const agentMessageSchema = z.discriminatedUnion("type", [
  agentHelloSchema,
  agentHeartbeatSchema,
  telemetryBatchSchema,
  agentEventSchema
]);
export type AgentMessage = z.infer<typeof agentMessageSchema>;

export const cloudAckSchema = z.object({
  type: z.literal("ack"),
  sequence: z.number().int().positive(),
  receivedAt: isoDateSchema,
  status: z.enum(["ok", "error"]),
  reason: z.string().optional()
});
export type CloudAck = z.infer<typeof cloudAckSchema>;

export const liveMessageSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("snapshot"),
    snapshot: homeSnapshotSchema
  }),
  z.object({
    type: z.literal("snapshot.updated"),
    snapshot: homeSnapshotSchema
  }),
  z.object({
    type: z.literal("alert"),
    event: homeEventSchema
  })
]);
export type LiveMessage = z.infer<typeof liveMessageSchema>;

export const inviteSchema = z.object({
  id: z.string().min(1),
  email: z.string().email(),
  role: roleSchema,
  token: z.string().min(20),
  expiresAt: isoDateSchema,
  acceptedAt: isoDateSchema.optional()
});
export type Invite = z.infer<typeof inviteSchema>;
