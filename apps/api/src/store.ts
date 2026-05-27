import { nanoid } from "nanoid";
import {
  homeSnapshotSchema,
  type AgentHeartbeat,
  type Device,
  type HomeEvent,
  type HomeSnapshot,
  type Room,
  type RoomState,
  type TelemetryPoint
} from "@homemonitor/types";

type MutableRoomState = Omit<RoomState, "room"> & { room: Room };

export class HomeStore {
  private readonly homeId = "home-main";
  private readonly rooms = new Map<string, Room>();
  private readonly roomStates = new Map<string, MutableRoomState>();
  private readonly devices = new Map<string, Device>();
  private readonly events: HomeEvent[] = [];
  private readonly telemetry: TelemetryPoint[] = [];

  constructor() {
    this.seed();
  }

  applyHeartbeat(message: AgentHeartbeat): void {
    let newlyOnline = 0;
    for (const device of message.devices) {
      const previous = this.devices.get(device.id);
      if (previous?.status !== "online") {
        newlyOnline += 1;
      }

      this.devices.set(device.id, {
        ...device,
        status: "online",
        lastSeenAt: message.sentAt
      });
    }

    if (newlyOnline > 0) {
      this.addEvent({
        id: `evt-${nanoid()}`,
        homeId: message.homeId,
        deviceId: message.devices[0]?.id,
        ts: message.sentAt,
        kind: "device_online",
        severity: "info",
        title: "Pi relay online",
        message: `${newlyOnline} device(s) came online.`,
        metadata: {
          uptimeSec: message.uptimeSec,
          transport: message.network.transport
        }
      });
    }
  }

  applyTelemetry(points: TelemetryPoint[]): void {
    this.telemetry.push(...points);
    if (this.telemetry.length > 10_000) {
      this.telemetry.splice(0, this.telemetry.length - 10_000);
    }

    for (const point of points) {
      const roomState = this.roomStates.get(point.roomId);
      if (!roomState) {
        continue;
      }

      if (point.kind === "presence") {
        roomState.present = point.value >= 0.5;
        roomState.confidence = point.confidence ?? roomState.confidence;
        roomState.lastActivityAt = point.ts;
      }

      if (point.kind === "motion") {
        roomState.motion = point.value >= 0.5;
        roomState.confidence = point.confidence ?? roomState.confidence;
        if (roomState.motion) {
          roomState.lastActivityAt = point.ts;
        }
      }

      if (point.kind === "breathing_rate") {
        roomState.breathingRate = point.value;
      }

      if (point.kind === "heart_rate") {
        roomState.heartRate = point.value;
      }

      if (point.kind === "rssi" || point.kind === "noise_floor" || point.kind === "csi_amplitude") {
        roomState.signalQuality = normalizeSignalQuality(point.value, point.kind);
      }

      const device = this.devices.get(point.deviceId);
      if (device) {
        this.devices.set(device.id, {
          ...device,
          status: "online",
          lastSeenAt: point.ts,
          signalQuality: roomState.signalQuality ?? device.signalQuality
        });
      }
    }
  }

  addEvent(event: HomeEvent): void {
    if (this.events.some((existing) => existing.id === event.id)) {
      return;
    }

    this.events.unshift(event);
    if (this.events.length > 500) {
      this.events.splice(500);
    }
  }

  snapshot(): HomeSnapshot {
    const rooms = Array.from(this.roomStates.values());
    const devices = Array.from(this.devices.values());
    const activeAlerts = this.events.filter((event) => event.severity !== "info" && !event.acknowledgedAt).slice(0, 20);
    const snapshot = {
      homeId: this.homeId,
      generatedAt: new Date().toISOString(),
      mode: "mock" as const,
      rooms,
      devices,
      activeAlerts,
      recentEvents: this.events.slice(0, 30),
      summary: {
        someoneHome: rooms.some((room) => room.present),
        activeRoomCount: rooms.filter((room) => room.present || room.motion).length,
        onlineDeviceCount: devices.filter((device) => device.status === "online").length,
        urgentAlertCount: activeAlerts.filter((event) => event.severity === "urgent").length
      }
    };

    return homeSnapshotSchema.parse(snapshot);
  }

  timeline(limit = 50): HomeEvent[] {
    return this.events.slice(0, limit);
  }

  listDevices(): Device[] {
    return Array.from(this.devices.values());
  }

  private seed(): void {
    const rooms: Room[] = [
      { id: "living", homeId: this.homeId, name: "Living room", kind: "living", floor: 1 },
      { id: "bedroom", homeId: this.homeId, name: "Bedroom", kind: "bedroom", floor: 1 },
      { id: "kitchen", homeId: this.homeId, name: "Kitchen", kind: "kitchen", floor: 1 },
      { id: "hall", homeId: this.homeId, name: "Hall", kind: "hall", floor: 1 },
      { id: "lab", homeId: this.homeId, name: "Diagnostics", kind: "lab", floor: 1 }
    ];

    for (const room of rooms) {
      this.rooms.set(room.id, room);
      this.roomStates.set(room.id, {
        room,
        present: false,
        motion: false,
        confidence: 0.5,
        signalQuality: 0.7
      });
    }

    const devices: Device[] = [
      {
        id: "pi-entrance-01",
        homeId: this.homeId,
        roomId: "hall",
        name: "Raspberry Pi relay",
        kind: "raspberry-pi",
        status: "offline",
        signalQuality: 0.8
      },
      {
        id: "sim-csi-01",
        homeId: this.homeId,
        roomId: "living",
        name: "Simulator CSI node",
        kind: "simulator",
        status: "offline",
        signalQuality: 0.75
      }
    ];

    for (const device of devices) {
      this.devices.set(device.id, device);
    }
  }
}

function normalizeSignalQuality(value: number, kind: TelemetryPoint["kind"]): number {
  if (kind === "rssi") {
    return clamp((value + 90) / 55);
  }

  if (kind === "noise_floor") {
    return clamp(1 - (value + 95) / 40);
  }

  return clamp(value);
}

function clamp(value: number): number {
  return Math.max(0, Math.min(1, value));
}
