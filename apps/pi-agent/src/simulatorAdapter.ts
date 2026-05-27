import { nanoid } from "nanoid";
import type { Device, HomeEvent, TelemetryPoint } from "@homemonitor/types";

const rooms = ["living", "bedroom", "kitchen", "hall"] as const;

export interface SimulatorAdapterConfig {
  homeId: string;
  agentId: string;
}

export function simulatorDevices(config: SimulatorAdapterConfig): Device[] {
  return [
    {
      id: config.agentId,
      homeId: config.homeId,
      roomId: "hall",
      name: "Raspberry Pi relay",
      kind: "raspberry-pi",
      status: "online",
      firmwareVersion: "sim-0.1.0",
      signalQuality: 0.9
    },
    {
      id: "sim-csi-01",
      homeId: config.homeId,
      roomId: "living",
      name: "Simulator CSI node",
      kind: "simulator",
      status: "online",
      firmwareVersion: "sim-0.1.0",
      signalQuality: 0.82
    }
  ];
}

export function nextTelemetryBatch(config: SimulatorAdapterConfig): TelemetryPoint[] {
  const now = new Date().toISOString();
  const activeRoom = rooms[Math.floor(Date.now() / 15_000) % rooms.length] ?? "living";

  return rooms.flatMap((roomId) => {
    const active = roomId === activeRoom;
    const deviceId = roomId === "hall" ? config.agentId : "sim-csi-01";
    const confidence = active ? 0.86 + Math.random() * 0.1 : 0.48 + Math.random() * 0.2;

    return [
      point(config, roomId, deviceId, now, "presence", active ? 1 : 0, confidence),
      point(config, roomId, deviceId, now, "motion", active && Math.random() > 0.25 ? 1 : 0, confidence),
      point(config, roomId, deviceId, now, "rssi", -48 - Math.random() * 12, 0.7),
      point(config, roomId, deviceId, now, "csi_amplitude", active ? 0.78 : 0.42, confidence)
    ];
  });
}

export function maybeSyntheticEvent(config: SimulatorAdapterConfig): HomeEvent | undefined {
  if (Math.random() > 0.04) {
    return undefined;
  }

  return {
    id: `evt-${nanoid()}`,
    homeId: config.homeId,
    roomId: "living",
    deviceId: "sim-csi-01",
    ts: new Date().toISOString(),
    kind: "motion_detected",
    severity: "info",
    title: "Motion detected",
    message: "Simulator detected movement in the living room.",
    metadata: {
      source: "simulator"
    }
  };
}

function point(
  config: SimulatorAdapterConfig,
  roomId: string,
  deviceId: string,
  ts: string,
  kind: TelemetryPoint["kind"],
  value: number,
  confidence: number
): TelemetryPoint {
  return {
    homeId: config.homeId,
    roomId,
    deviceId,
    ts,
    kind,
    value,
    confidence,
    tags: {
      adapter: "simulator"
    }
  };
}
