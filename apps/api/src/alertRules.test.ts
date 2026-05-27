import { describe, expect, it } from "vitest";
import { evaluateAlertRules } from "./alertRules.js";

describe("alert rules", () => {
  it("raises no-motion alerts only for occupied quiet rooms", () => {
    const events = evaluateAlertRules({
      homeId: "home-main",
      now: new Date("2026-05-27T10:00:00.000Z"),
      rooms: [
        {
          room: {
            id: "bedroom",
            homeId: "home-main",
            name: "Bedroom",
            kind: "bedroom",
            floor: 1
          },
          present: true,
          motion: false,
          lastActivityAt: "2026-05-27T06:30:00.000Z",
          confidence: 0.82
        }
      ],
      devices: [],
      noMotionMinutes: 120
    });

    expect(events).toHaveLength(1);
    expect(events[0]?.metadata.rule).toBe("no_motion_too_long");
  });

  it("raises stale device alerts", () => {
    const events = evaluateAlertRules({
      homeId: "home-main",
      now: new Date("2026-05-27T10:00:00.000Z"),
      rooms: [],
      devices: [
        {
          id: "esp32-1",
          homeId: "home-main",
          name: "Living CSI",
          kind: "esp32-csi",
          status: "online",
          lastSeenAt: "2026-05-27T09:50:00.000Z"
        }
      ],
      deviceOfflineMinutes: 5
    });

    expect(events).toHaveLength(1);
    expect(events[0]?.kind).toBe("device_offline");
  });
});
