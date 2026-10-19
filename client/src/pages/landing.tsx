import { useEffect, useState, useRef } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowRight,
  Phone,
  Mail,
  Play,
  X,
  Menu,
  FileText,
  Images,
  ChevronLeft,
  ChevronRight,
  Globe,
  Info,
  Shield,
  Sparkles,
  ShieldCheck,
  MapPin,
  CreditCard,
  Trash2,
  Search,
  PlusCircle,
  Zap,
  MessageSquare,
} from "lucide-react";
import { vibrate } from "@/lib/vibrate";
import { getApiUrl } from "@/lib/api-config";
import TermsContent from "@/components/terms-content";
import logo from "@assets/Logos/spotly_full-white.png";
import landingBg1 from "@assets/ld-bg-1.png";
import landingBg2 from "@assets/ld-bg-2.png";
import phoneHand from "@assets/landing-phone-hand.png";
import heroVisual from "@assets/landing-phone-hand.png";
import screenshot1 from "@assets/1-1_1779273074527.png";
import screenshot2 from "@assets/2-2_1779273074558.png";
import screenshot3 from "@assets/3-3_1779273074485.png";
import screenshot4 from "@assets/4-4_1779273074466.png";
import screenshot5 from "@assets/5-5_1779273074506.png";
import screenshot6 from "@assets/6-6_1779273074384.png";
import screenshot7 from "@assets/7-7_1779273074428.png";
import screenshot8 from "@assets/8-8_1779273074446.png";

const APP_SCREENSHOTS = [
  screenshot1,
  screenshot2,
  screenshot3,
  screenshot4,
  screenshot5,
  screenshot6,
  screenshot7,
  screenshot8,
];

