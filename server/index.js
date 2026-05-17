// AYNA — Express backend (Adım 3: SSE streaming).
//
// Endpoint:
//   POST /api/simulate { tweet }
//     → text/event-stream
//     → events: meta, persona (her persona için), risk, done, error
//   GET  /api/health
//
// Risk hesabı Adım 4'te (Council) gerçeğe dönecek; şu an basit heuristik.

import express from "express";
import cors from "cors";

import { loadDotEnv } from "./loadEnv.js";
loadDotEnv();

import { MODEL_ROLES, PERSONAS } from "../src/config.js";
import { simulatePersonasStream, MissingApiKeyError } from "./openrouter.js";
import { computeRiskScores } from "./riskScore.js";
import { runCouncil } from "./council.js";
import { soften } from "./soften.js";
import { councilCache } from "./cache.js";
import { matchDemoSimulate, matchDemoSoften, DEMO_TWEET } from "./demoCache.js";

const DEMO_MODE = process.env.AYNA_DEMO_MODE === "1";

// Demo modunda SSE persona event'leri arasında verilen aralıkta rastgele beklenir.
const DEMO_PERSONA_DELAY_MIN_MS = 300;
const DEMO_PERSONA_DELAY_MAX_MS = 700;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const randDelay = () =>
  DEMO_PERSONA_DELAY_MIN_MS +
  Math.random() * (DEMO_PERSONA_DELAY_MAX_MS - DEMO_PERSONA_DELAY_MIN_MS);

const PORT = Number(process.env.PORT) || 3001;

const app = express();
app.use(cors({ origin: true }));
app.use(express.json({ limit: "32kb" }));

app.get("/api/health", (_req, res) => {
  res.json({
    ok: true,
    model: MODEL_ROLES.personaPrimary,
    apiKeyConfigured: Boolean(process.env.OPENROUTER_API_KEY?.trim()),
    personaCount: PERSONAS.length,
  });
});

function sseWrite(res, event, data) {
  res.write(`event: ${event}\n`);
  res.write(`data: ${JSON.stringify(data)}\n\n`);
}

app.post("/api/simulate", async (req, res) => {
  const tweet = (req.body?.tweet ?? "").toString().trim();

  if (!tweet) {
    return res.status(400).json({
      error: "Tweet metni boş. `tweet` alanı zorunlu.",
      code: "EMPTY_TWEET",
    });
  }
  if (tweet.length > 1000) {
    return res.status(400).json({
      error: "Tweet 1000 karakteri aşamaz.",
      code: "TWEET_TOO_LONG",
    });
  }

  // SSE başlıkları
  res.status(200);
  res.setHeader("Content-Type", "text/event-stream; charset=utf-8");
  res.setHeader("Cache-Control", "no-cache, no-transform");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");
  res.flushHeaders?.();

  // === DEMO MODE === sabit cache'i SSE üstünden gerçekçi gecikmelerle replay et.
  if (DEMO_MODE) {
    const demo = matchDemoSimulate(tweet);
    if (demo) {
      console.log(`[demo] simulate replay → ${tweet === DEMO_TWEET ? "BEFORE" : "AFTER"}`);
      sseWrite(res, "meta", { ...demo.meta, startedAt: Date.now(), demo: true });
      let clientGone = false;
      res.on("close", () => {
        if (!res.writableEnded) clientGone = true;
      });
      for (const p of demo.personas) {
        if (clientGone) return;
        await sleep(randDelay());
        sseWrite(res, "persona", p);
      }
      if (clientGone) return;
      await sleep(200);
      sseWrite(res, "risk", { ...demo.risk, fromCache: false, demo: true });
      sseWrite(res, "done", { ...demo.done, demo: true });
      res.end();
      return;
    }
    console.log(`[demo] simulate: tweet eşleşmedi, canlı API'ye düşülüyor`);
  }

  const t0 = Date.now();
  const expectedPersonaIds = PERSONAS.map((p) => p.id);

  sseWrite(res, "meta", {
    expectedPersonaIds,
    model: MODEL_ROLES.personaPrimary,
    sharpModel: MODEL_ROLES.personaSharp,
    startedAt: t0,
  });

  // Keep-alive ping (bazı proxy'ler 30 sn üzerinde idle bağlantıyı kapatır).
  const ping = setInterval(() => {
    res.write(`: ping\n\n`);
  }, 15_000);

  let clientGone = false;
  // Node 24 / Express 5'te req.on("close") gövde tüketildiğinde de fire ediyor — yanıltıcı.
  // Gerçek client disconnect için res.on("close") kullan (socket destroyed).
  res.on("close", () => {
    if (res.writableEnded) return; // normal akış sonu
    clientGone = true;
    clearInterval(ping);
  });

  try {
    const onPersona = (result) => {
      if (clientGone) {
        console.log(`[simulate] onPersona ${result.personaId} — clientGone, skipping`);
        return;
      }
      console.log(`[simulate] -> persona event ${result.personaId} (stance=${result.stance})`);
      sseWrite(res, "persona", result);
    };

    const all = await simulatePersonasStream({
      tweet,
      personas: PERSONAS,
      onPersona,
    });

    if (clientGone) return;

    // 8 persona bitti — Council'i çağır (cache kontrol et).
    // Persona çağrıları cache'lenmez ki demo'da canlı görünsünler.
    let riskPayload;
    let riskSource = "council";
    let cacheState = "miss";

    const cached = councilCache.get(tweet);
    if (cached) {
      cacheState = "hit";
      console.log(`[simulate] council cache HIT — tweet hash eşleşti (TTL 60s)`);
      riskPayload = { ...cached, fromCache: true };
    } else {
      console.log(`[simulate] council cache MISS — yeni council çağrılacak`);
      try {
        const council = await runCouncil({ tweet, personaResults: all });
        if (council) {
          // councilStage1 = her bağımsız üyenin 3 metrik skoru (UI'da görünürlük için).
          const councilStage1 = (council.council?.stage1 ?? []).map((m) => ({
            memberKey: m.memberKey,
            model: m.model,
            virallik: m.virallik,
            polarizasyon: m.polarizasyon,
            itibarRiski: m.itibarRiski,
          }));
          riskPayload = {
            virallik: council.virallik,
            polarizasyon: council.polarizasyon,
            itibarRiski: council.itibarRiski,
            gerekce: council.gerekce,
            source: "council",
            president: council.council.president,
            elapsedMs: council.council.elapsedMs,
            councilStage1,
          };
          councilCache.set(tweet, riskPayload);
        } else {
          console.log("[simulate] council null döndü, heuristic'e düşülüyor");
          riskPayload = { ...computeRiskScores(tweet), source: "heuristic-fallback" };
          riskSource = "heuristic-fallback";
        }
      } catch (err) {
        console.error("[simulate] council çağrısında beklenmedik hata:", err);
        riskPayload = { ...computeRiskScores(tweet), source: "heuristic-fallback" };
        riskSource = "heuristic-fallback";
      }
    }

    if (clientGone) return;

    sseWrite(res, "risk", riskPayload);
    sseWrite(res, "done", {
      elapsedMs: Date.now() - t0,
      total: all.length,
      riskSource,
      cacheState,
    });
  } catch (err) {
    if (err instanceof MissingApiKeyError) {
      sseWrite(res, "error", {
        code: err.code,
        message: err.message,
        hint: ".env.example dosyasını .env olarak kopyalayıp OPENROUTER_API_KEY değerini doldurun, sonra sunucuyu yeniden başlatın.",
      });
    } else {
      console.error("[simulate] beklenmedik hata:", err);
      sseWrite(res, "error", {
        code: "INTERNAL",
        message: err?.message || String(err),
      });
    }
  } finally {
    clearInterval(ping);
    if (!clientGone) res.end();
  }
});

