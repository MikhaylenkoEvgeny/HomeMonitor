# HomeMonitor

Family-first home monitoring platform for ESP32 CSI experiments, Raspberry Pi relay, and a cloud dashboard in Yandex Cloud.

The repository is intentionally runnable before the hardware arrives:

- `apps/api` receives Pi-agent telemetry over WebSocket, keeps a live home snapshot, exposes REST endpoints, and fans updates out to the web UI.
- `apps/web` is a Next.js PWA-style dashboard focused on rooms, people-at-home state, alerts, devices, and history.
- `apps/pi-agent` runs on Raspberry Pi, keeps an outbound-only relay to the cloud, buffers messages locally, and currently uses a simulator adapter.
- `apps/simulator` is a direct cloud simulator for demos and load checks.
- `packages/types`, `packages/ui`, and `packages/db` hold shared contracts, UI primitives, and database migrations.
- `infra` contains Docker Compose and Yandex Cloud Terraform/OpenTofu scaffolding.

## Local quick start

```bash
npm install
npm run build
npm run test
npm run dev:api
```

In another terminal:

```bash
npm run dev:web
npm run dev:agent
```

Open `http://localhost:3000`. The dashboard will show synthetic rooms and live telemetry. The default agent token is `dev-agent-token`; change it before deployment.

## Cloud shape

The first deployment target is a small Yandex Compute VM running Docker Compose:

- `caddy` terminates HTTP/HTTPS and proxies `/api`, `/agent`, and `/live`.
- `web` serves the Next.js UI.
- `api` accepts REST, live WebSocket, and Pi-agent WebSocket traffic.
- `worker` handles retention and background maintenance.
- `timescaledb`, `redis`, and optional `grafana` support data storage and diagnostics.

Raw/high-frequency telemetry is designed for Object Storage as compressed `.jsonl.gz` objects with relational indexes in Postgres/TimescaleDB. Scalar telemetry and events are stored in TimescaleDB.

## Hardware path

The Pi agent has a simulator adapter now. Later adapters should be added without changing the cloud contract:

- RuView UDP ingest.
- ESP32-CSI raw CSV/UDP ingest.
- System health and device diagnostics.

The home network stays closed: the Raspberry Pi keeps an outbound WebSocket to the cloud and retries with a local outbox when offline.
