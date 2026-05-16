import { Canvas, useFrame } from "@react-three/fiber";
import { Float, OrbitControls, Sparkles, Stars, Text } from "@react-three/drei";
import { motion, AnimatePresence } from "framer-motion";
import { useMemo, useRef, useState, useEffect, useCallback } from "react";
import * as THREE from "three";
import { SIMULATION_STEPS } from "../simulation/simulationSteps.js";

const stepColors = {
  compose: "#2ffcff",
  "key-exchange": "#38bdf8",
  "crc-generate": "#ffd166",
  encrypt: "#9a5cff",
  "quantum-encode": "#c084fc",
  transmit: "#2ffcff",
  intercept: "#ff315e",
  decrypt: "#60a5fa",
  "crc-verify": "#ffd166",
  "basis-compare": "#9a5cff",
  result: "#6ee7b7"
};

function stateColor(state, activeStepId) {
  if (state === "attack") return "#ff315e";
  if (state === "crc") return "#ffd166";
  if (state === "noise") return "#9a5cff";
  return stepColors[activeStepId] || "#2ffcff";
}

function getPacketPercent(activeStepId, progress, isIdle) {
  if (isIdle) return 0;
  const base = {
    compose: 3,
    "key-exchange": 8,
    "crc-generate": 12,
    encrypt: 16,
    "quantum-encode": 24,
    transmit: 28 + progress * 0.42,
    intercept: 50 + progress * 0.1,
    decrypt: 72 + progress * 0.2,
    "crc-verify": 90,
    "basis-compare": 94,
    result: 100
  };
  return Math.min(100, base[activeStepId] ?? 0);
}

function Qubit({ position, color, speed = 1, pulse = false }) {
  const group = useRef();
  useFrame(({ clock }) => {
    const t = clock.getElapsedTime() * speed;
    group.current.rotation.x = t * 0.7;
    group.current.rotation.y = t;
    group.current.scale.setScalar(pulse ? 1 + Math.sin(t * 4) * 0.08 : 1);
  });
  return (
    <group ref={group} position={position}>
      <mesh>
        <sphereGeometry args={[0.42, 48, 48]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.8} roughness={0.2} transparent opacity={0.65} />
      </mesh>
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.72, 0.012, 16, 96]} />
        <meshStandardMaterial color="#ffffff" emissive={color} emissiveIntensity={1.2} />
      </mesh>
      <mesh rotation={[0.7, 0.5, 0.2]}>
        <torusGeometry args={[0.92, 0.01, 16, 96]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={1.4} />
      </mesh>
    </group>
  );
}

function PacketMesh({ color, activeStepId, progress, isIdle }) {
  const ref = useRef();
  useFrame(({ clock }) => {
    const percent = getPacketPercent(activeStepId, progress, isIdle);
    ref.current.position.x = -3.35 + (percent / 100) * 6.7;
    ref.current.position.y = Math.sin(clock.getElapsedTime() * 2.2) * 0.08;
    ref.current.rotation.x += 0.02;
    ref.current.rotation.y += 0.03;
  });
  return (
    <mesh ref={ref} position={[-3.35, 0, 0.18]}>
      <octahedronGeometry args={[0.26, 0]} />
      <meshStandardMaterial color={color} emissive={color} emissiveIntensity={2.6} roughness={0.15} />
    </mesh>
  );
}

function TunnelRings({ color, activeStepId, manipulation }) {
  const group = useRef();
  useFrame(({ clock }) => {
    group.current.rotation.x = Math.sin(clock.getElapsedTime() * 0.35) * 0.16;
    group.current.rotation.y = Math.sin(clock.getElapsedTime() * 0.22) * 0.08;
  });
  const active = !["compose", "result"].includes(activeStepId);
  return (
    <group ref={group}>
      {Array.from({ length: 10 }, (_, index) => {
        const x = -3.2 + index * 0.72;
        const scale = 0.9 + Math.sin(index * 0.8) * 0.12;
        return (
          <mesh key={index} position={[x, 0, -0.05]} rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[scale, manipulation !== "none" ? 0.018 : 0.012, 18, 96]} />
            <meshStandardMaterial color={color} emissive={color} emissiveIntensity={active ? 1.6 : 0.55} transparent opacity={active ? 0.55 : 0.18} />
          </mesh>
        );
      })}
    </group>
  );
}

