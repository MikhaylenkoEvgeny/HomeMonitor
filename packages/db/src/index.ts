export const rawTelemetryRetentionDays = 30;

export function retentionCutoffSql(days = rawTelemetryRetentionDays): string {
  if (!Number.isInteger(days) || days < 1 || days > 365) {
    throw new Error("retention days must be an integer between 1 and 365");
  }

  return `DELETE FROM telemetry_points WHERE ts < now() - interval '${days} days';`;
}

export const migrations = ["001_init.sql"] as const;
