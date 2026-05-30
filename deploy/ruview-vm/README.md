# RuView VM deployment

This is the current deployment path for the cloud UI: run the official RuView
Docker image on a small Ubuntu/Debian VM and expose it by public IP.

It intentionally does not build or serve the experimental `apps/web` dashboard.
The VM runs the native RuView backend from `ruvnet/wifi-densepose:latest`, but
serves a standalone HomeMonitor UI as the main page. The native RuView lab pages
remain available under `/ui/pose-fusion.html`, `/ui/observatory.html`, and
`/ui/viz.html`.

## One-command install

If the repository is public:

```bash
curl -fsSL https://raw.githubusercontent.com/MikhaylenkoEvgeny/HomeMonitor/main/scripts/install-ruview-vm.sh | sudo bash
```

If the repository is private, run it with a GitHub token that can read this repo:

```bash
GITHUB_TOKEN=ghp_xxx sh -c 'curl -fsSL -H "Authorization: Bearer $GITHUB_TOKEN" https://raw.githubusercontent.com/MikhaylenkoEvgeny/HomeMonitor/main/scripts/install-ruview-vm.sh | sudo -E bash'
```

## Update existing VM UI

For an already installed VM, refresh only the web UI files and restart Caddy:

```bash
cd /opt/homemonitor-ruview && sudo mkdir -p ui/utils && sudo curl -fsSL https://raw.githubusercontent.com/MikhaylenkoEvgeny/HomeMonitor/main/deploy/ruview-vm/ui-overrides/index.html -o ui/index.html && sudo curl -fsSL https://raw.githubusercontent.com/MikhaylenkoEvgeny/HomeMonitor/main/deploy/ruview-vm/ui-overrides/homemonitor.css -o ui/homemonitor.css && sudo curl -fsSL https://raw.githubusercontent.com/MikhaylenkoEvgeny/HomeMonitor/main/deploy/ruview-vm/ui-overrides/homemonitor.js -o ui/homemonitor.js && sudo curl -fsSL https://raw.githubusercontent.com/MikhaylenkoEvgeny/HomeMonitor/main/deploy/ruview-vm/ui-overrides/i18n.js -o ui/utils/i18n.js && sudo curl -fsSL https://raw.githubusercontent.com/MikhaylenkoEvgeny/HomeMonitor/main/deploy/ruview-vm/ui-overrides/sw.js -o ui/sw.js && sudo docker compose restart caddy
```

If the repository is private, add `-H "Authorization: Bearer $GITHUB_TOKEN"` to
each `curl` command or rerun the full installer with `GITHUB_TOKEN`.

The installer:

- installs Docker if needed;
- creates `/opt/homemonitor-ruview`;
- starts Caddy on public `:80`;
- starts `ruvnet/wifi-densepose:latest` with simulated CSI data;
- starts a small UDP adapter on public `5005/udp` that forwards raw CSI and
  translates ESP32 ADR-081 `feature_state` packets into RuView-compatible edge
  vitals updates;
- copies the native RuView UI from the Docker image and replaces the main
  `/ui/index.html` with the standalone HomeMonitor Russian UI;
- publishes ESP32 UDP `5005/udp` for later hardware;
- persists models, state, and CSI recordings under `/opt/homemonitor-ruview/data`;
- enables basic auth by default and prints the generated password.

Open:

```text
http://<VM_PUBLIC_IP>/
```

The public root `/` is mapped to HomeMonitor at `/ui/index.html`. The UI opens
in Russian by default. Technical terms without stable Russian usage stay in
English, for example CSI, RSSI, API, WebSocket, WiFi DensePose, Pose Fusion, and
Observatory.

The main HomeMonitor UI does not load the native RuView `app.js`; it reads the
RuView backend directly through REST and `/ws/sensing`. This avoids competing
demo/native updaters changing the same DOM fields and keeps live ESP32 frames
stable. Demo/mock frames are ignored by default and can be enabled in the
settings dialog only for UI testing.

The VM also exposes short links for the bundled RuView pages:

- `/observatory` -> `/ui/observatory.html`
- `/pose-fusion` -> `/ui/pose-fusion.html`
- `/viz` -> `/ui/viz.html`

## Useful overrides

```bash
CSI_SOURCE=auto sudo -E bash scripts/install-ruview-vm.sh
CSI_SOURCE=esp32 sudo -E bash scripts/install-ruview-vm.sh
RUVIEW_TAG=latest sudo -E bash scripts/install-ruview-vm.sh
HOMEMONITOR_BASIC_AUTH_PASSWORD='change-me' sudo -E bash scripts/install-ruview-vm.sh
HOMEMONITOR_BASIC_AUTH=0 sudo -E bash scripts/install-ruview-vm.sh
HOMEMONITOR_PUBLIC_HOST=203.0.113.10 sudo -E bash scripts/install-ruview-vm.sh
SENSING_ALLOWED_HOSTS=203.0.113.10,203.0.113.10:80 sudo -E bash scripts/install-ruview-vm.sh
```

## VM firewall

Open these inbound rules in Yandex Cloud:

- TCP `80` from your IP or from `0.0.0.0/0` while testing;
- UDP `5005` when ESP32 nodes are ready to stream CSI to the VM.

No domain is required for the first version.

## ESP32 packet compatibility

Recent RuView ESP32 firmware sends ADR-081 `feature_state` packets as the
default low-bandwidth stream. Some official Docker UI builds still refresh live
state from ADR-018 raw CSI or ADR-039 vitals only. The bundled `udp-adapter`
keeps both paths working:

- ADR-018 raw CSI and existing vitals packets are forwarded unchanged;
- ADR-081 `feature_state` is converted to a minimal ADR-039 vitals packet so
  `/api/v1/sensing/latest` and the HomeMonitor UI update even when raw CSI
  yield is low on a quiet network.

Useful diagnostics on the VM:

```bash
cd /opt/homemonitor-ruview
sudo docker compose logs -f udp-adapter
sudo docker compose logs -f ruview
```
