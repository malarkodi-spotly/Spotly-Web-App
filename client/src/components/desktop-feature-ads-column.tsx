import React from "react";
import { Star, CheckCircle2, HelpCircle, MessageSquare, MapPin, Building2 } from "lucide-react";

interface DesktopFeatureAdsColumnProps {
  onContactSupport?: () => void;
  className?: string;
  testId?: string;
}

export default function DesktopFeatureAdsColumn({
  onContactSupport,
  className = "",
  testId = "desktop-feature-ads-column",
}: DesktopFeatureAdsColumnProps) {
  return (
    <aside
      className={`w-[280px] shrink-0 space-y-5 hidden xl:block select-none ${className}`}
      data-testid={testId}
    >
      {/* Card 1: Why list with Spotly? */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm space-y-3.5">
        <div className="flex items-center gap-2.5">
          <div
            style={{ background: "linear-gradient(135deg, #1e3a8a 0%, #3b2fad 35%, #6d28d9 70%, #7c3aed 100%)" }}
            className="w-6 h-6 rounded-full text-white flex items-center justify-center shrink-0 shadow-xs"
          >
            <Star size={12} className="fill-white" />
          </div>
          <h3 className="text-xs font-bold text-slate-900">Why list with Spotly?</h3>
        </div>

        <div className="space-y-2.5">
          {[
            "Reach genuine parking seekers",
            "Flexible pricing & duration",
            "Safe and verified platform",
            "Earn additional income",
          ].map((text, idx) => (
            <div key={idx} className="flex items-center gap-2.5 text-xs text-slate-700">
              <CheckCircle2 size={15} className="text-emerald-500 shrink-0" />
              <span>{text}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Card 2: Need Help? */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm space-y-3">
        <div className="flex items-center gap-2.5">
          <div
            style={{ background: "linear-gradient(135deg, #1e3a8a 0%, #3b2fad 35%, #6d28d9 70%, #7c3aed 100%)" }}
            className="w-6 h-6 rounded-full text-white flex items-center justify-center shrink-0 shadow-xs"
          >
            <HelpCircle size={13} />
          </div>
          <h3 className="text-xs font-bold text-slate-900">Need Help?</h3>
        </div>

        <p className="text-xs text-slate-500 leading-relaxed">
          If you face any issues while posting, our support team is here to help.
        </p>

        <button
          type="button"
          onClick={onContactSupport}
          className="w-full py-2 px-3 rounded-xl bg-indigo-50/70 hover:bg-indigo-100 text-[#3b2fad] text-xs font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer border border-indigo-200/80 active:scale-95"
        >
          <MessageSquare size={14} />
          <span>Contact Support</span>
        </button>
      </div>

      {/* Card 3: More spaces. More convenience. */}
      <div className="bg-gradient-to-br from-indigo-50/60 via-white to-purple-50/40 rounded-2xl border border-indigo-100 p-5 shadow-sm relative overflow-hidden">
        <div className="flex items-center gap-3 mb-2">
          <div
            style={{ background: "linear-gradient(135deg, #1e3a8a 0%, #3b2fad 35%, #6d28d9 70%, #7c3aed 100%)" }}
            className="w-10 h-10 rounded-xl text-white flex items-center justify-center shrink-0 shadow-sm shadow-[#3b2fad]/20"
          >
            <MapPin size={20} />
          </div>
          <div>
            <h4 className="text-xs font-black text-[#3b2fad]">More spaces.</h4>
            <h4 className="text-xs font-black text-[#3b2fad]">More convenience.</h4>
          </div>
        </div>
        <p className="text-[11px] text-slate-500 leading-relaxed mt-2">
          Let's build a smarter parking community together!
        </p>

        <div className="mt-4 pt-4 border-t border-indigo-100/60 flex justify-center opacity-30">
          <Building2 size={32} className="text-[#3b2fad]" />
        </div>
      </div>
    </aside>
  );
}
