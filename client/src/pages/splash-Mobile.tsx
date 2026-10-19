import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import customLogo from "@assets/spotly_white_logo.png";
import logoImg from "@assets/spotly_white_logo.png";
import splashLogo from "@assets/spotly_white_logo.png";

// ==============================================================================
// ACTIVE DEFAULT SPLASH SCREEN (VARIANT 1: CLEAN LOGO SNOBBIT SCALING ZOOM)
// ==============================================================================
export default function SplashPage() {
  const [, setLocation] = useLocation();
  // Animation state phases:
  // "initial": logo starts extra small in center
  // "grow": logo scales smoothly from small to normal size
  // "scale": logo scales up massively to fill the viewport (Snobbit zoom reveal)
  const [phase, setPhase] = useState<"initial" | "grow" | "scale">("initial");

  useEffect(() => {
    // Stage 1: Fast scale up from small to normal size (at 50ms)
    const t1 = setTimeout(() => {
      setPhase("grow");
    }, 50);

    // Stage 2: Fast Snobbit scaling animation - zoom to screen-filling (at 450ms)
    const t2 = setTimeout(() => {
      setPhase("scale");
    }, 450);

    // Stage 3: Navigate to target page (at 850ms)
    const navTimer = setTimeout(() => {
      const userId = localStorage.getItem("userId");
      const userRole = localStorage.getItem("userRole");
      if (userId && userRole) {
        if (userRole === "customer") setLocation("/space-provider/home");
        else if (userRole === "worker") setLocation("/space-seeker/home");
        else setLocation("/location-setup");
      } else {
        setLocation("/location-setup");
      }
    }, 850);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(navTimer);
    };
  }, [setLocation]);

  return (
    <div className="fixed inset-0 w-full h-full min-h-[100dvh] overflow-hidden flex items-center justify-center bg-[#241e98] select-none z-[9999] pt-[env(safe-area-inset-top,0px)] pb-[env(safe-area-inset-bottom,0px)]">
      {/* Primary Blue Background */}
      <div className="absolute inset-0 bg-[#241e98] z-0 pointer-events-none" />

      {/* Centered Clean Spotly Logo with Fast Scaling Animation */}
      <motion.div
        className="relative z-10 flex items-center justify-center pointer-events-none transform-gpu"
        initial={{ scale: 0.02, opacity: 0 }}
        animate={
          phase === "initial"
            ? { scale: 0.02, opacity: 0 }
            : phase === "grow"
              ? { scale: 0.65, opacity: 1 }
              : { scale: 38, opacity: 0 }
        }
        transition={
          phase === "scale"
            ? { duration: 0.38, ease: [0.85, 0, 0.15, 1] } // Fast explosive zoom curve
            : { type: "spring", stiffness: 280, damping: 18 } // Fast spring grow
        }
      >
        <img
          src={customLogo}
          onError={(e) => {
            (e.target as HTMLElement).setAttribute("src", logoImg);
          }}
          alt="Spotly Logo"
          className="h-16 sm:h-20 md:h-24 w-auto max-w-[80vw] object-contain"
        />
      </motion.div>

      {/* Fast Background Dissolve Layer on Zoom Reveal */}
      <AnimatePresence>
        {phase === "scale" && (
          <motion.div
            initial={{ opacity: 1 }}
            animate={{ opacity: 0 }}
            transition={{ duration: 0.35, ease: "easeOut", delay: 0.05 }}
            className="absolute inset-0 bg-gradient-to-br from-[#241e98] via-[#1c177c] to-[#3e3ab3] z-0 pointer-events-none"
          />
        )}
      </AnimatePresence>
    </div>
  );
}

