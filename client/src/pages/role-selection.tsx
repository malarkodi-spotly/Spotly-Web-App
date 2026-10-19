import { useLocation } from "wouter";
import {
  Car,
  Search,
  ArrowRight,
  Check,
  Sparkles,
  TrendingUp,
  MapPin,
  Coins,
  Navigation,
} from "lucide-react";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import logo from "@assets/Logos/spotly_full-white.png";
import bgModern from "@assets/parking_bg_modern.png";
import { vibrate } from "@/lib/vibrate";

export default function RoleSelectionPage() {
  const [, setLocation] = useLocation();
  const [comingSoonMode, setComingSoonMode] = useState(false);
  const [selectedRole, setSelectedRole] = useState<"customer" | "worker" | null>(null);

  useEffect(() => {
    const checkComingSoonMode = async () => {
      try {
        const res = await fetch("/api/settings/coming_soon_mode");
        if (res.ok) {
          const data = await res.json();
          setComingSoonMode(data.setting?.value === "true");
        }
      } catch (error) {
        console.error("Failed to check Coming Soon mode:", error);
      }
    };
    checkComingSoonMode();
  }, []);

  const handleGetStarted = () => {
    if (!selectedRole) return;
    vibrate();
    localStorage.setItem("userRole", selectedRole);

    if (comingSoonMode || localStorage.getItem("exploreMode") === "true") {
      localStorage.setItem("userId", `explore_${Date.now()}`);
      localStorage.setItem("disclaimerAccepted", "true");
      if (selectedRole === "customer") {
        setLocation("/space-provider/home");
      } else {
        setLocation("/space-seeker/home");
      }
    } else {
      setLocation(`/auth?role=${selectedRole === "customer" ? "space-provider" : "space-seeker"}`);
    }
  };

  return (
    <div
      className="min-h-screen w-full text-white flex flex-col justify-between overflow-x-hidden font-sans select-none relative bg-cover bg-center"
      style={{
        backgroundImage: `url(${bgModern})`,
      }}
    >
      {/* Primary brand blue glass gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#241e98]/90 via-[#1c177c]/85 to-[#3e3ab3]/90 backdrop-blur-[2px] pointer-events-none z-0" />

      {/* Smart Parking Grid Layer */}
      <svg className="absolute inset-0 w-full h-full opacity-20 pointer-events-none z-0" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="role-grid-pattern" width="48" height="48" patternUnits="userSpaceOnUse">
            <path d="M 48 0 L 0 0 0 48" fill="none" stroke="white" strokeWidth="1" strokeDasharray="4 4" opacity="0.6" />
            <circle cx="48" cy="48" r="1.5" fill="#f59e0b" opacity="0.9" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#role-grid-pattern)" />
      </svg>

      {/* 1. TOP BLUE HEADER SECTION */}
      <div className="relative z-10 w-full text-white pt-6 pb-2 px-4 flex flex-col items-center">
        {/* Glow ambient background element */}
        <div className="absolute top-0 w-64 h-32 bg-white/10 rounded-full blur-3xl pointer-events-none" />

        {/* Spotly Logo Centered */}
        <div className="relative z-10 flex justify-center items-center">
          <a
            href="/"
            onClick={(e) => { e.preventDefault(); setLocation("/"); }}
            className="inline-flex items-center cursor-pointer transition-transform active:scale-95 relative group"
            title="Go to Landing Screen"
          >
            <img
              src={logo}
              alt="Spotly"
              className="h-10 sm:h-12 w-auto object-contain drop-shadow-md"
              data-testid="img-role-selection-logo"
            />
            <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 hidden group-hover:flex items-center px-2.5 py-1 bg-slate-900/95 backdrop-blur-md text-white text-[10px] font-bold rounded-lg shadow-xl pointer-events-none whitespace-nowrap z-50 border border-white/20">
              Go to Landing Screen
            </div>
          </a>
        </div>
      </div>

      {/* 2. MAIN THEME CONTENT AREA */}
      <main className="flex-1 w-full max-w-md mx-auto px-5 pt-4 pb-8 flex flex-col justify-center items-center z-20">
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="w-full flex flex-col items-center justify-center my-auto"
        >
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 text-white text-[10px] font-extrabold uppercase tracking-wider mb-2 border border-white/30 backdrop-blur-md">
            <Sparkles size={12} className="text-amber-300 fill-amber-300" />
            <span>Welcome to Spotly</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-black text-white text-center tracking-tight leading-tight mb-2 drop-shadow-md">
            Select Your Role
          </h1>
          <p className="text-xs sm:text-sm text-white/80 text-center mb-6 max-w-xs leading-relaxed font-medium">
            Tap a role option below to get started on Spotly
          </p>

          {/* Role Cards Grid */}
          <div className="grid grid-cols-2 gap-4 w-full mb-6">
            {/* Option 1: Space Provider */}
            <motion.button
              onClick={() => {
                vibrate();
                setSelectedRole("customer");
              }}
              whileTap={{ scale: 0.97 }}
              className={`relative rounded-3xl p-4.5 text-left transition-all duration-300 border-2 flex flex-col justify-between min-h-[200px] cursor-pointer ${
                selectedRole === "customer"
                  ? "bg-white border-amber-400 shadow-2xl ring-4 ring-amber-400/50 scale-[1.04]"
                  : "bg-white/95 hover:bg-white border-white/80 shadow-lg hover:scale-[1.01]"
              }`}
              data-testid="button-customer-role"
            >
              <div className="flex items-center justify-between">
                <div
                  className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${
                    selectedRole === "customer"
                      ? "bg-gradient-to-br from-[#241e98] to-[#3e3ab3] text-white shadow-md scale-105"
                      : "bg-gradient-to-br from-[#241e98] to-[#3e3ab3] text-white shadow-md"
                  }`}
                >
                  <Car className="w-6 h-6" />
                </div>
                {selectedRole === "customer" && (
                  <div className="w-6.5 h-6.5 rounded-full bg-gradient-to-br from-[#0d3da8] to-[#1a56db] text-white flex items-center justify-center shadow-md animate-in zoom-in-50">
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                  </div>
                )}
              </div>

              <div className="mt-4">
                <span
                  className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider mb-1.5 transition-colors ${
                    selectedRole === "customer"
                      ? "bg-[#241e98] text-white"
                      : "bg-blue-600 text-white"
                  }`}
                >
                  <TrendingUp size={10} />
                  Monetize
                </span>
                <h3 className="font-black text-base text-slate-900 leading-tight">
                  Space Provider
                </h3>
                <p className="text-xs text-slate-500 mt-1 leading-snug font-medium">
                  List vacant spots &amp; earn monthly income.
                </p>

                {/* Highlight Tag Pill */}
                <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center gap-1 text-[10px] font-bold text-emerald-700">
                  <Coins size={11} className="text-emerald-600 shrink-0" />
                  <span>Earn Monthly Rent</span>
                </div>
              </div>
            </motion.button>

            {/* Option 2: Space Seeker */}
            <motion.button
              onClick={() => {
                vibrate();
                setSelectedRole("worker");
              }}
              whileTap={{ scale: 0.97 }}
              className={`relative rounded-3xl p-4.5 text-left transition-all duration-300 border-2 flex flex-col justify-between min-h-[200px] cursor-pointer ${
                selectedRole === "worker"
                  ? "bg-white border-amber-400 shadow-2xl ring-4 ring-amber-400/50 scale-[1.04]"
                  : "bg-white/95 hover:bg-white border-white/80 shadow-lg hover:scale-[1.01]"
              }`}
              data-testid="button-worker-role"
            >
              <div className="flex items-center justify-between">
                <div
                  className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${
                    selectedRole === "worker"
                      ? "bg-gradient-to-br from-[#1d4ed8] to-[#2563eb] text-white shadow-md scale-105"
                      : "bg-gradient-to-br from-[#1d4ed8] to-[#2563eb] text-white shadow-md"
                  }`}
                >
                  <Search className="w-6 h-6" />
                </div>
                {selectedRole === "worker" && (
                  <div className="w-6.5 h-6.5 rounded-full bg-gradient-to-br from-[#241e98] to-[#3e3ab3] text-white flex items-center justify-center shadow-md animate-in zoom-in-50">
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                  </div>
                )}
              </div>

              <div className="mt-4">
                <span
                  className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider mb-1.5 transition-colors ${
                    selectedRole === "worker"
                      ? "bg-[#241e98] text-white"
                      : "bg-indigo-600 text-white"
                  }`}
                >
                  <MapPin size={10} />
                  Park &amp; Go
                </span>
                <h3 className="font-black text-base text-slate-900 leading-tight">
                  Space Seeker
                </h3>
                <p className="text-xs text-slate-500 mt-1 leading-snug font-medium">
                  Locate &amp; reserve nearby parking easily.
                </p>

                {/* Highlight Tag Pill */}
                <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center gap-1 text-[10px] font-bold text-blue-700">
                  <Navigation size={11} className="text-blue-600 shrink-0" />
                  <span>Instant Navigation</span>
                </div>
              </div>
            </motion.button>
          </div>

          {/* Action Button */}
          <div className="w-full flex flex-col items-center">
            <button
              onClick={handleGetStarted}
              disabled={!selectedRole}
              className={`w-full py-4 px-6 rounded-2xl font-black text-base shadow-xl flex items-center justify-center gap-2.5 transition-all duration-300 ${
                selectedRole
                  ? "bg-gradient-to-r from-[#241e98] via-[#2b24b1] to-[#3e3ab3] hover:from-[#1b1778] hover:to-[#2e2a97] text-white shadow-[#241e98]/30 hover:shadow-2xl cursor-pointer active:scale-95"
                  : "bg-white/20 text-white/60 cursor-not-allowed border border-white/10"
              }`}
              data-testid="button-get-started"
            >
              <span>{selectedRole ? (selectedRole === "customer" ? "Continue as Space Provider" : "Continue as Space Seeker") : "Select a Role to Proceed"}</span>
              <ArrowRight className={`w-5 h-5 transition-transform ${selectedRole ? "group-hover:translate-x-1" : ""}`} />
            </button>
            {!selectedRole && (
              <p className="text-[11px] font-semibold text-white/70 mt-2.5 text-center">
                Tap Space Provider or Space Seeker card above
              </p>
            )}
          </div>
        </motion.div>
      </main>
    </div>
  );
}
