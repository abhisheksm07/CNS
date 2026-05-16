import { useState } from "react";
import Landing from "./pages/Landing.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import Messenger from "./pages/Messenger.jsx";
import AttackerTerminal from "./pages/AttackerTerminal.jsx";

export default function App() {
  const [view, setView] = useState("landing");
  
  if (view === "landing") return <Landing onLaunch={(v) => setView(v || "dashboard")} />;
  if (view === "dashboard") return <Dashboard onHome={() => setView("landing")} />;
  if (view === "messenger") return <Messenger onHome={() => setView("landing")} />;
  if (view === "attacker") return <AttackerTerminal onHome={() => setView("landing")} />;
  
  return <Landing onLaunch={(v) => setView(v || "dashboard")} />;
}