/* ==============================================================================
   LEGACY VARIANT 2: CARD BADGE + UNFOLDING BRAND TEXT & PULSE RINGS SPLASH UI
   (Uncomment to activate if requested)
   ==============================================================================

export function SplashPageVariant2CardBadge() {
  const [, setLocation] = useLocation();
  const [phase, setPhase] = useState<"pop" | "reveal" | "scale" | "fade">("pop");

  useEffect(() => {
    const t1 = setTimeout(() => setPhase("reveal"), 400);
    const t2 = setTimeout(() => setPhase("scale"), 1000);
    const t3 = setTimeout(() => setPhase("fade"), 1550);
    const navTimer = setTimeout(() => {
      const userId = localStorage.getItem("userId");
      const userRole = localStorage.getItem("userRole");
      if (userId && userRole) {
        if (userRole === "customer") setLocation("/space-provider/home");
        else if (userRole === "worker") setLocation("/space-seeker/home");
        else setLocation("/location-setup");
      } else {
        setLocation("/location-setup");
      }
    }, 1850);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(navTimer);
    };
  }, [setLocation]);

  return (
    <div className="fixed inset-0 w-full h-full min-h-[100dvh] overflow-hidden flex flex-col justify-center items-center bg-gradient-to-br from-[#241e98] via-[#1c177c] to-[#3e3ab3] select-none font-sans z-[9999] pt-[env(safe-area-inset-top,0px)] pb-[env(safe-area-inset-bottom,0px)]">
      <div
        className="absolute inset-0 opacity-[0.18] pointer-events-none z-0"
        style={{
          backgroundImage: `
            linear-gradient(to right, rgba(255, 255, 255, 0.25) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(255, 255, 255, 0.25) 1px, transparent 1px)
          `,
          backgroundSize: "32px 32px",
        }}
      />
      <div className="absolute -top-40 -left-40 w-[30rem] h-[30rem] rounded-full blur-[120px] pointer-events-none bg-blue-500/30 z-0" />
      <div className="absolute -bottom-40 -right-40 w-[30rem] h-[30rem] rounded-full blur-[120px] pointer-events-none bg-cyan-400/25 z-0" />

      <motion.div
        className="relative z-10 flex flex-col items-center justify-center pointer-events-none"
        animate={
          phase === "scale" || phase === "fade"
            ? { scale: 45, opacity: phase === "fade" ? 0 : 0.95 }
            : { scale: 1, opacity: 1 }
        }
        transition={{ duration: 0.65, ease: [0.7, 0, 0.15, 1] }}
      >
        <AnimatePresence>
          {phase === "reveal" && (
            <>
              <motion.div
                initial={{ scale: 0.8, opacity: 0.8 }}
                animate={{ scale: 1.8, opacity: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.8, repeat: Infinity, ease: "easeOut" }}
                className="absolute w-28 h-28 rounded-full border-2 border-white/40 pointer-events-none z-0"
              />
              <motion.div
                initial={{ scale: 0.8, opacity: 0.6 }}
                animate={{ scale: 2.4, opacity: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.8, delay: 0.2, repeat: Infinity, ease: "easeOut" }}
                className="absolute w-28 h-28 rounded-full border border-cyan-300/30 pointer-events-none z-0"
              />
            </>
          )}
        </AnimatePresence>

        <motion.div
          initial={{ scale: 0.15, opacity: 0, rotate: -10 }}
          animate={{ scale: 1, opacity: 1, rotate: 0 }}
          transition={{ type: "spring", stiffness: 240, damping: 18 }}
          className="relative z-20 flex items-center justify-center"
        >
          <div className="w-24 h-24 sm:w-28 sm:h-28 bg-white/95 backdrop-blur-md rounded-[28px] shadow-[0_20px_60px_rgba(0,0,0,0.35)] flex items-center justify-center p-3 border border-white/40 transform-gpu">
            <img src={splashLogo} alt="Spotly Logo" className="w-full h-full object-contain drop-shadow-md" />
          </div>
        </motion.div>

        <div className="mt-5 overflow-hidden h-12 flex items-center z-10">
          <motion.div
            initial={{ y: 30, opacity: 0 }}
            animate={phase === "pop" ? { y: 30, opacity: 0 } : { y: 0, opacity: 1 }}
            transition={{ duration: 0.35, ease: "easeOut" }}
            className="flex items-center gap-1.5"
          >
            <span className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight font-heading drop-shadow-lg">
              Spotly
            </span>
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse mt-2" />
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}
*/

