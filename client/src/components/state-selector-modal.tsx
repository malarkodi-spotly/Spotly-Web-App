import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MapPin, X, Check, Navigation } from "lucide-react";
import { vibrate } from "@/lib/vibrate";
import { useRegisterModalBack } from "@/contexts/mobile-back-context";

export const BengaluruIcon = ({ active }: { active: boolean }) => (
  <svg className={`w-12 h-12 transition-colors ${active ? "text-emerald-500" : "text-slate-400"}`} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M 20 80 L 80 80 M 30 80 L 30 50 L 70 50 L 70 80 M 35 50 L 35 35 L 65 35 L 65 50" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M 42 35 Q 50 15 58 35 Z" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M 50 15 L 50 5" stroke="currentColor" strokeWidth="2.5" />
    <circle cx="50" cy="5" r="1.5" fill="currentColor" />
    <path d="M 15 80 L 15 65 L 25 65 L 25 80" stroke="currentColor" strokeWidth="2" />
    <path d="M 75 80 L 75 65 L 85 65 L 85 80" stroke="currentColor" strokeWidth="2" />
    <path d="M 40 80 L 40 60 M 50 80 L 50 60 M 60 80 L 60 60" stroke="currentColor" strokeWidth="1.5" />
  </svg>
);

export const ChennaiIcon = ({ active }: { active: boolean }) => (
  <svg className={`w-12 h-12 transition-colors ${active ? "text-emerald-500" : "text-slate-400"}`} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M 25 80 L 75 80 M 30 80 L 33 65 L 67 65 L 70 80 M 35 65 L 38 52 L 62 52 L 65 65 M 40 52 L 43 40 L 57 40 L 60 52 M 45 40 L 47 30 L 53 30 L 55 40" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M 47 30 L 50 25 L 53 30 Z" fill="currentColor" />
    <path d="M 33 80 L 33 72 L 40 72 L 40 80" stroke="currentColor" strokeWidth="1.5" />
    <path d="M 67 80 L 67 72 L 60 72 L 60 80" stroke="currentColor" strokeWidth="1.5" />
    <path d="M 46 80 L 46 70 C 46 67, 54 67, 54 70 L 54 80" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

interface StateOption {
  id: string;
  name: string;
  state?: string;
}

interface StateSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  displayCities: StateOption[];
  selectedCity?: string;
  userCity?: string;
  activeState?: string;
  onSelectCity: (cityId: string) => void;
  subtitle?: string;
}

