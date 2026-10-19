import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { getApiUrl } from "@/lib/api-config";

/**
 * Global Under Construction Guard
 * Fetches the under_construction_mode setting and shows a blocking overlay
 * on ALL pages except admin routes. This ensures no user can bypass the
 * maintenance screen regardless of which route they navigate to.
 */
export function UnderConstructionGuard({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const [underConstructionMode, setUnderConstructionMode] = useState(false);
  const [loaded, setLoaded] = useState(false);

  // Skip guard entirely for admin routes
  const isAdminRoute = location.startsWith("/admin");

  useEffect(() => {
    if (isAdminRoute) {
      setLoaded(true);
      return;
    }

    let cancelled = false;
    const fetchStatus = async () => {
      try {
        const res = await fetch(getApiUrl("/api/settings/under_construction_mode"));
        if (!cancelled && res.ok) {
          const data = await res.json();
          setUnderConstructionMode(data.setting?.value === "true");
        }
      } catch {
        // If fetch fails, don't block users — default to allowing access
      } finally {
        if (!cancelled) setLoaded(true);
      }
    };

    fetchStatus();

    // Poll every 30 seconds so the overlay disappears promptly when admin disables it
    const interval = setInterval(fetchStatus, 30000);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [isAdminRoute]);

  // Don't block admin pages
  if (isAdminRoute) return <>{children}</>;

  // Show overlay when under construction is active
  const showOverlay = loaded && underConstructionMode;

  return (
    <>
      {children}
      <AnimatePresence>
        {showOverlay && (
          <motion.div
            key="under-construction-backdrop-global"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.35 }}
            className="fixed inset-0 z-[9999] flex items-center justify-center px-4"
            style={{ background: "rgba(30,15,0,0.82)", backdropFilter: "blur(8px)" }}
          >
            <motion.div
              key="under-construction-card-global"
              initial={{ opacity: 0, scale: 0.82, y: 28 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.88, y: 16 }}
              transition={{ type: "spring", stiffness: 280, damping: 24 }}
              className="relative w-full max-w-lg bg-white rounded-[2rem] shadow-2xl overflow-hidden"
            >
              {/* ── Top hero band ── */}
              <div className="bg-gradient-to-br from-amber-600 via-orange-500 to-yellow-500 px-8 pt-8 pb-12 text-center relative overflow-hidden">
                {/* Decorative rings */}
                <div className="absolute -top-6 -right-6 w-32 h-32 border border-white/10 rounded-full" />
                <div className="absolute -top-2 -right-2 w-20 h-20 border border-white/15 rounded-full" />
                <div className="absolute bottom-4 left-4 w-3 h-3 bg-white/60 rounded-full animate-pulse" />
                <div className="absolute top-5 left-10 w-2 h-2 bg-yellow-200/80 rounded-full animate-pulse" style={{ animationDelay: "0.5s" }} />

                {/* Wrench badge */}
                <motion.div
                  initial={{ scale: 0, rotate: -15 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: "spring", stiffness: 300, damping: 18, delay: 0.15 }}
                  className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4 mx-auto relative"
                  style={{ background: "rgba(255,255,255,0.22)", backdropFilter: "blur(8px)", border: "1.5px solid rgba(255,255,255,0.35)" }}
                >
                  <svg className="w-9 h-9 text-white drop-shadow-lg" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M11.42 15.17L17.25 21A2.652 2.652 0 0021 17.25l-5.877-5.877M11.42 15.17l2.496-3.03c.317-.384.74-.626 1.208-.766M11.42 15.17l-4.655 5.653a2.548 2.548 0 11-3.586-3.586l6.837-5.63m5.108-.233c.55-.164 1.163-.188 1.743-.14a4.5 4.5 0 004.486-6.336l-3.276 3.277a3.004 3.004 0 01-2.25-2.25l3.276-3.276a4.5 4.5 0 00-6.336 4.486c.091 1.076-.071 2.264-.904 2.95l-.102.085m-1.745 1.437L5.909 7.5H4.5L2.25 3.75l1.5-1.5L7.5 4.5v1.409l4.26 4.26m-1.745 1.437l1.745-1.437m6.615 8.206L15.75 15.75M4.867 19.125h.008v.008h-.008v-.008z" />
                  </svg>
                  <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-[9px] font-black text-white">!</span>
                </motion.div>

                {/* Status pill */}
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.22 }}
                  className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-3"
                  style={{ background: "rgba(255,255,255,0.22)", border: "1px solid rgba(255,255,255,0.35)" }}
                >
                  <span className="w-2 h-2 rounded-full bg-red-300 animate-pulse" />
                  <span className="text-white/95 text-[11px] font-bold tracking-widest uppercase">Under Construction</span>
                </motion.div>

                {/* Headline */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.28 }}
                >
                  <h2 className="text-white text-2xl font-extrabold leading-tight mb-1">
                    🚧 We're Working on It!
                  </h2>
                  <p className="text-yellow-100 text-sm font-medium">
                    Scheduled Maintenance in Progress
                  </p>
                </motion.div>
              </div>

              {/* ── Body ── */}
              <div className="px-7 -mt-6 pb-6">
                {/* Main message card */}
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.35 }}
                  className="bg-white rounded-2xl shadow-xl shadow-amber-100/70 border border-amber-100 px-5 pt-4 pb-4 mt-5 mb-4"
                >
                  <p className="text-gray-800 font-bold text-sm text-center mb-1">
                    Spotly is temporarily unavailable 🔧
                  </p>
                  <p className="text-gray-500 text-xs leading-relaxed text-center">
                    Our team is making important improvements to give you a better experience. We'll be back up very shortly!
                  </p>

                  {/* Status chips */}
                  <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-gray-100">
                    {[
                      { icon: "🔧", label: "Maintenance",   color: "bg-orange-50 text-orange-700 border-orange-200" },
                      { icon: "⚙️", label: "Upgrading",     color: "bg-amber-50 text-amber-700 border-amber-200" },
                      { icon: "🛡️", label: "Securing",      color: "bg-yellow-50 text-yellow-700 border-yellow-200" },
                      { icon: "🚀", label: "Optimising",    color: "bg-blue-50 text-blue-700 border-blue-200" },
                      { icon: "✅", label: "Almost Done",   color: "bg-green-50 text-green-700 border-green-200" },
                      { icon: "🔔", label: "Back Soon",     color: "bg-pink-50 text-pink-700 border-pink-200" },
                    ].map(({ icon, label, color }) => (
                      <span key={label} className={`flex items-center justify-center gap-1 px-2 py-1.5 rounded-xl text-[11px] font-semibold border text-center ${color}`}>
                        {icon} {label}
                      </span>
                    ))}
                  </div>
                </motion.div>

                {/* Stay tuned strip */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.45 }}
                  className="flex items-center gap-3 bg-gradient-to-r from-amber-50 to-orange-50 rounded-2xl px-4 py-3 border border-amber-100"
                >
                  <div className="w-9 h-9 shrink-0 bg-amber-600 rounded-xl flex items-center justify-center shadow-md">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" /></svg>
                  </div>
                  <div>
                    <p className="text-gray-800 text-xs font-bold">Please Bear With Us!</p>
                    <p className="text-gray-500 text-[11px]">We'll be back online very soon. Thank you! 🙏</p>
                  </div>
                </motion.div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
