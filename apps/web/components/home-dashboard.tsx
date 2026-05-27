"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  Bell,
  FlaskConical,
  HeartPulse,
  Home,
  Radio,
  ShieldCheck,
  Users,
  Wifi
} from "lucide-react";
import { MetricTile, StatusPill } from "@homemonitor/ui";
import type { HomeEvent, HomeSnapshot, LiveMessage, RoomState } from "@homemonitor/types";
import { apiUrl, liveWsUrl } from "../lib/api";

const fallbackSnapshot: HomeSnapshot = {
  homeId: "home-main",
  generatedAt: new Date().toISOString(),
  mode: "mock",
  rooms: [],
  devices: [],
  activeAlerts: [],
  recentEvents: [],
  summary: {
    someoneHome: false,
    activeRoomCount: 0,
    onlineDeviceCount: 0,
    urgentAlertCount: 0
  }
};

export function HomeDashboard() {
  const [snapshot, setSnapshot] = useState<HomeSnapshot>(fallbackSnapshot);
  const [connection, setConnection] = useState<"connecting" | "live" | "offline">("connecting");
  const [selectedView, setSelectedView] = useState<"overview" | "timeline" | "devices" | "lab">("overview");

  useEffect(() => {
    let cancelled = false;
    let activeSocket = true;
    fetch(apiUrl("/api/home"))
      .then((response) => response.json() as Promise<HomeSnapshot>)
      .then((next) => {
        if (!cancelled) {
          setSnapshot(next);
        }
      })
      .catch(() => setConnection("offline"));

    const ws = new WebSocket(liveWsUrl());
    ws.onopen = () => {
      if (activeSocket) {
        setConnection("live");
      }
    };
    ws.onclose = () => {
      if (activeSocket) {
        setConnection("offline");
      }
    };
    ws.onerror = () => {
      if (activeSocket) {
        setConnection("offline");
      }
    };
    ws.onmessage = (event) => {
      const message = JSON.parse(event.data as string) as LiveMessage;
      if (message.type === "snapshot" || message.type === "snapshot.updated") {
        setConnection("live");
        setSnapshot(message.snapshot);
      }
    };

    return () => {
      cancelled = true;
      activeSocket = false;
      ws.close();
    };
  }, []);

  const activeRoom = useMemo(
    () => snapshot.rooms.find((room) => room.present || room.motion) ?? snapshot.rooms[0],
    [snapshot.rooms]
  );
  const recentAlerts = snapshot.activeAlerts.length > 0 ? snapshot.activeAlerts : snapshot.recentEvents.slice(0, 3);

  return (
    <main className="app-shell">
      <header className="topbar">
        <div className="brand-mark">
          <Home size={22} aria-hidden />
        </div>
        <div>
          <p className="eyebrow">HomeMonitor</p>
          <h1>Home right now</h1>
        </div>
        <StatusPill tone={connection === "live" ? "good" : connection === "connecting" ? "watch" : "urgent"}>
          {connection}
        </StatusPill>
      </header>

      <nav className="segmented" aria-label="Dashboard sections">
        <button className={selectedView === "overview" ? "active" : ""} onClick={() => setSelectedView("overview")}>
          <Activity size={18} aria-hidden />
          Overview
        </button>
        <button className={selectedView === "timeline" ? "active" : ""} onClick={() => setSelectedView("timeline")}>
          <Bell size={18} aria-hidden />
          Timeline
        </button>
        <button className={selectedView === "devices" ? "active" : ""} onClick={() => setSelectedView("devices")}>
          <Wifi size={18} aria-hidden />
          Devices
        </button>
        <button className={selectedView === "lab" ? "active" : ""} onClick={() => setSelectedView("lab")}>
          <FlaskConical size={18} aria-hidden />
          Lab
        </button>
      </nav>

      {selectedView === "overview" ? <Overview snapshot={snapshot} activeRoom={activeRoom} alerts={recentAlerts} /> : null}
      {selectedView === "timeline" ? <Timeline events={snapshot.recentEvents} /> : null}
      {selectedView === "devices" ? <Devices snapshot={snapshot} /> : null}
      {selectedView === "lab" ? <Diagnostics snapshot={snapshot} /> : null}
    </main>
  );
}