export default function StateSelectorModal({
  isOpen,
  onClose,
  displayCities,
  selectedCity,
  userCity = "",
  activeState = "",
  onSelectCity,
  subtitle = "Choose a state where you'd like to explore active spots",
}: StateSelectorModalProps) {
  useRegisterModalBack(isOpen, onClose, "state-selector-modal");

  if (!isOpen) return null;

  const gpsDetectedCity = typeof window !== "undefined" ? localStorage.getItem("gpsDetectedCity") || "" : "";

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-slate-950/65 flex items-center justify-center p-4 sm:p-6 select-none"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 10 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 10 }}
          transition={{ type: "spring", stiffness: 350, damping: 25 }}
          className="bg-white rounded-[32px] p-6 sm:p-7 shadow-2xl max-w-sm w-full font-sans relative overflow-hidden border border-slate-100/80"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Subtle Top Glow Background Accent */}
          <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-72 h-72 bg-gradient-to-br from-blue-500/10 via-indigo-500/10 to-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

          {/* Close Button */}
          <button
            onClick={() => {
              vibrate();
              onClose();
            }}
            className="absolute top-4 right-4 p-2 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors z-20 cursor-pointer"
            aria-label="Close modal"
            data-testid="button-close-state-modal"
          >
            <X size={18} />
          </button>

          {/* Header Section */}
          <div className="flex flex-col items-center text-center relative z-10 mb-5">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#241e98]/15 via-[#312aa8]/10 to-[#3e3ab3]/10 border border-[#241e98]/20 flex items-center justify-center mb-3 shadow-xs">
              <MapPin size={26} className="text-[#241e98]" />
            </div>
            <h3 className="text-xl font-black text-slate-900 tracking-tight font-heading">
              Select Your State
            </h3>
            <p className="text-xs text-slate-500 font-medium mt-1 leading-relaxed px-2">
              {subtitle}
            </p>
          </div>

          {/* State Options Cards Grid */}
          {displayCities.length === 0 ? (
            <div className="py-8 text-center text-sm text-slate-500 font-medium">
              No active states available at this time.
            </div>
          ) : (
            <div className={`relative z-10 ${displayCities.length === 1 ? "flex justify-center max-w-[200px] mx-auto" : "grid grid-cols-2 gap-3.5"}`}>
              {displayCities.map((city) => {
                const isBlr = city.name.toLowerCase().includes("bengaluru") ||
                  city.name.toLowerCase().includes("bangalore") ||
                  (!!city.state && city.state.toLowerCase().includes("karnataka"));
                const isChn = city.name.toLowerCase().includes("chennai") ||
                  (!!city.state && city.state.toLowerCase().includes("tamil"));
                const stateName = city.state || (isBlr ? "Karnataka" : isChn ? "Tamil Nadu" : city.name);

                let isActive = false;
                if (activeState) {
                  isActive = stateName.toLowerCase() === activeState.toLowerCase();
                } else if (selectedCity) {
                  isActive =
                    selectedCity === city.id ||
                    (selectedCity === "bengaluru-id-fallback" && isBlr) ||
                    (selectedCity === "chennai-id-fallback" && isChn);
                } else {
                  isActive =
                    (userCity.toLowerCase().includes("bengaluru") && isBlr) ||
                    (userCity.toLowerCase().includes("bangalore") && isBlr) ||
                    (userCity.toLowerCase().includes("chennai") && isChn);
                }

                const isPhysicalCity =
                  gpsDetectedCity &&
                  ((isBlr && (gpsDetectedCity.toLowerCase().includes("bengaluru") || gpsDetectedCity.toLowerCase().includes("bangalore"))) ||
                    (isChn && gpsDetectedCity.toLowerCase().includes("chennai")));

                return (
                  <button
                    key={city.id}
                    onClick={() => {
                      vibrate();
                      onSelectCity(city.id);
                      onClose();
                    }}
                    className={`relative flex flex-col items-center justify-center p-4 pt-5 pb-4 rounded-2xl border-2 transition-all active:scale-[0.97] cursor-pointer group ${
                      displayCities.length === 1 ? "w-full" : ""
                    } ${
                      isActive
                        ? "border-emerald-500 bg-gradient-to-b from-emerald-50/80 via-emerald-50/20 to-white shadow-lg shadow-emerald-500/10 scale-[1.02]"
                        : "border-slate-200/90 bg-slate-50/40 hover:bg-slate-100/70 hover:border-blue-400/50 hover:shadow-md"
                    }`}
                    data-testid={`city-select-${city.id}`}
                  >
                    {/* YOU ARE HERE Badge */}
                    {isPhysicalCity && (
                      <span
                        className={`absolute -top-3 left-1/2 -translate-x-1/2 px-2.5 py-0.5 text-white text-[9px] font-black uppercase tracking-wider rounded-full shadow-md whitespace-nowrap z-20 flex items-center gap-1 ${
                          isActive
                            ? "bg-gradient-to-r from-emerald-600 to-teal-600"
                            : "bg-slate-700"
                        }`}
                      >
                        <Navigation size={9} className="fill-white" />
                        <span>You are here</span>
                      </span>
                    )}

                    {/* Active Indicator Checkmark */}
                    {isActive && (
                      <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-xs">
                        <Check size={12} strokeWidth={3} />
                      </div>
                    )}

                    {/* Icon */}
                    <div className="mb-2.5 transition-transform group-hover:scale-105">
                      {isBlr ? (
                        <BengaluruIcon active={isActive} />
                      ) : isChn ? (
                        <ChennaiIcon active={isActive} />
                      ) : (
                        <MapPin className={`w-12 h-12 transition-colors ${isActive ? "text-emerald-500" : "text-slate-400"}`} />
                      )}
                    </div>

                    {/* State Name */}
                    <div className="flex items-center gap-1.5 justify-center">
                      {isActive && (
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      )}
                      <span className={`text-xs sm:text-sm font-extrabold ${isActive ? "text-slate-900" : "text-slate-700"}`}>
                        {stateName}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
