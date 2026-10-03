import { API_BASE } from "@/config/env";
import { tokenStore } from "@/services/apiClient";

export interface StreamMessage { event: string; data: Record<string, unknown> }

/** Authenticated SSE over fetch (EventSource cannot send Authorization). Auto-reconnects with backoff. */
export function openStream(onMessage: (m: StreamMessage) => void, onState: (s: "connecting" | "live" | "offline") => void) {
  let stopped = false;
  let ctrl: AbortController | null = null;
  let attempt = 0;

  async function run() {
    while (!stopped) {
      onState("connecting");
      ctrl = new AbortController();
      try {
        const res = await fetch(`${API_BASE}/stream`, { headers: { authorization: `Bearer ${tokenStore.get() ?? ""}`, accept: "text/event-stream" }, credentials: "include", signal: ctrl.signal });
        if (!res.ok || !res.body) throw new Error(`stream ${res.status}`);
        attempt = 0;
        onState("live");
        const reader = res.body.getReader();
        const dec = new TextDecoder();
        let buf = "";
        for (;;) {
          const { value, done } = await reader.read();
          if (done) break;
          buf += dec.decode(value, { stream: true });
          let idx;
          while ((idx = buf.indexOf("\n\n")) >= 0) {
            const block = buf.slice(0, idx); buf = buf.slice(idx + 2);
            const ev = /^event: (.+)$/m.exec(block)?.[1]; const data = /^data: (.+)$/m.exec(block)?.[1];
            if (ev && data) { try { onMessage({ event: ev, data: JSON.parse(data) }); } catch { /* ignore malformed */ } }
          }
        }
      } catch { /* fall through to retry */ }
      if (stopped) return;
      onState("offline");
      attempt += 1;
      await new Promise((r) => setTimeout(r, Math.min(15000, 1000 * 2 ** attempt)));
    }
  }
  void run();
  return () => { stopped = true; ctrl?.abort(); };
}
