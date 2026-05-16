import { Activity, AlertTriangle, CheckCircle2, RadioTower, History } from "lucide-react";

const iconMap = {
  critical: AlertTriangle,
  warn: AlertTriangle,
  success: CheckCircle2,
  info: RadioTower
};

export default function LiveLogs({ logs }) {
  return (
    <div className="flex h-full flex-col overflow-hidden">
      <div className="flex items-center gap-2 border-b border-white/10 bg-white/[0.03] px-6 py-4">
        <History className="h-4 w-4 text-cyanline" />
        <h2 className="font-display text-sm font-bold uppercase tracking-[0.2em] text-white">Network Audit Log</h2>
      </div>
      
      <div className="flex-1 space-y-3 overflow-y-auto p-6 scrollbar-hide">
        {logs.length === 0 && (
            <div className="flex flex-col items-center justify-center pt-20 text-center opacity-30">
                <Activity className="mb-4 h-10 w-10 animate-pulse text-cyanline" />
                <p className="text-xs uppercase tracking-widest">Awaiting Pulse...</p>
            </div>
        )}
        
        {logs.map((log, index) => {
          const Icon = iconMap[log.level] || Activity;
          const tone = log.level === "critical" ? "text-danger" : log.level === "warn" ? "text-signal" : log.level === "success" ? "text-emerald-300" : "text-cyanline";
          
          return (
            <div key={`${log.time}-${index}`} className="group flex items-start gap-4 rounded-lg border border-white/5 bg-white/[0.02] p-4 transition hover:bg-white/[0.05] hover:border-white/10">
              <div className={`mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-white/10 bg-black/40 ${tone}`}>
                <Icon className="h-4 w-4" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-500">{log.category || 'System'}</span>
                  <span className="text-[9px] font-medium text-slate-600">{new Date(log.time).toLocaleTimeString([], { hour12: false })}</span>
                </div>
                <p className="mt-1 text-[13px] leading-relaxed text-slate-300 group-hover:text-white transition-colors">{log.message}</p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="border-t border-white/10 bg-black/20 p-4">
        <div className="flex items-center justify-between text-[10px] uppercase tracking-widest text-slate-500">
            <span>Buffer Status</span>
            <span className="text-emerald-400">Stable</span>
        </div>
      </div>
    </div>
  );
}