function Overview({
  snapshot,
  activeRoom,
  alerts
}: {
  snapshot: HomeSnapshot;
  activeRoom: RoomState | undefined;
  alerts: HomeEvent[];
}) {
  return (
    <div className="dashboard-grid">
      <section className="home-state">
        <div className="state-copy">
          <StatusPill tone={snapshot.summary.someoneHome ? "good" : "muted"}>
            {snapshot.summary.someoneHome ? "someone home" : "quiet"}
          </StatusPill>
          <h2>{activeRoom ? activeRoom.room.name : "Waiting for the first signal"}</h2>
          <p>{activeRoom ? roomSentence(activeRoom) : "The simulator or Pi agent will fill this view once connected."}</p>
        </div>
        <div className="metric-row">
          <MetricTile label="Active rooms" value={snapshot.summary.activeRoomCount} detail="presence or motion" tone="good" />
          <MetricTile label="Devices online" value={snapshot.summary.onlineDeviceCount} detail="relay and nodes" />
          <MetricTile
            label="Urgent alerts"
            value={snapshot.summary.urgentAlertCount}
            detail="needs attention"
            tone={snapshot.summary.urgentAlertCount > 0 ? "urgent" : "calm"}
          />
        </div>
      </section>

      <section className="room-grid" aria-label="Rooms">
        {snapshot.rooms.map((room) => (
          <RoomCard key={room.room.id} room={room} />
        ))}
      </section>

      <section className="side-panel">
        <div className="section-heading">
          <Bell size={18} aria-hidden />
          <h2>Alerts</h2>
        </div>
        <EventList events={alerts} empty="No alerts yet" />
      </section>
    </div>
  );
}

function RoomCard({ room }: { room: RoomState }) {
  const tone = room.present ? "good" : room.motion ? "watch" : "muted";

  return (
    <article className={`room-card ${room.present ? "present" : ""}`}>
      <div className="room-card-header">
        <h3>{room.room.name}</h3>
        <StatusPill tone={tone}>{room.present ? "present" : room.motion ? "motion" : "clear"}</StatusPill>
      </div>
      <div className="room-signals">
        <span>
          <Users size={16} aria-hidden />
          {Math.round(room.confidence * 100)}%
        </span>
        <span>
          <Radio size={16} aria-hidden />
          {Math.round((room.signalQuality ?? 0) * 100)}%
        </span>
        <span>
          <HeartPulse size={16} aria-hidden />
          {room.breathingRate ? `${Math.round(room.breathingRate)} bpm` : "no vitals"}
        </span>
      </div>
    </article>
  );
}

function Timeline({ events }: { events: HomeEvent[] }) {
  return (
    <section className="wide-panel">
      <div className="section-heading">
        <Bell size={18} aria-hidden />
        <h2>Timeline</h2>
      </div>
      <EventList events={events} empty="The home is quiet. New events will appear here." />
    </section>
  );
}

function Devices({ snapshot }: { snapshot: HomeSnapshot }) {
  return (
    <section className="wide-panel">
      <div className="section-heading">
        <Wifi size={18} aria-hidden />
        <h2>Devices</h2>
      </div>
      <div className="device-list">
        {snapshot.devices.map((device) => (
          <article className="device-row" key={device.id}>
            <div>
              <h3>{device.name}</h3>
              <p>{device.kind}</p>
            </div>
            <StatusPill tone={device.status === "online" ? "good" : device.status === "degraded" ? "watch" : "urgent"}>
              {device.status}
            </StatusPill>
          </article>
        ))}
      </div>
    </section>
  );
}

function Diagnostics({ snapshot }: { snapshot: HomeSnapshot }) {
  return (
    <section className="wide-panel diagnostics">
      <div className="section-heading">
        <ShieldCheck size={18} aria-hidden />
        <h2>Diagnostics</h2>
      </div>
      <div className="diagnostic-grid">
        <MetricTile label="Mode" value={snapshot.mode} detail="mock until hardware arrives" />
        <MetricTile label="Raw retention" value="30d" detail="cloud telemetry policy" />
        <MetricTile label="Rooms tracked" value={snapshot.rooms.length} detail="simulated layout" />
      </div>
      <pre>{JSON.stringify(snapshot.summary, null, 2)}</pre>
    </section>
  );
}

function EventList({ events, empty }: { events: HomeEvent[]; empty: string }) {
  if (events.length === 0) {
    return <p className="empty-state">{empty}</p>;
  }

  return (
    <div className="event-list">
      {events.map((event) => (
        <article className="event-row" key={event.id}>
          <StatusPill tone={event.severity === "urgent" ? "urgent" : event.severity === "watch" ? "watch" : "muted"}>
            {event.severity}
          </StatusPill>
          <div>
            <h3>{event.title}</h3>
            <p>{event.message}</p>
          </div>
          <time>{new Date(event.ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</time>
        </article>
      ))}
    </div>
  );
}

function roomSentence(room: RoomState): string {
  if (room.present && room.motion) {
    return `Movement is active with ${Math.round(room.confidence * 100)}% confidence.`;
  }

  if (room.present) {
    return `Presence is steady with ${Math.round(room.confidence * 100)}% confidence.`;
  }

  if (room.motion) {
    return "Motion was seen, but presence is still uncertain.";
  }

  return "No current presence signal.";
}
