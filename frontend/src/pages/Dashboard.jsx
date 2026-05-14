import { useEffect, useMemo, useState } from "react";
import { io } from "socket.io-client";
import { Home, Radio, Send, ShieldAlert, ShieldCheck, Zap } from "lucide-react";
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

  const socket = useMemo(() => io(API, { transports: ["websocket", "polling"] }), []);
  const activeStep = SIMULATION_STEPS[currentStep];
  const activeManipulation = selectedManipulations[activeStep.id] || "none";
  const displayedResult = finalized ? finalResult || defaultResult : simulationData || defaultResult;
  const currentVisualState = finalized ? displayedResult.visualState : activeManipulation === "eavesdrop" ? "attack" : activeManipulation === "crc-tamper" ? "crc" : activeManipulation === "quantum-noise" ? "noise" : "stable";

  useEffect(() => {
    socket.on("connect", () => setSocketState("online"));
    socket.on("disconnect", () => setSocketState("offline"));
    socket.on("log:event", (log) => setLogs((items) => [log, ...items].slice(0, 100)));

    fetch(`${API}/api/logs`)
      .then((response) => response.json())
      .then((items) => {
        setLogs(items);
        setSocketState((state) => (state === "connecting" ? "api-online" : state));
      })
      .catch(() => setSocketState("api-offline"));

    return () => socket.disconnect();
  }, [socket]);

  useEffect(() => {
    if (!isRunning || !simulationStarted || animationMode !== "auto" || finalized) return undefined;
    const interval = window.setInterval(() => {
      setStepProgress((progress) => {
        const nextProgress = progress + 6 * animationSpeed;
        if (nextProgress < 100) return nextProgress;
        setCurrentStep((step) => {
          const nextStep = Math.min(step + 1, SIMULATION_STEPS.length - 1);
          setLogs((items) => [createLog(SIMULATION_STEPS[nextStep].log), ...items].slice(0, 100));
          if (nextStep === SIMULATION_STEPS.length - 1) {
            setIsRunning(false);
            finalizeSimulation();
          }
          return nextStep;
        });
        return 0;
      });
    }, 120);
    return () => window.clearInterval(interval);
  }, [animationMode, animationSpeed, finalized, isRunning, simulationStarted]);

  const prepareSimulation = async () => {
    setBusy(true);
    setFinalized(false);
    setFinalResult(null);
    setSelectedManipulations({});
    setCurrentStep(0);
    setStepProgress(0);
    try {
      const response = await fetch(`${API}/api/transmit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message, mode, attack: "none", dryRun: true })
      });
      if (!response.ok) throw new Error(`Prepare failed with ${response.status}`);
      const data = await response.json();
      setSimulationData(data);
      setSimulationStarted(true);
      setLogs((items) => [createLog(SIMULATION_STEPS[0].log), createLog("[SYSTEM] Dry-run packet prepared; receiver output locked"), ...items].slice(0, 100));
      setIsRunning(animationMode === "auto");
    } catch (error) {
      setLogs((items) => [createLog(`Backend prepare failed: ${error.message}`, "frontend", "critical"), ...items].slice(0, 100));
    } finally {
      setBusy(false);
    }
  };

  const finalizeSimulation = async () => {
    if (finalized || busy) return;
    setBusy(true);
    try {
      const response = await fetch(`${API}/api/transmit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message,
          mode,
          attack: Object.values(selectedManipulations).some((value) => value !== "none") ? "custom" : "none",
          dryRun: false,
          stepManipulations: selectedManipulations
        })
      });
      if (!response.ok) throw new Error(`Finalize failed with ${response.status}`);
      const data = await response.json();
      setFinalResult(data);
      setFinalized(true);
      setLogs((items) => [
        createLog(data.metrics.secure ? "[RESULT] Communication marked secure" : "[RESULT] Communication marked unsafe", "result", data.metrics.secure ? "success" : "critical"),
        ...items
      ].slice(0, 100));
    } catch (error) {
      setLogs((items) => [createLog(`Final simulation failed: ${error.message}`, "frontend", "critical"), ...items].slice(0, 100));
    } finally {
      setBusy(false);
    }
  };

  const startSimulation = () => {
    if (!simulationStarted) {
      prepareSimulation();
      return;
    }
    if (currentStep === SIMULATION_STEPS.length - 1) {
      finalizeSimulation();
      return;
    }
    setIsRunning(true);
  };

  const pauseSimulation = () => setIsRunning(false);

  const nextStep = () => {
    if (!simulationStarted) return;
    setStepProgress(0);
    setCurrentStep((step) => {
      const next = Math.min(step + 1, SIMULATION_STEPS.length - 1);
      setLogs((items) => [createLog(SIMULATION_STEPS[next].log), ...items].slice(0, 100));
      if (next === SIMULATION_STEPS.length - 1) finalizeSimulation();
      return next;
    });
  };

  const prevStep = () => {
    setStepProgress(0);
    setCurrentStep((step) => Math.max(step - 1, 0));
  };

  const resetSimulation = () => {
    setSimulationStarted(false);
    setSimulationData(null);
    setFinalResult(null);
    setIsRunning(false);
    setCurrentStep(0);
    setStepProgress(0);
    setSelectedManipulations({});
    setFinalized(false);
    setLogs((items) => [createLog("[SYSTEM] Simulator reset to idle state"), ...items].slice(0, 100));
  };

  const injectManipulation = (manipulation) => {
    if (!activeStep.canManipulate || !simulationStarted) return;
    setSelectedManipulations((items) => ({ ...items, [activeStep.id]: manipulation }));
    const label = manipulation === "none" ? "No manipulation selected" : manipulation;
    setLogs((items) => [createLog(`[ATTACK] ${label} injected at ${activeStep.title}`, "attack", manipulation === "none" ? "info" : "warn"), ...items].slice(0, 100));
  };

  const receiverMessage = !simulationStarted
    ? "Waiting for simulation start..."
    : !finalized
      ? `Packet currently in ${activeStep.title} stage...`
      : displayedResult.transmission.decrypted || "No receiver payload released.";

  return (
    <main className="relative min-h-screen overflow-hidden p-4 text-white lg:p-5">
      <ParticleField count={45} />
      <div className="absolute inset-0 grid-holo opacity-30" />
      <header className="relative z-10 mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="font-display text-xs uppercase tracking-[0.28em] text-cyanline">Q-SecCom Interactive Simulator</p>
          <h1 className="font-display text-2xl font-bold text-white md:text-4xl">3D Quantum Communication Pipeline</h1>
        </div>
        <div className="flex items-center gap-2">
          <StatusPill active={["online", "api-online"].includes(socketState)} danger={["offline", "api-offline"].includes(socketState)}>{socketState}</StatusPill>
          <button onClick={onHome} className="grid h-10 w-10 place-items-center rounded-md border border-white/10 bg-white/[0.06] text-slate-200 transition hover:border-cyanline/60" title="Home">
            <Home className="h-4 w-4" />
          </button>
        </div>
      </header>

      <div className="relative z-10 grid gap-4 xl:grid-cols-[340px_minmax(680px,1fr)_300px]">
        <Panel title="Sender Node" icon={Send} className="min-h-[720px]">
          <div className="space-y-4 p-4">
            <label className="block">
              <span className="mb-2 block text-xs uppercase tracking-[0.18em] text-slate-400">Payload</span>
              <textarea value={message} onChange={(event) => setMessage(event.target.value)} rows={5} disabled={simulationStarted && !finalized} className="w-full resize-none rounded-md border border-cyanline/20 bg-black/30 p-3 text-sm text-cyan-50 outline-none transition focus:border-cyanline disabled:opacity-60" />
            </label>
            <label className="block">
              <span className="mb-2 block text-xs uppercase tracking-[0.18em] text-slate-400">Communication Mode</span>
              <select value={mode} onChange={(event) => setMode(event.target.value)} disabled={simulationStarted && !finalized} className="w-full rounded-md border border-violetline/25 bg-[#080d1f] p-3 text-sm text-slate-100 outline-none disabled:opacity-60">
                {modes.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
              </select>
            </label>
            <button disabled={busy} onClick={prepareSimulation} className="flex w-full items-center justify-center gap-2 rounded-md bg-cyanline px-4 py-3 font-bold text-slate-950 shadow-neon transition hover:scale-[1.01] disabled:cursor-wait disabled:opacity-60">
              <Zap className="h-4 w-4" /> {busy ? "Preparing..." : "Send Message"}
            </button>
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
            <ManipulationPanel activeStep={activeStep} disabled={!simulationStarted || !activeStep.canManipulate} onInject={injectManipulation} selectedManipulation={activeManipulation} />
            <div className="rounded-md border border-white/10 bg-white/[0.04] p-3 text-xs leading-6 text-slate-400">
              <p><span className="text-cyanline">Original:</span> {displayedResult.transmission.original}</p>
              <p><span className="text-cyanline">Shared Secret:</span> {displayedResult.transmission.sharedSecret}</p>
              <p><span className="text-cyanline">CRC:</span> {displayedResult.transmission.crc}</p>
            </div>
          </div>
        </Panel>

        <section className="glass neon-border scanline relative min-h-[720px] overflow-hidden rounded-lg">
          <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
            <div className="flex items-center gap-2 font-display text-xs uppercase tracking-[0.22em] text-cyan-100">
              <Radio className="h-4 w-4 text-cyanline" /> Controlled 3D Quantum Channel
            </div>
            <StatusPill active={!finalized || displayedResult.metrics.secure} danger={finalized && !displayedResult.metrics.secure}>{simulationStarted ? activeStep.id : "idle"}</StatusPill>
          </div>
          <div className="p-4">
            <QuantumScene
              activeStepId={activeStep.id}
              progress={stepProgress}
              manipulation={activeManipulation}
              currentStepTitle={activeStep.title}
              isIdle={!simulationStarted}
              state={currentVisualState}
              result={displayedResult}
              finalized={finalized}
            />
          </div>
        </section>

        <Panel title="Receiver Analytics" icon={ShieldCheck} className="min-h-[720px]">
          <div className="space-y-4 p-4">
            <div className="grid gap-3">
              <MetricCard label="AES Strength" value={displayedResult.metrics.encryptionStrength} suffix=" bit" />
              <MetricCard label="Q Stability" value={displayedResult.metrics.quantumStability} suffix="%" tone={displayedResult.metrics.quantumStability < 80 ? "violet" : "cyan"} />
              <MetricCard label="Error Rate" value={finalized ? displayedResult.metrics.errorRate : "--"} suffix={finalized ? "%" : ""} tone={finalized && displayedResult.metrics.errorRate > 18 ? "red" : "green"} />
              <MetricCard label="Threat" value={finalized ? displayedResult.metrics.threatLevel : "--"} suffix={finalized ? "%" : ""} tone={finalized && displayedResult.metrics.threatLevel > 50 ? "red" : "cyan"} />
            </div>
            <div className="rounded-md border border-white/10 bg-black/25 p-3">
              <div className="mb-2 flex items-center justify-between gap-2">
                <span className="text-xs uppercase tracking-[0.18em] text-slate-400">Receiver Output</span>
                <StatusPill active={finalized && displayedResult.transmission.crcValid} danger={finalized && !displayedResult.transmission.crcValid}>{finalized ? displayedResult.transmission.crcValid ? "CRC verified" : "CRC mismatch" : "locked"}</StatusPill>
              </div>
              <p className="min-h-16 text-sm leading-6 text-slate-200">{receiverMessage}</p>
            </div>
            <div className="rounded-md border border-white/10 bg-black/25 p-3">
              <div className="mb-2 flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-slate-400"><ShieldAlert className="h-4 w-4 text-danger" /> Quantum Detection</div>
              <p className={!finalized ? "text-slate-400" : displayedResult.quantum.detected ? "text-danger" : "text-emerald-300"}>{!finalized ? "Waiting for basis comparison..." : displayedResult.quantum.detected ? "Eavesdropping or disturbance detected" : "No disturbance above threshold"}</p>
              <p className="mt-2 text-xs text-slate-500">Sample errors: {finalized ? displayedResult.quantum.sampled_errors : "--"} / {finalized ? displayedResult.quantum.compared_bits : "--"}</p>
            </div>
            <div className="rounded-md border border-white/10 bg-black/25 p-3">
              <p className="mb-2 text-xs uppercase tracking-[0.18em] text-slate-400">Encrypted Message</p>
              <p className="break-all font-mono text-xs leading-5 text-cyan-100">{simulationData ? displayedResult.transmission.encrypted : "Packet not prepared yet."}</p>
            </div>
          </div>
        </Panel>
      </div>

      <div className="relative z-10 mt-4">
        <LiveLogs logs={logs} />
      </div>
    </main>
  );
}
