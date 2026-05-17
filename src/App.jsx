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
  BadgeCheck,
  MessageCircle,
  Repeat2,
  Heart,
  BarChart3,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { PersonaCard, PersonaPending } from "@/components/PersonaCard";
import { RiskGauge } from "@/components/RiskGauge";
import { CouncilPanel } from "@/components/CouncilPanel";
import { StanceBar } from "@/components/StanceBar";

import { PERSONAS } from "@/config";
import { MOCK_COMMENTS, MOCK_RISK, SAMPLE_TWEET } from "@/mockData";
import { DEMO_SEEDS } from "@/seeds";
import { postSse } from "@/lib/sse";
import { cn } from "@/lib/utils";

// X Premium uzun-tweet sınırı + backend max 1000 ile hizalı; 280'i amber uyarı eşiği olarak tutuyoruz.
const MAX_CHARS = 1000;
const SOFT_LIMIT = 280;

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
  const [softenTot, setSoftenTot] = useState(null); // { secilenDal, branches, evaluatorModel }
  // Aktif demo seed (örn. Ruhi Çenet) — composer'ın avatar/isim/handle'ını override eder.
  const [activeSeed, setActiveSeed] = useState(null);

  const abortRef = useRef(null);

  const charCount = draft.length;
  const overLimit = charCount > MAX_CHARS;
  const softWarn = charCount > SOFT_LIMIT && !overLimit; // X klasik 280 üstü — amber uyarı

  const handleSeedToggle = (seed) => {
    if (activeSeed?.id === seed.id) {
      // Aynı seed'i tekrar tıklama → seç bırak.
      setActiveSeed(null);
      return;
    }
    setActiveSeed(seed);
    setDraft(seed.tweet);
    // Yeni bir kompozisyon başlıyor — eski before/after temizlensin.
    setSnapshot(null);
    setNeDegisti(null);
    setSoftenTot(null);
  };

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
      setSoftenTot(null);
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
      activeSeed,
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
      // ToT bilgileri (3 dal + seçim) — UI'da etiket göstermek için
      if (Array.isArray(json.branches) && json.branches.length > 0) {
        setSoftenTot({
          secilenDal: json.secilenDal || null,
          branches: json.branches,
          evaluatorModel: json.evaluatorModel || null,
          secimGerekcesi: json.secimGerekcesi || "",
        });
      } else {
        setSoftenTot(null);
      }
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
    if (snapshot.activeSeed !== undefined) setActiveSeed(snapshot.activeSeed);
    setSnapshot(null);
    setNeDegisti(null);
    setSoftenTot(null);
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
          <span className="text-sm font-semibold tracking-tight">Mirror</span>
          <span className="ml-2 text-[11px] text-zinc-500">
            tweet simülatörü
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

          {/* X-stili composer önizleme kartı */}
          <div className="flex flex-1 flex-col rounded-xl border border-zinc-800 bg-zinc-900/40 p-3">
            {/* Üst: avatar + isim/handle + tik — aktif seed varsa o profilden, yoksa "Sen". */}
            <div className="mb-2 flex items-center gap-2">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-amber-500/30 to-fuchsia-500/30 text-base ring-1 ring-zinc-700/50">
                {activeSeed?.profile?.avatarSrc ? (
                  <img
                    src={activeSeed.profile.avatarSrc}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span>🪞</span>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1">
                  <span className="truncate text-sm font-semibold text-zinc-100">
                    {activeSeed?.profile?.name ?? "Sen"}
                  </span>
                  {(activeSeed ? activeSeed.profile.verified !== false : true) && (
                    <BadgeCheck className="h-3.5 w-3.5 shrink-0 text-sky-400" aria-label="doğrulanmış" />
                  )}
                </div>
                <span className="block truncate text-[11px] text-zinc-500">
                  {activeSeed
                    ? `${activeSeed.profile.handle} · ${activeSeed.profile.dateLabel ?? "şimdi"}`
                    : "@sen · şimdi"}
                </span>
              </div>
            </div>

            <Textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="Paylaşmadan önce burada dene…"
              className="flex-1 min-h-[140px] border-0 bg-transparent text-[14.5px] leading-relaxed focus:ring-0 focus:border-0 p-0"
            />

            {/* X-stili dummy etkileşim ikonları (rakamsız) */}
            <div className="mt-2 flex items-center gap-4 text-zinc-600">
              <MessageCircle size={13} />
              <Repeat2 size={13} />
              <Heart size={13} />
              <BarChart3 size={13} />
            </div>

            <div className="mt-3 flex items-center justify-between border-t border-zinc-800 pt-3">
              <span
                className={cn(
                  "text-[11px] tabular-nums",
                  overLimit
                    ? "text-red-400"
                    : softWarn
                    ? "text-amber-400"
                    : "text-zinc-500"
                )}
                title={softWarn ? "280 karakter — X klasik tweet sınırı aşıldı (Premium uzun-tweet alanı)" : undefined}
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

          {/* Hazır demo seed'leri: tek tıkla tweet + composer kimliği değişir. */}
          {DEMO_SEEDS.length > 0 && (
            <div className="flex flex-col gap-1.5">
              <span className="text-[10px] uppercase tracking-[0.18em] text-zinc-600">
                Hazır seedler
              </span>
              <div className="flex flex-wrap gap-1.5">
                {DEMO_SEEDS.map((s) => {
                  const active = activeSeed?.id === s.id;
                  return (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => handleSeedToggle(s)}
                      className={cn(
                        "inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[11px] transition-colors duration-150",
                        active
                          ? "border-amber-500/50 bg-amber-500/10 text-amber-200"
                          : "border-zinc-800 bg-zinc-900/60 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200"
                      )}
                      title={s.label}
                    >
                      {s.profile?.avatarSrc ? (
                        <img
                          src={s.profile.avatarSrc}
                          alt=""
                          className="h-4 w-4 shrink-0 rounded-full object-cover"
                        />
                      ) : null}
                      <span className="truncate">{s.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

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
                    {softenTot && Array.isArray(softenTot.branches) && softenTot.branches.length > 1 && (
                      <div
                        className="text-[10.5px] leading-snug text-zinc-400"
                        title={
                          softenTot.branches
                            .map(
                              (b) =>
                                `${b.label || b.strategy}${
                                  b.skor
                                    ? ` — risk↓ ${b.skor.riskDusus}, niyet ${b.skor.niyetKorunma}`
                                    : ""
                                }${b.strategy === softenTot.secilenDal ? "  ✓ seçilen" : ""}`
                            )
                            .join("\n")
                        }
                      >
                        <span className="inline-flex items-center gap-1 rounded-full border border-zinc-700/60 bg-zinc-800/40 px-1.5 py-0.5">
                          <Sparkles className="h-2.5 w-2.5 text-amber-400" />
                          <span>3 alternatif değerlendirildi · en güvenlisi seçildi</span>
                        </span>
                      </div>
                    )}
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
