import { useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  Send,
  Flame,
  Scale,
  ShieldAlert,
  Loader2,
  AlertTriangle,
  Square,
  Wand2,
  Undo2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { PersonaCard, PersonaPending } from "@/components/PersonaCard";
import { RiskGauge } from "@/components/RiskGauge";
import { CouncilPanel } from "@/components/CouncilPanel";
import { StanceBar } from "@/components/StanceBar";

import { PERSONAS } from "@/config";
import { MOCK_COMMENTS, MOCK_RISK, SAMPLE_TWEET } from "@/mockData";
import { postSse } from "@/lib/sse";

const MAX_CHARS = 280;

const ZERO_RISK = { virallik: 0, polarizasyon: 0, itibarRiski: 0 };

// mockData yorum formatından Adım 3 payload formatına dönüştür (fallback için).
function mockCommentToPayload(c) {
  return {
    personaId: c.personaId,
    comment: c.text,
    stance: "notr",
    intensity: 3,
    willEngage: false,
    replyType: "reply",
    isMock: true,
  };
}

export default function App() {
  const [draft, setDraft] = useState(SAMPLE_TWEET);
  const [loading, setLoading] = useState(false);
  const [hasResult, setHasResult] = useState(false);
  // personaId -> payload (gelen sırada doluyor)
  const [results, setResults] = useState({});
  const [risk, setRisk] = useState(ZERO_RISK);
  const [gerekce, setGerekce] = useState(null); // council per-metrik gerekçe { virallik, polarizasyon, itibarRiski }
  const [councilStage1, setCouncilStage1] = useState(null); // [{memberKey, model, virallik, polarizasyon, itibarRiski}]
  const [councilPresident, setCouncilPresident] = useState(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [isMockFallback, setIsMockFallback] = useState(false);
  const [streamingPersonaIds, setStreamingPersonaIds] = useState(
    () => new Set()
  );
  // Yumuşat (before/after) durumu
  const [snapshot, setSnapshot] = useState(null); // { tweet, risk, results, gerekce }
  const [neDegisti, setNeDegisti] = useState(null);
  const [softening, setSoftening] = useState(false);

  const abortRef = useRef(null);

  const charCount = draft.length;
  const overLimit = charCount > MAX_CHARS;

  const personaById = useMemo(
    () => Object.fromEntries(PERSONAS.map((p) => [p.id, p])),
    []
  );

  const cancelStreaming = () => {
    abortRef.current?.abort();
    abortRef.current = null;
    setLoading(false);
  };

  const handleSimulate = async (opts = {}) => {
    const tweetToUse = (opts.tweet ?? draft).toString();
    const keepSnapshot = opts.keepSnapshot === true;
    if (!tweetToUse.trim() || loading) return;

    setLoading(true);
    setHasResult(true); // streaming durumunu hemen göster
    setErrorMsg("");
    setIsMockFallback(false);
    setResults({});
    setRisk(ZERO_RISK);
    setGerekce(null);
    setCouncilStage1(null);
    setCouncilPresident(null);
    setStreamingPersonaIds(new Set(PERSONAS.map((p) => p.id)));
    if (!keepSnapshot) {
      // Kullanıcı yeni bir simülasyon başlatıyor; eski before/after'ı temizle.
      setSnapshot(null);
      setNeDegisti(null);
    }

    const controller = new AbortController();
    abortRef.current = controller;

    let sawError = false;

    await postSse({
      url: "/api/simulate",
      body: { tweet: tweetToUse },
      signal: controller.signal,
      handlers: {
        meta: () => {
          // ileride model bilgisini header'da göstermek için kullanılabilir.
        },
        persona: (payload) => {
          if (!payload?.personaId) return;
          setResults((prev) => ({ ...prev, [payload.personaId]: payload }));
          setStreamingPersonaIds((prev) => {
            if (!prev.has(payload.personaId)) return prev;
            const next = new Set(prev);
            next.delete(payload.personaId);
            return next;
          });
        },
        risk: (data) => {
          setRisk({
            virallik: data?.virallik ?? 0,
            polarizasyon: data?.polarizasyon ?? 0,
            itibarRiski: data?.itibarRiski ?? 0,
          });
          // Council gerekçesi (her metrik için 1 cümle); fallback'te bu alan gelmeyebilir.
          if (data?.gerekce && typeof data.gerekce === "object") {
            setGerekce({
              virallik: data.gerekce.virallik || "",
              polarizasyon: data.gerekce.polarizasyon || "",
              itibarRiski: data.gerekce.itibarRiski || "",
            });
          } else {
            setGerekce(null);
          }
          // Uzman kurulu — 3 council üyesinin ham skoru (heuristic fallback'te gelmez).
          if (Array.isArray(data?.councilStage1) && data.councilStage1.length > 0) {
            setCouncilStage1(data.councilStage1);
            setCouncilPresident(data?.president || null);
          } else {
            setCouncilStage1(null);
            setCouncilPresident(null);
          }
        },
        done: () => {
          setLoading(false);
          setStreamingPersonaIds(new Set());
        },
        error: (data) => {
          sawError = true;
          setErrorMsg(data?.message || "Bilinmeyen bir hata oluştu.");
        },
        onTransportError: (msg) => {
          sawError = true;
          setErrorMsg(msg);
        },
      },
    });

    abortRef.current = null;

    if (sawError) {
      // Fallback: mock veriyi göster ki UI boş kalmasın.
      const mockResults = Object.fromEntries(
        MOCK_COMMENTS.map((c) => [c.personaId, mockCommentToPayload(c)])
      );
      setResults(mockResults);
      setRisk(MOCK_RISK);
      setIsMockFallback(true);
      setStreamingPersonaIds(new Set());
    }
    setLoading(false);
  };

  const handleSoften = async () => {
    if (!hasResult || loading || softening || !draft.trim()) return;

    // Şu anki sonucu snapshot olarak sakla (before).
    const previousSnapshot = {
      tweet: draft,
      risk: { ...risk },
      results: { ...results },
      gerekce: gerekce ? { ...gerekce } : null,
      councilStage1: councilStage1 ? [...councilStage1] : null,
      councilPresident,
    };

    setSoftening(true);
    setErrorMsg("");

    try {
      const res = await fetch("/api/soften", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tweet: draft,
          gerekce: gerekce || undefined,
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(json?.error || `Yumuşat hatası (HTTP ${res.status}).`);
      }
      const yumusatilmis = String(json.yumusatilmisTweet || "").trim();
      if (!yumusatilmis) throw new Error("Yumuşatılmış tweet boş döndü.");

      setSnapshot(previousSnapshot);
      setNeDegisti(json.neDegisti || "");
      setDraft(yumusatilmis);
      setSoftening(false);
      // Otomatik yeni simülasyonu tetikle — snapshot'ı koru ki before/after gösterilsin.
      await handleSimulate({ tweet: yumusatilmis, keepSnapshot: true });
    } catch (err) {
      setSoftening(false);
      setErrorMsg(err?.message || "Yumuşat sırasında bilinmeyen bir hata oluştu.");
    }
  };

  const handleRevert = () => {
    if (!snapshot) return;
    setDraft(snapshot.tweet);
    setResults(snapshot.results);
    setRisk(snapshot.risk);
    setGerekce(snapshot.gerekce);
    setCouncilStage1(snapshot.councilStage1 ?? null);
    setCouncilPresident(snapshot.councilPresident ?? null);
    setSnapshot(null);
    setNeDegisti(null);
    setErrorMsg("");
  };

  const personasRendered = PERSONAS.map((p) => ({
    persona: p,
    payload: results[p.id],
    streaming: streamingPersonaIds.has(p.id),
  }));

  const completedCount = personasRendered.filter((r) => r.payload).length;

  return (
    <div className="h-screen w-screen overflow-hidden bg-black text-zinc-100">
      <header className="flex h-11 items-center justify-between border-b border-zinc-900 px-5">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-amber-500" />
          <span className="text-sm font-semibold tracking-tight">AYNA</span>
          <span className="ml-2 text-[11px] text-zinc-500">
            tweet yorum simülatörü
          </span>
        </div>
        <div className="flex items-center gap-3 text-[11px] text-zinc-600">
          {loading && (
            <span className="flex items-center gap-1 text-amber-400">
              <Loader2 className="h-3 w-3 animate-spin" />
              {completedCount}/{PERSONAS.length} canlı akış
            </span>
          )}
          {snapshot && (
            <span className="rounded-full border border-amber-500/40 bg-amber-500/10 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-amber-300">
              before / after
            </span>
          )}
          <span>v0.6 — polish</span>
        </div>
      </header>

      <main className="grid h-[calc(100vh-2.75rem)] grid-cols-12 gap-4 p-4">
        {/* SOL — Kompozisyon (dar) */}
        <section className="col-span-12 flex min-h-0 flex-col gap-3 md:col-span-2">
          <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.18em] text-zinc-500">
            <Send size={12} />
            <span>Tweet</span>
          </div>

          <div className="flex flex-1 flex-col rounded-xl border border-zinc-800 bg-zinc-900/40 p-3">
            <Textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="Paylaşmadan önce burada dene…"
              className="flex-1 min-h-[180px] border-0 bg-transparent text-[15px] focus:ring-0 focus:border-0 p-0"
            />

            <div className="mt-3 flex items-center justify-between border-t border-zinc-800 pt-3">
              <span
                className={
                  "text-[11px] tabular-nums " +
                  (overLimit ? "text-red-400" : "text-zinc-500")
                }
              >
                {charCount}/{MAX_CHARS}
              </span>

              {loading ? (
                <Button
                  onClick={cancelStreaming}
                  size="sm"
                  variant="outline"
                >
                  <Square className="h-3 w-3" />
                  Durdur
                </Button>
              ) : (
                <Button
                  onClick={handleSimulate}
                  disabled={!draft.trim() || overLimit}
                  size="sm"
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  Simüle Et
                </Button>
              )}
            </div>
          </div>

          <p className="text-[11px] leading-relaxed text-zinc-600">
            8 persona, tweet'in altına yazacağı yorumu canlı yayınla simüle eder.
          </p>
        </section>

        {/* ORTA — Persona Yorumları (yıldız, en geniş) */}
        <section className="col-span-12 flex min-h-0 flex-col gap-3 md:col-span-7">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.18em] text-zinc-500">
              <span>Yorum Bölümü</span>
              <span className="text-zinc-700">·</span>
              <span>{PERSONAS.length} persona</span>
            </div>
            {hasResult && (
              <span className="text-[11px] text-zinc-600">
                {isMockFallback
                  ? "mock veri (fallback)"
                  : loading
                  ? `streaming · ${completedCount}/${PERSONAS.length}`
                  : "canlı modelden üretildi"}
              </span>
            )}
          </div>

          {hasResult && completedCount > 0 && (
            <StanceBar results={results} total={PERSONAS.length} />
          )}

          {errorMsg && (
            <div className="flex items-start gap-2 rounded-lg border border-red-900/60 bg-red-950/30 p-3 text-xs text-red-300">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-red-400" />
              <div className="min-w-0 flex-1">
                <div className="font-semibold text-red-200">Backend yanıt vermedi</div>
                <div className="mt-0.5 break-words text-red-300/90">{errorMsg}</div>
                <div className="mt-1 text-red-400/70">
                  Aşağıda mock veri gösteriliyor.
                </div>
              </div>
            </div>
          )}

          <div className="flex-1 min-h-0 overflow-y-auto pr-1">
            <AnimatePresence mode="wait">
              {!hasResult ? (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex h-full min-h-[280px] flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-zinc-800 text-center text-zinc-500"
                >
                  <Sparkles className="h-7 w-7 text-amber-500/70" />
                  <p className="text-sm">
                    Tweet'ini yaz, "Simüle Et"e bas.
                  </p>
                  <p className="text-xs text-zinc-600">
                    8 persona aynada sana yorumu canlı gösterecek.
                  </p>
                </motion.div>
              ) : (
                <motion.div
                  key="feed"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex flex-col gap-2"
                >
                  {personasRendered.map(({ persona, payload, streaming }, i) =>
                    payload ? (
                      <PersonaCard
                        key={persona.id}
                        persona={persona}
                        payload={payload}
                        index={i}
                      />
                    ) : streaming ? (
                      <PersonaPending key={persona.id} persona={persona} />
                    ) : null
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </section>

        {/* SAĞ — Risk Paneli (orta) */}
        <section className="col-span-12 flex min-h-0 flex-col gap-3 md:col-span-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.18em] text-zinc-500">
              <ShieldAlert size={12} />
              <span>Risk Paneli</span>
            </div>
            {snapshot && (
              <span className="text-[10px] uppercase tracking-wider text-amber-300/80">
                önce → sonra
              </span>
            )}
          </div>

          <div className="flex flex-1 min-h-0 flex-col gap-2 overflow-y-auto pr-1">
            <CouncilPanel councilStage1={councilStage1} president={councilPresident} />

            <RiskGauge
              label="Virallik"
              value={risk.virallik}
              icon={Flame}
              gerekce={gerekce?.virallik}
              previousValue={snapshot?.risk?.virallik}
            />
            <RiskGauge
              label="Polarizasyon"
              value={risk.polarizasyon}
              icon={Scale}
              gerekce={gerekce?.polarizasyon}
              previousValue={snapshot?.risk?.polarizasyon}
            />
            <RiskGauge
              label="İtibar Riski"
              value={risk.itibarRiski}
              icon={ShieldAlert}
              gerekce={gerekce?.itibarRiski}
              previousValue={snapshot?.risk?.itibarRiski}
            />

            {/* Yumuşat / Geri Al — risk paneli dolunca beliren aksiyon kutusu */}
            {hasResult && !loading && !isMockFallback && (
              <div className="rounded-2xl border border-amber-500/30 bg-amber-500/5 p-2.5">
                {snapshot ? (
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.18em] text-amber-300">
                      <Wand2 size={12} />
                      yumuşatıldı
                    </div>
                    {neDegisti && (
                      <p className="text-[12px] leading-relaxed text-zinc-300">
                        {neDegisti}
                      </p>
                    )}
                    <Button
                      onClick={handleRevert}
                      size="sm"
                      variant="outline"
                      className="border-amber-500/40 text-amber-200 hover:bg-amber-500/10"
                    >
                      <Undo2 className="h-3.5 w-3.5" />
                      Geri al (orijinal tweet)
                    </Button>
                  </div>
                ) : (
                  <div className="flex flex-col gap-2">
                    <p className="text-[11px] leading-relaxed text-zinc-400">
                      Council bu tweet'i riskli buldu. Niyetini koruyup dili yumuşatayım mı?
                    </p>
                    <Button
                      onClick={handleSoften}
                      disabled={softening}
                      size="sm"
                    >
                      {softening ? (
                        <>
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          Yumuşatılıyor…
                        </>
                      ) : (
                        <>
                          <Wand2 className="h-3.5 w-3.5" />
                          Yumuşat ve tekrar dene
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