function PhotonBit({ lane, bit, color, activeStepId, progress, isIdle, manipulation }) {
  const group = useRef();
  useFrame(({ clock }) => {
    const percent = getPacketPercent(activeStepId, progress, isIdle);
    const t = clock.getElapsedTime();
    group.current.position.x = -3.35 + (percent / 100) * 6.7;
    group.current.position.y = (lane === 0 ? 0.42 : -0.42) + Math.sin(t * 4 + lane) * 0.08;
    group.current.position.z = Math.cos(t * 3 + lane) * 0.32;
    group.current.rotation.y += 0.05;
    group.current.rotation.x += 0.035;
    group.current.scale.setScalar(manipulation !== "none" ? 1 + Math.sin(t * 9) * 0.12 : 1);
  });
  return (
    <group ref={group} position={[-3.35, lane === 0 ? 0.42 : -0.42, 0]}>
      <mesh>
        <icosahedronGeometry args={[0.22, 1]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={3} roughness={0.1} />
      </mesh>
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.34, 0.01, 12, 64]} />
        <meshStandardMaterial color="#ffffff" emissive={color} emissiveIntensity={2.2} transparent opacity={0.85} />
      </mesh>
      <Text position={[0, 0.42, 0]} fontSize={0.16} color="#eefbff" anchorX="center" anchorY="middle">
        {`B${lane}:${bit}`}
      </Text>
    </group>
  );
}

function SceneLabels({ activeStep, color, finalized, secure }) {
  return (
    <group>
      <Text position={[-3.35, -1.15, 0.1]} fontSize={0.34} color="#2ffcff" anchorX="center" anchorY="middle">
        S
      </Text>
      <Text position={[3.35, -1.15, 0.1]} fontSize={0.34} color={finalized && secure ? "#6ee7b7" : "#c4b5fd"} anchorX="center" anchorY="middle">
        R
      </Text>
      <Text position={[0, 1.95, 0.2]} fontSize={0.26} color={color} anchorX="center" anchorY="middle">
        {`${activeStep.symbol}  ${activeStep.shortLabel}`}
      </Text>
      <Text position={[0, -1.55, 0.15]} fontSize={0.12} color="#94a3b8" anchorX="center" anchorY="middle">
        quantum tunnel: basis rings, photon bits, and disturbance field
      </Text>
    </group>
  );
}

function DisturbanceField({ active, color }) {
  const ref = useRef();
  useFrame(({ clock }) => {
    if (!ref.current) return;
    ref.current.rotation.z = clock.getElapsedTime() * 0.8;
    ref.current.scale.setScalar(active ? 1 + Math.sin(clock.getElapsedTime() * 8) * 0.1 : 0.75);
  });
  return (
    <group ref={ref} position={[0, 0, 0.15]}>
      <mesh>
        <sphereGeometry args={[0.52, 32, 32]} />
        <meshStandardMaterial color={active ? "#ff315e" : "#64748b"} emissive={active ? "#ff315e" : "#334155"} emissiveIntensity={active ? 1.8 : 0.4} transparent opacity={active ? 0.28 : 0.12} wireframe />
      </mesh>
      <Text position={[0, 0, 0.62]} fontSize={0.18} color={active ? "#ff8aa4" : "#64748b"} anchorX="center" anchorY="middle">
        A
      </Text>
    </group>
  );
}

function Beam({ color, activeStepId, manipulation, isIdle }) {
  const ref = useRef();
  useFrame(({ clock }) => {
    const active = !isIdle && !["compose", "result"].includes(activeStepId);
    ref.current.material.opacity = active ? 0.35 + Math.sin(clock.getElapsedTime() * 5) * 0.12 : 0.12;
    ref.current.scale.x = manipulation !== "none" ? 1 + Math.sin(clock.getElapsedTime() * 10) * 0.035 : 1;
  });
  return (
    <mesh ref={ref} rotation={[0, 0, Math.PI / 2]}>
      <cylinderGeometry args={[0.035, 0.035, 7.2, 32]} />
      <meshStandardMaterial color={color} emissive={color} emissiveIntensity={2.5} transparent opacity={0.35} />
    </mesh>
  );
}

