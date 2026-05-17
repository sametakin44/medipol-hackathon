import { motion, useReducedMotion } from "framer-motion";
import { Users } from "lucide-react";
import { cn } from "@/lib/utils";

// model slug → kısa görünür ad
function shortModelName(slug) {
  if (!slug) return "?";
  if (slug.startsWith("anthropic/")) return "Claude";
  if (slug.startsWith("openai/")) return "GPT-4o";
  if (slug.startsWith("google/")) return "Gemini";
  if (slug.startsWith("meta-llama/")) return "Llama";
  if (slug.startsWith("mistralai/")) return "Mistral";
  if (slug.startsWith("qwen/")) return "Qwen";
  const tail = slug.split("/").pop() || slug;
  return tail.split("-").slice(0, 2).join(" ");
}

function avgScore(m) {
  const v = (Number(m.virallik) + Number(m.polarizasyon) + Number(m.itibarRiski)) / 3;
  return Math.round(v);
}

function zoneColor(value) {
  if (value >= 70) return "#ef4444";
  if (value >= 40) return "#f59e0b";
  return "#22c55e";
}

/**
 * @param {{ councilStage1?: Array<{memberKey, model, virallik, polarizasyon, itibarRiski}>, president?: string }} props
 */
export function CouncilPanel({ councilStage1, president }) {
  const reduce = useReducedMotion();
  if (!Array.isArray(councilStage1) || councilStage1.length === 0) return null;

  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-3">
      <div className="mb-2 flex items-center gap-1.5 text-[10px] uppercase tracking-[0.18em] text-zinc-500">
        <Users size={12} />
        <span>Uzman Kurulu</span>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {councilStage1.map((m, i) => {
          const name = shortModelName(m.model);
          const avg = avgScore(m);
          const color = zoneColor(avg);
          const isPresident = m.memberKey === president;
          return (
            <motion.div
              key={m.memberKey + i}
              initial={reduce ? false : { opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: reduce ? 0 : 0.25,
                delay: reduce ? 0 : i * 0.15,
                ease: "easeOut",
              }}
              className={cn(
                "relative flex flex-col items-center gap-0.5 rounded-lg border bg-zinc-950/40 px-1.5 py-1.5",
                isPresident ? "border-amber-500/40" : "border-zinc-800"
              )}
              title={`${m.model}${isPresident ? " (başkan)" : ""} · V${m.virallik} P${m.polarizasyon} İ${m.itibarRiski}`}
            >
              <span className="text-[11px] font-semibold text-zinc-200">
                {name}
              </span>
              <span
                className="text-base font-semibold tabular-nums leading-none"
                style={{ color }}
              >
                {avg}
              </span>
              {isPresident && (
                <span className="absolute -top-1.5 right-1 rounded-full bg-amber-500/90 px-1 text-[8px] font-bold uppercase tracking-wider text-zinc-950">
                  baş
                </span>
              )}
            </motion.div>
          );
        })}
      </div>

      <p className="mt-2 text-[10px] leading-snug text-zinc-500">
        3 yapay zeka uzmanı bağımsız değerlendirdi, başkan model sentezledi.
      </p>
    </div>
  );
}
