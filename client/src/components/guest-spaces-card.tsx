import React from "react";
import { MapPin, ArrowRight, ShieldCheck, Lock } from "lucide-react";

interface GuestSpacesCardProps {
  badgeText?: string;
  title?: string;
  description?: string;
  buttonText?: string;
  onAction: () => void;
  footerText?: string;
  testIdPrefix?: string;
}

export default function GuestSpacesCard({
  badgeText = "PARKING SPACES",
  title = "Sign in to explore parking spaces",
  description = "Create a free account or sign in to discover parking options and manage your listings.",
  buttonText = "Sign in or create account",
  onAction,
  footerText = "Free to create an account · Your parking journey starts here",
  testIdPrefix = "guest-spaces",
}: GuestSpacesCardProps) {
  return (
    <div
      className="relative w-full rounded-3xl overflow-hidden py-14 px-4 sm:px-8 flex items-center justify-center border border-slate-200/80 shadow-xs min-h-[540px] bg-gradient-to-b from-slate-50 via-white to-indigo-50/25"
      style={{
        backgroundImage: "url('/guest-spaces-bg.png')",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      }}
      data-testid={`${testIdPrefix}-container`}
    >
      {/* Centered White Floating Card */}
      <div className="w-full max-w-[500px] bg-white rounded-3xl shadow-xl shadow-indigo-950/5 border border-slate-100/90 p-8 sm:p-10 flex flex-col items-center text-center relative z-10 transition-all">
        {/* Top Pill Badge */}
        <div
          className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-[#f0efff] border border-[#e2e0ff] text-[#241e98] text-[10px] font-black uppercase tracking-wider mb-5 shadow-2xs"
          data-testid={`${testIdPrefix}-badge`}
        >
          <MapPin size={11} className="text-[#241e98] fill-[#241e98]" />
          <span>{badgeText}</span>
        </div>

        {/* Vector Icon Badge Only (Lock + Parking Pin) */}
        <div className="relative mb-5 flex items-center justify-center">
          {/* Ambient Glow */}
          <div className="absolute w-24 h-24 bg-gradient-to-tr from-[#241e98]/20 to-purple-500/20 rounded-full blur-xl pointer-events-none" />

          {/* Main Icon Badge */}
          <div className="relative w-20 h-20 rounded-3xl bg-gradient-to-br from-indigo-50/90 via-white to-purple-50/80 border border-indigo-100/90 flex items-center justify-center shadow-lg shadow-indigo-950/5">
            <div
              style={{
                background: "linear-gradient(135deg, #1e3a8a 0%, #3b2fad 35%, #6d28d9 70%, #7c3aed 100%)",
              }}
              className="w-13 h-13 rounded-2xl text-white flex items-center justify-center shadow-md shadow-[#241e98]/30"
            >
              <Lock size={24} className="stroke-[2.5]" />
            </div>

            {/* Floating parking pin badge on bottom-right */}
            <div className="absolute -bottom-1.5 -right-1.5 w-8 h-8 rounded-xl bg-white border border-indigo-100 shadow-md flex items-center justify-center text-[#3b2fad]">
              <MapPin size={16} className="fill-[#3b2fad] text-[#3b2fad]" />
            </div>
          </div>
        </div>

        {/* Main Title */}
        <h2
          className="text-2xl sm:text-[26px] font-black text-slate-900 tracking-tight leading-snug mb-2.5"
          data-testid={`${testIdPrefix}-title`}
        >
          {title}
        </h2>

        {/* Subtitle / Description */}
        <p
          className="text-xs sm:text-[13px] text-slate-500 max-w-[390px] leading-relaxed mb-7 font-medium"
          data-testid={`${testIdPrefix}-description`}
        >
          {description}
        </p>

        {/* Primary Action Button */}
        <button
          type="button"
          onClick={onAction}
          className="w-full max-w-xs py-3.5 px-6 rounded-full bg-gradient-to-r from-[#241e98] via-[#3b2fad] to-[#7c3aed] hover:from-[#1b1778] hover:to-[#6d28d9] text-white text-xs sm:text-[13px] font-extrabold shadow-lg shadow-[#3b2fad]/25 transition-all cursor-pointer inline-flex items-center justify-center gap-2 active:scale-95"
          data-testid={`${testIdPrefix}-btn-action`}
        >
          <ArrowRight size={15} />
          <span>{buttonText}</span>
        </button>

        {/* Bottom Divider with reassurance text */}
        <div className="w-full max-w-sm mt-8 pt-5 border-t border-slate-100 flex items-center justify-center gap-1.5 text-[11px] text-slate-400 font-semibold">
          <ShieldCheck size={13} className="text-[#3b2fad] shrink-0" />
          <span>{footerText}</span>
        </div>
      </div>
    </div>
  );
}