// "Yumuşat" — orijinal tweet'i ve council gerekçesini alır, daha düşük riskli yeniden yazılmış halini döner.
app.post("/api/soften", async (req, res) => {
  const tweet = (req.body?.tweet ?? "").toString().trim();
  const gerekce = req.body?.gerekce;

  if (!tweet) {
    return res.status(400).json({
      error: "Tweet metni boş. `tweet` alanı zorunlu.",
      code: "EMPTY_TWEET",
    });
  }
  if (tweet.length > 1000) {
    return res.status(400).json({
      error: "Tweet 1000 karakteri aşamaz.",
      code: "TWEET_TOO_LONG",
    });
  }

  // === DEMO MODE === sabit yumuşatılmış tweet'i hızlıca dön (kısa, makul gecikme).
  if (DEMO_MODE) {
    const cached = matchDemoSoften(tweet);
    if (cached) {
      console.log(`[demo] soften replay → DEMO_TWEET`);
      await sleep(1200);
      return res.json({ ...cached, demo: true });
    }
    console.log(`[demo] soften: tweet eşleşmedi, canlı API'ye düşülüyor`);
  }

  try {
    const result = await soften({ tweet, gerekce });
    res.json(result);
  } catch (err) {
    if (err instanceof MissingApiKeyError) {
      return res.status(503).json({
        error: err.message,
        code: err.code,
        hint: ".env.example dosyasını .env olarak kopyalayıp OPENROUTER_API_KEY değerini doldurun.",
      });
    }
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[soften] beklenmedik hata:", err);
    res.status(500).json({
      error: "Yumuşat sırasında hata oluştu.",
      detail: msg,
      code: "INTERNAL",
    });
  }
});

const server = app.listen(PORT, () => {
  const keyOk = Boolean(process.env.OPENROUTER_API_KEY?.trim());
  console.log(`[ayna-server] http://localhost:${PORT}`);
  console.log(`[ayna-server] OPENROUTER_API_KEY: ${keyOk ? "OK" : "EKSİK (.env doldurulmalı)"}`);
  console.log(`[ayna-server] personaPrimary: ${MODEL_ROLES.personaPrimary}`);
  console.log(`[ayna-server] personaSharp:   ${MODEL_ROLES.personaSharp}`);
  console.log(`[ayna-server] DEMO_MODE: ${DEMO_MODE ? "AÇIK (cache replay)" : "kapalı (canlı API)"}`);
});

server.on("error", (err) => {
  if (err && err.code === "EADDRINUSE") {
    console.error(`[ayna-server] HATA: Port ${PORT} dolu — başka bir process bu portu dinliyor.`);
    console.error(`[ayna-server] Eski sunucuyu kapatın (Windows: 'netstat -ano | findstr :${PORT}' ile PID bulun, 'taskkill /F /PID <pid>' ile kapatın) ve tekrar deneyin.`);
    process.exit(1);
  }
  console.error("[ayna-server] sunucu hatası:", err);
  process.exit(1);
});
