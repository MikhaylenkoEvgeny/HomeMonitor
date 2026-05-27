import { nanoid } from "nanoid";
import type { Device, HomeEvent, RoomState } from "@homemonitor/types";

export interface AlertRuleInput {
  homeId: string;
  now: Date;
  rooms: RoomState[];
  devices: Device[];
  noMotionMinutes?: number;
  deviceOfflineMinutes?: number;
}

export function evaluateAlertRules(input: AlertRuleInput): HomeEvent[] {
  return [
    ...evaluateNoMotionRule(input),
    ...evaluateDeviceOfflineRule(input)
  ];
}

export function evaluateNoMotionRule({
  homeId,
  now,
  rooms,
  noMotionMinutes = 180
}: AlertRuleInput): HomeEvent[] {
  const thresholdMs = noMotionMinutes * 60 * 1000;

  return rooms
    .filter((roomState) => {
      if (!roomState.present || !roomState.lastActivityAt) {
        return false;
      }

      return now.getTime() - Date.parse(roomState.lastActivityAt) > thresholdMs;
    })
    .map((roomState) => ({
      id: `rule-${nanoid()}`,
      homeId,
      roomId: roomState.room.id,
      ts: now.toISOString(),
      kind: "rule_triggered" as const,
      severity: "watch" as const,
      title: "No motion for a while",
      message: `${roomState.room.name} still looks occupied, but motion has been quiet.`,
      metadata: {
        rule: "no_motion_too_long",
        noMotionMinutes
      }
    }));
}

export function evaluateDeviceOfflineRule({
  homeId,
  now,
  devices,
  deviceOfflineMinutes = 5
}: AlertRuleInput): HomeEvent[] {
  const thresholdMs = deviceOfflineMinutes * 60 * 1000;

  return devices
    .filter((device) => {
      if (device.status === "offline") {
        return true;
      }

      if (!device.lastSeenAt) {
        return false;
      }

      return now.getTime() - Date.parse(device.lastSeenAt) > thresholdMs;
    })
    .map((device) => ({
      id: `rule-${nanoid()}`,
      homeId,
      roomId: device.roomId,
      deviceId: device.id,
      ts: now.toISOString(),
      kind: "device_offline" as const,
      severity: "watch" as const,
      title: "Device offline",
      message: `${device.name} has not checked in recently.`,
      metadata: {
        rule: "device_offline",
        deviceOfflineMinutes
      }
    }));
}
