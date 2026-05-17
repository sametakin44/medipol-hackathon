// AYNA — POST SSE okuyucusu.
// EventSource sadece GET destekler; biz POST ile tweet gönderdiğimiz için
// fetch + ReadableStream üstüne kendi SSE parser'ımızı yazıyoruz.

/**
 * @param {object} args
 * @param {string} args.url
 * @param {object} args.body              JSON gövde
 * @param {AbortSignal} [args.signal]
 * @param {Object<string, (data:any) => void>} args.handlers
 *   Her event tipi için bir handler; gelmeyen tipler yok sayılır.
 *   Özel handler: onTransportError(errMsg) — ağ/HTTP hatası.
 */
export async function postSse({ url, body, signal, handlers = {} }) {
  let res;
  try {
    res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "text/event-stream" },
      body: JSON.stringify(body),
      signal,
    });
  } catch (err) {
    handlers.onTransportError?.(err?.message || String(err));
    return;
  }

  if (!res.ok) {
    // SSE değil, normal JSON hata olabilir (örn. 400 boş tweet).
    let msg = `HTTP ${res.status}`;
    try {
      const j = await res.json();
      msg = j?.error || msg;
    } catch {
      // ignore
    }
    handlers.onTransportError?.(msg);
    return;
  }

  if (!res.body) {
    handlers.onTransportError?.("Yanıt gövdesi okunamadı.");
    return;
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder("utf-8");
  let buf = "";

  // SSE event akışı: her event boş satırla (\n\n) ayrılır.
  // Her event içinde "event: <type>" ve "data: <json>" satırları olur.
  while (true) {
    let chunk;
    try {
      chunk = await reader.read();
    } catch (err) {
      handlers.onTransportError?.(err?.message || String(err));
      return;
    }
    const { value, done } = chunk;
    if (done) break;
    buf += decoder.decode(value, { stream: true });

    let sepIndex;
    while ((sepIndex = buf.indexOf("\n\n")) !== -1) {
      const rawEvent = buf.slice(0, sepIndex);
      buf = buf.slice(sepIndex + 2);
      if (!rawEvent.trim()) continue;
      if (rawEvent.startsWith(":")) continue; // keep-alive ping

      let eventName = "message";
      const dataLines = [];
      for (const line of rawEvent.split("\n")) {
        if (line.startsWith("event:")) {
          eventName = line.slice(6).trim();
        } else if (line.startsWith("data:")) {
          dataLines.push(line.slice(5).trim());
        }
      }
      if (dataLines.length === 0) continue;

      const rawData = dataLines.join("\n");
      let parsed = rawData;
      try {
        parsed = JSON.parse(rawData);
      } catch {
        // metin event'i olarak bırak
      }

      const h = handlers[eventName];
      if (typeof h === "function") {
        try {
          h(parsed);
        } catch (err) {
          console.error(`[sse] '${eventName}' handler hatası:`, err);
        }
      }
    }
  }
}
