import { motion, useReducedMotion } from "framer-motion";

const STANCE_ORDER = ["destek", "karsit", "alayci", "notr"];
const STANCE_LABEL = {
  destek: "destek",
  karsit: "karşıt",
  alayci: "alaycı",
  notr: "nötr",
};
const STANCE_COLOR = {
  destek: "#22c55e",
  karsit: "#ef4444",
  alayci: "#d946ef",
  notr: "#71717a",
};

function countStances(results) {
  const counts = { destek: 0, karsit: 0, alayci: 0, notr: 0 };
  for (const r of Object.values(results || {})) {
    const s = r?.stance;
    if (s && counts[s] !== undefined) counts[s] += 1;
  }
  return counts;
}

/**
 * @param {{ results: Record<string, {stance:string}>, total?: number }} props
 */
export function StanceBar({ results, total = 8 }) {
  const reduce = useReducedMotion();
  const counts = countStances(results);
  const sum = Object.values(counts).reduce((a, b) => a + b, 0);
  if (sum === 0) return null;

  // Görünür segmentleri sıralı topla.
  const segments = STANCE_ORDER.filter((s) => counts[s] > 0).map((s) => ({
    stance: s,
    count: counts[s],
    pct: (counts[s] / total) * 100,
  }));

  const summaryText = segments
    .map((s) => `${s.count} ${STANCE_LABEL[s.stance]}`)
    .join(" · ");

  return (
    <div className="flex items-center gap-3">
      <div className="flex h-1.5 flex-1 overflow-hidden rounded-full bg-zinc-900">
        {segments.map((s, i) => (
          <motion.div
            key={s.stance}
            initial={reduce ? false : { width: 0 }}
            animate={{ width: `${s.pct}%` }}
            transition={{
              duration: reduce ? 0 : 0.45,
              delay: reduce ? 0 : i * 0.06,
              ease: "easeOut",
            }}
            style={{ background: STANCE_COLOR[s.stance] }}
            title={`${s.count} ${STANCE_LABEL[s.stance]}`}
          />
        ))}
      </div>
      <span className="shrink-0 text-[10.5px] text-zinc-500">{summaryText}</span>
    </div>
  );
}
