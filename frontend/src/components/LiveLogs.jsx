import { Activity, AlertTriangle, CheckCircle2, RadioTower } from "lucide-react";
import Panel from "./Panel.jsx";

const iconMap = {
  critical: AlertTriangle,
  warn: AlertTriangle,
  success: CheckCircle2,
  info: RadioTower
};

export default function LiveLogs({ logs }) {
  return (
    <Panel title="Live Communication Logs" icon={Activity} className="min-h-[210px]">
      <div className="max-h-52 space-y-2 overflow-y-auto p-4">
        {logs.length === 0 && <p className="text-sm text-slate-400">Awaiting channel events...</p>}
        {logs.map((log, index) => {
          const Icon = iconMap[log.level] || Activity;
          const tone = log.level === "critical" ? "text-danger" : log.level === "warn" ? "text-signal" : log.level === "success" ? "text-emerald-300" : "text-cyanline";
          return (
            <div key={`${log.time}-${index}`} className="flex items-start gap-3 rounded-md border border-white/10 bg-white/[0.035] px-3 py-2">
              <Icon className={`mt-0.5 h-4 w-4 ${tone}`} />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2 text-[11px] uppercase tracking-[0.16em] text-slate-500">
                  <span>{log.category}</span>
                  <span>{new Date(log.time).toLocaleTimeString()}</span>
                </div>
                <p className="mt-1 text-sm text-slate-200">{log.message}</p>
              </div>
            </div>
          );
        })}
      </div>
    </Panel>
  );
}
