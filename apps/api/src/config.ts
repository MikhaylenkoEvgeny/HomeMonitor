export interface ApiConfig {
  port: number;
  webOrigin: string;
  sessionSecret: string;
  agentToken: string;
  bootstrapOwnerEmail: string | undefined;
  bootstrapOwnerPassword: string | undefined;
  telegramBotToken: string | undefined;
  telegramChatId: string | undefined;
}

function optionalEnv(name: string): string | undefined {
  const value = process.env[name];
  return value && value.trim().length > 0 ? value : undefined;
}

function requiredEnv(name: string, fallback: string): string {
  return optionalEnv(name) ?? fallback;
}

export function loadConfig(): ApiConfig {
  return {
    port: Number.parseInt(requiredEnv("API_PORT", "4000"), 10),
    webOrigin: requiredEnv("WEB_ORIGIN", "http://localhost:3000"),
    sessionSecret: requiredEnv("SESSION_SECRET", "dev-session-secret"),
    agentToken: requiredEnv("AGENT_TOKEN", "dev-agent-token"),
    bootstrapOwnerEmail: optionalEnv("BOOTSTRAP_OWNER_EMAIL"),
    bootstrapOwnerPassword: optionalEnv("BOOTSTRAP_OWNER_PASSWORD"),
    telegramBotToken: optionalEnv("TELEGRAM_BOT_TOKEN"),
    telegramChatId: optionalEnv("TELEGRAM_CHAT_ID")
  };
}
