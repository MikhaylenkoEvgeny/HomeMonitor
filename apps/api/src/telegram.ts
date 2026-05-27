import type { HomeEvent } from "@homemonitor/types";

export interface TelegramConfig {
  botToken: string | undefined;
  chatId: string | undefined;
}

export async function sendTelegramAlert(config: TelegramConfig, event: HomeEvent): Promise<"sent" | "disabled"> {
  if (!config.botToken || !config.chatId) {
    return "disabled";
  }

  const text = [
    `HomeMonitor: ${event.title}`,
    event.message,
    event.roomId ? `Room: ${event.roomId}` : undefined,
    `Severity: ${event.severity}`
  ]
    .filter(Boolean)
    .join("\n");

  const response = await fetch(`https://api.telegram.org/bot${config.botToken}/sendMessage`, {
    method: "POST",
    headers: {
      "content-type": "application/json"
    },
    body: JSON.stringify({
      chat_id: config.chatId,
      text
    })
  });

  if (!response.ok) {
    throw new Error(`Telegram send failed: ${response.status}`);
  }

  return "sent";
}