/* ==============================================================================
   LEGACY VARIANT 3: CARS24-STYLE BOTTOM-UP CURVED WAVE WIPE SPLASH UI
   (Uncomment to activate if requested)
   ==============================================================================

export function SplashPageVariant3Cars24Wipe() {
  const [, setLocation] = useLocation();
  const [phase, setPhase] = useState<"badge" | "reveal" | "wipe">("badge");

  useEffect(() => {
    const t1 = setTimeout(() => setPhase("reveal"), 450);
    const t2 = setTimeout(() => setPhase("wipe"), 1350);
    const navTimer = setTimeout(() => {
      const userId = localStorage.getItem("userId");
      const userRole = localStorage.getItem("userRole");
      if (userId && userRole) {
        if (userRole === "customer") setLocation("/space-provider/home");
        else if (userRole === "worker") setLocation("/space-seeker/home");
        else setLocation("/location-setup");
      } else {
        setLocation("/location-setup");
      }
    }, 1850);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(navTimer);
    };
  }, [setLocation]);

  return (
    <div className="fixed inset-0 w-full h-full min-h-[100dvh] overflow-hidden flex flex-col justify-center items-center bg-gradient-to-br from-[#241e98] via-[#1c177c] to-[#3e3ab3] select-none font-sans z-[9999] pt-[env(safe-area-inset-top,0px)] pb-[env(safe-area-inset-bottom,0px)]">
      <div
        className="absolute inset-0 opacity-[0.22] pointer-events-none z-0"
        style={{
          backgroundImage: `
            linear-gradient(to right, rgba(255, 255, 255, 0.25) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(255, 255, 255, 0.25) 1px, transparent 1px)
          `,
          backgroundSize: "28px 28px",
        }}
      />
      <div className="relative z-10 flex items-center justify-center">
        <motion.div
          initial={{ scale: 0.2, rotate: -20, opacity: 0 }}
          animate={phase === "badge" ? { scale: 1, rotate: -16, opacity: 1 } : { scale: 1, rotate: 0, x: -6, opacity: 1 }}
          transition={{ type: "spring", stiffness: 140, damping: 14, duration: 0.45 }}
          className="w-16 h-16 sm:w-20 sm:h-20 bg-white rounded-[22px] shadow-2xl flex items-center justify-center shrink-0 z-20"
        >
          <svg viewBox="0 0 100 100" className="w-10 h-10 sm:w-12 sm:h-12 drop-shadow-xs">
            <path d="M50 8 C30 8 15 23 15 43 C15 67 50 92 50 92 C50 92 85 67 85 43 C85 23 70 8 50 8 Z" fill="#0d3da8" />
            <text x="50" y="45" textAnchor="middle" dominantBaseline="middle" fill="#ffffff" fontSize="38" fontWeight="900">S</text>
          </svg>
        </motion.div>
        <div className="overflow-hidden h-16 sm:h-20 flex items-center ml-2 z-10">
          <motion.div
            initial={{ x: "-100%", opacity: 0 }}
            animate={phase === "badge" ? { x: "-100%", opacity: 0 } : { x: "0%", opacity: 1 }}
            transition={{ type: "spring", stiffness: 120, damping: 15, delay: 0.05 }}
            className="flex items-center"
          >
            <span className="text-3xl sm:text-4xl font-black text-white tracking-tight font-heading pl-1">Spotly</span>
          </motion.div>
        </div>
      </div>
      <AnimatePresence>
        {phase === "wipe" && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 28, opacity: 1 }}
            transition={{ duration: 0.55, ease: [0.65, 0, 0.35, 1] }}
            className="absolute bottom-[-100px] left-1/2 -translate-x-1/2 w-32 h-32 bg-white rounded-full z-30 pointer-events-none"
          />
        )}
      </AnimatePresence>
    </div>
  );
}
*/




