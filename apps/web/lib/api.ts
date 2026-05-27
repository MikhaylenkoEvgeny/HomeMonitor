export function apiUrl(path: string): string {
  const base = process.env.NEXT_PUBLIC_API_URL;
  if (base) {
    return `${base}${path}`;
  }

  if (typeof window !== "undefined" && isLocalNext(window.location)) {
    return `http://127.0.0.1:4000${path}`;
  }

  return path;
}

export function liveWsUrl(): string {
  if (process.env.NEXT_PUBLIC_WS_URL) {
    return `${process.env.NEXT_PUBLIC_WS_URL}/live`;
  }

  if (typeof window === "undefined") {
    return "ws://127.0.0.1:4000/live";
  }

  if (isLocalNext(window.location)) {
    return "ws://127.0.0.1:4000/live";
  }

  const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
  return `${protocol}//${window.location.host}/live`;
}

function isLocalNext(location: Location): boolean {
  return ["localhost", "127.0.0.1", "::1"].includes(location.hostname) && location.port === "3000";
}
