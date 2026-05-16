import { motion } from "framer-motion";
import { ArrowRight, Cpu, KeyRound, Radio, ShieldCheck, Sparkles, Waves, MessageSquare, Terminal } from "lucide-react";
import ParticleField from "../components/ParticleField.jsx";

const features = [
  ["AES-256 Encryption", "Real payload encryption with generated Diffie-Hellman session material.", KeyRound],
  ["BB84-Inspired Detection", "Basis comparison and error-rate scoring reveal channel disturbance.", Sparkles],
  ["Live Attack Theater", "Interception, tampering, and noise light up the channel in real time.", Radio],
  ["Integrity Analytics", "CRC-32 verification and secure-channel metrics stay visible while packets move.", ShieldCheck]
];

export default function Landing({ onLaunch }) {
  return (
    <main className="relative min-h-screen overflow-hidden text-white">
      <ParticleField />
      <div className="absolute inset-0 grid-holo opacity-50" />
      <section className="relative z-10 mx-auto flex min-h-screen max-w-7xl flex-col px-5 py-6">
        <nav className="flex items-center justify-between">
          <div className="font-display text-xl font-bold tracking-[0.24em] text-cyanline">Q-SECCOM</div>
          <button onClick={onLaunch} className="rounded-md border border-cyanline/40 bg-cyanline/10 px-4 py-2 text-sm font-semibold text-cyan-100 shadow-neon transition hover:bg-cyanline/20">
            Open Console
          </button>
        </nav>

        <div className="grid flex-1 items-center gap-10 py-12 lg:grid-cols-[1.04fr_.96fr]">
          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
            <p className="mb-4 font-display text-sm uppercase tracking-[0.34em] text-violet-200">Quantum-inspired secure transmission</p>
            <h1 className="max-w-4xl font-display text-5xl font-extrabold leading-tight sm:text-6xl lg:text-7xl">
              Q-SecCom
              <span className="block bg-gradient-to-r from-cyanline via-white to-violetline bg-clip-text text-transparent">Next-Gen Secure Communication System</span>
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-300">
              A research-grade command dashboard for encrypted payload transfer, CRC integrity checks, Diffie-Hellman session exchange, and BB84-inspired eavesdropping detection.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <button 
                onClick={() => onLaunch("dashboard")} 
                className="inline-flex items-center gap-2 rounded-md bg-cyanline px-6 py-4 font-bold text-slate-950 shadow-neon transition hover:scale-[1.02]"
              >
                Launch Console <ArrowRight className="h-4 w-4" />
              </button>
              <button 
                onClick={() => onLaunch("messenger")} 
                className="inline-flex items-center gap-2 rounded-md border border-violetline/50 bg-violetline/10 px-6 py-4 font-bold text-violet-100 shadow-neon-violet transition hover:scale-[1.02]"
              >
                Secure Messenger <MessageSquare className="h-4 w-4" />
              </button>
              <button 
                onClick={() => onLaunch("attacker")} 
                className="inline-flex items-center gap-2 rounded-md border border-red-500/50 bg-red-500/10 px-6 py-4 font-bold text-red-100 shadow-neon-red transition hover:scale-[1.02]"
              >
                Attacker Terminal <Terminal className="h-4 w-4" />
              </button>
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, scale: 0.94 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.8, delay: 0.15 }} className="glass neon-border scanline relative min-h-[440px] overflow-hidden rounded-lg p-6">
            <div className="absolute inset-x-10 top-1/2 h-1 bg-gradient-to-r from-cyanline via-violetline to-danger shadow-neon" />
            <div className="relative grid h-full grid-cols-3 items-center gap-4">
              {["SENDER", "QUANTUM FIELD", "RECEIVER"].map((label, index) => (
                <div key={label} className="flex flex-col items-center gap-4">
                  <motion.div animate={{ y: [0, -8, 0], boxShadow: ["0 0 20px rgba(47,252,255,.3)", "0 0 42px rgba(154,92,255,.45)", "0 0 20px rgba(47,252,255,.3)"] }} transition={{ duration: 3 + index, repeat: Infinity }} className="grid h-28 w-28 place-items-center rounded-full border border-cyanline/50 bg-cyanline/10">
                    {index === 1 ? <Waves className="h-10 w-10 text-violetline" /> : <Cpu className="h-10 w-10 text-cyanline" />}
                  </motion.div>
                  <span className="font-display text-xs uppercase tracking-[0.22em] text-slate-300">{label}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      <section id="overview" className="relative z-10 border-y border-cyanline/10 bg-black/20 px-5 py-16">
        <div className="mx-auto grid max-w-7xl gap-4 md:grid-cols-2 lg:grid-cols-4">
          {features.map(([title, body, Icon]) => (
            <motion.article whileHover={{ y: -5 }} key={title} className="glass neon-border rounded-lg p-5">
              <Icon className="mb-5 h-8 w-8 text-cyanline" />
              <h2 className="font-display text-lg text-white">{title}</h2>
              <p className="mt-3 text-sm leading-6 text-slate-400">{body}</p>
            </motion.article>
          ))}
        </div>
      </section>

      <section className="relative z-10 mx-auto grid max-w-7xl gap-8 px-5 py-16 lg:grid-cols-2">
        <div>
          <h2 className="font-display text-3xl text-cyan-50">Quantum Security Overview</h2>
          <p className="mt-4 leading-8 text-slate-300">
            Q-SecCom models a secure session from key exchange through encrypted transit and receiver verification. The BB84-inspired layer samples matching bases and flags disturbance when mismatches exceed the configured threshold.
          </p>
        </div>
        <div className="glass neon-border rounded-lg p-6">
          <h3 className="font-display text-xl text-violet-100">Communication Simulation Preview</h3>
          <div className="mt-5 grid gap-3 text-sm text-slate-300">
            {["Generate DH session", "Encrypt payload", "Animate packet travel", "Verify CRC", "Compare quantum bases"].map((item) => (
              <div key={item} className="flex items-center gap-3 rounded-md border border-white/10 bg-white/[0.04] p-3">
                <span className="h-2 w-2 rounded-full bg-cyanline shadow-neon" />
                {item}
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer className="relative z-10 border-t border-white/10 px-5 py-8 text-center text-sm text-slate-500">
        Q-SecCom research console. Built for secure communication simulation and visual analysis.
      </footer>
    </main>
  );
}
