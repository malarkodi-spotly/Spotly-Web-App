import { createContext, useContext, useState, useCallback, ReactNode } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { Lock, X } from "lucide-react";
import { isGuest, exitGuestMode } from "@/lib/guest";
import { vibrate } from "@/lib/vibrate";

type AuthGuardContextType = {
  requireLogin: (actionLabel?: string) => boolean;
};

const AuthGuardContext = createContext<AuthGuardContextType | null>(null);

export function AuthGuardProvider({ children }: { children: ReactNode }) {
  const [, setLocation] = useLocation();
  const [open, setOpen] = useState(false);
  const [actionLabel, setActionLabel] = useState<string>("");

  const requireLogin = useCallback((label?: string) => {
    const userId = localStorage.getItem("userId");
    const hasRealUserId = userId && !userId.startsWith("explore_");
    // If user has a real userId, they are logged in — allow through
    if (hasRealUserId) return true;
    // Otherwise, show login popup for guests / explore-only users
    if (isGuest() || !userId || localStorage.getItem("exploreMode") === "true") {
      setActionLabel(label || "");
      setOpen(true);
      return false;
    }
    return true;
  }, []);

  const handleLogin = () => {
    vibrate();
    const savedRole = localStorage.getItem("userRole");
    const roleParam = savedRole === "worker" || savedRole === "space-seeker" ? "space-seeker" : "space-provider";
    exitGuestMode();
    setOpen(false);
    setLocation(`/auth?role=${roleParam}`);
  };

  return (
    <AuthGuardContext.Provider value={{ requireLogin }}>
      {children}
      <AnimatePresence>
        {open && (
          <motion.div
            className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setOpen(false)}
            data-testid="dialog-login-required"
          >
            <motion.div
              className="w-full max-w-[340px] rounded-3xl overflow-hidden shadow-2xl bg-white relative font-sans"
              initial={{ scale: 0.85, y: 20, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: "spring", stiffness: 320, damping: 26 }}
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setOpen(false)}
                className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 backdrop-blur-md flex items-center justify-center text-white z-10 cursor-pointer border border-white/20"
                data-testid="button-close-login-required"
                aria-label="Close"
              >
                <X size={16} />
              </button>
              <div className="bg-gradient-to-br from-[#1b1675] via-[#241e98] to-[#3e3ab3] px-6 pt-7 pb-5 text-center relative overflow-hidden">
                {/* Decorative background shapes */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-[#3e3ab3]/40 rounded-full blur-2xl -translate-y-6 translate-x-6" />
                <div className="absolute bottom-0 left-0 w-24 h-24 bg-amber-400/20 rounded-full blur-xl translate-y-4 -translate-x-4" />

                <div className="relative z-10">
                  <div className="w-16 h-16 mx-auto mb-3 rounded-2xl bg-[#241e98] border border-white/25 flex items-center justify-center shadow-xl shadow-indigo-950/60">
                    <Lock size={28} className="text-white" />
                  </div>
                  <h3 className="text-white text-xl font-black mb-1 font-heading tracking-tight">Login Required</h3>
                  <p className="text-white/90 text-xs font-medium leading-relaxed">
                    {actionLabel
                      ? `Please log in to ${actionLabel}.`
                      : "Please log in to continue using this feature."}
                  </p>
                </div>
              </div>
              <div className="px-6 pt-5 pb-6 bg-white">
                <p className="text-xs text-slate-600 text-center font-medium leading-relaxed mb-5">
                  You're browsing as a guest. Create an account or log in to unlock all features.
                </p>
                <button
                  onClick={handleLogin}
                  className="w-full h-13 rounded-2xl bg-gradient-to-r from-[#241e98] via-[#2b24b1] to-[#3e3ab3] hover:from-[#1b1778] hover:to-[#2e2a97] text-white font-black text-sm uppercase tracking-wider shadow-xl shadow-[#241e98]/30 active:scale-[0.98] transition-all cursor-pointer flex items-center justify-center gap-2"
                  data-testid="button-login-now"
                >
                  <span>Login Now</span>
                </button>
                <button
                  onClick={() => setOpen(false)}
                  className="w-full h-11 mt-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs active:scale-[0.98] transition-all cursor-pointer"
                  data-testid="button-continue-browsing"
                >
                  Continue Browsing
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </AuthGuardContext.Provider>
  );
}

export function useAuthGuard() {
  const ctx = useContext(AuthGuardContext);
  if (!ctx) throw new Error("useAuthGuard must be used within AuthGuardProvider");
  return ctx;
}
