import { motion, useReducedMotion, animate, useMotionValue } from "framer-motion";
import { useEffect, useState } from "react";
import {
  Quote,
  BadgeCheck,
  MessageCircle,
  Repeat2,
  Heart,
  BarChart3,
} from "lucide-react";

import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { computeEngagement, formatTrCount } from "@/lib/engagement";

const STANCE_STYLES = {
  destek: { label: "destek", className: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30" },
  karsit: { label: "karşıt", className: "bg-red-500/15 text-red-300 border-red-500/30" },
  alayci: { label: "alaycı", className: "bg-fuchsia-500/15 text-fuchsia-300 border-fuchsia-500/30" },
  notr:   { label: "nötr",   className: "bg-zinc-500/15 text-zinc-300 border-zinc-500/30" },
};

function StanceBadge({ stance, intensity }) {
  const style = STANCE_STYLES[stance] || STANCE_STYLES.notr;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider",
        style.className
      )}
      title={`yoğunluk ${intensity}/5`}
    >
      <span>{style.label}</span>
      {intensity ? <span className="opacity-70">·{intensity}</span> : null}
    </span>
  );
}

// X-stili etkileşim sayısı (count-up animasyonlu).
function EngagementMetric({ Icon, value, color = "text-zinc-500", animateOn = true }) {
  const reduce = useReducedMotion();
  const mv = useMotionValue(0);
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    if (!animateOn || reduce) {
      setDisplay(value || 0);
      return;
    }
    const controls = animate(mv, value || 0, {
      duration: 0.3,
      ease: "easeOut",
      onUpdate: (v) => setDisplay(Math.round(v)),
    });
    return () => controls.stop();
  }, [value, animateOn, reduce, mv]);

  return (
    <span className={cn("inline-flex items-center gap-1 text-[11px] tabular-nums", color)}>
      <Icon size={13} />
      {formatTrCount(display)}
    </span>
  );
}

function EngagementRow({ payload }) {
  const eng = computeEngagement(payload);
  return (
    <div className="mt-2 flex items-center gap-4 border-t border-zinc-800/60 pt-2 text-zinc-500">
      <EngagementMetric Icon={MessageCircle} value={eng.replies} />
      <EngagementMetric Icon={Repeat2} value={eng.retweets} color="text-zinc-500" />
      <EngagementMetric Icon={Heart} value={eng.likes} color="text-zinc-500" />
      <EngagementMetric Icon={BarChart3} value={eng.views} color="text-zinc-500" />
    </div>
  );
}

export function PersonaCard({ persona, payload, index = 0 }) {
  const reduce = useReducedMotion();
  const stance = payload?.stance || "notr";
  const intensity = payload?.intensity || 0;
  const isQuote = payload?.replyType === "quote";

  return (
    <motion.div
      initial={reduce ? false : { opacity: 0, y: 10, scale: 0.99 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{
        duration: reduce ? 0 : 0.22,
        delay: reduce ? 0 : Math.min(index, 6) * 0.05,
        ease: "easeOut",
      }}
    >
      <Card
        className={cn(
          "p-3 transition-colors hover:border-zinc-700",
          isQuote && "border-l-2 border-l-amber-500/70 bg-zinc-900/60"
        )}
      >
        <div className="flex gap-3">
          {/* Yuvarlak avatar — emoji ortalı, X-stili. */}
          <div
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-zinc-700 to-zinc-800 text-xl ring-1 ring-zinc-700/50"
            aria-hidden="true"
          >
            {persona.avatarEmoji}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-x-1.5 gap-y-1">
              <span className="text-sm font-semibold text-zinc-100">
                {persona.label}
              </span>
              {/* X tarzı doğrulama tiki (lucide telifsiz). */}
              <BadgeCheck className="h-3.5 w-3.5 text-sky-400" aria-label="doğrulanmış" />
              <span className="text-xs text-zinc-500 truncate">
                @{persona.id}
              </span>
              <span className="ml-auto flex items-center gap-1">
                {isQuote && (
                  <span
                    className="inline-flex items-center gap-1 rounded-full border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-amber-300"
                    title="alıntı tweet"
                  >
                    <Quote size={10} />
                    alıntı
                  </span>
                )}
                <StanceBadge stance={stance} intensity={intensity} />
              </span>
            </div>
            <p className="mt-1.5 text-[13.5px] leading-relaxed text-zinc-200 whitespace-pre-wrap">
              {payload?.comment}
            </p>
            {/* X-stili etkileşim satırı — sahte ama tutarlı sayılar */}
            {payload?.personaId && !payload?.isMock && <EngagementRow payload={payload} />}
          </div>
        </div>
      </Card>
    </motion.div>
  );
}

// "yazıyor..." placeholder — X tipi 3 nokta yumuşak dalga.
export function PersonaPending({ persona }) {
  return (
    <Card className="p-3 opacity-80">
      <div className="flex gap-3">
        <div
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-zinc-700 to-zinc-800 text-xl grayscale ring-1 ring-zinc-700/50"
          aria-hidden="true"
        >
          {persona.avatarEmoji}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline gap-2">
            <span className="text-sm font-semibold text-zinc-300">
              {persona.label}
            </span>
            <span className="text-xs text-zinc-600 truncate">
              @{persona.id}
            </span>
          </div>
          <div className="mt-1.5 flex items-center gap-2 text-xs text-zinc-500">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-zinc-800/60 px-2 py-1">
              <TypingDots />
            </span>
            <span className="italic">yazıyor…</span>
          </div>
        </div>
      </div>
    </Card>
  );
}

function TypingDots() {
  const reduce = useReducedMotion();
  return (
    <span className="inline-flex items-end gap-1" aria-hidden="true">
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className="block h-1.5 w-1.5 rounded-full bg-zinc-400"
          initial={false}
          animate={reduce ? { y: 0 } : { y: [0, -3, 0] }}
          transition={{
            duration: 0.9,
            ease: "easeInOut",
            repeat: reduce ? 0 : Infinity,
            delay: i * 0.15,
          }}
        />
      ))}
    </span>
  );
}