function ParticleStream({ color, active }) {
  const ref = useRef();
  const positions = useMemo(() => {
    const array = new Float32Array(220 * 3);
    for (let i = 0; i < 220; i += 1) {
      array[i * 3] = (Math.random() - 0.5) * 8;
      array[i * 3 + 1] = (Math.random() - 0.5) * 2.3;
      array[i * 3 + 2] = (Math.random() - 0.5) * 2.3;
    }
    return array;
  }, []);

  useFrame(({ clock }) => {
    ref.current.rotation.z = Math.sin(clock.getElapsedTime() * 0.35) * 0.1;
    ref.current.position.x = active ? Math.sin(clock.getElapsedTime() * 1.8) * 0.18 : 0;
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={positions.length / 3} array={positions} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial size={0.035} color={color} transparent opacity={active ? 0.88 : 0.38} blending={THREE.AdditiveBlending} />
    </points>
  );
}

function bitGradient(state, manipulation, lane) {
  if (state === "attack" || manipulation === "eavesdrop") return lane === 0 ? "from-danger to-rose-100" : "from-rose-300 to-danger";
  if (state === "crc" || manipulation === "crc-tamper") return lane === 0 ? "from-signal to-yellow-100" : "from-yellow-300 to-signal";
  if (state === "noise" || manipulation === "quantum-noise") return lane === 0 ? "from-violetline to-fuchsia-200" : "from-fuchsia-300 to-violetline";
  return lane === 0 ? "from-cyanline to-cyan-100" : "from-violetline to-cyanline";
}

function stepStatusText(activeStepId, manipulation, finalized) {
  if (manipulation === "eavesdrop") return "Eavesdropping injected: attacker observation is disturbing the quantum sample.";
  if (manipulation === "crc-tamper") return "CRC tampering injected: packet integrity will fail at receiver verification.";
  if (manipulation === "quantum-noise") return "Quantum noise injected: violet instability is increasing basis mismatch pressure.";
  if (finalized) return "Final result is available at the receiver.";
  if (activeStepId === "intercept") return "Interception window is open. Select a manipulation or continue safely.";
  return "No manipulation active at this stage.";
}

export default function QuantumScene({
  activeStepId = "compose",
  progress = 0,
  manipulation = "none",
  currentStepTitle = "Message Composition",
  isIdle = true,
  state = "stable",
  result,
  finalized = false,
  onStepClick
}) {
  const color = stateColor(state, activeStepId);
  const activeStep = SIMULATION_STEPS.find((step) => step.id === activeStepId) || SIMULATION_STEPS[0];
  const bits = result?.quantum?.bits?.slice(0, 2);
  const displayBits = bits?.length === 2 ? bits : [0, 1];
  const packetPercent = getPacketPercent(activeStepId, progress, isIdle);
  const streamActive = !isIdle && !["compose", "result"].includes(activeStepId);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const containerRef = useRef(null);

  const toggleFullscreen = useCallback(() => {
    if (!isFullscreen) {
      containerRef.current?.requestFullscreen?.();
    } else {
      document.exitFullscreen?.();
    }
  }, [isFullscreen]);

  useEffect(() => {
    const handler = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", handler);
    return () => document.removeEventListener("fullscreenchange", handler);
  }, []);

  return (
    <div ref={containerRef} className="rounded-lg bg-black/20">
      {/* ── Canvas ── */}
      <div className={isFullscreen ? "relative h-screen w-screen overflow-hidden" : "relative h-[520px] w-full overflow-hidden rounded-t-lg"}>
        <Canvas style={{ width: "100%", height: "100%" }} camera={{ position: [0, 2.35, 6.3], fov: 54 }}>
          <color attach="background" args={["#050712"]} />
          <ambientLight intensity={0.35} />
          <pointLight position={[0, 3, 4]} color={color} intensity={12} />
          <Stars radius={30} depth={18} count={1700} factor={3} saturation={0} fade />
          <Sparkles count={90} scale={[8, 2.6, 2.6]} size={2.4} speed={0.55} color={color} opacity={0.7} />
          <Float speed={isIdle ? 0.5 : 1.1} rotationIntensity={isIdle ? 0.2 : 0.45} floatIntensity={isIdle ? 0.25 : 0.55}>
            <Qubit position={[-3.35, 0, 0]} color="#2ffcff" speed={0.95} pulse={activeStepId === "compose"} />
            <Qubit position={[3.35, 0, 0]} color={finalized && result?.metrics?.secure ? "#6ee7b7" : "#9a5cff"} speed={1.15} pulse={["decrypt", "crc-verify", "result"].includes(activeStepId)} />
            <Qubit position={[0, 1.35, -0.2]} color={manipulation === "none" ? color : "#ff315e"} speed={1.55} pulse={activeStepId === "intercept" || manipulation !== "none"} />
            <TunnelRings color={color} activeStepId={activeStepId} manipulation={manipulation} />
            <PhotonBit lane={0} bit={displayBits[0]} color={color} activeStepId={activeStepId} progress={progress} isIdle={isIdle} manipulation={manipulation} />
            <PhotonBit lane={1} bit={displayBits[1]} color={state === "noise" ? "#c084fc" : color} activeStepId={activeStepId} progress={progress} isIdle={isIdle} manipulation={manipulation} />
            <DisturbanceField active={manipulation !== "none" || activeStepId === "intercept" || state === "attack"} color={color} />
            <SceneLabels activeStep={activeStep} color={color} finalized={finalized} secure={result?.metrics?.secure} />
            <Beam color={color} activeStepId={activeStepId} manipulation={manipulation} isIdle={isIdle} />
            <PacketMesh color={color} activeStepId={activeStepId} progress={progress} isIdle={isIdle} />
            <ParticleStream color={color} active={streamActive} />
          </Float>
          <OrbitControls enableZoom={false} enablePan={false} autoRotate autoRotateSpeed={isIdle ? 0.25 : 0.5} />
        </Canvas>

        {/* Top-left HUD info card — overlaid on the canvas */}
        <div className="pointer-events-none absolute left-4 top-4 max-w-xs rounded-md border border-cyanline/25 bg-black/35 p-3 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <span className="grid h-11 w-11 place-items-center rounded-md border border-cyanline/40 bg-cyanline/10 font-display text-xl text-cyanline shadow-neon">
              {isIdle ? "I" : activeStep.symbol}
            </span>
            <div>
              <p className="font-display text-sm uppercase tracking-[0.16em] text-white">{isIdle ? "Idle Quantum Channel" : currentStepTitle}</p>
              <p className="mt-1 text-xs text-slate-400">{isIdle ? "Waiting for sender command" : activeStep.id}</p>
            </div>
          </div>
          <p className="mt-2 text-xs leading-5 text-slate-300">{isIdle ? "Background qubits remain active; packet motion starts after Send Message." : activeStep.description}</p>
          <p className={manipulation === "none" ? "mt-2 text-xs text-emerald-300" : "mt-2 text-xs text-signal"}>{stepStatusText(activeStepId, manipulation, finalized)}</p>
        </div>

        {/* Fullscreen toggle button — top-right corner */}
        <button
          onClick={toggleFullscreen}
          title={isFullscreen ? "Exit fullscreen" : "View fullscreen"}
          className="absolute right-3 top-3 z-10 grid h-9 w-9 place-items-center rounded-md border border-cyanline/30 bg-black/40 text-cyanline backdrop-blur-sm transition hover:border-cyanline hover:bg-cyanline/10 hover:shadow-neon"
        >
          {isFullscreen ? (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 9L4 4m0 0h5m-5 0v5M15 9l5-5m0 0h-5m5 0v5M9 15l-5 5m0 0h5m-5 0v-5M15 15l5 5m0 0h-5m5 0v-5" />
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 8V4m0 0h4M4 4l5 5M20 8V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5M20 16v4m0 0h-4m4 0l-5-5" />
            </svg>
          )}
        </button>
      </div>

      {/* ── Pipeline panel — below canvas in normal flow ── */}
      <div className="rounded-b-lg border border-t-0 border-cyanline/25 bg-[#070b18]/90 p-4 shadow-[0_28px_80px_rgba(0,0,0,.55)]" style={{ perspective: "1200px" }}>
        <div className="mb-3 flex items-center justify-between gap-3">
          <div>
            <p className="font-display text-xs uppercase tracking-[0.24em] text-cyanline">Interactive Pipeline Inside 3D Channel</p>
            <p className="mt-1 text-xs text-slate-400">3D photon bits move through basis rings above; steps below drive the scene.</p>
          </div>
          <div className="h-2 w-36 overflow-hidden rounded-full bg-white/10">
            <motion.div className="h-full rounded-full bg-cyanline shadow-neon" animate={{ width: `${isIdle ? 0 : progress}%` }} />
          </div>
        </div>

        <div className="relative grid grid-cols-[86px_1fr_86px] items-center gap-4 opacity-70">
          <div className="rounded-full border border-cyanline/40 bg-cyanline/10 p-4 text-center shadow-neon" style={{ transform: "translateZ(50px)" }}>
            <p className="font-display text-3xl text-cyanline">S</p>
            <p className="text-[10px] uppercase tracking-[0.18em] text-slate-400">Sender</p>
          </div>
          <div className="relative h-28 overflow-hidden rounded-lg border border-white/10 bg-[radial-gradient(circle_at_center,rgba(47,252,255,.10),rgba(255,255,255,.025)_42%,transparent_70%)] shadow-[inset_0_0_45px_rgba(47,252,255,.08)]">
            <div className="absolute inset-x-6 top-14 h-px bg-gradient-to-r from-cyanline/10 via-cyanline to-violetline/10 shadow-neon" />
            <div className="absolute inset-x-6 bottom-14 h-px bg-gradient-to-r from-violetline/10 via-violetline to-cyanline/10" />
            <div className="absolute left-0 right-0 top-1/2 h-20 -translate-y-1/2 bg-gradient-to-r from-transparent via-cyanline/10 to-transparent blur-xl" />
            <div className={manipulation !== "none" || activeStepId === "intercept" ? "absolute left-1/2 top-1/2 grid h-20 w-20 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border border-danger/50 bg-danger/15 text-danger shadow-danger" : "absolute left-1/2 top-1/2 grid h-20 w-20 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border border-white/10 bg-white/[0.04] text-slate-500"}>
              <span className="font-display text-2xl">A</span>
            </div>
            {[0, 1].map((lane) => (
              <motion.div
                key={lane}
                className={`absolute grid h-12 w-20 place-items-center rounded-md bg-gradient-to-r ${bitGradient(state, manipulation, lane)} font-display text-base font-bold text-slate-950 shadow-neon`}
                style={{ top: lane === 0 ? 18 : 70, transform: "translateZ(80px)" }}
                animate={{ left: `calc(${packetPercent}% - ${packetPercent > 96 ? "4rem" : "0rem"})`, scale: manipulation !== "none" ? [1, 1.14, 1] : 1 }}
                transition={{ duration: 0.35 }}
              >
                B{lane}:{displayBits[lane]}
              </motion.div>
            ))}
          </div>
          <div className="rounded-full border border-violetline/40 bg-violetline/10 p-4 text-center shadow-violet" style={{ transform: "translateZ(50px)" }}>
            <p className="font-display text-3xl text-violet-100">R</p>
            <p className="text-[10px] uppercase tracking-[0.18em] text-slate-400">Receiver</p>
          </div>
        </div>

        <div className="mt-4 grid gap-2 md:grid-cols-6">
          {SIMULATION_STEPS.slice(0, 6).map((step, index) => {
            const active = step.id === activeStepId;
            const complete = SIMULATION_STEPS.findIndex((item) => item.id === activeStepId) > index;
            return (
              <button
                key={step.id}
                onClick={() => onStepClick?.(index)}
                className={`text-left transition-all ${active ? "rounded-md border border-cyanline/70 bg-cyanline/10 p-2 shadow-neon scale-[1.02] z-10" : complete ? "rounded-md border border-emerald-300/40 bg-emerald-300/10 p-2 hover:border-emerald-300/60" : "rounded-md border border-white/10 bg-black/20 p-2 opacity-70 hover:opacity-100 hover:border-white/30"}`}
              >
                <div className="flex items-center gap-2">
                  <span className={`grid h-7 w-7 place-items-center rounded font-display text-xs ${active ? "bg-cyanline text-slate-950" : "bg-white/[0.07] text-cyanline"}`}>{step.symbol}</span>
                  <p className="font-display text-[11px] text-slate-100">{step.shortLabel}</p>
                </div>
                <p className="mt-1 line-clamp-2 text-[10px] leading-4 text-slate-500">{step.description}</p>
              </button>
            );
          })}
        </div>
        <div className="mt-2 grid gap-2 md:grid-cols-5">
          {SIMULATION_STEPS.slice(6).map((step, offset) => {
            const index = offset + 6;
            const active = step.id === activeStepId;
            const complete = SIMULATION_STEPS.findIndex((item) => item.id === activeStepId) > index;
            return (
              <button
                key={step.id}
                onClick={() => onStepClick?.(index)}
                className={`text-left transition-all ${active ? "rounded-md border border-cyanline/70 bg-cyanline/10 p-2 shadow-neon scale-[1.02] z-10" : complete ? "rounded-md border border-emerald-300/40 bg-emerald-300/10 p-2 hover:border-emerald-300/60" : "rounded-md border border-white/10 bg-black/20 p-2 opacity-70 hover:opacity-100 hover:border-white/30"}`}
              >
                <div className="flex items-center gap-2">
                  <span className={`grid h-7 w-7 place-items-center rounded font-display text-xs ${active ? "bg-cyanline text-slate-950" : "bg-white/[0.07] text-cyanline"}`}>{step.symbol}</span>
                  <p className="font-display text-[11px] text-slate-100">{step.shortLabel}</p>
                </div>
                <p className="mt-1 line-clamp-2 text-[10px] leading-4 text-slate-500">{step.description}</p>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
