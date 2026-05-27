import type { ReactNode } from "react";

export type Tone = "calm" | "good" | "watch" | "urgent" | "muted";

export function toneClass(tone: Tone): string {
  return `hm-tone-${tone}`;
}

export function StatusPill({
  tone,
  children
}: {
  tone: Tone;
  children: ReactNode;
}) {
  return <span className={`hm-status-pill ${toneClass(tone)}`}>{children}</span>;
}

export function MetricTile({
  label,
  value,
  detail,
  tone = "calm"
}: {
  label: string;
  value: ReactNode;
  detail?: ReactNode;
  tone?: Tone;
}) {
  return (
    <section className={`hm-metric-tile ${toneClass(tone)}`}>
      <span className="hm-metric-label">{label}</span>
      <strong className="hm-metric-value">{value}</strong>
      {detail ? <span className="hm-metric-detail">{detail}</span> : null}
    </section>
  );
}
