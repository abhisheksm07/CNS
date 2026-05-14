import { ShieldAlert } from "lucide-react";
import { MANIPULATIONS } from "../simulation/simulationSteps.js";

const toneClasses = {
  cyan: "border-cyanline/30 bg-cyanline/10 text-cyan-100",
  red: "border-danger/40 bg-danger/10 text-rose-100",
  yellow: "border-signal/40 bg-signal/10 text-yellow-100",
  violet: "border-violetline/40 bg-violetline/10 text-violet-100"
};

export default function ManipulationPanel({ activeStep, disabled, onInject, selectedManipulation }) {
  return (
    <div className="rounded-md border border-white/10 bg-white/[0.045] p-3">
      <div className="mb-3 flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-slate-400">
        <ShieldAlert className="h-4 w-4 text-danger" />
        Stage Manipulation
      </div>
      <p className="mb-3 text-sm leading-5 text-slate-400">
        {disabled ? "Manipulation is locked for this stage." : `Inject an event during ${activeStep.title}.`}
      </p>
      <div className="grid gap-2">
        {MANIPULATIONS.map((item) => (
          <button
            key={item.id}
            disabled={disabled && item.id !== "none"}
            onClick={() => onInject(item.id)}
            className={`rounded-md border px-3 py-2 text-left transition disabled:cursor-not-allowed disabled:opacity-35 ${toneClasses[item.tone]} ${selectedManipulation === item.id ? "ring-1 ring-white/50" : ""}`}
          >
            <span className="block text-sm font-semibold">{item.label}</span>
            <span className="mt-1 block text-xs opacity-70">{item.description}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
