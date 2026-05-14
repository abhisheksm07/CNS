import { motion } from "framer-motion";

export default function MetricCard({ label, value, tone = "cyan", suffix = "" }) {
  const tones = {
    cyan: "text-cyanline shadow-neon",
    violet: "text-violetline shadow-violet",
    yellow: "text-signal",
    red: "text-danger shadow-danger",
    green: "text-emerald-300"
  };

  return (
    <motion.div whileHover={{ y: -3 }} className="rounded-md border border-white/10 bg-white/[0.045] p-3">
      <p className="text-[11px] uppercase tracking-[0.18em] text-slate-400">{label}</p>
      <p className={`mt-2 font-display text-2xl ${tones[tone] || tones.cyan}`}>
        {value}
        <span className="text-sm text-slate-400">{suffix}</span>
      </p>
    </motion.div>
  );
}
