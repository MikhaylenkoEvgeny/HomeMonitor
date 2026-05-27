import { describe, expect, it } from "vitest";
import { retentionCutoffSql } from "./index.js";

describe("retention SQL", () => {
  it("keeps raw telemetry retention bounded", () => {
    expect(retentionCutoffSql(30)).toContain("30 days");
    expect(() => retentionCutoffSql(0)).toThrow();
    expect(() => retentionCutoffSql(366)).toThrow();
  });
});
