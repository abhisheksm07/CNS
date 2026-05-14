import { motion } from "framer-motion";

const toneClasses = {
  cyan: "text-cyanline",
  blue: "text-sky-300",
  violet: "text-violet-200",
  yellow: "text-signal",
  red: "text-danger",
  green: "text-emerald-300"
};

export default function StepTimeline({ steps, currentStep, selectedManipulations }) {
  return (
    <div className="rounded-md border border-white/10 bg-white/[0.045] p-3">
      <p className="mb-3 text-xs uppercase tracking-[0.18em] text-slate-400">Pipeline Timeline</p>
      <div className="max-h-[430px] space-y-2 overflow-y-auto pr-1">
        {steps.map((step, index) => {
          const active = index === currentStep;
          const complete = index < currentStep;
          const manipulation = selectedManipulations[step.id];
          return (
            <motion.div
              key={step.id}
              animate={{
                borderColor: active ? "rgba(47,252,255,.75)" : complete ? "rgba(110,231,183,.42)" : "rgba(255,255,255,.1)",
                opacity: active || complete ? 1 : 0.62
              }}
              className="rounded-md border bg-black/25 p-3"
            >
              <div className="flex items-start gap-3">
                <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-md border border-white/10 bg-white/[0.06] font-display ${toneClasses[step.color]}`}>
                  {step.symbol}
                </span>
                <div className="min-w-0">
                  <p className="font-display text-xs text-slate-100">{step.title}</p>
                  <p className="mt-1 text-[11px] leading-4 text-slate-500">{step.description}</p>
                  {manipulation && manipulation !== "none" && (
                    <p className="mt-2 rounded border border-danger/30 bg-danger/10 px-2 py-1 text-[11px] uppercase tracking-[0.12em] text-rose-100">
                      Injected: {manipulation}
                    </p>
                  )}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
