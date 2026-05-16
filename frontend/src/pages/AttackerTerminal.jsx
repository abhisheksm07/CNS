import { useEffect, useMemo, useRef, useState } from "react";
import { io } from "socket.io-client";
import { Home, Terminal, Zap, ShieldAlert, Eye, Radio, Activity, Lock } from "lucide-react";

const API = import.meta.env.VITE_API_URL || "http://localhost:5000";

export default function AttackerTerminal({ onHome }) {
  const [isJoined, setIsJoined] = useState(false);
  const [logs, setLogs] = useState([]);
  const [detectedPackets, setDetectedPackets] = useState([]); // Array of { txId, roomId, sender, time }
  const [hookedPacket, setHookedPacket] = useState(null); // { txId, roomId, progress, stepId, status }
  const [isTriggering, setIsTriggering] = useState(false);
  const [sniffedTraffic, setSniffedTraffic] = useState([]);
  const [socket, setSocket] = useState(null);
  
  const logsEndRef = useRef(null);

  useEffect(() => {
    const s = io(API, { 
        transports: ["websocket", "polling"],
        reconnection: true,
        reconnectionAttempts: 5
    });
    
    setSocket(s);

    s.on("connect", () => {
        setIsJoined(true);
        console.log("Attacker Socket Connected:", s.id);
        const newLog = { id: Date.now(), msg: "[SYSTEM] Global sniffer node initialized.", type: "system", time: new Date().toLocaleTimeString([], { hour12: false }) };
        setLogs(prev => [newLog, ...prev]);
    });

    s.on("connect_error", (err) => {
        console.error("Attacker Connection Error:", err);
        const newLog = { id: Date.now(), msg: `[ERROR] Connection failed: ${err.message}`, type: "error", time: new Date().toLocaleTimeString([], { hour12: false }) };
        setLogs(prev => [newLog, ...prev]);
    });

    s.on("disconnect", (reason) => {
        setIsJoined(false);
        console.warn("Attacker Disconnected:", reason);
    });

    // Radar Detection
    s.on("global:sniffer:packet", (data) => {
        console.log("Radar Packet Detected:", data);
        setDetectedPackets(prev => [...prev, data]);
        const newLog = { id: Date.now() + Math.random(), msg: `[RADAR] In-flight packet detected: TX-${data.txId.slice(0,8)}`, type: "warn", time: new Date().toLocaleTimeString([], { hour12: false }) };
        setLogs(prev => [newLog, ...prev]);
        
        // Auto-remove packet from radar after some time if not hooked
        setTimeout(() => {
            setDetectedPackets(prev => prev.filter(p => p.txId !== data.txId));
        }, 15000);
    });

    s.on("attacker:hook:ack", (data) => {
        console.log("Hook ACK Received:", data);
        if (data.status === "hooked") {
            setHookedPacket({ ...data.tx, txId: data.txId });
            const newLog = { id: Date.now() + Math.random(), msg: `[HOOK] Successfully linked to TX-${data.txId.slice(0,8)}`, type: "system", time: new Date().toLocaleTimeString([], { hour12: false }) };
            setLogs(prev => [newLog, ...prev]);
        } else {
            const newLog = { id: Date.now() + Math.random(), msg: `[ERROR] Hook failed: ${data.reason}`, type: "error", time: new Date().toLocaleTimeString([], { hour12: false }) };
            setLogs(prev => [newLog, ...prev]);
        }
    });

    s.on("attacker:trigger:ack", (data) => {
        console.log("Trigger ACK Received:", data);
        setIsTriggering(false);
        if (data.status === "success") {
            const newLog = { id: Date.now() + Math.random(), msg: `[INJECT] Interference success: ${data.type} active on TX-${data.txId.slice(0,8)}`, type: "system", time: new Date().toLocaleTimeString([], { hour12: false }) };
            setLogs(prev => [newLog, ...prev]);
        } else {
            const newLog = { id: Date.now() + Math.random(), msg: `[ERROR] Injection failed: ${data.reason}`, type: "error", time: new Date().toLocaleTimeString([], { hour12: false }) };
            setLogs(prev => [newLog, ...prev]);
        }
    });

    s.on("sim:step", (data) => {
        console.log("Sim Step Received:", data.stepId, data.progress);
        setHookedPacket(prev => {
            if (prev && prev.txId === data.txId) {
                return { ...prev, progress: data.progress, stepId: data.stepId };
            }
            return prev;
        });

        if (data.stepId === "transmit") {
            const cipherSnippet = Math.random().toString(36).substring(2, 10).toUpperCase();
            const newTraffic = { id: Date.now() + Math.random(), msg: `[SNIFF] TX-${data.txId.slice(0,8)} Payload: ${cipherSnippet}...`, time: new Date().toLocaleTimeString([], { hour12: false }) };
            setSniffedTraffic(prev => [newTraffic, ...prev].slice(0, 20));
        }
    });

    s.on("recv:message", (data) => {
        setHookedPacket(prev => (prev && prev.txId === data.txId ? null : prev));
        setDetectedPackets(prev => prev.filter(p => p.txId !== data.txId));
        const newLog = { id: Date.now() + Math.random(), msg: `[RESULT] TX-${data.txId.slice(0,8)} delivered. Secure: ${data.secure}`, type: data.secure ? "info" : "error", time: new Date().toLocaleTimeString([], { hour12: false }) };
        setLogs(prev => [newLog, ...prev]);
    });

    return () => s.disconnect();
  }, []);

  useEffect(() => {
    if (logsEndRef.current) {
        logsEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [logs, sniffedTraffic, detectedPackets]);

  const hookPacket = (txId) => {
    if (socket) socket.emit("attacker:hook", { txId });
  };

  const triggerInjection = (manipulation) => {
    if (!hookedPacket || !socket) return;
    setIsTriggering(true);
    socket.emit("attacker:trigger", { txId: hookedPacket.txId, manipulation });
  };

  const canTrigger = hookedPacket && ["transmit", "intercept", "quantum-encode"].includes(hookedPacket.stepId);

  return (
    <main className="flex h-screen flex-col bg-[#050505] font-mono text-emerald-500">
      {/* Terminal Header */}
      <header className="flex items-center justify-between border-b border-emerald-500/20 bg-black px-4 py-2">
        <div className="flex items-center gap-3">
          <Terminal className="h-4 w-4" />
          <h1 className="text-sm font-bold uppercase tracking-widest">Quantum-Interceptor v3.0 (Radar Mode)</h1>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className={`h-2 w-2 rounded-full ${isJoined ? 'bg-emerald-500 shadow-[0_0_8px_#10b981]' : 'bg-red-500'}`} />
            <span className="text-[10px] uppercase">{isJoined ? 'Global Sniffer Online' : 'Offline'}</span>
          </div>
          <button onClick={onHome} className="border border-emerald-500/30 px-3 py-1 text-[10px] uppercase transition hover:bg-emerald-500 hover:text-black">
            Exit
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Left Side: Radar & Hooked Info */}
        <aside className="w-80 border-r border-emerald-500/20 bg-black p-4 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto space-y-4">
            <div>
              <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-emerald-500/60">Live Radar</p>
              {detectedPackets.length === 0 && <p className="text-[10px] italic opacity-40">Scanning for traffic...</p>}
              <div className="space-y-2">
                {detectedPackets.map(p => (
                  <div key={p.txId} className="flex flex-col gap-2 rounded border border-emerald-500/20 bg-emerald-500/5 p-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold">TX-{p.txId.slice(0,8)}</span>
                      <span className="text-[8px] opacity-60">Room: {p.roomId}</span>
                    </div>
                    <button 
                      onClick={() => hookPacket(p.txId)}
                      disabled={hookedPacket?.txId === p.txId}
                      className="w-full border border-emerald-500/40 py-1 text-[9px] uppercase hover:bg-emerald-500 hover:text-black disabled:opacity-40"
                    >
                      {hookedPacket?.txId === p.txId ? "Hooked" : "Hook Packet"}
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {hookedPacket && (
              <div className="rounded border border-red-500/40 bg-red-500/10 p-3 shadow-[0_0_15px_rgba(239,68,68,0.1)]">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase text-red-500">Live Hook: {hookedPacket.txId.slice(0,8)}</span>
                  <Activity className="h-3 w-3 animate-pulse text-red-500" />
                </div>
                
                <div className="mb-3">
                  <div className="flex items-center justify-between text-[9px] uppercase text-red-400 mb-1">
                    <span>{hookedPacket.stepId || 'Initializing'}</span>
                    <span>{hookedPacket.progress}%</span>
                  </div>
                  <div className="h-1 w-full bg-red-950">
                    <div className="h-full bg-red-500 transition-all duration-300" style={{ width: `${hookedPacket.progress}%` }} />
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-[9px] font-bold uppercase tracking-widest text-red-500/60">Inject Protocol</p>
                  <button 
                    disabled={!canTrigger || isTriggering}
                    onClick={() => triggerInjection("eavesdrop")}
                    className={`w-full border py-2 text-[10px] font-bold uppercase transition ${canTrigger ? 'border-red-500 bg-red-500/20 text-red-500 hover:bg-red-500 hover:text-black' : 'border-white/10 text-white/20'}`}
                  >
                    Eavesdrop
                  </button>
                  <button 
                    disabled={!canTrigger || isTriggering}
                    onClick={() => triggerInjection("crc-tamper")}
                    className={`w-full border py-2 text-[10px] font-bold uppercase transition ${canTrigger ? 'border-amber-500 bg-amber-500/20 text-amber-500 hover:bg-amber-500 hover:text-black' : 'border-white/10 text-white/20'}`}
                  >
                    Tamper CRC
                  </button>
                  <button 
                    disabled={!canTrigger || isTriggering}
                    onClick={() => triggerInjection("quantum-noise")}
                    className={`w-full border py-2 text-[10px] font-bold uppercase transition ${canTrigger ? 'border-purple-500 bg-purple-500/20 text-purple-500 hover:bg-purple-500 hover:text-black' : 'border-white/10 text-white/20'}`}
                  >
                    Inject Noise
                  </button>
                </div>
                
                {!canTrigger && hookedPacket.progress > 0 && (
                  <p className="mt-2 text-center text-[8px] uppercase text-red-500/60 italic">Interception window closed</p>
                )}
                {canTrigger && (
                  <p className="mt-2 text-center text-[8px] uppercase text-emerald-400 animate-pulse italic">Window Open - Inject Now</p>
                )}
              </div>
            )}
          </div>

          <div className="mt-4 border-t border-emerald-500/20 pt-4">
            <div className="rounded bg-emerald-500/5 p-3 text-[9px] leading-relaxed text-emerald-500/60">
                <div className="mb-1 flex items-center gap-2">
                    <Lock className="h-3 w-3" />
                    <span className="uppercase font-bold">In-Flight Hack</span>
                </div>
                Packets are only vulnerable during transit steps (45% - 75% progress). Miss the window and the decryption key is derived, making interception impossible.
            </div>
          </div>
        </aside>

        {/* Main Content: Logs & Sniffer */}
        <section className="flex flex-1 flex-col overflow-hidden bg-black/40">
            {/* Sniffer View */}
            <div className="h-1/3 border-b border-emerald-500/10 p-4">
                <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-emerald-500/40 flex items-center gap-2">
                    <Activity className="h-3 w-3" /> Live Packet Sniffer
                </p>
                <div className="space-y-1 text-[11px] font-mono leading-tight overflow-y-auto h-[calc(100%-20px)] scrollbar-none">
                    {sniffedTraffic.length === 0 && <p className="opacity-20 italic">Awaiting network activity...</p>}
                    {sniffedTraffic.map(t => (
                        <div key={t.id} className="flex gap-4">
                            <span className="opacity-30">[{t.time}]</span>
                            <span className="text-cyan-500">{t.msg}</span>
                        </div>
                    ))}
                    <div ref={logsEndRef} />
                </div>
            </div>

            {/* Event Log */}
            <div className="flex-1 p-4 overflow-hidden flex flex-col">
                <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-emerald-500/40 flex items-center gap-2">
                    <Terminal className="h-3 w-3" /> System Event Log
                </p>
                <div className="flex-1 overflow-y-auto text-[11px] space-y-1 scrollbar-none">
                    {logs.map(log => (
                        <div key={log.id} className={`flex gap-4 ${log.type === 'error' ? 'text-red-500' : log.type === 'warn' ? 'text-amber-500' : 'text-emerald-500'}`}>
                            <span className="opacity-30">[{log.time}]</span>
                            <span>{log.msg}</span>
                        </div>
                    ))}
                    <div ref={logsEndRef} />
                </div>
            </div>

            {/* Bottom Status Bar */}
            <footer className="border-t border-emerald-500/10 bg-black px-4 py-1 flex items-center justify-between text-[10px] uppercase opacity-50">
                <div className="flex gap-6">
                    <span>Sniffer: Active</span>
                    <span>Buffer: 1024KB</span>
                    <span>Encryption: AES/BB84 Detected</span>
                </div>
                <div>SECURE_LINK_BYPASS: ENABLED</div>
            </footer>
        </section>
      </div>
    </main>
  );
}
