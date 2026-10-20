import React, { useState } from "react";
import { motion } from "framer-motion";

interface SpotlyPreloaderProps {
  fullScreen?: boolean;
}

export default function SpotlyPreloader({
  fullScreen = true,
}: SpotlyPreloaderProps) {
  const [overlayOpacity, setOverlayOpacity] = useState(0);
  return (
    <div
      className={`${
        fullScreen ? "fixed inset-0 z-[99999] pointer-events-auto" : "w-full h-full min-h-[300px]"
      } flex flex-col items-center justify-center select-none overflow-hidden font-sans`}
      onClick={() => {
        if (typeof window !== 'undefined' && window.innerWidth >= 768) {
          setOverlayOpacity(prev => prev === 0 ? 0.15 : 0);
        }
      }}
      style={{
        background: "linear-gradient(135deg, #1e3a8a 0%, #3b2fad 35%, #6d28d9 70%, #7c3aed 100%)",
      }}
      data-testid="spotly-preloader"
    >
      {/* Ambient background glow orbs */}
      <div className="absolute top-[-10%] right-[-10%] w-[320px] h-[320px] bg-purple-500/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[320px] h-[320px] bg-indigo-600/25 rounded-full blur-3xl pointer-events-none" />

        {/* Dynamic dark overlay */}
        <div className="absolute inset-0 pointer-events-none" style={{ backgroundColor: `rgba(0,0,0,${overlayOpacity})` }}></div>
      {/* Subtle background micro-dots grid */}
      <div
        className="absolute inset-0 pointer-events-none select-none opacity-15"
        style={{
          backgroundImage: "radial-gradient(circle at 1px 1px, rgba(255, 255, 255, 0.8) 1px, transparent 0)",
          backgroundSize: "28px 28px",
        }}
      />

      {/* Center Content: Small Logo + Circle Animation only */}
      <div className="relative z-10 flex flex-col items-center justify-center gap-5">
        {/* Small Spotly Logo with subtle pulse */}
        <motion.div
          animate={{ scale: [1, 1.025, 1], opacity: [0.95, 1, 0.95] }}
          transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
        >
          <img
            src="/images/spotly-logo-white.png"
            alt="Spotly"
            className="h-8 sm:h-9 w-auto object-contain drop-shadow-[0_2px_12px_rgba(0,0,0,0.3)]"
            onError={(e) => {
              (e.target as HTMLElement).setAttribute("src", "/spotly-icon.png");
            }}
          />
        </motion.div>

        {/* Clean Circle Animation Spinner */}
        <div className="relative w-8 h-8">
          <div className="absolute inset-0 rounded-full border-[2.5px] border-white/20" />
          <motion.div
            className="absolute inset-0 rounded-full border-[2.5px] border-transparent border-t-white border-r-white/80"
            animate={{ rotate: 360 }}
            transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
          />
        </div>
      </div>
    </div>
  );
}
