import { useEffect, useMemo, useState, useRef } from "react";
import { io } from "socket.io-client";
import { Home, Radio, Send, ShieldAlert, ShieldCheck, Zap, AlertTriangle, Users } from "lucide-react";
import LiveLogs from "../components/LiveLogs.jsx";
import ManipulationPanel from "../components/ManipulationPanel.jsx";
import MetricCard from "../components/MetricCard.jsx";
import Panel from "../components/Panel.jsx";
import ParticleField from "../components/ParticleField.jsx";
import SimulationControls from "../components/SimulationControls.jsx";
import StatusPill from "../components/StatusPill.jsx";
import { createLog, SIMULATION_STEPS } from "../simulation/simulationSteps.js";
import QuantumScene from "../visuals/QuantumScene.jsx";

const API = import.meta.env.VITE_API_URL || "http://localhost:5000";
const STEP_DURATION = 1800;
const modes = [
  ["normal", "Normal Encrypted Communication"],
  ["crc-error", "CRC Error Detection"],
  ["eavesdrop", "Eavesdropping Detection"],
  ["interference", "Quantum Interference Simulation"],
  ["quantum-secure", "Quantum Secure Transmission"]
];

const defaultResult = {
  transmission: {
    original: "Awaiting payload...",
    encrypted: "No ciphertext generated",
    decrypted: "",
    sharedSecret: "pending",
    crc: "--------",
    receivedCrc: "--------",
    crcValid: true,
    aesBits: 256
  },
  quantum: { bits: [0, 1], error_rate: 0, stability: 1, compared_bits: 0, sampled_errors: 0, detected: false },
  metrics: { encryptionStrength: 256, quantumStability: 100, errorRate: 0, packetIntegrity: 100, threatLevel: 0, secure: true },
  visualState: "stable"
};

