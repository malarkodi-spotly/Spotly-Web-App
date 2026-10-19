import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Radio, Sparkles, CheckCircle2, ShieldCheck } from "lucide-react";

interface MiniCarProps {
  color?: string;
  roofColor?: string;
  headlights?: boolean;
  brakeLights?: boolean;
  reverseLights?: boolean;
  blinker?: boolean;
  length?: number;
  width?: number;
}

export function MiniCar({
  color = "#3b82f6",
  roofColor = "#1d4ed8",
  headlights = true,
  brakeLights = false,
  reverseLights = false,
  blinker = false,
  length = 34,
  width = 17,
}: MiniCarProps) {
  return (
    <div className="relative inline-flex items-center justify-center select-none" style={{ width: length, height: width }}>
      {/* Front Headlight Beams */}
      {headlights && (
        <div
          className="absolute -right-6 top-1/2 -translate-y-1/2 w-7 h-6 pointer-events-none opacity-80"
          style={{
            background: "radial-gradient(ellipse at 0% 50%, rgba(254, 240, 138, 0.45) 0%, rgba(254, 240, 138, 0.15) 50%, transparent 80%)",
            clipPath: "polygon(0% 35%, 100% 0%, 100% 100%, 0% 65%)",
          }}
        />
      )}

      {/* Rear Reverse Light Beams */}
      {reverseLights && (
        <div
          className="absolute -left-4 top-1/2 -translate-y-1/2 w-5 h-5 pointer-events-none opacity-70"
          style={{
            background: "radial-gradient(ellipse at 100% 50%, rgba(255, 255, 255, 0.5) 0%, transparent 70%)",
          }}
        />
      )}

      <svg width={length} height={width} viewBox="0 0 34 17" fill="none" className="drop-shadow-md">
        {/* Wheels */}
        <rect x="5" y="0" width="5.5" height="1.8" rx="0.9" fill="#090d16" />
        <rect x="23" y="0" width="5.5" height="1.8" rx="0.9" fill="#090d16" />
        <rect x="5" y="15.2" width="5.5" height="1.8" rx="0.9" fill="#090d16" />
        <rect x="23" y="15.2" width="5.5" height="1.8" rx="0.9" fill="#090d16" />

        {/* Car Body Chassis */}
        <rect x="2" y="1.8" width="30" height="13.4" rx="3.5" fill={color} />

        {/* Front Windshield */}
        <path d="M21 3.5 L24.5 3.5 L24.5 13.5 L21 13.5 Z" fill="#090d16" opacity="0.8" />
        {/* Rear Windshield */}
        <path d="M7.5 4 L10 4 L10 13 L7.5 13 Z" fill="#090d16" opacity="0.8" />
        {/* Side Windows */}
        <rect x="11" y="2.8" width="8.5" height="1.6" rx="0.5" fill="#090d16" opacity="0.8" />
        <rect x="11" y="12.6" width="8.5" height="1.6" rx="0.5" fill="#090d16" opacity="0.8" />

        {/* Roof */}
        <rect x="10.5" y="4.6" width="10" height="7.8" rx="1.8" fill={roofColor} />

        {/* Front Headlights */}
        <circle cx="31.5" cy="3.8" r="1.3" fill={headlights ? "#fef08a" : "#94a3b8"} />
        <circle cx="31.5" cy="13.2" r="1.3" fill={headlights ? "#fef08a" : "#94a3b8"} />

        {/* Rear Lights */}
        <circle
          cx="2.5"
          cy="3.8"
          r="1.3"
          fill={reverseLights ? "#ffffff" : brakeLights ? "#f87171" : "#ef4444"}
        />
        <circle
          cx="2.5"
          cy="13.2"
          r="1.3"
          fill={reverseLights ? "#ffffff" : brakeLights ? "#f87171" : "#ef4444"}
        />

        {/* Amber Turn Blinker */}
        {blinker && (
          <circle cx="31.5" cy="3.8" r="2.2" fill="#fbbf24" className="animate-ping" />
        )}
      </svg>
    </div>
  );
}

