import { Gauge, Pause, Play, RotateCcw, SkipBack, SkipForward } from "lucide-react";

export default function SimulationControls({
  mode,
  setMode,
  isRunning,
  speed,
  setSpeed,
  onStart,
  onPause,
  onNext,
  onPrev,
  onReset,
  currentStep,
  totalSteps,
  disabled
}) {
  return (
    <div className="rounded-md border border-white/10 bg-white/[0.045] p-3">
      <div className="mb-3 flex items-center justify-between gap-2">
        <span className="text-xs uppercase tracking-[0.18em] text-slate-400">Simulation Control</span>
        <span className="font-display text-xs text-cyanline">
          {currentStep + 1}/{totalSteps}
        </span>
      </div>
      <select value={mode} onChange={(event) => setMode(event.target.value)} className="mb-3 w-full rounded-md border border-cyanline/20 bg-[#080d1f] p-2 text-sm text-slate-100 outline-none">
        <option value="manual">Manual Analysis</option>
        <option value="auto">Auto Playback</option>
      </select>
      <div className="grid grid-cols-5 gap-2">
        <button onClick={onPrev} disabled={disabled || currentStep === 0} className="grid h-10 place-items-center rounded-md border border-white/10 bg-white/[0.06] text-slate-200 disabled:opacity-40" title="Previous">
          <SkipBack className="h-4 w-4" />
        </button>
        <button onClick={onStart} disabled={disabled} className="grid h-10 place-items-center rounded-md bg-cyanline text-slate-950 shadow-neon disabled:opacity-50" title="Start">
          <Play className="h-4 w-4" />
        </button>
        <button onClick={onPause} disabled={disabled || !isRunning} className="grid h-10 place-items-center rounded-md border border-white/10 bg-white/[0.06] text-slate-200 disabled:opacity-40" title="Pause">
          <Pause className="h-4 w-4" />
        </button>
        <button onClick={onNext} disabled={disabled || currentStep >= totalSteps - 1} className="grid h-10 place-items-center rounded-md border border-white/10 bg-white/[0.06] text-slate-200 disabled:opacity-40" title="Next">
          <SkipForward className="h-4 w-4" />
        </button>
        <button onClick={onReset} className="grid h-10 place-items-center rounded-md border border-danger/30 bg-danger/10 text-rose-100" title="Reset">
          <RotateCcw className="h-4 w-4" />
        </button>
      </div>
      <label className="mt-4 block">
        <span className="mb-2 flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-slate-400">
          <Gauge className="h-4 w-4 text-cyanline" />
          Speed {speed.toFixed(1)}x
        </span>
        <input type="range" min="0.5" max="3" step="0.1" value={speed} onChange={(event) => setSpeed(Number(event.target.value))} className="w-full accent-cyanline" />
      </label>
    </div>
  );
}
