import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { initAppSecurity } from "./lib/app-security";

// Initialize screenshot and content protection
initAppSecurity();

window.addEventListener("error", (e) => {
  const msg = (e?.message || "").toLowerCase();
  const hasStack = !!(e?.error && (e.error as Error).stack && (e.error as Error).stack!.trim().length > 0);
  if (!hasStack && (msg.includes("unknown runtime error") || msg === "" || msg === "script error.")) {
    e.stopImmediatePropagation();
    e.preventDefault();
  }
});

window.addEventListener("unhandledrejection", (e) => {
  const reason: any = e?.reason;
  if (!reason || (typeof reason === "object" && !reason.stack && !reason.message)) {
    e.preventDefault();
  }
});

createRoot(document.getElementById("root")!).render(<App />);
