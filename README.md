# HomeMonitor

Cloud deployment wrapper for the ready-made RuView / WiFi-DensePose interface.

Current direction: do not use the experimental HomeMonitor dashboard as the main UI. Run the native RuView Docker image on a Yandex Cloud VM and open it by public IP.

## VM install

If the repository is public:

```bash
curl -fsSL https://raw.githubusercontent.com/MikhaylenkoEvgeny/HomeMonitor/main/scripts/install-ruview-vm.sh | sudo bash
```

If the repository is private, use a GitHub token with read access:

```bash
GITHUB_TOKEN=ghp_xxx sh -c 'curl -fsSL -H "Authorization: Bearer $GITHUB_TOKEN" https://raw.githubusercontent.com/MikhaylenkoEvgeny/HomeMonitor/main/scripts/install-ruview-vm.sh | sudo -E bash'
```

The installer creates `/opt/homemonitor-ruview`, installs Docker if needed, starts Caddy on port `80`, and runs `ruvnet/wifi-densepose:latest` with simulated data. It copies the native RuView UI from the image, applies the HomeMonitor Russian UI overlay, and persists models/recordings under `/opt/homemonitor-ruview/data`. It prints the generated basic-auth password at the end.
It also configures RuView's `SENSING_ALLOWED_HOSTS` allowlist for public-IP access.

Open:

```text
http://<VM_PUBLIC_IP>/
```

Yandex Cloud security group:

- open TCP `80`;
- open UDP `5005` later, when ESP32 starts streaming CSI.

See [deploy/ruview-vm/README.md](deploy/ruview-vm/README.md) for overrides.

## What runs

- UI/API: official `ruvnet/wifi-densepose:latest`.
- HTTP access: Caddy reverse proxy on public `:80`.
- Sensing WebSocket: proxied from `/ws/sensing` to RuView's internal `:3001`.
- ESP32 CSI UDP: host `5005/udp` to container `5005/udp`.
- Default data source: `CSI_SOURCE=simulated`, so the interface works before hardware arrives.

## Parked prototype

The TypeScript HomeMonitor stack under `apps/` and `packages/` is kept in the repo for later experiments, but it is not used by the VM installer.
