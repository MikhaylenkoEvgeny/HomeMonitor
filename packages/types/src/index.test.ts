import { describe, expect, it } from "vitest";
import { agentMessageSchema, homeSnapshotSchema } from "./index.js";

describe("shared contracts", () => {
  it("accepts a telemetry batch from the Pi relay", () => {
    const parsed = agentMessageSchema.parse({
      type: "telemetry.batch",
      sequence: 1,
      batchId: "batch-1",
      sentAt: "2026-05-27T07:00:00.000Z",
      points: [
        {
          homeId: "home-main",
          roomId: "living",
          deviceId: "esp32-1",
          ts: "2026-05-27T07:00:00.000Z",
          kind: "presence",
          value: 1,
          confidence: 0.92
        }
      ]
    });

    expect(parsed.type).toBe("telemetry.batch");
  });

  it("rejects snapshots without room confidence", () => {
    expect(() =>
      homeSnapshotSchema.parse({
        homeId: "home-main",
        generatedAt: "2026-05-27T07:00:00.000Z",
        rooms: [
          {
            room: {
              id: "living",
              homeId: "home-main",
              name: "Living room",
              kind: "living"
            },
            present: true,
            motion: true
          }
        ],
        devices: [],
        activeAlerts: [],
        recentEvents: [],
        summary: {
          someoneHome: true,
          activeRoomCount: 1,
          onlineDeviceCount: 0,
          urgentAlertCount: 0
        }
      })
    ).toThrow();
  });
});
