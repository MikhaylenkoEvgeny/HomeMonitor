CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS timescaledb;

CREATE TABLE IF NOT EXISTS homes (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  timezone TEXT NOT NULL DEFAULT 'Europe/Moscow',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('owner', 'member', 'viewer')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('owner', 'member', 'viewer')),
  token_hash TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  accepted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS rooms (
  id TEXT PRIMARY KEY,
  home_id TEXT NOT NULL REFERENCES homes(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  kind TEXT NOT NULL,
  floor INT NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS devices (
  id TEXT PRIMARY KEY,
  home_id TEXT NOT NULL REFERENCES homes(id) ON DELETE CASCADE,
  room_id TEXT REFERENCES rooms(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  kind TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'offline',
  firmware_version TEXT,
  last_seen_at TIMESTAMPTZ,
  signal_quality DOUBLE PRECISION,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS agent_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id TEXT NOT NULL UNIQUE,
  home_id TEXT NOT NULL REFERENCES homes(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  revoked_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS telemetry_points (
  ts TIMESTAMPTZ NOT NULL,
  home_id TEXT NOT NULL REFERENCES homes(id) ON DELETE CASCADE,
  room_id TEXT NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  device_id TEXT NOT NULL REFERENCES devices(id) ON DELETE CASCADE,
  kind TEXT NOT NULL,
  value DOUBLE PRECISION NOT NULL,
  unit TEXT,
  confidence DOUBLE PRECISION,
  tags JSONB NOT NULL DEFAULT '{}'::jsonb
);

SELECT create_hypertable('telemetry_points', 'ts', if_not_exists => TRUE);

CREATE INDEX IF NOT EXISTS telemetry_points_home_ts_idx ON telemetry_points (home_id, ts DESC);
CREATE INDEX IF NOT EXISTS telemetry_points_room_kind_ts_idx ON telemetry_points (room_id, kind, ts DESC);

CREATE TABLE IF NOT EXISTS csi_objects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  home_id TEXT NOT NULL REFERENCES homes(id) ON DELETE CASCADE,
  room_id TEXT NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  device_id TEXT NOT NULL REFERENCES devices(id) ON DELETE CASCADE,
  started_at TIMESTAMPTZ NOT NULL,
  bucket TEXT NOT NULL,
  object_key TEXT NOT NULL,
  codec TEXT NOT NULL,
  sample_count INT NOT NULL,
  byte_size BIGINT,
  sha256 TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (bucket, object_key)
);

CREATE TABLE IF NOT EXISTS events (
  id TEXT PRIMARY KEY,
  home_id TEXT NOT NULL REFERENCES homes(id) ON DELETE CASCADE,
  room_id TEXT REFERENCES rooms(id) ON DELETE SET NULL,
  device_id TEXT REFERENCES devices(id) ON DELETE SET NULL,
  ts TIMESTAMPTZ NOT NULL,
  kind TEXT NOT NULL,
  severity TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  acknowledged_at TIMESTAMPTZ,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS events_home_ts_idx ON events (home_id, ts DESC);
CREATE INDEX IF NOT EXISTS events_active_idx ON events (home_id, severity, acknowledged_at) WHERE acknowledged_at IS NULL;

CREATE TABLE IF NOT EXISTS alert_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  home_id TEXT NOT NULL REFERENCES homes(id) ON DELETE CASCADE,
  kind TEXT NOT NULL,
  enabled BOOLEAN NOT NULL DEFAULT TRUE,
  config JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS notification_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  home_id TEXT NOT NULL REFERENCES homes(id) ON DELETE CASCADE,
  channel TEXT NOT NULL CHECK (channel IN ('telegram', 'web')),
  enabled BOOLEAN NOT NULL DEFAULT TRUE,
  config JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (home_id, channel)
);
