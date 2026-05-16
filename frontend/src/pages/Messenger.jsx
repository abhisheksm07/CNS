import { useEffect, useMemo, useRef, useState } from "react";
import { io } from "socket.io-client";
import { Home, MessageSquare, Send, ShieldCheck, User, Users, Lock, ShieldAlert } from "lucide-react";
import ParticleField from "../components/ParticleField.jsx";
import { SIMULATION_STEPS } from "../simulation/simulationSteps.js";

const API = import.meta.env.VITE_API_URL || "http://localhost:5000";

export default function Messenger({ onHome }) {
  const [room, setRoom] = useState("quantum-room-1");
  const [user, setUser] = useState("Alice");
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [isJoined, setIsJoined] = useState(false);
  const [transmissionStep, setTransmissionStep] = useState(null);
  const [transmissionProgress, setTransmissionProgress] = useState(0);
  const [isTransmitting, setIsTransmitting] = useState(false);
  const [securityStatus, setSecurityStatus] = useState("stable"); // stable, attack, crc
  const [roomUsers, setRoomUsers] = useState([]);
  const [socket, setSocket] = useState(null);

  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTransmitting]);

  useEffect(() => {
    const s = io(API, { transports: ["websocket", "polling"] });
    setSocket(s);

    s.on("connect", () => {
      console.log("Messenger Connected:", s.id);
      if (isJoined) s.emit("session:join", { roomId: room, role: user });
    });

    s.on("connect_error", (err) => console.error("Messenger Connection Error:", err));

    s.on("session:joined", (data) => {
        setIsJoined(true);
    });

    s.on("sim:step", (data) => {
        if (data.roomId !== room) return;
        setIsTransmitting(true);
        setTransmissionStep(data.stepId);
        setTransmissionProgress(data.progress);
        setSecurityStatus(data.state);
    });

    s.on("recv:message", (data) => {
        if (data.roomId !== room) return;
        setIsTransmitting(false);
        setTransmissionStep(null);
        setTransmissionProgress(0);
        
        const newMessage = {
            id: Date.now(),
            sender: data.sender,
            text: data.decrypted,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            secure: data.secure,
            manipulation: data.manipulation
        };
        
        setMessages(prev => [...prev, newMessage]);
    });

    s.on("room:users", (data) => {
        setRoomUsers(data.users);
    });

    return () => s.disconnect();
  }, [room, user]);

  const joinRoom = () => {
    if (socket) {
        socket.emit("session:join", { roomId: room, role: user });
        setIsJoined(true);
    }
  };

  const sendMessage = (e) => {
    e.preventDefault();
    if (!message.trim() || isTransmitting || !socket) return;

    socket.emit("sender:message", {
      roomId: room,
      message: message,
      sender: user
    });
    
    setMessage("");
  };

  const activeStep = SIMULATION_STEPS.find(s => s.id === transmissionStep);

  return (
    <main className="relative flex h-screen flex-col overflow-hidden bg-[#050712] text-white">
      <ParticleField count={30} />
      
      {/* Header */}
      <header className="relative z-10 flex items-center justify-between border-b border-white/10 bg-black/40 px-6 py-4 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-cyanline/20 text-cyanline shadow-neon">
            <MessageSquare className="h-5 w-5" />
          </div>
          <div>
            <h1 className="font-display text-lg font-bold tracking-tight text-white">Quantum Messenger</h1>
            <p className="text-xs text-slate-400">End-to-End Quantum Secure</p>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          {isJoined && (
            <div className="flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1">
                <div className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" />
                <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-300">Live: {room}</span>
            </div>
          )}
          <button onClick={onHome} className="rounded-md border border-white/10 bg-white/5 p-2 text-slate-300 transition hover:border-cyanline hover:text-white">
            <Home className="h-4 w-4" />
          </button>
        </div>
      </header>

      {!isJoined ? (
        <div className="relative z-10 flex flex-1 items-center justify-center p-6">
          <div className="glass neon-border w-full max-w-md rounded-xl p-8">
            <div className="mb-6 text-center">
                <h2 className="font-display text-3xl font-bold text-white">Initialize Session</h2>
                <p className="mt-2 text-xs uppercase tracking-widest text-slate-500">Secure Node Registration</p>
            </div>
            
            <div className="space-y-6">
              <div>
                <label className="mb-2 block text-xs font-black uppercase tracking-widest text-cyanline">Operator Name</label>
                <div className="relative">
                    <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                    <input 
                        type="text" 
                        value={user} 
                        onChange={(e) => setUser(e.target.value)}
                        className="w-full rounded-md border border-white/10 bg-black/40 py-3.5 pl-10 pr-4 text-sm outline-none focus:border-cyanline transition-all focus:bg-cyanline/5"
                        placeholder="e.g. Alice, Eve, Dr. Smith..."
                    />
                </div>
              </div>

              <div>
                <label className="mb-2 block text-xs font-black uppercase tracking-widest text-violetline">Channel Identifier</label>
                <div className="relative">
                    <Users className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                    <input 
                        type="text" 
                        value={room} 
                        onChange={(e) => setRoom(e.target.value)}
                        className="w-full rounded-md border border-white/10 bg-black/40 py-3.5 pl-10 pr-4 text-sm outline-none focus:border-violetline transition-all focus:bg-violetline/5"
                        placeholder="e.g. project-x, secure-chat-1..."
                    />
                </div>
              </div>

              <div className="rounded-lg bg-white/[0.03] p-4 border border-white/5">
                <div className="flex items-center gap-3">
                    <div className="h-10 w-10 shrink-0 rounded-full bg-emerald-500/10 grid place-items-center text-emerald-400">
                        <Lock className="h-5 w-5" />
                    </div>
                    <p className="text-[10px] leading-relaxed text-slate-400 uppercase tracking-tight">
                        By joining, you establish a <span className="text-emerald-400">quantum-secure entanglement</span> with all other operators in this channel.
                    </p>
                </div>
              </div>

              <button 
                onClick={joinRoom} 
                disabled={!user.trim() || !room.trim()}
                className="w-full rounded-md bg-cyanline py-4 font-bold text-slate-950 shadow-neon transition hover:scale-[1.02] active:scale-95 disabled:opacity-50"
              >
                Establish Connection
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="relative z-10 flex flex-1 overflow-hidden">
          {/* Sidebar */}
          <aside className="hidden w-72 border-r border-white/10 bg-black/20 md:block">
            <div className="p-4">
                <p className="mb-4 text-[10px] font-bold uppercase tracking-widest text-slate-500">Connected Operators</p>
                <div className="space-y-2">
                    {roomUsers.map((u, idx) => (
                      <div key={idx} className={`flex items-center gap-3 rounded-lg border p-3 transition-all ${u === user ? 'border-cyanline/30 bg-cyanline/10' : 'border-white/5 bg-white/[0.02]'}`}>
                          <div className={`flex h-8 w-8 items-center justify-center rounded-full font-bold text-slate-950 ${u === user ? 'bg-cyanline shadow-neon' : 'bg-slate-700 text-white'}`}>
                            {u.charAt(0).toUpperCase()}
                          </div>
                          <div className="flex-1 overflow-hidden">
                              <p className="truncate text-xs font-bold text-white">{u} {u === user && "(You)"}</p>
                              <div className="flex items-center gap-1.5">
                                <div className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                                <span className="text-[9px] text-emerald-400/80 uppercase tracking-tighter">Synchronized</span>
                              </div>
                          </div>
                      </div>
                    ))}
                    {roomUsers.length === 0 && (
                      <p className="py-4 text-center text-[10px] text-slate-500 italic">Establishing node presence...</p>
                    )}
                </div>
                
                <div className="mt-8 rounded-lg border border-white/10 bg-white/5 p-4">
                    <div className="mb-2 flex items-center gap-2">
                        <Lock className="h-3 w-3 text-cyanline" />
                        <span className="text-[10px] font-bold uppercase tracking-widest text-cyanline">Security Protocol</span>
                    </div>
                    <p className="text-[11px] leading-relaxed text-slate-400">
                        Messages are processed via a simulated BB84 Quantum Channel using a 48-bit basis comparison.
                    </p>
                </div>
            </div>
          </aside>

          {/* Chat Window */}
          <div className="flex flex-1 flex-col bg-black/10">
            {/* Messages Area */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.length === 0 && !isTransmitting && (
                <div className="flex h-full flex-col items-center justify-center text-center opacity-40">
                    <MessageSquare className="mb-4 h-12 w-12" />
                    <p className="text-sm">No messages yet in this secure channel.</p>
                </div>
              )}
              
              {messages.map((msg) => (
                <div key={msg.id} className={`flex ${msg.sender === user ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[80%] rounded-2xl p-4 ${
                    msg.sender === user 
                      ? "bg-cyanline/10 border border-cyanline/30 text-white rounded-tr-none" 
                      : "bg-white/10 border border-white/20 text-white rounded-tl-none"
                  }`}>
                    <div className="mb-1 flex items-center justify-between gap-4">
                        <span className={`text-[10px] font-bold uppercase ${msg.sender === user ? "text-cyanline" : "text-violetline"}`}>
                            {msg.sender}
                        </span>
                        <span className="text-[9px] text-slate-500">{msg.time}</span>
                    </div>
                    <p className="text-sm leading-relaxed">{msg.text}</p>
                    
                    {!msg.isLocal && (
                        <div className={`mt-2 flex items-center gap-2 border-t border-white/10 pt-2 text-[9px] font-bold uppercase tracking-wider ${msg.secure ? "text-emerald-400" : "text-danger"}`}>
                            {msg.secure ? (
                                <><ShieldCheck className="h-3 w-3" /> Quantum Secure ✓</>
                            ) : (
                                <><ShieldAlert className="h-3 w-3" /> Compromised! ✗ ({msg.manipulation})</>
                            )}
                        </div>
                    )}
                  </div>
                </div>
              ))}

              {isTransmitting && (
                <div className={`flex ${user === "Alice" ? "justify-end" : "justify-start"}`}>
                  <div className="w-full max-w-[300px] animate-pulse rounded-2xl border border-violetline/30 bg-violetline/5 p-4">
                    <div className="mb-3 flex items-center justify-between">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-violetline">Transmission Pipeline</span>
                        <span className="text-[10px] text-violet-300">{transmissionProgress}%</span>
                    </div>
                    <div className="mb-2 h-1.5 w-full overflow-hidden rounded-full bg-black/40">
                        <div className="h-full bg-violetline transition-all duration-300" style={{ width: `${transmissionProgress}%` }} />
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-300">
                        <div className={`h-2 w-2 rounded-full ${securityStatus === 'stable' ? 'bg-cyanline shadow-neon' : 'bg-danger shadow-neon-red'}`} />
                        <span>{activeStep ? activeStep.title : "Initializing..."}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Input Area */}
            <div className="border-t border-white/10 bg-black/40 p-4">
              <form onSubmit={sendMessage} className="flex gap-3">
                <input 
                  type="text" 
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  disabled={isTransmitting}
                  className="flex-1 rounded-lg border border-white/10 bg-white/5 p-4 text-sm outline-none focus:border-cyanline disabled:opacity-50"
                  placeholder={isTransmitting ? "Quantum tunnel busy..." : "Type your secure message..."}
                />
                <button 
                    type="submit" 
                    disabled={!message.trim() || isTransmitting}
                    className="flex h-14 w-14 items-center justify-center rounded-lg bg-cyanline text-slate-950 shadow-neon transition hover:scale-105 disabled:opacity-50 disabled:hover:scale-100"
                >
                  <Send className="h-6 w-6" />
                </button>
              </form>
              <div className="mt-2 flex items-center gap-2 text-[9px] font-medium uppercase tracking-[0.2em] text-slate-500">
                <Lock className="h-3 w-3" /> AES-256 Enabled | BB84 Protocol Active
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