export default function LandingMiniRoads() {
  const [parkState, setParkState] = useState<"approaching" | "parking" | "parked" | "leaving">("approaching");

  useEffect(() => {
    // Continuous 12s cycle:
    // 0s - 3s: approaching
    // 3s - 5s: parking
    // 5s - 9s: parked
    // 9s - 12s: leaving
    const runCycle = () => {
      setParkState("approaching");
      const t1 = setTimeout(() => setParkState("parking"), 3000);
      const t2 = setTimeout(() => setParkState("parked"), 5000);
      const t3 = setTimeout(() => setParkState("leaving"), 9000);
      return [t1, t2, t3];
    };

    let timers = runCycle();
    const interval = setInterval(() => {
      timers.forEach(clearTimeout);
      timers = runCycle();
    }, 12000);

    return () => {
      clearInterval(interval);
      timers.forEach(clearTimeout);
    };
  }, []);

  return (
    <div className="relative w-full max-w-[340px] lg:max-w-[370px] xl:max-w-[400px] select-none my-auto">
      {/* ═══ INFINITE RIPPLE / SONAR RADAR BEACON (Center of the roads) ═══ */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        {[0, 1, 2, 3].map((idx) => (
          <motion.div
            key={idx}
            className="absolute rounded-full border border-cyan-400/35"
            style={{
              background: "radial-gradient(circle, rgba(56, 189, 248, 0.12) 0%, rgba(99, 102, 241, 0.04) 55%, transparent 75%)",
            }}
            animate={{
              width: ["80px", "220px", "360px"],
              height: ["80px", "220px", "360px"],
              opacity: [0.75, 0.4, 0],
              scale: [0.7, 1.25, 1.8],
            }}
            transition={{
              duration: 4.2,
              repeat: Infinity,
              ease: "easeOut",
              delay: idx * 1.05,
            }}
          />
        ))}

        {/* Revolving Radar Sonar Scanner Sweep */}
        <div
          className="absolute w-64 h-64 rounded-full pointer-events-none opacity-40"
          style={{
            background: "conic-gradient(from 0deg, transparent 0deg, transparent 300deg, rgba(56, 189, 248, 0.3) 340deg, rgba(99, 102, 241, 0.6) 360deg)",
            animation: "radarSpin 4.5s linear infinite",
          }}
        />
      </div>

      {/* ═══ MAIN GLASS ROAD PLATFORM ═══ */}
      <div className="relative z-10 rounded-2xl lg:rounded-3xl bg-slate-950/75 border border-white/20 backdrop-blur-xl p-3.5 sm:p-4 shadow-2xl shadow-indigo-950/60 overflow-hidden">
        {/* Top Header Pill of Mini Hub */}
        <div className="flex items-center justify-between gap-2 mb-2.5 px-0.5">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-cyan-500/15 border border-cyan-400/30 text-[10px] font-bold text-cyan-300">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
            <span>Live Radar</span>
          </div>

          <div className="inline-flex items-center gap-1 text-[10px] font-semibold text-blue-200/80">
            <Radio className="w-3 h-3 text-cyan-300 animate-pulse" />
            <span>Spot Sonar Active</span>
          </div>
        </div>

        {/* ═══ MINI ROAD NETWORK & PARKING LOT (TOP-DOWN VIEW) ═══ */}
        <div className="relative w-full rounded-xl bg-slate-900/90 border border-slate-700/60 p-2 overflow-hidden shadow-inner">
          {/* Subtle Asphalt Texture */}
          <div
            className="absolute inset-0 opacity-[0.08] pointer-events-none"
            style={{
              backgroundImage: "radial-gradient(circle at 1px 1px, white 1px, transparent 0)",
              backgroundSize: "8px 8px",
            }}
          />

          {/* ── PARKING BAYS ROW (TOP) ── */}
          <div className="grid grid-cols-3 gap-2 mb-2 relative z-10 px-1">
            {/* Slot P1: Parked Silver Car */}
            <div className="h-14 rounded-lg border border-dashed border-slate-600/80 bg-slate-800/50 flex flex-col items-center justify-between p-1 relative">
              <span className="text-[8px] font-extrabold text-slate-400">P1</span>
              <div className="transform -rotate-90 origin-center scale-90">
                <MiniCar color="#94a3b8" roofColor="#64748b" headlights={false} brakeLights={false} />
              </div>
              <span className="text-[7px] font-bold text-slate-500 uppercase">Occupied</span>
            </div>

            {/* Slot P2: THE ACTIVE PARKING BAY */}
            <div
              className={`h-14 rounded-lg border-2 transition-all duration-500 flex flex-col items-center justify-between p-1 relative ${
                parkState === "parked"
                  ? "border-emerald-400 bg-emerald-950/40 shadow-sm shadow-emerald-500/30"
                  : "border-cyan-400/80 border-dashed bg-cyan-950/30"
              }`}
            >
              <div className="w-full flex items-center justify-between px-0.5">
                <span className="text-[8px] font-extrabold text-cyan-300">P2</span>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              </div>

              {/* Parked Car in P2 when state is "parked" */}
              <AnimatePresence>
                {parkState === "parked" && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.85, y: 10 }}
                    animate={{ opacity: 1, scale: 0.95, y: 0 }}
                    exit={{ opacity: 0, scale: 0.85 }}
                    transition={{ duration: 0.4 }}
                    className="transform -rotate-90 origin-center"
                  >
                    <MiniCar color="#10b981" roofColor="#047857" headlights={false} brakeLights={false} />
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Status Badge */}
              <span
                className={`text-[7px] font-black uppercase tracking-tight transition-colors ${
                  parkState === "parked" ? "text-emerald-300 font-bold" : "text-cyan-300 animate-pulse"
                }`}
              >
                {parkState === "parked" ? "✓ Parked" : "Reserved"}
              </span>
            </div>

            {/* Slot P3: Parked Navy Car */}
            <div className="h-14 rounded-lg border border-dashed border-slate-600/80 bg-slate-800/50 flex flex-col items-center justify-between p-1 relative">
              <span className="text-[8px] font-extrabold text-slate-400">P3</span>
              <div className="transform -rotate-90 origin-center scale-90">
                <MiniCar color="#6366f1" roofColor="#4338ca" headlights={false} brakeLights={false} />
              </div>
              <span className="text-[7px] font-bold text-slate-500 uppercase">Occupied</span>
            </div>
          </div>

          {/* ── TWO-WAY HORIZONTAL ROAD TRACK ── */}
          <div className="relative h-18 rounded-lg bg-slate-950 border-y-2 border-slate-700/80 overflow-hidden flex flex-col justify-between py-0.5 px-0">
            {/* Road Curbs (Top & Bottom subtle stripes) */}
            <div className="w-full h-0.5 bg-gradient-to-r from-amber-400/40 via-white/30 to-amber-400/40" />

            {/* Lane 1: Traffic Going (Left to Right) */}
            <div className="relative h-7 flex items-center overflow-hidden">
              {/* Going Car 1 (Yellow Sports Coupe) */}
              <motion.div
                className="absolute z-10"
                animate={{ x: [-50, 380] }}
                transition={{ duration: 5.5, repeat: Infinity, ease: "linear" }}
              >
                <MiniCar color="#f59e0b" roofColor="#b45309" headlights={true} />
              </motion.div>

              {/* Dynamic Parking Car Animation (Green Car) */}
              {parkState === "approaching" && (
                <motion.div
                  className="absolute z-20"
                  initial={{ x: -40 }}
                  animate={{ x: 130 }}
                  transition={{ duration: 2.8, ease: "easeOut" }}
                >
                  <MiniCar color="#10b981" roofColor="#047857" headlights={true} blinker={true} />
                </motion.div>
              )}

              {parkState === "parking" && (
                <motion.div
                  className="absolute z-20"
                  initial={{ x: 130, y: 0, rotate: 0 }}
                  animate={{ x: 136, y: -24, rotate: -90 }}
                  transition={{ duration: 1.8, ease: "easeInOut" }}
                >
                  <MiniCar color="#10b981" roofColor="#047857" headlights={true} blinker={true} />
                </motion.div>
              )}
            </div>

            {/* Center Dashed Road Divider */}
            <div className="w-full border-t border-dashed border-amber-300/60 my-auto" />

            {/* Lane 2: Traffic Coming (Right to Left) */}
            <div className="relative h-7 flex items-center overflow-hidden">
              {/* Coming Car (Cyan Sedan facing Left) */}
              <motion.div
                className="absolute z-10 transform rotate-180"
                animate={{ x: [380, -50] }}
                transition={{ duration: 6.2, repeat: Infinity, ease: "linear", delay: 1 }}
              >
                <MiniCar color="#06b6d4" roofColor="#0891b2" headlights={true} />
              </motion.div>

              {/* Departing Car leaving from P2 */}
              {parkState === "leaving" && (
                <motion.div
                  className="absolute z-20 transform rotate-180"
                  initial={{ x: 155 }}
                  animate={{ x: -50 }}
                  transition={{ duration: 2.8, ease: "easeIn" }}
                >
                  <MiniCar color="#10b981" roofColor="#047857" headlights={true} />
                </motion.div>
              )}
            </div>

            {/* Bottom Curb */}
            <div className="w-full h-0.5 bg-gradient-to-r from-amber-400/40 via-white/30 to-amber-400/40" />
          </div>
        </div>

        {/* ═══ LIVE STATUS FOOTER ═══ */}
        <div className="flex items-center justify-between gap-2 mt-2.5 px-1 text-[10px]">
          <div className="flex items-center gap-1.5 text-blue-100 font-semibold truncate">
            {parkState === "parked" ? (
              <>
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span className="truncate">Vehicle Parked in Spot #2</span>
              </>
            ) : parkState === "parking" ? (
              <>
                <Sparkles className="w-3.5 h-3.5 text-amber-300 shrink-0 animate-spin" />
                <span className="truncate">Parking Maneuver in Progress...</span>
              </>
            ) : (
              <>
                <ShieldCheck className="w-3.5 h-3.5 text-cyan-300 shrink-0" />
                <span className="truncate">Active Cars Navigating Network</span>
              </>
            )}
          </div>

          <span className="text-[9px] font-bold text-cyan-300 shrink-0 uppercase tracking-wider bg-white/10 px-2 py-0.5 rounded-full">
            Autonomous Flow
          </span>
        </div>
      </div>

      <style>{`
        @keyframes radarSpin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
