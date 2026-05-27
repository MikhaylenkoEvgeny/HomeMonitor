# Deployment

## Current path: native RuView UI on a VM

Use the official RuView Docker image through the HomeMonitor VM installer.

If this repo is public:

```bash
curl -fsSL https://raw.githubusercontent.com/MikhaylenkoEvgeny/HomeMonitor/main/scripts/install-ruview-vm.sh | sudo bash
```

If this repo is private:

```bash
GITHUB_TOKEN=ghp_xxx sh -c 'curl -fsSL -H "Authorization: Bearer $GITHUB_TOKEN" https://raw.githubusercontent.com/MikhaylenkoEvgeny/HomeMonitor/main/scripts/install-ruview-vm.sh | sudo -E bash'
```

The VM serves RuView at `http://<VM_PUBLIC_IP>/` through Caddy on port `80`.
The installer sets RuView's `SENSING_ALLOWED_HOSTS` so the public IP is accepted by its DNS-rebinding defense.
It also applies the HomeMonitor Russian UI overlay and keeps `/opt/homemonitor-ruview/data`
persistent for models, state, and CSI recordings.

Open in Yandex Cloud security group:

- TCP `80`;
- UDP `5005` later for ESP32 CSI packets.

The sections below describe the parked TypeScript prototype and are not needed
for the current RuView VM deployment.

## Local

```bash
npm install
npm run build
npm run test
npm run dev:api
npm run dev:web
npm run dev:agent
```

For a Docker-based local run:

```bash
cp .env.example .env
docker compose -f infra/docker/docker-compose.yml up --build
```

## Yandex Cloud MVP

1. Create `infra/terraform/terraform.tfvars` with `cloud_id`, `folder_id`, `ssh_public_key`, and an Ubuntu image id.
2. Run `terraform init` and `terraform apply` from `infra/terraform`.
3. Add GitHub secrets:
   - `YC_REGISTRY_ID`
   - `YC_SA_JSON_KEY`
   - `DEPLOY_HOST`
   - `DEPLOY_USER`
   - `DEPLOY_SSH_KEY`
   - `HOMEMONITOR_HOST`
   - `WEB_ORIGIN`
   - `SESSION_SECRET`
   - `AGENT_TOKEN`
   - `POSTGRES_PASSWORD`
   - optional `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID`
4. Run the `Build and Deploy` workflow.

Until a real domain is connected, set `HOMEMONITOR_HOST=localhost` for local Docker or the VM IP for staging. Once a domain is ready, point DNS to the static IP and switch `HOMEMONITOR_HOST`/`WEB_ORIGIN` to the final URL.
