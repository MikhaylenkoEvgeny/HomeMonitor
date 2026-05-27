export interface AgentConfig {
  cloudWsUrl: string;
  agentId: string;
  homeId: string;
  token: string;
  dataDir: string;
  adapter: "simulator";
  batchIntervalMs: number;
}

export function loadAgentConfig(): AgentConfig {
  return {
    cloudWsUrl: process.env.HOMEMONITOR_CLOUD_WS ?? "ws://127.0.0.1:4000/agent",
    agentId: process.env.HOMEMONITOR_AGENT_ID ?? "pi-entrance-01",
    homeId: process.env.HOMEMONITOR_HOME_ID ?? "home-main",
    token: process.env.HOMEMONITOR_AGENT_TOKEN ?? "dev-agent-token",
    dataDir: process.env.HOMEMONITOR_DATA_DIR ?? "./data/pi-agent",
    adapter: "simulator",
    batchIntervalMs: Number.parseInt(process.env.HOMEMONITOR_BATCH_INTERVAL_MS ?? "2500", 10)
  };
}
