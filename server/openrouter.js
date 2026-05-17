// AYNA — OpenRouter çağrı yardımcısı (Adım 3).
// - Her persona için modelRole'a göre kendi modeline çağrı yapar.
// - JSON çıktı bekler; parse hatasında zarif fallback üretir.
// - simulatePersonasStream: paralel başlatır, her cevap hazır oldukça onPersona(result) callback'iyle yayınlar.

import { PERSONA_PROMPTS } from "./personas.js";
import { MODEL_ROLES } from "../src/config.js";

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";
const TIMEOUT_MS = 30_000;

const VALID_STANCES = new Set(["destek", "karsit", "notr", "alayci"]);
const VALID_REPLY_TYPES = new Set(["reply", "quote"]);

class MissingApiKeyError extends Error {
  constructor() {
    super("OPENROUTER_API_KEY tanımlı değil. .env dosyasını oluşturup anahtarı doldurun.");
    this.code = "MISSING_API_KEY";
  }
}

function buildHeaders() {
  const key = process.env.OPENROUTER_API_KEY;
  if (!key || !key.trim()) {
    throw new MissingApiKeyError();
  }
  return {
    Authorization: `Bearer ${key.trim()}`,
    "Content-Type": "application/json",
    "HTTP-Referer": process.env.OPENROUTER_APP_URL || "http://localhost:5173",
    "X-Title": process.env.OPENROUTER_APP_NAME || "AYNA",
  };
}

async function callOnce({ model, system, user, maxTokens = 220, temperature = 0.9 }) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  const t0 = Date.now();

  try {
    const body = {
      model,
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
      max_tokens: maxTokens,
      temperature,
    };
    // response_format: bazı OpenRouter modelleri (örn. Gemini) bunu desteklemiyor
    // ve istek hata verebiliyor. AYNA_FORCE_JSON_FORMAT=1 ile açık şekilde isteyebilirsin.
    if (process.env.AYNA_FORCE_JSON_FORMAT === "1") {
      body.response_format = { type: "json_object" };
    }

    console.log(`[openrouter] -> ${model}`);
    const res = await fetch(OPENROUTER_URL, {
      method: "POST",
      headers: buildHeaders(),
      signal: controller.signal,
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(`OpenRouter ${res.status}: ${text.slice(0, 200) || res.statusText}`);
    }

    const json = await res.json();
    const content = json?.choices?.[0]?.message?.content;
    if (typeof content !== "string" || !content.trim()) {
      throw new Error("OpenRouter boş içerik döndürdü.");
    }
    console.log(`[openrouter] <- ${model} ${Date.now() - t0}ms`);
    return content.trim();
  } catch (err) {
    console.log(`[openrouter] !! ${model} ${Date.now() - t0}ms ${err?.message || err}`);
    throw err;
  } finally {
    clearTimeout(timer);
  }
}

// Modelin döndürdüğü metinden JSON'u kurtar. Bazen ```json ... ``` veya başında/sonunda metin olabilir.
function extractJsonBlock(raw) {
  if (!raw) return null;
  // 1) Doğrudan JSON ise
  const t = raw.trim();
  if (t.startsWith("{") && t.endsWith("}")) return t;
  // 2) ```json ... ``` çitleri
  const fenced = t.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  if (fenced && fenced[1]) return fenced[1].trim();
  // 3) İlk { ile son } arası
  const firstBrace = t.indexOf("{");
  const lastBrace = t.lastIndexOf("}");
  if (firstBrace !== -1 && lastBrace > firstBrace) {
    return t.slice(firstBrace, lastBrace + 1);
  }
  return null;
}

function normalizePayload(parsed) {
  // Boşlukları temizle, geçerli aralıklara sıkıştır.
  const comment = String(parsed?.comment ?? "").trim();
  let stance = String(parsed?.stance ?? "notr").trim().toLowerCase();
  if (!VALID_STANCES.has(stance)) stance = "notr";

  let intensity = Number(parsed?.intensity);
  if (!Number.isFinite(intensity)) intensity = 3;
  intensity = Math.max(1, Math.min(5, Math.round(intensity)));

  const willEngage = Boolean(parsed?.willEngage);

  let replyType = String(parsed?.replyType ?? "reply").trim().toLowerCase();
  if (!VALID_REPLY_TYPES.has(replyType)) replyType = "reply";

  return { comment, stance, intensity, willEngage, replyType };
}

function parsePersonaJson(raw) {
  const block = extractJsonBlock(raw);
  if (!block) {
    throw new Error("JSON bloğu bulunamadı.");
  }
  let parsed;
  try {
    parsed = JSON.parse(block);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    throw new Error(`JSON parse hatası: ${msg}`, { cause: err });
  }
  if (!parsed || typeof parsed !== "object") {
    throw new Error("JSON nesne değil.");
  }
  const out = normalizePayload(parsed);
  if (!out.comment) throw new Error("`comment` boş.");
  return out;
}

function fallbackPayload(reason) {
  return {
    comment: `(bu persona şu an cevap veremedi: ${reason})`,
    stance: "notr",
    intensity: 1,
    willEngage: false,
    replyType: "reply",
  };
}

function resolveModel(persona) {
  const roleKey = persona.modelRole && MODEL_ROLES[persona.modelRole]
    ? persona.modelRole
    : "personaPrimary";
  return { roleKey, model: MODEL_ROLES[roleKey] };
}

// Tek bir personayı çağırır, dönerken JSON'u parse eder.
async function runOnePersona({ persona, tweet }) {
  const system = PERSONA_PROMPTS[persona.id];
  const { roleKey, model } = resolveModel(persona);

  if (!system) {
    return {
      personaId: persona.id,
      model,
      roleKey,
      ...fallbackPayload(`persona prompt'u tanımsız (${persona.id})`),
      error: "MISSING_PERSONA",
    };
  }

  try {
    const raw = await callOnce({
      model,
      system,
      user: `Tweet:\n${tweet}\n\nBu tweet için JSON formatında yorumunu üret.`,
    });
    const payload = parsePersonaJson(raw);
    return {
      personaId: persona.id,
      model,
      roleKey,
      ...payload,
    };
  } catch (err) {
    return {
      personaId: persona.id,
      model,
      roleKey,
      ...fallbackPayload(err?.message || String(err)),
      error: err?.message || String(err),
    };
  }
}

/**
 * 8 persona için paralel başlat. Sonuçları (her biri hazır oldukça) callback ile yayınla.
 *
 * @param {object} args
 * @param {string} args.tweet
 * @param {Array} args.personas
 * @param {(result) => void} args.onPersona - her persona cevabı hazır olduğunda çağrılır.
 * @returns {Promise<Array>} hepsi bitince tüm sonuçların listesi (sırasız).
 */
export async function simulatePersonasStream({ tweet, personas, onPersona }) {
  // API key kontrolünü baştan tek seferde yap.
  buildHeaders();

  const tasks = personas.map((p) =>
    runOnePersona({ persona: p, tweet }).then((result) => {
      if (typeof onPersona === "function") {
        try {
          onPersona(result);
        } catch {
          // callback hatası simülasyonu bozmasın
        }
      }
      return result;
    })
  );

  return Promise.all(tasks);
}

// Council ve diğer modüllerin yeniden kullanabilmesi için düşük seviye helper'lar.
export { callOnce, extractJsonBlock };

// Test/debug için: bozuk JSON simülasyonunda parse fallback'i çalışır.
export const __test__ = {
  parsePersonaJson,
  fallbackPayload,
  extractJsonBlock,
  normalizePayload,
};

export { MissingApiKeyError };