export default function Dashboard({ onHome }) {
  const [socketState, setSocketState] = useState("connecting");
  const [isLiveMode, setIsLiveMode] = useState(false);
  const [roomId, setRoomId] = useState("quantum-room-1");
  const [message, setMessage] = useState("Transfer retinal vault seed to receiver node.");
  const [mode, setMode] = useState("quantum-secure");
  const [logs, setLogs] = useState([]);
  const [simulationStarted, setSimulationStarted] = useState(false);
  const [simulationData, setSimulationData] = useState(null);
  const [finalResult, setFinalResult] = useState(null);
  const [animationMode, setAnimationMode] = useState("manual");
  const [isRunning, setIsRunning] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [stepProgress, setStepProgress] = useState(0);
  const [animationSpeed, setAnimationSpeed] = useState(1);
  const [selectedManipulations, setSelectedManipulations] = useState({});
  const [finalized, setFinalized] = useState(false);
  const [busy, setBusy] = useState(false);
  
  // Real-time state
  const [liveManipulation, setLiveManipulation] = useState("none");
  const [analytics, setAnalytics] = useState(null);
  const [liveVisualState, setLiveVisualState] = useState("stable");
  const [socket, setSocket] = useState(null);

  const activeStep = SIMULATION_STEPS[currentStep];
  const activeManipulation = isLiveMode ? liveManipulation : (selectedManipulations[activeStep.id] || "none");
  const displayedResult = useMemo(() => {
    const res = finalized ? finalResult : simulationData;
    if (!res || !res.transmission || !res.metrics || !res.quantum) {
      return defaultResult;
    }
    return res;
  }, [finalized, finalResult, simulationData]);
  
  const currentVisualState = isLiveMode 
    ? liveVisualState 
    : (finalized ? displayedResult.visualState : activeManipulation === "eavesdrop" ? "attack" : activeManipulation === "crc-tamper" ? "crc" : activeManipulation === "quantum-noise" ? "noise" : "stable");

  useEffect(() => {
    const s = io(API, { transports: ["websocket", "polling"] });
    setSocket(s);

    s.on("connect", () => {
      console.log("Dashboard Connected:", s.id);
      setSocketState("online");
      if (isLiveMode) s.emit("session:join", { roomId, role: "observer" });
    });
    
    s.on("connect_error", (err) => {
        console.error("Dashboard Connection Error:", err);
        setSocketState("offline");
    });

    s.on("disconnect", () => setSocketState("offline"));
    s.on("log:event", (log) => setLogs((items) => [log, ...items].slice(0, 100)));

    // Live Mode Listeners
    s.on("simulation:result", (data) => {
      setFinalResult(data);
      if (data.analytics) setAnalytics(data.analytics);
    });

    s.on("sim:analytics", (data) => {
      setAnalytics(data);
    });

    s.on("sim:step", (data) => {
      if (!isLiveMode) return;
      setSimulationStarted(true);
      setFinalized(false);
      const stepIdx = SIMULATION_STEPS.findIndex(s => s.id === data.stepId);
      if (stepIdx !== -1) setCurrentStep(stepIdx);
      setStepProgress(data.progress);
      setLiveVisualState(data.state);
      setLiveManipulation(data.manipulation);
    });

    s.on("sim:quantum", (data) => {
      if (!isLiveMode) return;
      setSimulationData(prev => ({
        ...prev,
        quantum: {
          bits: data.bits,
          error_rate: data.errorRate,
          stability: data.stability,
          compared_bits: data.comparedBits,
          sampled_errors: data.sampledErrors,
          detected: data.detected
        }
      }));
    });

    s.on("recv:message", (data) => {
      if (!isLiveMode) return;
      const visualState = data.secure ? "stable" : (data.manipulation === "eavesdrop" ? "attack" : data.manipulation === "crc-tamper" ? "crc" : "noise");
      const result = {
        transmission: {
          original: "Incoming data...",
          encrypted: "CIPHERTEXT_HIDDEN",
          decrypted: data.decrypted,
          sharedSecret: "DERIVED_VIA_QUANTUM",
          crc: data.crcValid ? "VALID" : "INVALID",
          receivedCrc: data.crcValid ? "VALID" : "INVALID",
          crcValid: data.crcValid,
          aesBits: 256
        },
        quantum: { bits: [0,1], detected: !data.secure }, // Placeholder as we get sim:quantum separately
        metrics: data.metrics,
        visualState: visualState
      };
      setFinalResult(result);
      setFinalized(true);
      setLiveVisualState(visualState);
    });

    fetch(`${API}/api/logs`)
      .then((response) => response.json())
      .then((items) => {
        setLogs(items);
        setSocketState((state) => (state === "connecting" ? "api-online" : state));
      })
      .catch(() => setSocketState("api-offline"));

    return () => s.disconnect();
  }, [isLiveMode, roomId]);

  useEffect(() => {
    if (!isRunning || !simulationStarted || animationMode !== "auto" || finalized) return undefined;
    const interval = setInterval(() => {
      setCurrentStep((prev) => {
        if (prev >= SIMULATION_STEPS.length - 1) {
          setIsRunning(false);
          setFinalized(true);
          return prev;
        }
        return prev + 1;
      });
    }, STEP_DURATION / animationSpeed);
    return () => clearInterval(interval);
  }, [isRunning, simulationStarted, animationMode, finalized, animationSpeed]);

  const prepareSimulation = async () => {
    setBusy(true);
    setFinalized(false);
    setAnalytics(null);
    setFinalResult(null);
    try {
      const response = await fetch(`${API}/api/simulate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message, mode, manipulations: selectedManipulations }),
      });
      const data = await response.json();
      setSimulationData(data);
      setAnalytics(data.analytics);
      setSimulationStarted(true);
      setCurrentStep(0);
      setStepProgress(0);
      
      // Respect current mode - don't force auto if user chose manual
      if (animationMode === "auto") {
        setIsRunning(true);
      }
    } catch (error) {
      console.error("Simulation failed:", error);
    } finally {
      setBusy(false);
    }
  };

  const startSimulation = () => {
    if (!simulationStarted) {
        prepareSimulation();
    } else {
        if (finalized) {
            setFinalized(false);
            setCurrentStep(0);
        }
        setAnimationMode("auto");
        setIsRunning(true);
    }
  };

  const pauseSimulation = () => setIsRunning(false);
  const nextStep = () => {
    setAnimationMode("manual");
    setIsRunning(false);
    setCurrentStep((prev) => {
        if (prev >= SIMULATION_STEPS.length - 1) {
            setFinalized(true);
            return prev;
        }
        return prev + 1;
    });
  };

  const prevStep = () => {
    setAnimationMode("manual");
    setIsRunning(false);
    setFinalized(false);
    setCurrentStep((prev) => Math.max(prev - 1, 0));
  };
  const resetSimulation = () => {
    setSimulationStarted(false);
    setIsRunning(false);
    setCurrentStep(0);
    setFinalized(false);
    setAnalytics(null);
    setSimulationData(null);
  };

  const injectManipulation = (stepId, type) => {
    setSelectedManipulations((prev) => ({
      ...prev,
      [stepId]: prev[stepId] === type ? "none" : type
    }));
  };

  return (
    <main className="relative flex h-screen flex-col overflow-hidden bg-[#050712] text-white">
      <ParticleField count={40} />
      
      <header className="relative z-10 border-b border-white/10 bg-black/40 backdrop-blur-md">
        <div className="flex items-center justify-between px-8 py-4">
          <div>
            <p className="font-display text-[10px] uppercase tracking-[0.28em] text-cyanline">Q-SecCom Interactive Console</p>
            <h1 className="font-display text-xl font-bold text-white md:text-2xl">Distributed Quantum Pipeline</h1>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 rounded-md border border-white/10 bg-black/20 p-1">
              <div className="flex items-center px-2">
                <Users className="mr-2 h-3.5 w-3.5 text-slate-500" />
                <input 
                  type="text" 
                  value={roomId} 
                  onChange={(e) => {
                    const newRoom = e.target.value;
                    setRoomId(newRoom);
                    if (isLiveMode && socket) {
                      socket.emit("session:join", { roomId: newRoom, role: "observer" });
                    }
                  }}
                  placeholder="Room ID..."
                  className="w-24 bg-transparent text-[10px] uppercase font-bold text-white outline-none focus:text-cyanline"
                />
              </div>
              <div className="h-4 w-px bg-white/10" />
              <button
                onClick={() => setIsLiveMode(false)}
                className={`rounded px-3 py-1 text-[10px] font-bold uppercase transition-all ${!isLiveMode ? "bg-cyanline text-slate-950 shadow-neon" : "text-slate-400 hover:text-white"}`}
              >
                Simulator
              </button>
              <button
                onClick={() => setIsLiveMode(true)}
                className={`rounded px-3 py-1 text-[10px] font-bold uppercase transition-all ${isLiveMode ? "bg-cyanline text-slate-950 shadow-neon" : "text-slate-400 hover:text-white"}`}
              >
                Live Monitor
              </button>
            </div>
            <StatusPill active={["online", "api-online"].includes(socketState)} danger={["offline", "api-offline"].includes(socketState)}>{socketState}</StatusPill>
            <button onClick={onHome} className="grid h-10 w-10 place-items-center rounded-md border border-white/10 bg-white/[0.06] text-slate-200 transition hover:border-cyanline/60" title="Home">
              <Home className="h-4 w-4" />
            </button>
          </div>
        </div>
        {/* Global Progress Bar */}
        <div className="h-[2px] w-full bg-white/5">
          <div 
            className="h-full bg-cyanline shadow-[0_0_10px_#2ffcff] transition-all duration-500 ease-out" 
            style={{ width: `${((currentStep + 1) / SIMULATION_STEPS.length) * 100}%` }} 
          />
        </div>
      </header>

      <div className="relative z-10 flex flex-1 overflow-hidden">
        {/* Left Sidebar: Control & Info */}
        <aside className="flex w-96 flex-col border-r border-white/10 bg-black/20 backdrop-blur-sm">
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            <div className="glass neon-border flex flex-col overflow-hidden rounded-xl bg-white/[0.02]">
              <div className="border-b border-white/10 bg-white/[0.03] px-4 py-3">
                <h2 className="font-display text-sm font-bold uppercase tracking-widest text-white">Transmission Control</h2>
              </div>
              <div className="space-y-4 p-4">
                <label className="block">
                  <span className="mb-2 block text-xs uppercase tracking-[0.18em] text-slate-400">Payload</span>
                  <textarea value={message} onChange={(event) => setMessage(event.target.value)} rows={4} disabled={isLiveMode || (simulationStarted && !finalized)} className="w-full resize-none rounded-md border border-cyanline/20 bg-black/30 p-3 text-sm text-cyan-50 outline-none transition focus:border-cyanline disabled:opacity-60" />
                  {isLiveMode && <p className="mt-1 text-[10px] text-violetline/80 italic text-center">Monitoring Network Traffic</p>}
                </label>
                
                <label className="block">
                  <span className="mb-2 block text-xs uppercase tracking-[0.18em] text-slate-400">Communication Mode</span>
                  <select value={mode} onChange={(event) => setMode(event.target.value)} disabled={isLiveMode || (simulationStarted && !finalized)} className="w-full rounded-md border border-violetline/25 bg-[#080d1f] p-3 text-sm text-slate-100 outline-none disabled:opacity-60">
                    {modes.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                  </select>
                </label>

                {!isLiveMode && (
                  <button disabled={busy} onClick={prepareSimulation} className="flex w-full items-center justify-center gap-2 rounded-md bg-cyanline px-4 py-3 font-bold text-slate-950 shadow-neon transition hover:scale-[1.01] disabled:cursor-wait disabled:opacity-60">
                    <Zap className="h-4 w-4" /> {busy ? "Preparing..." : "Send Message"}
                  </button>
                )}

                <div className="rounded-md border border-white/10 bg-white/[0.04] p-3 text-xs leading-6 text-slate-400">
                  <p><span className="text-cyanline">Node:</span> Operator Station (Alpha)</p>
                  <p><span className="text-cyanline">Shared Secret:</span> {displayedResult?.transmission?.sharedSecret || "--------"}</p>
                </div>
              </div>
            </div>

            {/* Integrated Step Composition Detail */}
            <div className="rounded-xl border border-white/10 bg-cyanline/5 p-4">
                <div className="mb-2 flex items-center gap-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-cyanline shadow-neon" />
                    <span className="text-[10px] font-bold uppercase tracking-widest text-cyanline">Active Process: {activeStep.title}</span>
                </div>
                <p className="text-xs leading-relaxed text-slate-300">
                    {activeStep.description}
                </p>
            </div>

            {!isLiveMode && (
              <SimulationControls
                mode={animationMode}
                setMode={setAnimationMode}
                isRunning={isRunning}
                speed={animationSpeed}
                setSpeed={setAnimationSpeed}
                onStart={startSimulation}
                onPause={pauseSimulation}
                onNext={nextStep}
                onPrev={prevStep}
                onReset={resetSimulation}
                currentStep={currentStep}
                totalSteps={SIMULATION_STEPS.length}
                disabled={busy || !simulationStarted}
              />
            )}

            {!isLiveMode && (
               <ManipulationPanel activeStep={activeStep} disabled={!simulationStarted || !activeStep.canManipulate} onInject={injectManipulation} selectedManipulation={activeManipulation} />
            )}

            <div className="space-y-4">
              <MetricCard label="Encryption Strength" value={displayedResult.metrics.encryptionStrength} unit="bit" progress={displayedResult.metrics.encryptionStrength / 256} />
              <MetricCard label="Quantum Stability" value={displayedResult.metrics.quantumStability} unit="%" progress={displayedResult.metrics.quantumStability / 100} color="#9a5cff" />
            </div>

            {/* NEW: Intelligence HUD */}
            {analytics && (
              <div className="rounded-xl border border-white/10 bg-black/40 p-4 space-y-4 shadow-2xl">
                <div className="flex items-center justify-between border-b border-white/10 pb-2">
                  <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-cyanline">QDAE Intelligence</h3>
                  <div className={`h-1.5 w-1.5 rounded-full animate-pulse ${analytics.intelligence.threatLevel === 'LOW' ? 'bg-emerald-400' : 'bg-danger'}`} />
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase text-slate-400">Channel Trust</span>
                  <span className={`font-display text-xl font-bold ${analytics.intelligence.trustScore > 70 ? 'text-emerald-400' : 'text-danger'}`}>
                    {analytics.intelligence.trustScore}%
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded border border-white/5 bg-white/[0.02] p-2 text-center">
                    <p className="text-[8px] uppercase tracking-widest text-slate-500">Coherence</p>
                    <p className="font-display text-sm text-slate-200">{Math.round(analytics.metrics.coherence * 100)}%</p>
                  </div>
                  <div className="rounded border border-white/5 bg-white/[0.02] p-2 text-center">
                    <p className="text-[8px] uppercase tracking-widest text-slate-500">Entropy</p>
                    <p className="font-display text-sm text-slate-200">{analytics.metrics.entropy.toFixed(2)}</p>
                  </div>
                </div>

                <div className="rounded-md border border-cyanline/20 bg-cyanline/5 p-3">
                  <p className="text-[9px] font-black uppercase tracking-widest text-cyanline">Inference Prediction</p>
                  <p className="mt-1 text-[11px] font-bold text-white uppercase">{analytics.intelligence.inference.type}</p>
                  <p className="mt-1 text-[10px] leading-relaxed text-slate-400">{analytics.intelligence.inference.diagnosis}</p>
                </div>

                {analytics.intelligence.trustScore < 50 && (
                  <div className="flex items-center gap-2 rounded bg-danger/20 p-2 text-[9px] font-bold text-danger animate-bounce">
                    <AlertTriangle className="h-3 w-3" />
                    ADAPTIVE RESPONSE: KEY ROTATION TRIGGERED
                  </div>
                )}
              </div>
            )}
          </div>
        </aside>

        {/* Center: Main Visualization */}
        <section className="relative flex flex-1 flex-col overflow-hidden bg-black/10 p-6">
          <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-4">
            <Panel label="Protocol Stage" value={activeStep.title} subValue={`Step ${currentStep + 1} of ${SIMULATION_STEPS.length}`} />
            <Panel label="Packet Integrity" value={`${displayedResult.metrics.packetIntegrity}%`} subValue={displayedResult.transmission.crcValid ? "Valid CRC" : "Checksum Mismatch"} danger={!displayedResult.transmission.crcValid} />
            <Panel label="Threat Detection" value={displayedResult.metrics.threatLevel > 50 ? "High" : "Low"} subValue={`${displayedResult.metrics.threatLevel}% probability`} danger={displayedResult.metrics.threatLevel > 50} />
            <Panel label="Security Status" value={displayedResult.metrics.secure ? "Secure" : "Compromised"} subValue={displayedResult.metrics.secure ? "Channel Trusted" : "Attack Detected"} danger={!displayedResult.metrics.secure} />
          </div>

          <div className="glass neon-border relative flex-1 overflow-hidden rounded-2xl bg-black/40">
            <QuantumScene 
              activeStepId={activeStep.id} 
              progress={stepProgress} 
              manipulation={activeManipulation}
              currentStepTitle={activeStep.title}
              state={currentVisualState} 
              result={displayedResult} 
              finalized={finalized}
              isIdle={!simulationStarted}
              onStepClick={(idx) => {
                if (!isLiveMode) {
                  setCurrentStep(idx);
                  setAnimationMode("manual");
                  setIsRunning(false);
                }
              }}
            />
            <div className="absolute inset-0 pointer-events-none border border-white/5" />
          </div>

        </section>

        {/* Right Sidebar: Full Height Logs */}
        <aside className="w-80 border-l border-white/10 bg-black/40 backdrop-blur-md">
          <LiveLogs logs={logs} />
        </aside>
      </div>
    </main>
  );
}
