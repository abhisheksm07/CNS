import { motion } from "framer-motion";
import { Binary, Eye, KeyRound, LockKeyhole, Radio, ShieldCheck, Sigma } from "lucide-react";

const steps = [
  {
    key: "key-exchange",
    symbol: "K",
    title: "Key Exchange",
    description: "Sender and receiver derive the shared Diffie-Hellman secret before payload encryption.",
    icon: KeyRound
  },
  {
    key: "encrypt",
    symbol: "E",
    title: "AES Encryption",
    description: "The payload is sealed as AES-256 ciphertext and split into two visible bit carriers.",
    icon: LockKeyhole
  },
  {
    key: "transmit",
    symbol: "T",
    title: "Two-Bit Transit",
    description: "Bit A and Bit B travel across the quantum channel as paired encrypted particles.",
    icon: Binary
  },
  {
    key: "verify",
    symbol: "C",
    title: "CRC Verification",
    description: "The receiver recalculates CRC-32 and checks whether packet integrity survived transit.",
    icon: ShieldCheck
  },
  {
    key: "quantum-sift",
    symbol: "Q",
    title: "Basis Comparison",
    description: "Random BB84-style bases are compared; mismatches raise the quantum disturbance score.",
    icon: Sigma
  }
];

const phaseAlias = {
  launch: "key-exchange",
  intercept: "transmit",
  tamper: "verify",
  noise: "quantum-sift",
  verified: "quantum-sift",
  "threat-detected": "quantum-sift"
};

function getActiveIndex(phase) {
  const normalized = phaseAlias[phase] || phase;
  const index = steps.findIndex((step) => step.key === normalized);
  return index === -1 ? 0 : index;
}

function bitTone(state, index) {
  if (state === "attack") return index === 0 ? "from-danger to-rose-200" : "from-rose-300 to-danger";
  if (state === "crc") return index === 0 ? "from-signal to-yellow-100" : "from-yellow-300 to-signal";
  if (state === "noise") return index === 0 ? "from-violetline to-fuchsia-200" : "from-fuchsia-300 to-violetline";
  return index === 0 ? "from-cyanline to-cyan-100" : "from-violetline to-cyanline";
}

export default function QuantumBitChannel({ phase, state, result }) {
  const activeIndex = getActiveIndex(phase);
  const activeStep = steps[activeIndex];
  const bits = result?.quantum?.bits?.slice(0, 2);
  const displayBits = bits?.length === 2 ? bits : [0, 1];
  const alertText =
    state === "attack"
      ? "Interception detected: sampled quantum bits show abnormal basis disturbance."
      : state === "crc"
        ? "CRC mismatch: receiver checksum no longer matches the sender checksum."
        : state === "noise"
          ? "Quantum noise: basis comparison is unstable and carrier paths are distorted."
          : "Stable channel: encrypted two-bit carriers are passing receiver verification.";

  return (
    <div className="mt-4 space-y-4">
      <div className="relative overflow-hidden rounded-lg border border-cyanline/15 bg-black/30 p-4">
        <div className="absolute inset-x-6 top-1/2 h-px bg-gradient-to-r from-cyanline/20 via-cyanline to-violetline/20" />
        <div className="relative grid grid-cols-[86px_1fr_86px] items-center gap-3">
          <div className="rounded-md border border-cyanline/30 bg-cyanline/10 p-3 text-center">
            <p className="font-display text-lg text-cyanline">S</p>
            <p className="text-[10px] uppercase tracking-[0.16em] text-slate-400">Sender</p>
          </div>

          <div className="relative h-32 overflow-hidden rounded-md border border-white/10 bg-white/[0.035]">
            {[0, 1].map((lane) => (
              <div key={lane} className={`absolute left-4 right-4 ${lane === 0 ? "top-7" : "bottom-7"} h-px bg-white/10`}>
                <motion.div
                  className={`absolute -top-5 grid h-10 w-14 place-items-center rounded-md bg-gradient-to-r ${bitTone(state, lane)} font-display text-sm font-bold text-slate-950 shadow-neon`}
                  animate={{ left: ["0%", "calc(100% - 3.5rem)", "0%"], scale: state === "attack" && lane === 1 ? [1, 1.22, 1] : [1, 1.05, 1] }}
                  transition={{ duration: lane === 0 ? 3.1 : 3.6, repeat: Infinity, ease: "easeInOut" }}
                >
                  B{lane}:{displayBits[lane]}
                </motion.div>
              </div>
            ))}

            <motion.div
              className="absolute left-1/2 top-1/2 grid h-14 w-14 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border border-danger/50 bg-danger/10 text-danger shadow-danger"
              animate={{ opacity: state === "attack" ? [0.35, 1, 0.35] : 0.25, scale: state === "attack" ? [1, 1.18, 1] : 1 }}
              transition={{ duration: 1.4, repeat: Infinity }}
              title="Attacker monitor"
            >
              <Eye className="h-5 w-5" />
            </motion.div>
          </div>

          <div className="rounded-md border border-violetline/30 bg-violetline/10 p-3 text-center">
            <p className="font-display text-lg text-violet-100">R</p>
            <p className="text-[10px] uppercase tracking-[0.16em] text-slate-400">Receiver</p>
          </div>
        </div>
      </div>

      <div className="grid gap-3 lg:grid-cols-[220px_1fr]">
        <div className="rounded-md border border-white/10 bg-white/[0.045] p-4">
          <div className="mb-3 flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-slate-400">
            <Radio className="h-4 w-4 text-cyanline" />
            Active Step
          </div>
          <div className="flex items-center gap-3">
            <span className="grid h-12 w-12 place-items-center rounded-md border border-cyanline/30 bg-cyanline/10 font-display text-2xl text-cyanline shadow-neon">
              {activeStep.symbol}
            </span>
            <div>
              <p className="font-display text-sm text-white">{activeStep.title}</p>
              <p className="mt-1 text-xs text-slate-500">{phase}</p>
            </div>
          </div>
          <p className="mt-3 text-sm leading-6 text-slate-300">{alertText}</p>
        </div>

        <div className="grid gap-2 md:grid-cols-5">
          {steps.map((step, index) => {
            const Icon = step.icon;
            const active = index === activeIndex;
            const complete = index < activeIndex;
            return (
              <motion.div
                key={step.key}
                animate={{
                  borderColor: active ? "rgba(47,252,255,.75)" : complete ? "rgba(110,231,183,.45)" : "rgba(255,255,255,.1)",
                  opacity: active || complete ? 1 : 0.62
                }}
                className="rounded-md border bg-black/25 p-3"
              >
                <div className="mb-2 flex items-center justify-between">
                  <span className="grid h-8 w-8 place-items-center rounded-md bg-white/[0.06] font-display text-sm text-cyanline">{step.symbol}</span>
                  <Icon className={active ? "h-4 w-4 text-cyanline" : "h-4 w-4 text-slate-500"} />
                </div>
                <p className="font-display text-xs text-slate-100">{step.title}</p>
                <p className="mt-2 text-[11px] leading-4 text-slate-500">{step.description}</p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
