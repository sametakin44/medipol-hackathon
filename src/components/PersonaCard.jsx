import { motion, useReducedMotion } from "framer-motion";
import { Quote, Loader2 } from "lucide-react";

import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

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
      {intensity ? (
        <span className="opacity-70">·{intensity}</span>
      ) : null}
    </span>
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
          <div
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-zinc-800 text-xl"
            aria-hidden="true"
          >
            {persona.avatarEmoji}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
              <span className="text-sm font-semibold text-zinc-100">
                {persona.label}
              </span>
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
            <p className="mt-1.5 text-sm leading-relaxed text-zinc-200 whitespace-pre-wrap">
              {payload?.comment}
            </p>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}

// "yazıyor..." placeholder — SSE geldikçe yerini PersonaCard alır.
export function PersonaPending({ persona }) {
  return (
    <Card className="p-3 opacity-70 motion-safe:animate-pulse">
      <div className="flex gap-3">
        <div
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-zinc-800 text-xl grayscale"
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
            <Loader2 className="h-3 w-3 animate-spin text-amber-500/70" />
            <span className="inline-flex items-center gap-1">
              yazıyor
              <TypingDots />
            </span>
          </div>
        </div>
      </div>
    </Card>
  );
}

function TypingDots() {
  return (
    <span className="inline-flex gap-0.5">
      <span className="h-1 w-1 animate-pulse rounded-full bg-zinc-500" style={{ animationDelay: "0ms" }} />
      <span className="h-1 w-1 animate-pulse rounded-full bg-zinc-500" style={{ animationDelay: "150ms" }} />
      <span className="h-1 w-1 animate-pulse rounded-full bg-zinc-500" style={{ animationDelay: "300ms" }} />
    </span>
  );
}
