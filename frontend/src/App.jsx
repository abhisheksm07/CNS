import { useState } from "react";
import Landing from "./pages/Landing.jsx";
import Dashboard from "./pages/Dashboard.jsx";

export default function App() {
  const [view, setView] = useState("landing");
  return view === "landing" ? <Landing onLaunch={() => setView("dashboard")} /> : <Dashboard onHome={() => setView("landing")} />;
}