export default function LandingPage() {
  const [, setLocation] = useLocation();
  const [videoUrl, setVideoUrl] = useState("");
  const [videoEnabled, setVideoEnabled] = useState(true);
  const [showVideo, setShowVideo] = useState(false);
  const [bgIndex, setBgIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setBgIndex((prev) => (prev === 0 ? 1 : 0));
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const videoRef = useRef<HTMLVideoElement>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const [showScreenshots, setShowScreenshots] = useState(false);
  const screenshotsRef = useRef<HTMLDivElement>(null);
  const [comingSoonMode, setComingSoonMode] = useState(false);
  const [underConstructionMode, setUnderConstructionMode] = useState(false);

  const scrollScreenshots = (dir: "left" | "right") => {
    if (!screenshotsRef.current) return;
    const amount = screenshotsRef.current.clientWidth * 0.8;
    screenshotsRef.current.scrollBy({ left: dir === "left" ? -amount : amount, behavior: "smooth" });
  };

  const [headline, setHeadline] = useState("Your perfect parking spot.\nRight around the corner.");
  const [subtitle, setSubtitle] = useState("Find secure car & bike parking nearby —\nor earn from your unused space.");
  const [address, setAddress] = useState(
    "Heeraa Technologies: 139/81, Unit 101 Oxford Towers, HAL Old Airport Road, Kodihalli, Bengaluru, Karnataka – 560008."
  );
  const [footerPhone, setFooterPhone] = useState("+91-97425 45584");
  const [footerEmail, setFooterEmail] = useState("info@spotlyindia.org");
  const [footerWebsite, setFooterWebsite] = useState("spotlyindia.org");
  const [copyright, setCopyright] = useState("©2026 Spotly. All Rights Reserved.");
  const [totalSpots, setTotalSpots] = useState("8+");
  const [totalProviders, setTotalProviders] = useState("1+");

  useEffect(() => {
    (async () => {
      // 1. Spots count from admin setting or live API
      try {
        const sRes = await fetch(getApiUrl("/api/settings/landing_spots_count"));
        if (sRes.ok) {
          const sData = await sRes.json();
          if (sData.setting?.value && sData.setting.value.trim()) {
            setTotalSpots(sData.setting.value.trim());
          }
        }
      } catch { }

      try {
        const res = await fetch(getApiUrl("/api/spots/count"));
        if (res.ok) {
          const data = await res.json();
          if (typeof data.count === "number" && data.count > 0) {
            setTotalSpots(`${data.count.toLocaleString()}+`);
          }
        }
      } catch { }

      // Fallback to pending bookings total if spots/count is unavailable
      try {
        const pRes = await fetch(getApiUrl("/api/bookings/pending?limit=1"));
        if (pRes.ok) {
          const pData = await pRes.json();
          if (typeof pData.total === "number" && pData.total > 0) {
            setTotalSpots(`${pData.total.toLocaleString()}+`);
          }
        }
      } catch { }

      // 2. Providers count from admin setting or live API
      try {
        const provSettingRes = await fetch(getApiUrl("/api/settings/landing_providers_count"));
        if (provSettingRes.ok) {
          const provSettingData = await provSettingRes.json();
          if (provSettingData.setting?.value && provSettingData.setting.value.trim()) {
            setTotalProviders(provSettingData.setting.value.trim());
            return;
          }
        }
      } catch { }

      try {
        const provRes = await fetch(getApiUrl("/api/providers/count"));
        if (provRes.ok) {
          const provData = await provRes.json();
          if (typeof provData.count === "number" && provData.count > 0) {
            setTotalProviders(`${provData.count.toLocaleString()}+`);
          } else if (typeof provData.count === "string" && provData.count.trim()) {
            setTotalProviders(provData.count.trim());
          }
        }
      } catch { }
    })();
  }, []);

  useEffect(() => {
    (async () => {
      const keys: Array<[string, (v: string) => void]> = [
        ["landing_headline", setHeadline],
        ["landing_subtitle", setSubtitle],
        ["landing_address", setAddress],
        ["support_phone", setFooterPhone],
        ["support_email", setFooterEmail],
        ["support_website", setFooterWebsite],
        ["landing_copyright", setCopyright],
      ];
      await Promise.all(
        keys.map(async ([k, setter]) => {
          try {
            const r = await fetch(getApiUrl(`/api/settings/${k}`));
            if (r.ok) {
              const d = await r.json();
              if (d.setting?.value) {
                if (k === "landing_copyright" && typeof d.setting.value === "string") {
                  setter(d.setting.value.replace(/(\.?\s*Powered by Zeboto\.?)/gi, ""));
                } else {
                  setter(d.setting.value);
                }
              }
            }
          } catch { }
        })
      );
    })();
  }, []);

  // Fetch coming soon mode from admin settings
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(getApiUrl("/api/settings/coming_soon_mode"));
        if (res.ok) {
          const data = await res.json();
          setComingSoonMode(data.setting?.value === "true");
        }
      } catch { }
    })();
  }, []);

  // Fetch under construction mode from admin settings
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(getApiUrl("/api/settings/under_construction_mode"));
        if (res.ok) {
          const data = await res.json();
          setUnderConstructionMode(data.setting?.value === "true");
        }
      } catch { }
    })();
  }, []);

  useEffect(() => {
    const userId = localStorage.getItem("userId");
    const userRole = localStorage.getItem("userRole");
    if (userId && userRole) {
      if (userRole === "customer") setLocation("/space-provider/home");
      else if (userRole === "worker") setLocation("/space-seeker/home");
    }
  }, [setLocation]);

  useEffect(() => {
    (async () => {
      try {
        const [urlRes, enabledRes] = await Promise.all([
          fetch(getApiUrl("/api/settings/ad_video_url")),
          fetch(getApiUrl("/api/settings/ad_video_enabled")),
        ]);
        if (urlRes.ok) {
          const d = await urlRes.json();
          if (d.setting?.value) setVideoUrl(d.setting.value);
        }
        if (enabledRes.ok) {
          const d = await enabledRes.json();
          if (d.setting?.value !== undefined) setVideoEnabled(d.setting.value === "true");
        }
      } catch (e) {
        console.error("Failed to load demo video:", e);
      }
    })();
  }, []);

  useEffect(() => {
    const hasToggled = sessionStorage.getItem("landingMenuAutoToggled");
    if (!hasToggled) {
      sessionStorage.setItem("landingMenuAutoToggled", "true");
      const openTimer = setTimeout(() => {
        setMenuOpen(true);
        const closeTimer = setTimeout(() => {
          setMenuOpen(false);
        }, 2000);
        return () => clearTimeout(closeTimer);
      }, 2000);
      return () => clearTimeout(openTimer);
    }
  }, []);

  const handleGetStarted = () => {
    vibrate();
    sessionStorage.setItem("fromLanding", "1");
    setLocation("/splash");
  };

  const handleFindParking = () => {
    vibrate();
    sessionStorage.setItem("fromLanding", "1");
    sessionStorage.setItem("directRole", "worker");
    setLocation("/splash");
  };

  const handleListYourSpace = () => {
    vibrate();
    sessionStorage.setItem("fromLanding", "1");
    sessionStorage.setItem("directRole", "customer");
    setLocation("/splash");
  };

  const handleHowItWorks = () => {
    vibrate();
    setLocation("/about");
  };

  const renderDesktopHeadline = (text: string) => {
    if (!text) return null;
    const lines = text.includes("\n") ? text.split("\n") : text.split(/(?<=\.)\s+/);
    return lines.map((line, idx) => {
      const cornerMatch = line.match(/(.*?)(the corner\.?)(.*)/i);
      return (
        <span key={idx} className="block whitespace-normal sm:whitespace-nowrap">
          {cornerMatch ? (
            <>
              {cornerMatch[1]}
              <span className="text-[#00e5ff]">{cornerMatch[2]}</span>
              {cornerMatch[3]}
            </>
          ) : (
            line
          )}
        </span>
      );
    });
  };

  const handleSignIn = () => {
    vibrate();
    setLocation("/auth");
  };

  const handlePlayVideo = () => {
    vibrate();
    setShowVideo(true);
  };

  const handleCloseVideo = () => {
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
    }
    setShowVideo(false);
  };

  const showPlayBtn = videoEnabled && !!videoUrl;

  return (
    <div
      className="relative w-full min-h-screen md:min-h-screen lg:h-[100dvh] overflow-x-hidden md:overflow-x-visible overflow-y-auto lg:overflow-hidden flex flex-col justify-between text-white select-none bg-[#050729]"
      data-testid="page-landing"
    >
      {/* Background Image Layer 1 */}
      <div
        className="fixed inset-0 z-0 pointer-events-none select-none bg-cover bg-center bg-no-repeat transition-opacity duration-1000 ease-in-out"
        style={{
          backgroundImage: `url(${landingBg1})`,
          backgroundPosition: "center center",
          opacity: bgIndex === 0 ? 1 : 0,
        }}
        aria-hidden="true"
      />
      {/* Background Image Layer 2 */}
      <div
        className="fixed inset-0 z-0 pointer-events-none select-none bg-cover bg-center bg-no-repeat transition-opacity duration-1000 ease-in-out"
        style={{
          backgroundImage: `url(${landingBg2})`,
          backgroundPosition: "center center",
          opacity: bgIndex === 1 ? 1 : 0,
        }}
        aria-hidden="true"
      />

      {/* HEADER NAVBAR */}
      <header className="flex items-center justify-between px-4 sm:px-8 lg:px-12 py-3.5 lg:py-5 relative z-30 shrink-0 max-w-7xl xl:max-w-[1440px] w-full mx-auto">
        <div className="flex items-center gap-3">
          <a
            href="/"
            onClick={(e) => {
              e.preventDefault();
              setLocation("/");
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
            className="flex items-center cursor-pointer transition-transform active:scale-95 relative group"
            title="Spotly"
            data-testid="link-logo-landing"
          >
            <img src={logo} alt="Spotly" className="h-9 sm:h-11 md:h-12 w-auto object-contain" style={{ filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.25))" }} data-testid="img-logo" />
          </a>
        </div>

        {/* Center: Desktop Navigation Links */}
        <nav className="hidden lg:flex items-center gap-8 xl:gap-10">
          <button
            onClick={handleFindParking}
            className="relative py-1 text-white text-sm xl:text-base font-semibold after:content-[''] after:absolute after:bottom-0 after:left-0 after:w-full after:h-[2.5px] after:bg-cyan-400 after:rounded-full cursor-pointer hover:opacity-90 transition-opacity"
            data-testid="nav-find-parking"
          >
            Find Parking
          </button>
          <button
            onClick={handleListYourSpace}
            className="py-1 text-white/80 hover:text-white text-sm xl:text-base font-medium transition-colors cursor-pointer"
            data-testid="nav-rent-space"
          >
            Rent Your Space
          </button>
          <button
            onClick={handleHowItWorks}
            className="py-1 text-white/80 hover:text-white text-sm xl:text-base font-medium transition-colors cursor-pointer"
            data-testid="nav-how-it-works"
          >
            How It Works
          </button>
        </nav>

        {/* Right: Sign In, Get Started, Menu Dropdown */}
        <div className="flex items-center gap-3 sm:gap-4">
          <button
            onClick={handleSignIn}
            className="hidden sm:inline-flex text-white/90 hover:text-white text-sm font-semibold transition-colors px-2.5 py-1.5 cursor-pointer"
            data-testid="nav-sign-in"
          >
            Sign In
          </button>

          <button
            onClick={handleGetStarted}
            className="px-5 py-2.5 bg-[#FACC15] hover:bg-yellow-400 active:scale-95 text-slate-950 text-sm font-extrabold rounded-full shadow-md shadow-amber-500/20 flex items-center gap-1.5 transition-all cursor-pointer"
            data-testid="button-get-started-nav"
          >
            <span>Get Started</span>
            <ArrowRight className="w-4 h-4 stroke-[2.5]" />
          </button>

          <div className="relative">
            <button
              onClick={() => {
                vibrate();
                setMenuOpen((v) => !v);
              }}
              className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-white/15 hover:bg-white/25 backdrop-blur-md border border-white/30 text-white flex items-center justify-center transition-all active:scale-95 shadow-lg cursor-pointer"
              aria-label="Open menu"
              data-testid="button-menu"
            >
              <Menu className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>

            <AnimatePresence>
              {menuOpen && (
                <>
                  <div className="fixed inset-0 z-30" onClick={() => setMenuOpen(false)} aria-hidden="true" />
                  <motion.div
                    initial={{ opacity: 0, y: -8, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -8, scale: 0.96 }}
                    transition={{ duration: 0.18 }}
                    className="absolute right-0 mt-2 w-60 bg-white rounded-2xl shadow-2xl ring-1 ring-black/10 overflow-hidden z-40"
                    data-testid="menu-landing"
                  >
                    <a
                      href="/about"
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => {
                        vibrate();
                        setMenuOpen(false);
                      }}
                      className="w-full flex items-center gap-3 px-4 py-3 text-left text-sm font-semibold text-neutral-800 hover:bg-primary/5 active:bg-primary/10 transition-colors"
                      data-testid="menu-about"
                    >
                      <span className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                        <Info className="w-4 h-4" />
                      </span>
                      About Spotly
                    </a>
                    <div className="h-px bg-neutral-100" />
                    <a
                      href="/customer-feedback"
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => {
                        vibrate();
                        setMenuOpen(false);
                      }}
                      className="w-full flex items-center gap-3 px-4 py-3 text-left text-sm font-semibold text-neutral-800 hover:bg-primary/5 active:bg-primary/10 transition-colors"
                      data-testid="menu-feedback"
                    >
                      <span className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-600 flex items-center justify-center shrink-0">
                        <MessageSquare className="w-4 h-4" />
                      </span>
                      Customer Feedback
                    </a>
                    <div className="h-px bg-neutral-100" />
                    <a
                      href="/privacy-policy"
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => {
                        vibrate();
                        setMenuOpen(false);
                      }}
                      className="w-full flex items-center gap-3 px-4 py-3 text-left text-sm font-semibold text-neutral-800 hover:bg-primary/5 active:bg-primary/10 transition-colors"
                      data-testid="menu-privacy"
                    >
                      <span className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                        <ShieldCheck className="w-4 h-4" />
                      </span>
                      Privacy Policy
                    </a>
                    <div className="h-px bg-neutral-100" />
                    <a
                      href="/terms-and-conditions"
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => {
                        vibrate();
                        setMenuOpen(false);
                      }}
                      className="w-full flex items-center gap-3 px-4 py-3 text-left text-sm font-semibold text-neutral-800 hover:bg-primary/5 active:bg-primary/10 transition-colors"
                      data-testid="menu-terms"
                    >
                      <span className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                        <FileText className="w-4 h-4" />
                      </span>
                      Terms &amp; Conditions
                    </a>
                    <div className="h-px bg-neutral-100" />
                    <a
                      href="/subscription-policy"
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => {
                        vibrate();
                        setMenuOpen(false);
                      }}
                      className="w-full flex items-center gap-3 px-4 py-3 text-left text-sm font-semibold text-neutral-800 hover:bg-primary/5 active:bg-primary/10 transition-colors"
                      data-testid="menu-subscription"
                    >
                      <span className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                        <Shield className="w-4 h-4" />
                      </span>
                      Subscription Policy
                    </a>
                    <div className="h-px bg-neutral-100" />
                    <a
                      href="/delete-account"
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => {
                        vibrate();
                        setMenuOpen(false);
                      }}
                      className="w-full flex items-center gap-3 px-4 py-3 text-left text-sm font-semibold text-red-500 hover:bg-red-50 active:bg-red-100 transition-colors"
                      data-testid="menu-delete-account"
                    >
                      <span className="w-8 h-8 rounded-lg bg-red-50 text-red-500 flex items-center justify-center shrink-0">
                        <Trash2 className="w-4 h-4" />
                      </span>
                      Delete Account
                    </a>
                    <div className="h-px bg-neutral-100" />
                    <button
                      onClick={() => {
                        vibrate();
                        setMenuOpen(false);
                        setShowScreenshots(true);
                      }}
                      className="w-full flex items-center gap-3 px-4 py-3 text-left text-sm font-semibold text-neutral-800 hover:bg-primary/5 active:bg-primary/10 transition-colors cursor-pointer"
                      data-testid="menu-screenshots"
                    >
                      <span className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                        <Images className="w-4 h-4" />
                      </span>
                      App Screenshots
                    </button>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
        </div>
      </header>

      {/* ========================================================= */}
      {/* MOBILE SCREEN HERO (VISIBLE ONLY ON MOBILE < 768px)       */}
      {/* ========================================================= */}
      <div className="flex md:hidden flex-1 flex-col justify-between px-4 pt-1 pb-[calc(1.25rem+env(safe-area-inset-bottom,0px))] relative z-20 min-h-0 overflow-hidden text-center">

        {/* TOP TEXT & BADGES */}
        <div className="flex flex-col items-center gap-2 pt-0.5">
          {/* Punchy Pill */}
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 border border-white/20 backdrop-blur-md text-[11px] font-bold text-yellow-300 shadow-sm">
            <Sparkles className="w-3.5 h-3.5 text-yellow-300 shrink-0 animate-pulse" />
            <span>India's Smartest Parking App</span>
          </div>

          {/* Headline */}
          <h1 className="text-[29px] font-black leading-[1.12] tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-white via-blue-100 to-blue-200 drop-shadow-md px-2">
            {headline}
          </h1>

          {/* Subtitle */}
          <p className="text-[14px] text-blue-100/90 font-normal leading-relaxed max-w-sm px-2">
            {subtitle}
          </p>

          {/* Micro Stats Ticker */}
          <div className="grid grid-cols-3 gap-2 w-full max-w-xs pt-1">
            <div className="bg-white/10 border border-white/20 backdrop-blur-md rounded-xl py-1 px-2 flex flex-col items-center justify-center shadow-xs">
              <span className="text-xs font-black text-yellow-300">{totalSpots}</span>
              <span className="text-[9px] text-white/80 font-medium">Spots</span>
            </div>
            <div className="bg-white/10 border border-white/20 backdrop-blur-md rounded-xl py-1 px-2 flex flex-col items-center justify-center shadow-xs">
              <span className="text-xs font-black text-cyan-300">&lt; 30s</span>
              <span className="text-[9px] text-white/80 font-medium">Find</span>
            </div>
            <div className="bg-white/10 border border-white/20 backdrop-blur-md rounded-xl py-1 px-2 flex flex-col items-center justify-center shadow-xs">
              <span className="text-xs font-black text-emerald-300">100%</span>
              <span className="text-[9px] text-white/80 font-medium">Verified</span>
            </div>
          </div>
        </div>

        {/* CENTER PHONE GRAPHIC WITH FLOATING INTERACTIVE BADGES */}
        <div className="relative flex-1 flex items-center justify-center min-h-[180px] max-h-[38vh] my-1 overflow-hidden">
          {/* Floating Hotspot 1 - Top Left */}
          <motion.div
            animate={{ y: [0, -4, 0] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            className="absolute top-1 left-2 z-20 bg-[#0a2773]/95 border border-yellow-400/50 backdrop-blur-xl py-1 px-2.5 rounded-xl shadow-xl flex items-center gap-2"
          >
            <div className="w-6 h-6 rounded-lg bg-yellow-400/20 text-yellow-300 flex items-center justify-center shrink-0">
              <MapPin size={12} />
            </div>
            <div className="text-left">
              <p className="text-[10px] font-black text-white leading-none">120m away</p>
              <p className="text-[8px] text-yellow-300 font-bold leading-none mt-0.5">Spot available</p>
            </div>
          </motion.div>

          {/* Floating Hotspot 2 - Bottom Right */}
          <motion.div
            animate={{ y: [0, 4, 0] }}
            transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
            className="absolute bottom-2 right-2 z-20 bg-[#0a2773]/95 border border-emerald-400/50 backdrop-blur-xl py-1 px-2.5 rounded-xl shadow-xl flex items-center gap-2"
          >
            <div className="w-6 h-6 rounded-lg bg-emerald-400/20 text-emerald-300 flex items-center justify-center shrink-0">
              <CreditCard size={12} />
            </div>
            <div className="text-left">
              <p className="text-[10px] font-black text-white leading-none">Monetize Space</p>
              <p className="text-[8px] text-emerald-300 font-bold leading-none mt-0.5">Earn monthly rent</p>
            </div>
          </motion.div>

          {/* Phone Mockup */}
          <img
            src={phoneHand}
            alt="Spotly app preview"
            className="h-full max-h-[40vh] w-auto object-contain drop-shadow-[0_24px_50px_rgba(0,0,0,0.6)] transition-all scale-110"
            data-testid="img-phone-hand-mobile"
          />
        </div>

        {/* BOTTOM ACTION BUTTONS */}
        <div className="flex flex-col gap-2 w-full max-w-xs mx-auto pt-1">
          <button
            onClick={handleGetStarted}
            className="w-full h-12 bg-gradient-to-r from-yellow-400 via-amber-400 to-yellow-500 hover:from-yellow-300 hover:to-amber-400 active:scale-[0.98] text-blue-950 font-black rounded-2xl shadow-xl shadow-amber-500/25 flex items-center justify-center gap-2 text-sm uppercase tracking-wider transition-all cursor-pointer"
            data-testid="button-get-started-mobile"
          >
            <span>Get Started Now</span>
            <ArrowRight size={16} />
          </button>

          {showPlayBtn && (
            <button
              onClick={handlePlayVideo}
              className="w-full py-2 bg-white/15 hover:bg-white/25 border border-white/20 backdrop-blur-md rounded-xl text-white font-bold text-xs flex items-center justify-center gap-2 active:scale-95 transition-all cursor-pointer"
              data-testid="button-play-demo-mobile"
            >
              <span className="w-4 h-4 rounded-full bg-yellow-400 text-blue-950 flex items-center justify-center shrink-0">
                <Play className="w-2.5 h-2.5 fill-current ml-px" />
              </span>
              <span>Watch How It Works</span>
            </button>
          )}
        </div>
      </div>

      {/* ========================================================= */}
      {/* DESKTOP SCREEN HERO (VISIBLE ONLY ON DESKTOP md+)         */}
      {/* ========================================================= */}
      <main className="hidden md:flex flex-1 w-full max-w-7xl xl:max-w-[1440px] mx-auto px-6 lg:px-12 xl:px-16 pt-3 lg:pt-5 pb-0 min-h-0 items-stretch justify-between relative z-20">
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="w-full h-full flex flex-col lg:flex-row items-stretch justify-between gap-8 lg:gap-10 xl:gap-16 min-h-0"
        >
          {/* Left Column: Hero Content */}
          <div className="flex-1 flex flex-col justify-center items-start gap-5 sm:gap-6 max-w-2xl xl:max-w-3xl text-left w-full py-2 self-center">
            {/* Top Pill: SMART PARKING, MADE SIMPLE */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#1e2ea8]/35 border border-[#4d5ce2]/50 backdrop-blur-md text-xs font-extrabold tracking-wider text-white uppercase shadow-sm">
              <Zap className="w-3.5 h-3.5 text-cyan-400 fill-cyan-400/30 shrink-0" />
              <span>SMART PARKING, MADE SIMPLE</span>
            </div>

            {/* Headline */}
            <h1 className="text-3xl md:text-4xl lg:text-[42px] xl:text-[48px] font-black leading-[1.15] tracking-tight text-white drop-shadow-sm">
              {renderDesktopHeadline(headline)}
            </h1>

            {/* Subtitle */}
            <p className="text-base sm:text-lg lg:text-[18px] text-white/85 font-normal leading-relaxed max-w-lg whitespace-pre-line">
              {subtitle}
            </p>

            {/* KPI Feature Badges */}
            <div className="flex items-center flex-wrap gap-3 sm:gap-4.5 py-1 w-full">
              {/* 1. Dynamic Spots */}
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 sm:w-7.5 sm:h-7.5 rounded-full bg-gradient-to-br from-[#2b4bf7] to-[#1e35d0] border border-blue-400/30 flex items-center justify-center text-white shadow-md shadow-blue-900/40 shrink-0">
                  <MapPin className="w-3.5 h-3.5 text-white" />
                </div>
                <div className="text-left leading-tight">
                  <div className="text-xs sm:text-[13px] font-black text-white">{totalSpots}</div>
                  <div className="text-[9.5px] sm:text-[10px] font-semibold text-cyan-200/90">Spots</div>
                </div>
              </div>

              <div className="hidden sm:block h-4.5 w-px bg-white/20" />

              {/* 2. Registered & Verified Providers Count (Next to number of spots) */}
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 sm:w-7.5 sm:h-7.5 rounded-full bg-gradient-to-br from-[#2b4bf7] to-[#1e35d0] border border-blue-400/30 flex items-center justify-center text-white shadow-md shadow-blue-900/40 shrink-0">
                  <ShieldCheck className="w-3.5 h-3.5 text-white" />
                </div>
                <div className="text-left leading-tight">
                  <div className="text-xs sm:text-[13px] font-black text-white">{totalProviders}</div>
                  <div className="text-[9.5px] sm:text-[10px] font-semibold text-cyan-200/90 whitespace-nowrap">Verified Providers</div>
                </div>
              </div>

              <div className="hidden sm:block h-4.5 w-px bg-white/20" />

              {/* 3. Under 30 sec to find a spot */}
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 sm:w-7.5 sm:h-7.5 rounded-full bg-gradient-to-br from-[#2b4bf7] to-[#1e35d0] border border-blue-400/30 flex items-center justify-center text-white shadow-md shadow-blue-900/40 shrink-0">
                  <Zap className="w-3.5 h-3.5 text-white fill-white/20" />
                </div>
                <div className="text-left leading-tight">
                  <div className="text-xs sm:text-[13px] font-black text-white">Under 30 sec</div>
                  <div className="text-[9.5px] sm:text-[10px] font-semibold text-cyan-200/90 whitespace-nowrap">to find a spot</div>
                </div>
              </div>
            </div>

            {/* 2 CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 pt-1 w-full sm:w-auto">
              <button
                onClick={handleFindParking}
                className="px-4 py-2 sm:px-4.5 sm:py-2 bg-[#FED421] hover:bg-yellow-400 active:scale-95 text-[#0c145a] font-extrabold rounded-full shadow-md shadow-amber-500/20 flex items-center justify-center gap-1.5 text-xs sm:text-[13px] transition-all cursor-pointer"
                data-testid="button-find-parking-hero"
              >
                <Search className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>Find Parking</span>
                <ArrowRight className="w-3 h-3 stroke-[2.5]" />
              </button>

              <button
                onClick={handleListYourSpace}
                className="px-3.5 py-2 sm:px-4 sm:py-2 bg-white/5 hover:bg-white/15 border border-white/70 backdrop-blur-md active:scale-95 text-white font-bold rounded-full shadow-sm flex items-center justify-center gap-1.5 text-xs sm:text-[13px] transition-all cursor-pointer"
                data-testid="button-list-space-hero"
              >
                <PlusCircle className="w-3.5 h-3.5 stroke-[2]" />
                <span>List Your Space</span>
              </button>
            </div>
          </div>

          {/* Right Column: Hero Visual Graphic */}
          <div className="flex-1 relative flex items-end justify-center lg:justify-end w-full self-stretch min-h-0 overflow-visible lg:-translate-x-[150px]">
            <motion.img
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              src={heroVisual}
              alt="Spotly Mobile App Preview"
              style={{ marginRight: "30px" }}
              className="w-auto h-[480px] sm:h-[520px] lg:h-[560px] xl:h-[620px] max-h-[calc(100dvh-75px)] object-contain object-bottom drop-shadow-[0_32px_75px_rgba(0,0,0,0.65)] select-none pointer-events-none transition-all block translate-y-[2px]"
              data-testid="img-hero-ux2-preview"
            />
          </div>
        </motion.div>
      </main>

      {/* FOOTER (Hidden for now) */}
      {/* 
      <footer
        className="bg-black/40 backdrop-blur-xl border-t border-white/10 px-4 sm:px-8 py-3 text-[11px] sm:text-xs leading-snug text-white/85 relative z-30 shrink-0"
        data-testid="footer-landing"
      >
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center md:justify-between gap-2 md:gap-4">
          <div className="flex flex-col md:flex-row md:items-center gap-1.5 md:gap-6">
            <p className="text-white/80 text-[11px] sm:text-xs md:truncate md:max-w-xl leading-relaxed max-w-2xl break-words md:break-normal" data-testid="text-footer-address">
              {address}
            </p>
            <div className="flex flex-wrap items-center gap-4">
              <a
                href={`tel:${footerPhone.replace(/[^+\d]/g, "")}`}
                className="flex items-center gap-1.5 hover:text-yellow-300 transition-colors"
                data-testid="link-mobile"
              >
                <Phone className="w-3.5 h-3.5 text-yellow-400" /> {footerPhone}
              </a>
              <a
                href={`mailto:${footerEmail}`}
                className="flex items-center gap-1.5 hover:text-yellow-300 transition-colors"
                data-testid="link-email"
              >
                <Mail className="w-3.5 h-3.5 text-yellow-400" /> {footerEmail}
              </a>
              <a
                href={footerWebsite.startsWith("http") ? footerWebsite : `https://${footerWebsite}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 hover:text-yellow-300 transition-colors"
                data-testid="link-website"
              >
                <Globe className="w-3.5 h-3.5 text-yellow-400" /> {footerWebsite}
              </a>
            </div>
          </div>
          <p className="text-white/60 text-[10px] sm:text-xs md:text-right shrink-0" data-testid="text-copyright">
            {copyright}
          </p>
        </div>
      </footer>
      */}

      {/* MODALS */}
      <AnimatePresence>
        {/* Terms Modal */}
        {showTerms && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4"
            onClick={() => setShowTerms(false)}
            data-testid="modal-terms"
          >
            <motion.div
              initial={{ y: 40, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 40, opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="relative w-full sm:max-w-2xl bg-white text-neutral-900 rounded-t-3xl sm:rounded-2xl shadow-2xl overflow-hidden max-h-[92vh] sm:max-h-[85vh] flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between px-5 py-3.5 border-b border-neutral-200 bg-white sticky top-0 z-10">
                <div className="flex items-center gap-2.5">
                  <span className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                    <FileText className="w-4 h-4" />
                  </span>
                  <h2 className="text-base font-bold text-neutral-900">Terms &amp; Conditions</h2>
                </div>
                <button
                  onClick={() => setShowTerms(false)}
                  className="w-8 h-8 rounded-full bg-neutral-100 hover:bg-neutral-200 text-neutral-700 flex items-center justify-center transition-colors"
                  aria-label="Close terms"
                  data-testid="button-close-terms"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="overflow-y-auto px-5 py-5 flex-1">
                <TermsContent />
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* Screenshots Modal */}
        {showScreenshots && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-3 sm:p-6"
            onClick={() => setShowScreenshots(false)}
            data-testid="modal-screenshots"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ duration: 0.22 }}
              className="relative w-full max-w-5xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] border border-white/20 spotly-inner-page-bg"
              style={{
                backgroundImage:
                  "radial-gradient(ellipse at 100% 0%, rgba(225, 75, 255, 0.95) 0%, transparent 36%), radial-gradient(ellipse at 72% 5%, rgba(83, 30, 255, 0.9) 0%, transparent 40%), radial-gradient(ellipse at 58% 65%, rgba(24, 28, 220, 0.7) 0%, transparent 46%), linear-gradient(115deg, #020b50 0%, #061b9e 48%, #2410c9 76%, #740dff 100%)",
                backgroundRepeat: "no-repeat",
                backgroundColor: "#020b50",
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/10 bg-black/25 backdrop-blur-md">
                <div className="flex items-center gap-2.5">
                  <span className="w-8 h-8 rounded-lg bg-white/10 text-white flex items-center justify-center">
                    <Images className="w-4 h-4" />
                  </span>
                  <h2 className="text-base font-bold text-white">App Screenshots</h2>
                </div>
                <button
                  onClick={() => setShowScreenshots(false)}
                  className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
                  aria-label="Close screenshots"
                  data-testid="button-close-screenshots"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="relative flex-1 min-h-0">
                <div
                  ref={screenshotsRef}
                  className="h-full overflow-x-auto overflow-y-hidden scrollbar-hide flex items-center gap-4 px-5 py-5 snap-x snap-mandatory"
                  data-testid="screenshots-scroll"
                >
                  {APP_SCREENSHOTS.map((src, i) => (
                    <div
                      key={i}
                      className="snap-center shrink-0 h-full max-h-[75vh] flex items-center justify-center"
                      data-testid={`screenshot-item-${i}`}
                    >
                      <img
                        src={src}
                        alt={`App screenshot ${i + 1}`}
                        className="h-full max-h-[75vh] w-auto object-contain rounded-xl shadow-2xl ring-1 ring-white/10"
                        loading={i === 0 ? "eager" : "lazy"}
                      />
                    </div>
                  ))}
                </div>
                <button
                  onClick={() => scrollScreenshots("left")}
                  className="hidden sm:flex absolute left-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/60 hover:bg-black/80 text-white items-center justify-center transition-colors backdrop-blur-sm"
                  aria-label="Previous screenshot"
                  data-testid="button-screenshots-prev"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  onClick={() => scrollScreenshots("right")}
                  className="hidden sm:flex absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/60 hover:bg-black/80 text-white items-center justify-center transition-colors backdrop-blur-sm"
                  aria-label="Next screenshot"
                  data-testid="button-screenshots-next"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
              <p className="text-center text-[11px] text-white/50 py-2 border-t border-white/10">
                Swipe horizontally to view all screenshots
              </p>
            </motion.div>
          </motion.div>
        )}

        {/* Video Demo Modal */}
        {showVideo && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4"
            onClick={handleCloseVideo}
            data-testid="modal-video"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="relative w-full max-w-4xl bg-black rounded-2xl overflow-hidden shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={handleCloseVideo}
                className="absolute top-3 right-3 z-10 w-10 h-10 rounded-full bg-black/60 hover:bg-black/80 text-white flex items-center justify-center transition-colors"
                data-testid="button-close-video"
                aria-label="Close video"
              >
                <X className="w-5 h-5" />
              </button>
              <video
                ref={videoRef}
                src={videoUrl}
                controls
                autoPlay
                playsInline
                className="w-full h-auto max-h-[80vh] bg-black"
                data-testid="video-demo"
              >
                Your browser does not support the video tag.
              </video>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Coming Soon Modal ── */}
      <AnimatePresence>
        {comingSoonMode && (
          <motion.div
            key="coming-soon-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.35 }}
            className="fixed inset-0 z-[9999] flex items-center justify-center px-4"
            style={{ background: "rgba(8,6,50,0.82)", backdropFilter: "blur(8px)" }}
          >
            <motion.div
              key="coming-soon-card"
              initial={{ opacity: 0, scale: 0.82, y: 28 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.88, y: 16 }}
              transition={{ type: "spring", stiffness: 280, damping: 24 }}
              className="relative w-full max-w-lg bg-white rounded-[2rem] shadow-2xl overflow-hidden"
            >
              {/* ── Top hero band ── */}
              <div className="bg-gradient-to-br from-[#0f0c6e] via-[#241e98] to-[#4338ca] px-8 pt-8 pb-12 text-center relative overflow-hidden">
                {/* Decorative rings */}
                <div className="absolute -top-6 -right-6 w-32 h-32 border border-white/10 rounded-full" />
                <div className="absolute -top-2 -right-2 w-20 h-20 border border-white/15 rounded-full" />
                <div className="absolute bottom-4 left-4 w-3 h-3 bg-yellow-400 rounded-full animate-pulse" />
                <div className="absolute top-5 left-10 w-2 h-2 bg-cyan-400/70 rounded-full animate-pulse" style={{ animationDelay: "0.5s" }} />

                {/* Rocket badge */}
                <motion.div
                  initial={{ scale: 0, rotate: -15 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: "spring", stiffness: 300, damping: 18, delay: 0.15 }}
                  className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4 mx-auto relative"
                  style={{ background: "rgba(255,255,255,0.18)", backdropFilter: "blur(8px)", border: "1.5px solid rgba(255,255,255,0.25)" }}
                >
                  <svg className="w-8 h-8 text-white drop-shadow-lg" fill="none" stroke="currentColor" strokeWidth="1.7" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.59 14.37a6 6 0 01-5.84 7.38v-4.82m5.84-2.56a14.98 14.98 0 006.16-12.12A14.98 14.98 0 009.63 8.41m5.96 5.96a14.926 14.926 0 01-5.96 2.91m0 0a6 6 0 01-7.38-5.84m7.38 5.84v-4.82m0 0a14.926 14.926 0 01-2.91-5.96M3 3l3.5 3.5" />
                  </svg>
                  <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-yellow-400 rounded-full flex items-center justify-center text-[9px] font-black text-yellow-900">✦</span>
                </motion.div>

                {/* Status pill */}
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.22 }}
                  className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-3"
                  style={{ background: "rgba(255,255,255,0.18)", border: "1px solid rgba(255,255,255,0.25)" }}
                >
                  <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                  <span className="text-white/95 text-[11px] font-bold tracking-widest uppercase">App Coming Soon</span>
                </motion.div>

                {/* Headline */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.28 }}
                >
                  <h2 className="text-white text-2xl font-extrabold leading-tight mb-1">
                    🎉 Welcome to Spotly!
                  </h2>
                  <p className="text-blue-200 text-sm font-medium">
                    India's Smartest Parking Platform
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
                  className="bg-white rounded-2xl shadow-xl shadow-indigo-100/70 border border-indigo-50 px-5 pt-4 pb-4 mt-5 mb-4"
                >
                  <p className="text-gray-800 font-bold text-sm text-center mb-1">
                    We're gearing up for launch! 🚀
                  </p>
                  <p className="text-gray-500 text-xs leading-relaxed text-center">
                    List your spare parking space &amp; earn, or find verified parking near you instantly. Safe. Smart. Spotly.
                  </p>

                  {/* Feature chips — 3 per row grid */}
                  <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-gray-100">
                    {[
                      { icon: "🚗", label: "Car Parking", color: "bg-green-50 text-green-700 border-green-200" },
                      { icon: "🛵", label: "Bike Parking", color: "bg-blue-50 text-blue-700 border-blue-200" },
                      { icon: "📍", label: "Near You", color: "bg-purple-50 text-purple-700 border-purple-200" },
                      { icon: "🔒", label: "Verified", color: "bg-yellow-50 text-yellow-700 border-yellow-200" },
                      { icon: "💸", label: "Earn Money", color: "bg-pink-50 text-pink-700 border-pink-200" },
                      { icon: "⚡", label: "Instant Book", color: "bg-orange-50 text-orange-700 border-orange-200" },
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
                  className="flex items-center gap-3 bg-gradient-to-r from-indigo-50 to-blue-50 rounded-2xl px-4 py-3 border border-indigo-100"
                >
                  <div className="w-9 h-9 shrink-0 bg-[#241e98] rounded-xl flex items-center justify-center shadow-md">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6 6 0 10-12 0v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
                  </div>
                  <div>
                    <p className="text-gray-800 text-xs font-bold">Stay Tuned!</p>
                    <p className="text-gray-500 text-[11px]">Big things are coming your way very soon. 🚀</p>
                  </div>
                </motion.div>

              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Under Construction Modal ── */}
      <AnimatePresence>
        {underConstructionMode && (
          <motion.div
            key="under-construction-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.35 }}
            className="fixed inset-0 z-[9999] flex items-center justify-center px-4"
            style={{ background: "rgba(30,15,0,0.82)", backdropFilter: "blur(8px)" }}
          >
            <motion.div
              key="under-construction-card"
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
                      { icon: "🔧", label: "Maintenance", color: "bg-orange-50 text-orange-700 border-orange-200" },
                      { icon: "⚙️", label: "Upgrading", color: "bg-amber-50 text-amber-700 border-amber-200" },
                      { icon: "🛡️", label: "Securing", color: "bg-yellow-50 text-yellow-700 border-yellow-200" },
                      { icon: "🚀", label: "Optimising", color: "bg-blue-50 text-blue-700 border-blue-200" },
                      { icon: "✅", label: "Almost Done", color: "bg-green-50 text-green-700 border-green-200" },
                      { icon: "🔔", label: "Back Soon", color: "bg-pink-50 text-pink-700 border-pink-200" },
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
    </div>
  );
}
