import { useLocation } from "wouter";
import MobileLayout from "@/components/layout/mobile-layout";
import { Lock, LogIn, Sparkles, Eye, ThumbsUp, MapPin } from "lucide-react";
import { motion } from "framer-motion";
import { exitGuestMode } from "@/lib/guest";
import { vibrate } from "@/lib/vibrate";
import { useAuthGuard } from "@/contexts/auth-guard";

export default function GuestAccountView({ role, hideLayout }: { role: "customer" | "worker"; hideLayout?: boolean }) {
  const [, setLocation] = useLocation();
  const { requireLogin } = useAuthGuard();

  const handleLogin = () => {
    vibrate();
    exitGuestMode();
    const roleParam = role === "customer" ? "space-provider" : "space-seeker";
    setLocation(`/auth?role=${roleParam}`);
  };

  const benefits = role === "customer"
    ? [
      { icon: MapPin, text: "Post your parking spaces" },
      { icon: ThumbsUp, text: "Get interested seekers" },
      { icon: Sparkles, text: "Earn monthly rent" },
    ]
    : [
      { icon: Eye, text: "View contact details" },
      { icon: ThumbsUp, text: "Show interest in spaces" },
      { icon: Sparkles, text: "Unlock Premium features" },
    ];

  const content = (
    <div className="min-h-[calc(100dvh-120px)] flex flex-col">
      <div
        className="px-6 pt-[calc(1.5rem+env(safe-area-inset-top,0px))] pb-12 relative"
        style={{ background: "linear-gradient(135deg, #1e3a8a 0%, #3b2fad 35%, #6d28d9 70%, #7c3aed 100%)" }}
      >
        <h2 className="text-xl font-bold font-heading text-white relative z-10">My Profile</h2>
        <p className="text-blue-100 text-sm relative z-10 mt-0.5">
          {role === "customer" ? "Space Provider" : "Space Seeker"}
        </p>
      </div>

      <div className="px-6 -mt-4 relative z-10 flex-1 flex flex-col items-center">
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="w-full max-w-[360px] bg-white rounded-3xl p-6 border border-slate-100 shadow-xl shadow-[#241e98]/10"
        >
          <div className="flex flex-col items-center text-center mb-5">
            <div className="w-16 h-16 rounded-2xl bg-[#241e98] border border-white/20 flex items-center justify-center mb-3 shadow-xl shadow-[#241e98]/30">
              <Lock size={28} className="text-white" />
            </div>
            <h3 className="text-[17px] font-extrabold text-neutral-900 mb-1.5">You're browsing as Guest</h3>
            <p className="text-[12.5px] text-neutral-500 leading-relaxed max-w-[260px]">
              Log in to manage your profile and unlock all features of Spotly.
            </p>
          </div>

          <div className="space-y-2.5 mb-5">
            {benefits.map((b, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 + i * 0.06 }}
                className="flex items-center gap-3 px-3.5 py-3 rounded-2xl bg-[#ECEBFF]/50 border border-[#3e3ab3]/15"
              >
                <div className="w-8 h-8 rounded-xl bg-white flex items-center justify-center shadow-xs">
                  <b.icon size={16} className="text-[#241e98]" />
                </div>
                <span className="text-[12.5px] font-bold text-slate-800">{b.text}</span>
              </motion.div>
            ))}
          </div>

          <button
            onClick={handleLogin}
            className="w-full h-13 rounded-2xl text-white font-extrabold text-[15px] uppercase tracking-wider shadow-xl shadow-[#1e3a8a]/30 active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer"
            style={{ background: "linear-gradient(135deg, #1e3a8a 0%, #3b2fad 35%, #6d28d9 70%, #7c3aed 100%)" }}
            data-testid="button-guest-login"
          >
            <LogIn size={18} />
            <span>Login / Sign Up</span>
          </button>
        </motion.div>
      </div>
    </div>
  );

  if (hideLayout) return content;

  return (
    <MobileLayout showNav userType={role}>
      {content}
    </MobileLayout>
  );
}
