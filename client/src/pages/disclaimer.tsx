import { useState, useRef, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { FileText, ArrowDown, ShieldCheck, ArrowRight, Sparkles, HeartHandshake, Lock } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { vibrate } from "@/lib/vibrate";
import TermsContent from "@/components/terms-content";
import { getApiUrl } from "@/lib/api-config";
import spotlyLogo from "@assets/Logos/spotly_full-white.png";

export default function DisclaimerPage() {
  const [, setLocation] = useLocation();
  const [isAccepted, setIsAccepted] = useState(false);
  const [showScrollBottomBtn, setShowScrollBottomBtn] = useState(true);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  // Desktop scroll ref
  const desktopScrollRef = useRef<HTMLDivElement>(null);
  const [desktopShowScrollBtn, setDesktopShowScrollBtn] = useState(true);

  const role = localStorage.getItem("userRole") as "customer" | "worker" || "customer";

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const target = e.currentTarget;
    const isAtBottom = target.scrollHeight - target.scrollTop <= target.clientHeight + 60;
    setShowScrollBottomBtn((prev) => (prev !== !isAtBottom ? !isAtBottom : prev));
  };

  const handleDesktopScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const target = e.currentTarget;
    const isAtBottom = target.scrollHeight - target.scrollTop <= target.clientHeight + 60;
    setDesktopShowScrollBtn((prev) => (prev !== !isAtBottom ? !isAtBottom : prev));
  };

  const scrollToBottom = () => {
    vibrate();
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({
        top: scrollContainerRef.current.scrollHeight,
        behavior: "smooth"
      });
    }
  };

  const scrollDesktopToBottom = () => {
    vibrate();
    if (desktopScrollRef.current) {
      desktopScrollRef.current.scrollTo({
        top: desktopScrollRef.current.scrollHeight,
        behavior: "smooth"
      });
    }
  };

  useEffect(() => {
    const isNew = localStorage.getItem("isNewRegistration") === "true";
    const disclaimerAccepted = localStorage.getItem("disclaimerAccepted") === "true";
    if (!isNew && disclaimerAccepted) {
      const userRole = localStorage.getItem("userRole");
      setLocation(userRole === "worker" ? "/space-seeker/home" : "/space-provider/home");
      return;
    }

    const checkScroll = () => {
      if (scrollContainerRef.current) {
        const target = scrollContainerRef.current;
        const isAtBottom = target.scrollHeight - target.scrollTop <= target.clientHeight + 60;
        setShowScrollBottomBtn((prev) => (prev !== !isAtBottom ? !isAtBottom : prev));
      }
      if (desktopScrollRef.current) {
        const target = desktopScrollRef.current;
        const isAtBottom = target.scrollHeight - target.scrollTop <= target.clientHeight + 60;
        setDesktopShowScrollBtn((prev) => (prev !== !isAtBottom ? !isAtBottom : prev));
      }
    };
    const timer = setTimeout(checkScroll, 300);
    window.addEventListener("resize", checkScroll);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("resize", checkScroll);
    };
  }, [setLocation]);

  const handleProceed = async () => {
    if (!isAccepted) return;
    vibrate();
    
    const userId = localStorage.getItem("userId");
    const userMobile = localStorage.getItem("userMobile");

    try {
      await fetch(getApiUrl("/api/auth/accept-disclaimer"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, mobile: userMobile, role }),
      });
    } catch (e) {
      console.error("Failed to accept disclaimer on backend:", e);
    }
    
    localStorage.setItem("disclaimerAccepted", "true");
    localStorage.removeItem("isNewRegistration");
    
    // Navigate to location setup page based on role
    if (role === "worker") {
      setLocation("/space-seeker/home");
    } else {
      setLocation("/space-provider/home");
    }
  };

  return (
    <>
      {/* ===================== DESKTOP LAYOUT (>= 768px) ===================== */}
      <div className="hidden md:flex fixed inset-0 w-full h-full overflow-hidden" data-testid="disclaimer-desktop">
        {/* Left Branding Panel: Exactly 50% width, Rich Modern Glassmorphic UX, Non-scrollable */}
        <div
          className="relative w-1/2 min-w-0 h-full overflow-hidden flex flex-col justify-between p-6 lg:p-8 xl:p-12 text-white shadow-2xl border-r border-white/10 select-none"
          style={{ background: "linear-gradient(145deg, #0d1538 0%, #161c5c 28%, #281d7f 60%, #4a198c 88%, #581c87 100%)" }}
          data-testid="disclaimer-desktop-left-panel"
        >
          {/* Ambient Lighting Glows (strictly contained inside overflow-hidden) */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute -top-20 -left-20 w-80 h-80 rounded-full blur-[100px] bg-blue-500/20" />
            <div className="absolute top-1/2 -right-20 -translate-y-1/2 w-80 h-80 rounded-full blur-[100px] bg-purple-500/25" />
            <div className="absolute -bottom-20 -left-12 w-72 h-72 rounded-full blur-[90px] bg-indigo-500/20" />

            {/* Dot Matrix Pattern Overlay */}
            <div 
              className="absolute inset-0 opacity-[0.06]" 
              style={{
                backgroundImage: "radial-gradient(circle at 1px 1px, white 1px, transparent 0)",
                backgroundSize: "24px 24px"
              }} 
            />
          </div>

          {/* TOP SECTION: BRAND & DYNAMIC ROLE BADGE */}
          <div className="relative z-10 shrink-0 space-y-4">
            <div className="flex items-center justify-between">
              <a
                href="/"
                onClick={(e) => { e.preventDefault(); setLocation("/"); }}
                className="flex items-center cursor-pointer transition-transform hover:opacity-90 active:scale-95"
                title="Go to Home"
              >
                <img
                  src={spotlyLogo}
                  alt="Spotly"
                  className="h-8 lg:h-9 w-auto object-contain drop-shadow-md"
                />
              </a>

              {/* Dynamic Role Badge */}
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-xs font-semibold text-white shadow-sm">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse ring-4 ring-emerald-400/20" />
                <span>{role === "worker" ? "Space Seeker Mode" : "Space Provider Mode"}</span>
              </div>
            </div>

            {/* HERO TITLE & SUBTITLE */}
            <div className="space-y-1.5 pt-1">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/10 border border-white/15 text-[11px] font-semibold text-blue-200">
                <Sparkles className="w-3 h-3 text-blue-300" />
                <span>Smart Community Parking</span>
              </div>
              <h2 className="text-2xl lg:text-3xl xl:text-[2rem] font-black text-white tracking-tight leading-tight font-heading">
                Find Parking.{" "}
                <span className="bg-gradient-to-r from-blue-300 via-indigo-200 to-purple-200 bg-clip-text text-transparent">
                  Create Value.
                </span>
              </h2>
              <p className="text-blue-100/80 text-xs lg:text-sm leading-relaxed max-w-[500px]">
                {role === "worker"
                  ? "Connect directly with verified space providers to find hassle-free, secure, and affordable parking across India."
                  : "Turn your unused driveway, basement, or parking slot into steady passive income with trusted community members."}
              </p>
            </div>
          </div>

          {/* MIDDLE SECTION: 3 MODERN HORIZONTAL FEATURE CARDS */}
          <div className="relative z-10 my-auto py-2 space-y-3 shrink-0">
            {/* Feature 1 */}
            <div className="group rounded-2xl bg-white/[0.07] hover:bg-white/[0.12] border border-white/10 hover:border-white/20 p-3.5 lg:p-4 backdrop-blur-md transition-all duration-200 flex items-center gap-4 shadow-sm">
              <div className="w-11 h-11 rounded-xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-300 shrink-0 group-hover:scale-105 transition-transform">
                <ShieldCheck className="w-5 h-5 lg:w-6 lg:h-6" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2 mb-0.5">
                  <h4 className="text-xs lg:text-sm font-bold text-white">100% Verified Community</h4>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-400/25 shrink-0">
                    KYC Checked
                  </span>
                </div>
                <p className="text-[11px] lg:text-xs text-blue-100/70 leading-relaxed">
                  Every user and parking space is authenticated for complete peace of mind.
                </p>
              </div>
            </div>

            {/* Feature 2 */}
            <div className="group rounded-2xl bg-white/[0.07] hover:bg-white/[0.12] border border-white/10 hover:border-white/20 p-3.5 lg:p-4 backdrop-blur-md transition-all duration-200 flex items-center gap-4 shadow-sm">
              <div className="w-11 h-11 rounded-xl bg-blue-500/20 border border-blue-400/30 flex items-center justify-center text-blue-300 shrink-0 group-hover:scale-105 transition-transform">
                <HeartHandshake className="w-5 h-5 lg:w-6 lg:h-6" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2 mb-0.5">
                  <h4 className="text-xs lg:text-sm font-bold text-white">Zero Brokerage &amp; Direct</h4>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-300 border border-blue-400/25 shrink-0">
                    0% Commission
                  </span>
                </div>
                <p className="text-[11px] lg:text-xs text-blue-100/70 leading-relaxed">
                  Transparent agreements with direct host communication and no hidden fees.
                </p>
              </div>
            </div>

            {/* Feature 3 */}
            <div className="group rounded-2xl bg-white/[0.07] hover:bg-white/[0.12] border border-white/10 hover:border-white/20 p-3.5 lg:p-4 backdrop-blur-md transition-all duration-200 flex items-center gap-4 shadow-sm">
              <div className="w-11 h-11 rounded-xl bg-violet-500/20 border border-violet-400/30 flex items-center justify-center text-violet-300 shrink-0 group-hover:scale-105 transition-transform">
                <Lock className="w-5 h-5 lg:w-6 lg:h-6" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2 mb-0.5">
                  <h4 className="text-xs lg:text-sm font-bold text-white">Encrypted &amp; Privacy First</h4>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-violet-500/15 text-violet-300 border border-violet-400/25 shrink-0">
                    256-Bit SSL
                  </span>
                </div>
                <p className="text-[11px] lg:text-xs text-blue-100/70 leading-relaxed">
                  Your location, phone number, and data remain protected at all times.
                </p>
              </div>
            </div>
          </div>

          {/* Bottom subtle anchor */}
          <div className="relative z-10 shrink-0" />
        </div>

        {/* Right Content Panel: Exactly 50% width */}
        <div className="w-1/2 min-w-0 h-full bg-[#f5f7fb] flex flex-col overflow-hidden">
          <div className="flex-1 flex flex-col max-w-[680px] w-full mx-auto px-8 lg:px-10 xl:px-14 pt-8 pb-0 h-full overflow-hidden">
            {/* Icon + Header */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="shrink-0 mb-4"
            >
              <div className="w-12 h-12 bg-[#241e98]/8 rounded-2xl flex items-center justify-center mb-3 border border-[#241e98]/10">
                <FileText className="w-6 h-6 text-[#241e98]" />
              </div>
              <h1 className="text-2xl lg:text-[1.75rem] font-bold text-neutral-900 mb-1.5 font-heading tracking-tight">
                Terms &amp; Conditions
              </h1>
              <p className="text-neutral-500 text-sm leading-relaxed">
                Please read and agree to the terms and conditions below to continue using Spotly.
              </p>
            </motion.div>

            {/* Scrollable Terms Content + Bottom Confirmation Checkbox */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="flex-1 min-h-0 relative flex flex-col"
            >
              <div
                ref={desktopScrollRef}
                onScroll={handleDesktopScroll}
                className="flex-1 min-h-0 overflow-y-auto rounded-2xl border border-neutral-200/80 bg-white px-7 py-6 shadow-sm"
                style={{
                  scrollbarWidth: "thin",
                  scrollbarColor: "#c7c7cc transparent",
                  overscrollBehavior: "contain",
                }}
              >
                <TermsContent />

                {/* Confirmation Checkbox Section - visible when scrolled down, matching mobile behavior */}
                <div className="mt-8 pt-6 border-t border-neutral-200/80">
                  <div className="bg-blue-50/70 border-2 border-[#0d3da8]/30 p-5 rounded-2xl shadow-xs">
                    <div className="flex items-center justify-between mb-3 border-b border-[#0d3da8]/20 pb-2">
                      <h3 className="text-base font-bold text-[#0d3da8] flex items-center gap-2">
                        <ShieldCheck className="w-5 h-5 text-[#0d3da8]" />
                        {role === "worker" ? "Confirmation for Space Seekers" : "Confirmation for Space Providers"}
                      </h3>
                    </div>

                    <div className="flex items-start gap-3.5 mt-2">
                      <Checkbox
                        id="accept-desktop"
                        checked={isAccepted}
                        onCheckedChange={(checked) => setIsAccepted(checked === true)}
                        className="mt-1 w-5 h-5 border-2 border-[#241e98] data-[state=checked]:bg-[#241e98] data-[state=checked]:text-white rounded-md shrink-0 cursor-pointer"
                        data-testid="checkbox-accept-disclaimer-desktop"
                      />
                      <label htmlFor="accept-desktop" className="text-sm font-medium text-slate-800 cursor-pointer leading-relaxed">
                        {role === "worker" ? (
                          <>
                            <p className="font-bold text-slate-900 text-sm mb-1.5">
                              I confirm that I am registering as a <span className="text-[#241e98]">Space Seeker</span> looking for parking spaces:
                            </p>
                            <ul className="text-sm text-slate-700 space-y-1.5 list-disc pl-4 font-normal">
                              <li>I can view parking listings and contact Space Providers through Spotly.</li>
                              <li>All communications, agreements, and outcomes with Space Providers are my sole responsibility.</li>
                              <li>Spotly is not responsible for any external disputes, payments, or misuse.</li>
                              <li>I agree to use the platform responsibly and in good faith.</li>
                            </ul>
                            <div className="mt-3.5 p-3 rounded-xl bg-amber-50/90 border border-amber-300/80 text-amber-950">
                              <p className="font-extrabold text-[12px] text-amber-900 flex items-center gap-1.5 mb-1 tracking-wide">
                                <span>⚠️</span> FREE PUBLIC ROADSIDE PARKING
                              </p>
                              <p className="text-[11px] lg:text-xs text-amber-900/90 leading-relaxed font-medium">
                                Spotly provides location guidance only. Availability is not guaranteed. Check parking rules and signs before parking. Park at your own risk; Spotly is not responsible for fines or vehicle-related incidents.
                              </p>
                            </div>
                          </>
                        ) : (
                          <>
                            <p className="font-bold text-slate-900 text-sm mb-1.5">
                              I confirm that I am registering as a <span className="text-[#241e98]">Space Provider</span> to list parking spaces:
                            </p>
                            <ul className="text-sm text-slate-700 space-y-1.5 list-disc pl-4 font-normal">
                              <li>My parking space details and contact information will be displayed to registered Space Seekers.</li>
                              <li>All agreements, discussions, and outcomes with Space Seekers are my sole responsibility.</li>
                              <li>Spotly is not responsible for any external disputes, payments, or misuse.</li>
                              <li>I agree to use the platform responsibly and in good faith.</li>
                            </ul>
                          </>
                        )}
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              {/* Floating Scroll to Bottom Button on Desktop */}
              <AnimatePresence>
                {desktopShowScrollBtn && (
                  <motion.button
                    type="button"
                    initial={{ opacity: 0, scale: 0.8, x: "-50%" }}
                    animate={{ opacity: 1, scale: 1, x: "-50%" }}
                    exit={{ opacity: 0, scale: 0.8, x: "-50%" }}
                    onClick={scrollDesktopToBottom}
                    className="absolute left-1/2 bottom-5 z-40 w-11 h-11 rounded-full bg-[#241e98] hover:bg-[#1b1778] text-white flex items-center justify-center shadow-xl active:scale-95 transition-all cursor-pointer"
                    style={{ boxShadow: "0 4px 16px rgba(36,30,152,0.4)" }}
                    aria-label="Scroll to bottom"
                    title="Scroll to bottom"
                  >
                    <ArrowDown className="w-5 h-5 animate-bounce" />
                  </motion.button>
                )}
              </AnimatePresence>
            </motion.div>

            {/* Bottom bar: Accept & Continue */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.3 }}
              className="shrink-0 py-5"
            >
              <Button
                type="button"
                onClick={handleProceed}
                disabled={!isAccepted}
                className="w-full h-13 rounded-2xl text-base font-bold shadow-xl bg-gradient-to-r from-[#241e98] via-[#2b24b1] to-[#3e3ab3] hover:from-[#1b1778] hover:to-[#2e2a97] text-white disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200 cursor-pointer group"
                style={{ boxShadow: isAccepted ? "0 8px 30px rgba(36,30,152,0.35)" : "none" }}
                data-testid="button-proceed-disclaimer-desktop"
              >
                <span className="flex items-center justify-center gap-2.5">
                  Accept &amp; Continue
                  <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
                </span>
              </Button>
            </motion.div>
          </div>
        </div>
      </div>

      {/* ===================== MOBILE LAYOUT (< 768px) ===================== */}
      <div className="md:hidden fixed inset-0 w-full h-full min-h-[100dvh] overflow-hidden flex flex-col items-center justify-center bg-gradient-to-br from-[#241e98] via-[#1c177c] to-[#3e3ab3] p-0 sm:p-4">
        <div className="relative w-full max-w-[430px] mx-auto z-10 h-full max-h-full sm:max-h-[850px] flex flex-col overflow-hidden bg-white shadow-2xl safe-area-top sm:rounded-3xl">
          <div 
            ref={scrollContainerRef}
            onScroll={handleScroll}
            className="flex-1 min-h-0 overflow-y-auto p-5 sm:p-6"
            style={{ overscrollBehavior: "contain" }}
          >
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center"
            >
              <div className="w-16 h-16 bg-[#241e98]/10 rounded-full flex items-center justify-center mb-4">
                <FileText className="w-8 h-8 text-[#241e98]" />
              </div>

              <h1 className="text-2xl font-bold text-neutral-900 mb-6 text-center">
                Terms &amp; Conditions
              </h1>

              <div className="bg-neutral-50 border border-neutral-200 rounded-2xl p-5 mb-6 w-full">
                <TermsContent />
              </div>

              <div className="w-full bg-blue-50/70 border-2 border-[#0d3da8]/30 p-5 rounded-2xl mb-5 shadow-xs">
                <div className="flex items-center justify-between mb-3 border-b border-[#0d3da8]/20 pb-2">
                  <h3 className="text-base font-bold text-[#0d3da8] flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-[#0d3da8]" />
                    {role === "worker" ? "Confirmation for Space Seekers" : "Confirmation for Space Providers"}
                  </h3>
                </div>

                <div className="flex items-start gap-3.5 mt-2">
                  <Checkbox
                    id="accept"
                    checked={isAccepted}
                    onCheckedChange={(checked) => setIsAccepted(checked === true)}
                    className="mt-1 w-5 h-5 border-2 border-[#241e98] data-[state=checked]:bg-[#241e98] data-[state=checked]:text-white rounded-md shrink-0 cursor-pointer"
                    data-testid="checkbox-accept-disclaimer"
                  />
                  <label htmlFor="accept" className="text-sm font-medium text-slate-800 cursor-pointer leading-relaxed">
                        {role === "worker" ? (
                          <>
                            <p className="font-bold text-slate-900 text-sm mb-1.5">
                              I confirm that I am registering as a <span className="text-[#241e98]">Space Seeker</span> looking for parking spaces:
                            </p>
                            <ul className="text-xs sm:text-sm text-slate-700 space-y-1.5 list-disc pl-4 font-normal">
                              <li>I can view parking listings and contact Space Providers through Spotly.</li>
                              <li>All communications, agreements, and outcomes with Space Providers are my sole responsibility.</li>
                              <li>Spotly is not responsible for any external disputes, payments, or misuse.</li>
                              <li>I agree to use the platform responsibly and in good faith.</li>
                            </ul>
                            <div className="mt-3 p-3 rounded-xl bg-amber-50/90 border border-amber-300/80 text-amber-950">
                              <p className="font-extrabold text-[12px] text-amber-900 flex items-center gap-1.5 mb-1 tracking-wide">
                                <span>⚠️</span> FREE PUBLIC ROADSIDE PARKING
                              </p>
                              <p className="text-[11px] text-amber-900/90 leading-relaxed font-medium">
                                Spotly provides location guidance only. Availability is not guaranteed. Check parking rules and signs before parking. Park at your own risk; Spotly is not responsible for fines or vehicle-related incidents.
                              </p>
                            </div>
                          </>
                        ) : (
                      <>
                        <p className="font-bold text-slate-900 text-sm mb-1.5">
                          I confirm that I am registering as a <span className="text-[#241e98]">Space Provider</span> to list parking spaces:
                        </p>
                        <ul className="text-xs sm:text-sm text-slate-700 space-y-1.5 list-disc pl-4 font-normal">
                          <li>My parking space details and contact information will be displayed to registered Space Seekers.</li>
                          <li>All agreements, discussions, and outcomes with Space Seekers are my sole responsibility.</li>
                          <li>Spotly is not responsible for any external disputes, payments, or misuse.</li>
                          <li>I agree to use the platform responsibly and in good faith.</li>
                        </ul>
                      </>
                    )}
                  </label>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Floating Scroll Bottom Button */}
          <AnimatePresence>
            {showScrollBottomBtn && (
              <motion.button
                type="button"
                initial={{ opacity: 0, scale: 0.8, x: "-50%" }}
                animate={{ opacity: 1, scale: 1, x: "-50%" }}
                exit={{ opacity: 0, scale: 0.8, x: "-50%" }}
                onClick={scrollToBottom}
                className="absolute left-1/2 z-40 w-11 h-11 rounded-full bg-[#241e98] text-white flex items-center justify-center shadow-lg active:scale-95 transition-transform"
                style={{ bottom: "85px", boxShadow: "0 4px 14px rgba(36,30,152,0.4)" }}
                aria-label="Scroll to bottom"
              >
                <ArrowDown className="w-5 h-5 animate-bounce" />
              </motion.button>
            )}
          </AnimatePresence>

          <div className="p-4 sm:p-5 border-t border-neutral-200 bg-white shrink-0 z-30 pb-[max(1.25rem,env(safe-area-inset-bottom))] shadow-lg relative">
            <Button
              type="button"
              onClick={handleProceed}
              disabled={!isAccepted}
              className="w-full h-12 rounded-2xl text-base sm:text-lg font-bold shadow-xl bg-gradient-to-r from-[#241e98] via-[#2b24b1] to-[#3e3ab3] hover:from-[#1b1778] hover:to-[#2e2a97] text-white disabled:opacity-40 shadow-[#241e98]/30 cursor-pointer"
              data-testid="button-proceed-disclaimer"
            >
              Accept &amp; Continue
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
