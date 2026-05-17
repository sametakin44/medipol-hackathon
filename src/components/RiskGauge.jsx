import { motion, useMotionValue, useTransform, animate } from "framer-motion";
import { useEffect, useState } from "react";
import { ArrowRight } from "lucide-react";

const SIZE = 132;
const STROKE = 12;
const RADIUS = (SIZE - STROKE) / 2;
const CIRC = 2 * Math.PI * RADIUS;

function riskColor(value) {
  if (value >= 70) return "#ef4444";
  if (value >= 40) return "#f59e0b";
  return "#22c55e";
}

export function RiskGauge({ label, value, icon: Icon, gerekce, previousValue }) {
  const progress = useMotionValue(0);
  const dash = useTransform(progress, (v) => `${(v / 100) * CIRC} ${CIRC}`);
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    const controls = animate(progress, value || 0, {
      duration: 1.2,
      ease: "easeOut",
      onUpdate: (v) => setDisplay(Math.round(v)),
    });
    return () => controls.stop();
  }, [value, progress]);

  const color = riskColor(value || 0);
  const hasPrevious =
    typeof previousValue === "number" && previousValue !== value;
  const delta = hasPrevious ? value - previousValue : 0;
  const deltaPositive = delta > 0; // risk yükseldi
  const deltaColor = deltaPositive ? "#ef4444" : "#22c55e";

  return (
    <div className="flex flex-col items-center gap-2 rounded-2xl border border-zinc-800 bg-zinc-900/40 p-3">
      <div className="flex w-full items-center justify-between text-[11px] uppercase tracking-[0.18em] text-zinc-500">
        <span className="flex items-center gap-1.5">
          {Icon ? <Icon size={13} /> : null}
          {label}
        </span>
        <span className="font-semibold tabular-nums" style={{ color }}>
          {display}
        </span>
      </div>

      <div className="relative" style={{ width: SIZE, height: SIZE }}>
        <svg width={SIZE} height={SIZE} className="-rotate-90">
          <circle
            cx={SIZE / 2}
            cy={SIZE / 2}
            r={RADIUS}
            stroke="#27272a"
            strokeWidth={STROKE}
            fill="none"
          />
          <motion.circle
            cx={SIZE / 2}
            cy={SIZE / 2}
            r={RADIUS}
            stroke={color}
            strokeWidth={STROKE}
            strokeLinecap="round"
            fill="none"
            style={{ strokeDasharray: dash }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span
            className="text-3xl font-semibold tabular-nums leading-none"
            style={{ color }}
          >
            {display}
          </span>
          <span className="mt-0.5 text-[10px] uppercase tracking-[0.18em] text-zinc-500">
            / 100
          </span>
        </div>
      </div>

      {/* Before/after delta — Yumuşat sonrası */}
      {hasPrevious && (
        <div className="flex items-center gap-2 text-xs">
          <span className="tabular-nums text-zinc-500">önce {previousValue}</span>
          <ArrowRight size={12} className="text-zinc-600" />
          <span
            className="tabular-nums font-semibold"
            style={{ color: deltaColor }}
          >
            şimdi {value}
          </span>
          <span
            className="ml-1 rounded-full px-1.5 py-0.5 text-[10px] tabular-nums"
            style={{
              background: `${deltaColor}22`,
              color: deltaColor,
            }}
          >
            {delta > 0 ? "+" : ""}
            {delta}
          </span>
        </div>
      )}

      <div className="h-1.5 w-full rounded-full bg-zinc-800 overflow-hidden">
        <motion.div
          className="h-full rounded-full"
          style={{ background: color }}
          initial={{ width: 0 }}
          animate={{ width: `${value || 0}%` }}
          transition={{ duration: 1.2, ease: "easeOut" }}
        />
      </div>

      {gerekce ? (
        <p className="text-[10.5px] leading-snug text-zinc-500 text-center line-clamp-3">
          {gerekce}
        </p>
      ) : null}
    </div>
  );
}
