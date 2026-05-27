# Deployment

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
