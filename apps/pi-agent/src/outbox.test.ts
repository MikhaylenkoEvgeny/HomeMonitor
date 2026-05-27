import { mkdtemp, rm } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { describe, expect, it } from "vitest";
import { FileOutbox } from "./outbox.js";

describe("FileOutbox", () => {
  it("persists queued messages and removes acknowledged sequences", async () => {
    const dir = await mkdtemp(join(tmpdir(), "hm-outbox-"));
    try {
      const outbox = FileOutbox.at(dir);
      await outbox.open();
      await outbox.enqueue({
        type: "heartbeat",
        homeId: "home-main",
        sequence: 1,
        sentAt: "2026-05-27T07:00:00.000Z",
        uptimeSec: 1,
        devices: [],
        network: {
          transport: "ethernet"
        }
      });

      const reopened = FileOutbox.at(dir);
      await reopened.open();
      expect(reopened.list()).toHaveLength(1);

      await reopened.ack(1);
      expect(reopened.list()).toHaveLength(0);
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });
});
