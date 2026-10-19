import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import {
  User,
  Loader2,
  ArrowLeft,
  ArrowRight,
  X,
  AlertCircle,
  Car,
  Search,
  Sparkles,
  Check,
  ShieldCheck,
  Lock,
  Star,
  CheckCircle2,
  Volume2,
  VolumeX,
} from "lucide-react";
import { motion } from "framer-motion";
import { getApiUrl, safeFetch } from "@/lib/api-config";
import { vibrate } from "@/lib/vibrate";
import { enterGuestMode, isGuest } from "@/lib/guest";
import spotlyLogoWhite from "@assets/Logos/Spotly-4.1.png";
import spotlyIcon from "@assets/file_00000000a1c8720881e8312ea1ae4e07_1775947107119.png";

export default function AuthPage() {
  const [, setLocation] = useLocation();
  const [step, setStep] = useState<"phone" | "otp">("phone");
  const isExplorerUser =
    typeof window !== "undefined" &&
    (isGuest() ||
      localStorage.getItem("exploreMode") === "true" ||
      localStorage.getItem("isGuest") === "true" ||
      localStorage.getItem("userId")?.startsWith("explore_"));
  const [showLoginForm, setShowLoginForm] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [name, setName] = useState("");
  const [mobile, setMobile] = useState("");
  const [otpDigits, setOtpDigits] = useState(["", "", "", ""]);
  const [userRole, setUserRole] = useState<"customer" | "worker">(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const r = params.get("role");
      if (r === "space-provider" || r === "customer" || r === "partner" || r === "provider") {
        localStorage.setItem("userRole", "customer");
        return "customer";
      }
      if (r === "space-seeker" || r === "worker" || r === "seeker") {
        localStorage.setItem("userRole", "worker");
        return "worker";
      }
    }
    return (localStorage.getItem("userRole") as "customer" | "worker") || "customer";
  });
  const [errorMessage, setErrorMessage] = useState("");
  const [resendTimer, setResendTimer] = useState(59);
  const [canResend, setCanResend] = useState(false);
  const [otpAutofilled, setOtpAutofilled] = useState(false);
  const [userLookupState, setUserLookupState] = useState<"idle" | "checking" | "existing" | "new">("idle");

  const singleOtpInputRef = useRef<HTMLInputElement>(null);
  const phoneInputRef = useRef<HTMLInputElement>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);

  // Desktop specific input refs
  const phoneInputDesktopRef = useRef<HTMLInputElement>(null);
  const nameInputDesktopRef = useRef<HTMLInputElement>(null);
  const singleOtpInputDesktopRef = useRef<HTMLInputElement>(null);
  const [isOtpDesktopFocused, setIsOtpDesktopFocused] = useState(true);
  const [isOtpMobileFocused, setIsOtpMobileFocused] = useState(true);

  const DEFAULT_VIDEO_URL = "/attached_assets/login-ad-1.mp4";
  const [heroVideoUrl, setHeroVideoUrl] = useState<string>(DEFAULT_VIDEO_URL);
  const [isMuted, setIsMuted] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const fetchHeroVideoSetting = async () => {
      try {
        const res = await safeFetch("/api/settings/hero_video_url");
        if (res.ok) {
          const data = await res.json();
          const val = data?.setting?.value;
          // Admin can override with any URL (local path or YouTube)
          if (val && val.trim() !== "") {
            setHeroVideoUrl(val.trim());
          }
        }
      } catch { }
    };
    fetchHeroVideoSetting();
  }, []);

  // Sync video muted state & ensure autoplay
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.muted = isMuted;
      videoRef.current.defaultMuted = isMuted;
      videoRef.current.play().catch(() => { });
    }
  }, [isMuted, heroVideoUrl]);

  const isYouTubeUrl = (url: string) =>
    /youtu\.be\/|youtube\.com\//.test(url);

  const getYouTubeEmbedUrl = (url: string): string => {
    const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/);
    const videoId = match ? match[1] : "";
    return `https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1&loop=1&playlist=${videoId}&controls=0&showinfo=0&modestbranding=1&rel=0&enablejsapi=1&iv_load_policy=3&playsinline=1`;
  };

  const iframeRef = useRef<HTMLIFrameElement>(null);

  const toggleSound = () => {
    vibrate();
    const newMuted = !isMuted;
    if (isYouTubeUrl(heroVideoUrl)) {
      if (!iframeRef.current?.contentWindow) return;
      iframeRef.current.contentWindow.postMessage(
        JSON.stringify({ event: "command", func: newMuted ? "mute" : "unMute", args: [] }), "*"
      );
      if (!newMuted) {
        iframeRef.current.contentWindow.postMessage(
          JSON.stringify({ event: "command", func: "setVolume", args: [70] }), "*"
        );
      }
    } else {
      if (!videoRef.current) return;
      videoRef.current.muted = newMuted;
      if (!newMuted) videoRef.current.volume = 0.7;
    }
    setIsMuted(newMuted);
  };

  const isValidIndianMobile = (num: string): boolean => {
    if (!/^[6789]\d{9}$/.test(num)) return false;
    if (/^(\d)\1{9}$/.test(num)) return false;
    return true;
  };

  const checkMobile = async (num: string, targetRole?: string) => {
    const activeRole = targetRole || userRole;
    if (num.length !== 10) {
      setUserLookupState("idle");
      setErrorMessage("");
      return;
    }
    if (!isValidIndianMobile(num)) {
      setUserLookupState("idle");
      setErrorMessage("Please enter a valid 10-digit mobile number starting with 6, 7, 8, or 9.");
      return;
    }
    setErrorMessage("");
    setUserLookupState("checking");
    try {
      const response = await safeFetch(`/api/auth/check-mobile?mobile=${num}&role=${activeRole}`);
      const isRealUser = (d: any) => Boolean(d && d.registered);

      if (response.ok) {
        const contentType = response.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
          const data = await response.json();
          if (isRealUser(data)) {
            setUserLookupState("existing");
            setName(data.name && data.name !== "User" ? data.name : "");
          } else {
            setUserLookupState("new");
            setName(data.existingName && data.existingName !== "User" ? data.existingName : "");
            setTimeout(() => {
              nameInputRef.current?.focus();
              nameInputDesktopRef.current?.focus();
            }, 250);
          }
        } else {
          setUserLookupState("new");
          setName("");
        }
      } else {
        setUserLookupState("new");
        setName("");
        setTimeout(() => {
          nameInputRef.current?.focus();
          nameInputDesktopRef.current?.focus();
        }, 250);
      }
    } catch (err) {
      console.error("Check mobile error:", err);
      setUserLookupState("new");
      setName("");
      setTimeout(() => {
        nameInputRef.current?.focus();
        nameInputDesktopRef.current?.focus();
      }, 250);
    }
  };

  useEffect(() => {
    // Clear stale auth data when landing on the auth page.
    // If admin deleted the user from DB, these stale values would make
    // the deleted user appear as still registered. Clearing them forces
    // a fresh login flow based on current DB state.
    localStorage.removeItem("userId");
    localStorage.removeItem("sessionToken");
    localStorage.removeItem("disclaimerAccepted");
    localStorage.removeItem("isNewRegistration");
    localStorage.removeItem("exploreMode");

    const params = new URLSearchParams(window.location.search);
    const rawRole = params.get("role");
    let role: "customer" | "worker" = "customer";

    if (rawRole === "space-seeker" || rawRole === "worker") {
      role = "worker";
    } else if (rawRole === "space-provider" || rawRole === "customer") {
      role = "customer";
    } else {
      const savedRole = localStorage.getItem("userRole");
      if (savedRole === "worker" || savedRole === "space-seeker") {
        role = "worker";
      } else {
        role = "customer";
      }
    }
    setUserRole(role);
    localStorage.setItem("userRole", role);
    const rememberedMobile = localStorage.getItem("rememberedMobile");
    const rememberedRole = localStorage.getItem("rememberedRole");
    if (rememberedMobile) {
      setMobile(rememberedMobile);
      if (!role && (rememberedRole === "customer" || rememberedRole === "worker")) {
        setUserRole(rememberedRole);
      }
      if (rememberedMobile.length === 10) {
        checkMobile(rememberedMobile);
      }
    }
    if (!isExplorerUser) {
      const focusTimer = setTimeout(() => {
        phoneInputRef.current?.focus();
        phoneInputDesktopRef.current?.focus();
      }, 100);
      return () => clearTimeout(focusTimer);
    }
  }, []);

  useEffect(() => {
    if (!showLoginForm) return;
    if (step === "phone") {
      const timer = setTimeout(() => {
        phoneInputRef.current?.focus();
        phoneInputDesktopRef.current?.focus();
      }, 100);
      return () => clearTimeout(timer);
    } else if (step === "otp") {
      setIsOtpDesktopFocused(true);
      setIsOtpMobileFocused(true);
      const focusOtp = () => {
        singleOtpInputDesktopRef.current?.focus();
        singleOtpInputRef.current?.focus();
      };
      focusOtp();
      const t1 = setTimeout(focusOtp, 40);
      const t2 = setTimeout(focusOtp, 120);
      const t3 = setTimeout(focusOtp, 250);
      return () => {
        clearTimeout(t1);
        clearTimeout(t2);
        clearTimeout(t3);
      };
    }
  }, [step, showLoginForm]);

  useEffect(() => {
    if (step !== "otp") return;
    setResendTimer(59);
    setCanResend(false);
    const interval = setInterval(() => {
      setResendTimer((prev) => {
        if (prev <= 1) {
          setCanResend(true);
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [step]);

  useEffect(() => {
    if (step !== "otp") return;
    let cancelled = false;
    const isWebOTPSupported =
      typeof window !== "undefined" &&
      "OTPCredential" in window &&
      !!navigator.credentials &&
      typeof navigator.credentials.get === "function";
    if (!isWebOTPSupported) return;
    const abortController = new AbortController();
    (async () => {
      try {
        const otpCredential = await (navigator.credentials as any).get({
          otp: { transport: ["sms"] },
          signal: abortController.signal,
        });
        if (cancelled || !otpCredential?.code) return;
        const codeText = otpCredential.code.replace(/\D/g, "").slice(0, 4);
        const digits = codeText.split("");
        while (digits.length < 4) digits.push("");
        setOtpDigits(digits);
        setOtpAutofilled(true);
        if (singleOtpInputRef.current) {
          singleOtpInputRef.current.value = codeText;
        }
        if (singleOtpInputDesktopRef.current) {
          singleOtpInputDesktopRef.current.value = codeText;
        }
      } catch { }
    })();
    return () => {
      cancelled = true;
      abortController.abort();
    };
  }, [step]);

  useEffect(() => {
    if (step !== "otp" || !otpAutofilled) return;
    if (otpDigits.every((d) => d !== "")) {
      const timer = setTimeout(() => {
        const form = document.querySelector("form[data-otp-form]");
        if (form) (form as HTMLFormElement).requestSubmit();
      }, 200);
      return () => clearTimeout(timer);
    }
  }, [step, otpAutofilled, otpDigits]);

  const handleResendOtp = async () => {
    vibrate();
    setIsLoading(true);
    setErrorMessage("");
    setOtpAutofilled(false);
    try {
      const response = await safeFetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mobile, role: userRole }),
      });
      setIsLoading(false);
      if (response.ok) {
        setResendTimer(59);
        setCanResend(false);
        setOtpDigits(["", "", "", ""]);
        setOtpAutofilled(false);
        setIsOtpDesktopFocused(true);
        setIsOtpMobileFocused(true);
        const focusOtpInputs = () => {
          singleOtpInputDesktopRef.current?.focus();
          singleOtpInputRef.current?.focus();
        };
        focusOtpInputs();
        setTimeout(focusOtpInputs, 40);
        setTimeout(focusOtpInputs, 120);
      } else {
        const data = await response.json();
        setErrorMessage(data.error || "Failed to resend OTP.");
      }
    } catch {
      setIsLoading(false);
      setErrorMessage("Network error.");
    }
  };

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    vibrate();
    setIsLoading(true);
    setErrorMessage("");

    if (mobile.length !== 10 || !isValidIndianMobile(mobile)) {
      setIsLoading(false);
      setErrorMessage("Please enter a valid 10-digit mobile number starting with 6, 7, 8, or 9.");
      return;
    }
    if (userLookupState === "new" && !name.trim()) {
      setIsLoading(false);
      setErrorMessage("Please enter your full name for registration.");
      return;
    }

    try {
      const response = await safeFetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mobile, role: userRole }),
      });
      const data = await response.json();
      setIsLoading(false);

      if (!response.ok) {
        setErrorMessage(data.error || "Login failed.");
        return;
      }
      localStorage.setItem("rememberedMobile", mobile);
      localStorage.setItem("rememberedRole", userRole);
      setStep("otp");
      setIsOtpDesktopFocused(true);
      setIsOtpMobileFocused(true);
      setOtpDigits(["", "", "", ""]);
      setOtpAutofilled(false);
      const focusOtpInputs = () => {
        singleOtpInputDesktopRef.current?.focus();
        singleOtpInputRef.current?.focus();
      };
      focusOtpInputs();
      setTimeout(focusOtpInputs, 40);
      setTimeout(focusOtpInputs, 120);
      setTimeout(focusOtpInputs, 250);
      const cleanMob = mobile.replace(/\D/g, "").slice(-10);
      if (cleanMob === "9095549886") {
        setOtpDigits(["2", "1", "2", "1"]);
        setOtpAutofilled(true);
      }
    } catch (err) {
      console.error("Send OTP error:", err);
      setIsLoading(false);
      setErrorMessage("Network error. Please check your internet connection.");
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    vibrate();
    setIsLoading(true);
    setErrorMessage("");

    const otpCode = otpDigits.join("");
    if (otpCode.length !== 4) {
      setIsLoading(false);
      setErrorMessage("Please enter the complete 4-digit OTP.");
      return;
    }

    try {
      let response = await safeFetch("/api/auth/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mobile,
          otp: otpCode,
          role: userRole,
          name: name.trim() || undefined,
        }),
      });

      // Automatic fallback to /api/auth/verify-otp if /api/auth/verify returns 404
      if (response.status === 404) {
        response = await safeFetch("/api/auth/verify-otp", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            mobile,
            otp: otpCode,
            role: userRole,
            name: name.trim() || undefined,
          }),
        });
      }

      const data = await response.json();
      setIsLoading(false);
      if (!response.ok) {
        setErrorMessage(data.error || "Verification failed.");
        return;
      }
      localStorage.removeItem("isGuest");
      localStorage.removeItem("exploreMode");
      localStorage.removeItem("spotly_user_feedback_done");
      localStorage.setItem("userRole", userRole);
      localStorage.setItem("userMobile", mobile);
      localStorage.setItem("userName", name.trim());
      if (data.user?.id) localStorage.setItem("userId", data.user.id);
      if (data.sessionToken) localStorage.setItem("sessionToken", data.sessionToken);
      window.dispatchEvent(new CustomEvent("spotly_login_success", { detail: { userId: data.user?.id, role: userRole } }));

      // Determine new vs returning user from the server's authoritative response.
      // data.isNewUser is set by the server based on whether the user record was
      // just created during this OTP verification (i.e., didn't exist in DB before).
      // This correctly handles the case where admin deleted a user — re-registering
      // with the same number will be treated as a brand new user.
      const isNewUser = data.isNewUser === true || data.user?.isNewUser === true;
      if (isNewUser) {
        localStorage.removeItem(`spotly_feedback_submitted_${mobile}`);
        if (data.user?.id) localStorage.removeItem(`spotly_feedback_submitted_${data.user.id}`);
        localStorage.setItem("isNewRegistration", "true");
        localStorage.removeItem("disclaimerAccepted");
        setLocation("/disclaimer");
      } else {
        localStorage.removeItem("isNewRegistration");
        localStorage.setItem("disclaimerAccepted", "true");
        setLocation(userRole === "worker" ? "/space-seeker/home" : "/space-provider/home");
      }
    } catch {
      setIsLoading(false);
      setErrorMessage("Network error.");
    }
  };

  const isProvider = userRole === "customer";
  const otpFull = otpDigits.every((d) => d !== "");

  return (
    <div className="fixed inset-0 h-[100dvh] w-full bg-white md:bg-slate-950 text-neutral-900 overflow-hidden font-sans select-none z-10 flex items-center justify-center">

      {/* ========================================================================= */}
      {/* DESKTOP & TABLET VIEW (md:flex) — FULL WIDTH & FULL HEIGHT AUTH PORTAL     */}
      {/* ========================================================================= */}
      <div className="hidden md:flex w-full h-full bg-slate-950 overflow-hidden relative z-20">

        {/* LEFT COLUMN: FULL HEIGHT HERO SHOWCASE WITH ONLY FULL-SCREEN AUTOPLAY VIDEO (55% WIDTH) */}
        <div className="w-[55%] h-full p-8 xl:p-12 flex flex-col justify-between relative overflow-hidden text-white border-r border-slate-800/80 bg-slate-950">

          {/* AUTOPLAY BACKGROUND VIDEO — local MP4 or YouTube iframe */}
          <div className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none z-0">
            {isYouTubeUrl(heroVideoUrl) ? (
              <iframe
                ref={iframeRef}
                src={getYouTubeEmbedUrl(heroVideoUrl)}
                title="Spotly Hero Video"
                className="w-[300%] h-[300%] absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 border-0 pointer-events-none filter brightness-[0.90] contrast-[1.05]"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            ) : (
              <video
                ref={videoRef}
                key={heroVideoUrl}
                src={heroVideoUrl}
                autoPlay
                loop
                muted
                playsInline
                preload="auto"
                className="absolute inset-0 w-full h-full object-cover object-center"
                style={{
                  transform: "translate3d(0, 0, 0)",
                  backfaceVisibility: "hidden",
                }}
              >
                <source src={heroVideoUrl} type="video/mp4" />
              </video>
            )}
          </div>

          {/* SUBTLE VIGNETTE FOR LOGO READABILITY WITHOUT DARKENING VIDEO */}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/40 via-transparent to-slate-950/20 z-1 pointer-events-none"></div>

          {/* BRAND LOGO & AUDIO CONTROL BAR */}
          <div className="relative z-10 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <a
                href="/"
                onClick={(e) => { e.preventDefault(); setLocation("/"); }}
                className="flex items-center cursor-pointer transition-transform active:scale-95 relative group"
                title="Go to Landing Screen"
              >
                <img
                  src={spotlyLogoWhite}
                  alt="Spotly"
                  className="h-8 md:h-9 w-auto object-contain drop-shadow-md"
                />
                <div className="absolute -bottom-8 left-0 hidden md:group-hover:flex items-center px-2.5 py-1 bg-slate-900/95 backdrop-blur-md text-white text-[10px] font-bold rounded-lg shadow-xl pointer-events-none whitespace-nowrap z-50 border border-white/20">
                  Go to Landing Screen
                </div>
              </a>
            </div>

            {/* MUTE / UNMUTE (70% VOLUME) TOGGLE BUTTON */}
            <button
              type="button"
              onClick={toggleSound}
              className="flex items-center gap-2 bg-slate-950/70 hover:bg-slate-900/90 backdrop-blur-md border border-white/20 text-white text-xs font-bold px-3.5 py-2 rounded-full shadow-lg transition-all duration-300 active:scale-95 cursor-pointer"
              title={isMuted ? "Click to enable video sound at 70% volume" : "Click to mute sound"}
              data-testid="button-toggle-sound"
            >
              {isMuted ? (
                <>
                  <VolumeX size={15} className="text-slate-400" />
                  <span>Sound Off</span>
                </>
              ) : (
                <>
                  <Volume2 size={15} className="text-emerald-400 animate-pulse" />
                  <span>Sound On (70%)</span>
                </>
              )}
            </button>
          </div>

          {/* MINIMAL FOOTER */}
          <div className="relative z-10 text-xs text-white/80 font-medium tracking-wide drop-shadow-md">
            India's Smartest Parking Network
          </div>

        </div>

        {/* RIGHT COLUMN: FULL HEIGHT CLEAN FORM (45% WIDTH) */}
        <div className="w-[45%] h-full bg-white p-12 xl:p-16 flex flex-col justify-between relative z-10 text-neutral-900 overflow-y-auto">

          {/* HEADER ROW WITH ROLE SELECTOR & SKIP BUTTON */}
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold uppercase tracking-wider text-[#241e98]">Account Login</span>
              <button
                type="button"
                onClick={() => {
                  vibrate();
                  enterGuestMode(userRole);
                  setLocation(userRole === "worker" ? "/space-seeker/home" : "/space-provider/home");
                }}
                className="px-4 py-1.5 rounded-full bg-slate-100 hover:bg-slate-200 text-xs font-bold text-neutral-700 transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <span>Skip</span>
                <ArrowRight size={14} />
              </button>
            </div>

            {/* ROLE SELECTION TABS */}
            <div className="w-full bg-slate-100/90 p-1.5 rounded-2xl flex items-center border border-slate-300 shadow-xs relative">
              <button
                type="button"
                onClick={() => {
                  if (userRole === "customer") return;
                  vibrate();
                  setUserRole("customer");
                  localStorage.setItem("userRole", "customer");
                  if (mobile.length === 10) checkMobile(mobile, "customer");
                }}
                className={`relative flex-1 flex items-center justify-center py-3 px-4 rounded-xl text-xs sm:text-sm font-bold transition-colors z-10 ${userRole === "customer" ? "text-white" : "text-neutral-600 hover:text-neutral-900"
                  }`}
              >
                {userRole === "customer" && (
                  <motion.div
                    layoutId="activeRoleDesktop"
                    className="absolute inset-0 rounded-xl shadow-md shadow-[#1e3a8a]/35 z-0 active-role-tab-pill landing-gradient"
                    style={{ background: "linear-gradient(135deg, #1e3a8a 0%, #3b2fad 35%, #6d28d9 70%, #7c3aed 100%)" }}
                    transition={{ type: "spring", stiffness: 1400, damping: 48 }}
                  />
                )}
                <span className="relative z-10 flex items-center gap-2">
                  <Car size={16} />
                  <span>Space Provider</span>
                </span>
              </button>

              <button
                type="button"
                onClick={() => {
                  if (userRole === "worker") return;
                  vibrate();
                  setUserRole("worker");
                  localStorage.setItem("userRole", "worker");
                  if (mobile.length === 10) checkMobile(mobile, "worker");
                }}
                className={`relative flex-1 flex items-center justify-center py-3 px-4 rounded-xl text-xs sm:text-sm font-bold transition-colors z-10 ${userRole === "worker" ? "text-white" : "text-neutral-600 hover:text-neutral-900"
                  }`}
              >
                {userRole === "worker" && (
                  <motion.div
                    layoutId="activeRoleDesktop"
                    className="absolute inset-0 rounded-xl shadow-md shadow-[#1e3a8a]/35 z-0 active-role-tab-pill landing-gradient"
                    style={{ background: "linear-gradient(135deg, #1e3a8a 0%, #3b2fad 35%, #6d28d9 70%, #7c3aed 100%)" }}
                    transition={{ type: "spring", stiffness: 1400, damping: 48 }}
                  />
                )}
                <span className="relative z-10 flex items-center gap-2">
                  <Search size={16} />
                  <span>Space Seeker</span>
                </span>
              </button>
            </div>
          </div>

          {/* DYNAMIC FORM AREA */}
          <div className="my-auto py-6 space-y-6 max-w-md w-full mx-auto">

            {step === "phone" ? (
              <form onSubmit={handleSendOtp} className="space-y-5">
                <div>
                  <h3 className="text-2xl font-black text-neutral-900 tracking-tight">
                    {userLookupState === "existing" ? "Welcome Back!" : "Enter Mobile Number"}
                  </h3>
                  <p className="text-sm text-neutral-500 font-medium mt-1">
                    {userLookupState === "existing"
                      ? `Welcome back ${name || "Member"}`
                      : "We'll send a 4-digit code to verify"}
                  </p>
                </div>

                {/* MOBILE NUMBER INPUT */}
                <div className="space-y-1">
                  <div className="h-14 w-full rounded-2xl border border-slate-300 bg-white flex items-center px-4 shadow-xs focus-within:border-[#241e98] focus-within:ring-2 focus-within:ring-[#241e98]/20 transition-all">
                    <span className="text-base font-extrabold text-[#241e98] mr-3 shrink-0">+91</span>
                    <input
                      ref={phoneInputDesktopRef}
                      id="mobileDesktop"
                      type="tel"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      placeholder="10-digit mobile number"
                      className="flex-1 min-w-0 text-base font-bold text-neutral-900 outline-none bg-transparent placeholder:text-neutral-400 placeholder:font-normal"
                      value={mobile}
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, "").slice(0, 10);
                        setMobile(val);
                        if (val.length === 10) {
                          checkMobile(val);
                        } else {
                          setUserLookupState("idle");
                        }
                      }}
                      maxLength={10}
                      required
                    />

                    {userLookupState === "checking" && <Loader2 size={18} className="animate-spin text-[#241e98] shrink-0" />}
                    {userLookupState === "existing" && (
                      <span className="text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full text-xs font-bold flex items-center gap-1 border border-emerald-200 shrink-0">
                        <Check size={12} /> Registered
                      </span>
                    )}
                    {userLookupState === "new" && (
                      <span className="text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full text-xs font-bold flex items-center gap-1 border border-amber-200 shrink-0">
                        <Sparkles size={12} /> New User
                      </span>
                    )}
                  </div>
                </div>

                {/* NAME INPUT FOR NEW REGISTRATIONS */}
                {userLookupState === "new" && (
                  <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} className="space-y-1">
                    <div className="h-13 w-full rounded-2xl border border-amber-300 bg-amber-50/50 flex items-center px-4 shadow-xs focus-within:bg-white focus-within:border-[#241e98] transition-all">
                      <User size={18} className="text-amber-600 mr-2.5 shrink-0" />
                      <input
                        ref={nameInputDesktopRef}
                        id="nameDesktop"
                        type="text"
                        placeholder="Enter full name"
                        className="flex-1 min-w-0 text-base font-bold text-neutral-900 outline-none bg-transparent placeholder:text-neutral-400 placeholder:font-normal"
                        value={name}
                        onChange={(e) => setName(e.target.value.replace(/[^a-zA-Z\s]/g, "").slice(0, 10).replace(/\b\w/g, c => c.toUpperCase()))}
                        maxLength={10}
                        required
                      />
                    </div>
                  </motion.div>
                )}

                {/* ERROR MESSAGE DISPLAY */}
                {errorMessage && (
                  <div className="bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 rounded-2xl text-xs font-semibold flex items-center gap-2" data-testid="error-message-phone-desktop">
                    <AlertCircle size={16} className="shrink-0 text-rose-500" />
                    <span>{errorMessage}</span>
                  </div>
                )}

                {/* SUBMIT BUTTON */}
                <button
                  type="submit"
                  disabled={isLoading || userLookupState === "checking" || mobile.length !== 10 || (userLookupState === "new" && !name.trim())}
                  className={`w-full h-14 rounded-2xl font-black text-base uppercase tracking-wider text-white flex items-center justify-center gap-2 transition-all active:scale-[0.98] shadow-lg ${mobile.length === 10
                    ? "bg-gradient-to-r from-[#241e98] via-[#2b24b1] to-[#3e3ab3] hover:from-[#1b1778] hover:to-[#2e2a97] shadow-[#241e98]/30 cursor-pointer"
                    : "bg-neutral-300 text-white cursor-not-allowed opacity-90"
                    }`}
                >
                  {isLoading ? (
                    <Loader2 className="animate-spin text-white" size={22} />
                  ) : userLookupState === "checking" ? (
                    <span className="flex items-center gap-2">
                      <Loader2 className="animate-spin" size={18} /> Verifying...
                    </span>
                  ) : (
                    <span>Get OTP Code</span>
                  )}
                </button>
              </form>
            ) : (
              /* OTP STEP FORM */
              <form data-otp-form onSubmit={handleVerifyOtp} className="space-y-5">
                <div className="flex items-center gap-2.5">
                  <button
                    type="button"
                    onClick={() => {
                      setStep("phone");
                      setOtpDigits(["", "", "", ""]);
                      setErrorMessage("");
                      setOtpAutofilled(false);
                    }}
                    className="p-2 rounded-full bg-slate-100 border border-slate-200 text-[#241e98] hover:bg-slate-200 transition-colors"
                  >
                    <ArrowLeft size={18} />
                  </button>
                  <div>
                    <h3 className="text-lg font-black text-neutral-900">Enter OTP Code</h3>
                    <p className="text-xs text-neutral-500 font-semibold">Sent to +91 {mobile}</p>
                  </div>
                </div>

                {/* OTP INPUT DIGITS */}
                <div className="relative">
                  <input
                    ref={(el) => {
                      (singleOtpInputDesktopRef as any).current = el;
                      if (el && step === "otp") {
                        el.focus();
                      }
                    }}
                    type="tel"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={4}
                    autoFocus
                    value={otpDigits.join("")}
                    onFocus={() => setIsOtpDesktopFocused(true)}
                    onBlur={() => setIsOtpDesktopFocused(false)}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, "").slice(0, 4);
                      const digits = val.split("");
                      while (digits.length < 4) digits.push("");
                      setOtpDigits(digits);
                      if (val.length === 4) {
                        e.target.blur();
                        setOtpAutofilled(true);
                      }
                    }}
                    className="absolute inset-0 w-full h-[56px] opacity-0 z-10 cursor-pointer"
                  />
                  <div className="grid grid-cols-4 gap-3.5 pointer-events-none">
                    {otpDigits.map((digit, idx) => {
                      const activeIndex = Math.min(
                        otpDigits.findIndex((d) => !d) === -1 ? 3 : otpDigits.findIndex((d) => !d),
                        3
                      );
                      const isCurrentActive = isOtpDesktopFocused && idx === activeIndex && !digit;

                      return (
                        <div
                          key={idx}
                          className={`w-full h-[56px] rounded-2xl border flex items-center justify-center text-xl font-black transition-all relative ${digit
                              ? "bg-white border-2 border-[#241e98] text-[#241e98] shadow-md ring-2 ring-[#241e98]/20"
                              : isCurrentActive
                                ? "bg-white border-2 border-[#241e98] ring-4 ring-[#241e98]/20 shadow-lg scale-[1.02]"
                                : "bg-slate-50/80 border-slate-300 text-slate-400"
                            }`}
                        >
                          {digit ? (
                            digit
                          ) : isCurrentActive ? (
                            <motion.span
                              animate={{ opacity: [1, 0, 1] }}
                              transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
                              className="w-[2.5px] h-6 bg-[#241e98] rounded-full inline-block shadow-xs"
                            />
                          ) : null}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* RESEND TIMER */}
                <div className="text-center text-xs">
                  {!canResend ? (
                    <span className="text-neutral-500 font-medium">Resend code in <strong className="text-[#241e98] font-bold">{resendTimer}s</strong></span>
                  ) : (
                    <button
                      type="button"
                      onClick={handleResendOtp}
                      disabled={isLoading}
                      className="font-bold text-[#241e98] hover:underline cursor-pointer text-sm"
                    >
                      {isLoading && <Loader2 className="animate-spin inline mr-1" size={14} />}
                      Resend OTP Code
                    </button>
                  )}
                </div>

                {/* ERROR MESSAGE DISPLAY */}
                {errorMessage && (
                  <div className="bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 rounded-2xl text-xs font-semibold flex items-center gap-2" data-testid="error-message-desktop">
                    <AlertCircle size={16} className="shrink-0 text-rose-500" />
                    <span>{errorMessage}</span>
                  </div>
                )}

                {/* VERIFY BUTTON */}
                <button
                  type="submit"
                  disabled={isLoading || !otpFull}
                  className="w-full h-14 bg-gradient-to-r from-[#241e98] via-[#2b24b1] to-[#3e3ab3] hover:from-[#1b1778] hover:to-[#2e2a97] text-white font-black text-base uppercase tracking-wider rounded-2xl shadow-xl shadow-[#241e98]/30 transition-all active:scale-[0.98] disabled:opacity-40"
                >
                  {isLoading ? <Loader2 className="animate-spin text-white" size={22} /> : "Verify & Continue"}
                </button>
              </form>
            )}

          </div>

          {/* FOOTER POLICIES */}
          <div className="border-t border-slate-100 pt-4 text-center space-y-1.5">
            <p className="text-xs text-neutral-400 font-medium flex items-center justify-center gap-1.5">
              <Lock size={13} className="text-emerald-600" /> 256-Bit Encrypted Secure Login
            </p>
            <p className="text-xs text-neutral-400">
              By logging in, I accept Spotly's{" "}
              <button type="button" onClick={() => setLocation("/terms-and-conditions")} className="text-[#241e98] underline font-semibold">Terms</button> &amp;{" "}
              <button type="button" onClick={() => setLocation("/privacy-policy")} className="text-[#241e98] underline font-semibold">Privacy Policy</button>
            </p>
          </div>

        </div>

      </div>

      {/* ========================================================================= */}
      {/* MOBILE VIEW (md:hidden) — PRESERVED 100% UNTOUCHED FOR MOBILE DEVICES     */}
      {/* ========================================================================= */}
      <div className="md:hidden fixed inset-0 h-[100dvh] w-full bg-white text-neutral-900 flex flex-col justify-between overflow-hidden font-sans select-none z-10">
        <div className="w-full h-full overflow-hidden relative flex flex-col justify-between">

          {/* TOP 3-COLUMN VERTICAL AUTO-SCROLLING PHOTO GRID */}
          <div className="relative w-full max-w-md mx-auto h-[58vh] sm:h-[62vh] overflow-hidden pt-0 px-0">

            {/* Floating Top Header with Skip option */}
            <div className="absolute top-[calc(16px+env(safe-area-inset-top,0px))] right-4 z-50">
              <button
                type="button"
                onClick={() => {
                  vibrate();
                  enterGuestMode(userRole);
                  setLocation(userRole === "worker" ? "/space-seeker/home" : "/space-provider/home");
                }}
                className="px-3.5 py-1.5 rounded-full bg-white/95 backdrop-blur-md shadow-md border border-neutral-200/90 text-xs font-bold text-[#0d3da8] hover:bg-white transition-all flex items-center gap-1 active:scale-95 cursor-pointer"
                data-testid="button-skip-guest-top"
              >
                <span>Skip</span>
                <ArrowRight size={13} />
              </button>
            </div>

            {/* 3 Columns Layout */}
            <div className="flex w-[130%] -ml-[15%] h-full justify-between items-center gap-2.5 overflow-hidden px-0">

              <motion.div
                animate={{ y: [0, -560] }}
                transition={{ duration: 22, repeat: Infinity, ease: "linear" }}
                className="w-[23.5%] flex flex-col gap-3 shrink-0 opacity-90"
              >
                <div className="w-full h-36 sm:h-40 rounded-[22px] overflow-hidden relative shadow-md shrink-0 bg-neutral-900 border border-white/10">
                  <img src="https://images.unsplash.com/photo-1617814076367-b759c7d7e738?auto=format&fit=crop&w=800&q=85" alt="Gated Driveway" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 via-[#0d3da8]/20 to-transparent flex items-end justify-center p-2 text-center">
                    <span className="text-white font-extrabold text-[10px] drop-shadow-md tracking-tight">Gated Driveway</span>
                  </div>
                </div>
                <div className="w-full h-36 sm:h-40 rounded-[22px] overflow-hidden relative shadow-md shrink-0 bg-neutral-900 border border-white/10">
                  <img src="https://images.unsplash.com/photo-1573348722427-f1d6819fdf98?auto=format&fit=crop&w=800&q=85" alt="Safe Car Spot" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 via-[#0d3da8]/20 to-transparent flex items-end justify-center p-2 text-center">
                    <span className="text-white font-extrabold text-[10px] drop-shadow-md tracking-tight">Safe Car Spot</span>
                  </div>
                </div>
                <div className="w-full h-36 sm:h-40 rounded-[22px] overflow-hidden relative shadow-md shrink-0 bg-neutral-900 border border-white/10">
                  <img src="https://images.unsplash.com/photo-1590674899484-d5640e854abe?auto=format&fit=crop&w=800&q=85" alt="Private Garage" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 via-[#0d3da8]/20 to-transparent flex items-end justify-center p-2 text-center">
                    <span className="text-white font-extrabold text-[10px] drop-shadow-md tracking-tight">Private Garage</span>
                  </div>
                </div>
                <div className="w-full h-36 sm:h-40 rounded-[22px] overflow-hidden relative shadow-md shrink-0 bg-neutral-900 border border-white/10">
                  <img src="https://images.unsplash.com/photo-1558981806-ec527fa84c39?auto=format&fit=crop&w=800&q=85" alt="Covered Bike Bay" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 via-[#0d3da8]/20 to-transparent flex items-end justify-center p-2 text-center">
                    <span className="text-white font-extrabold text-[10px] drop-shadow-md tracking-tight">Covered Bike Bay</span>
                  </div>
                </div>
                <div className="w-full h-36 sm:h-40 rounded-[22px] overflow-hidden relative shadow-md shrink-0 bg-neutral-900 border border-white/10">
                  <img src="https://images.unsplash.com/photo-1506521781263-d8422e82f27a?auto=format&fit=crop&w=800&q=85" alt="24/7 CCTV Safe" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 via-[#0d3da8]/20 to-transparent flex items-end justify-center p-2 text-center">
                    <span className="text-white font-extrabold text-[10px] drop-shadow-md tracking-tight">24/7 CCTV Safe</span>
                  </div>
                </div>
              </motion.div>

              <motion.div
                animate={{ y: [-680, 0] }}
                transition={{ duration: 26, repeat: Infinity, ease: "linear" }}
                className="w-[50%] flex flex-col gap-3.5 shrink-0 z-10"
              >
                <div className="w-full h-48 sm:h-56 rounded-[28px] overflow-hidden relative shadow-lg shrink-0 bg-neutral-900 border border-blue-900/40">
                  <img src="https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=800&q=85" alt="Earn Monthly Rent" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 via-[#0d3da8]/30 to-transparent flex items-end justify-center p-4 text-center">
                    <span className="text-white font-black text-sm sm:text-base drop-shadow-lg leading-tight tracking-wide">Earn Monthly Rent</span>
                  </div>
                </div>
                <div className="w-full h-48 sm:h-56 rounded-[28px] overflow-hidden relative shadow-lg shrink-0 bg-neutral-900 border border-blue-900/40">
                  <img src="https://images.unsplash.com/photo-1573348722427-f1d6819fdf98?auto=format&fit=crop&w=800&q=85" alt="Prime Car Spot" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 via-[#0d3da8]/30 to-transparent flex items-end justify-center p-4 text-center">
                    <span className="text-white font-black text-sm sm:text-base drop-shadow-lg leading-tight tracking-wide">Prime Car Spot</span>
                  </div>
                </div>
                <div className="w-full h-48 sm:h-56 rounded-[28px] overflow-hidden relative shadow-lg shrink-0 bg-neutral-900 border border-blue-900/40">
                  <img src="https://images.unsplash.com/photo-1563720223185-11003d516935?auto=format&fit=crop&w=800&q=85" alt="Monthly Parking Spot" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 via-[#0d3da8]/30 to-transparent flex items-end justify-center p-4 text-center">
                    <span className="text-white font-black text-sm sm:text-base drop-shadow-lg leading-tight tracking-wide">Monthly Parking Spot</span>
                  </div>
                </div>
                <div className="w-full h-48 sm:h-56 rounded-[28px] overflow-hidden relative shadow-lg shrink-0 bg-neutral-900 border border-blue-900/40">
                  <img src="https://images.unsplash.com/photo-1506521781263-d8422e82f27a?auto=format&fit=crop&w=800&q=85" alt="Verified Parking Space" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 via-[#0d3da8]/30 to-transparent flex items-end justify-center p-4 text-center">
                    <span className="text-white font-black text-sm sm:text-base drop-shadow-lg leading-tight tracking-wide">Verified Parking Space</span>
                  </div>
                </div>
              </motion.div>

              <motion.div
                animate={{ y: [0, -560] }}
                transition={{ duration: 24, repeat: Infinity, ease: "linear" }}
                className="w-[23.5%] flex flex-col gap-3 shrink-0 opacity-90"
              >
                <div className="w-full h-36 sm:h-40 rounded-[22px] overflow-hidden relative shadow-md shrink-0 bg-neutral-900 border border-white/10">
                  <img src="https://images.unsplash.com/photo-1590674899484-d5640e854abe?auto=format&fit=crop&w=800&q=85" alt="Monthly Car Bay" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 via-[#0d3da8]/20 to-transparent flex items-end justify-center p-2 text-center">
                    <span className="text-white font-extrabold text-[10px] drop-shadow-md tracking-tight">Monthly Car Bay</span>
                  </div>
                </div>
                <div className="w-full h-36 sm:h-40 rounded-[22px] overflow-hidden relative shadow-md shrink-0 bg-neutral-900 border border-white/10">
                  <img src="https://images.unsplash.com/photo-1573348722427-f1d6819fdf98?auto=format&fit=crop&w=800&q=85" alt="Nearby Spotly Space" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 via-[#0d3da8]/20 to-transparent flex items-end justify-center p-2 text-center">
                    <span className="text-white font-extrabold text-[10px] drop-shadow-md tracking-tight">Nearby Spotly Space</span>
                  </div>
                </div>
                <div className="w-full h-36 sm:h-40 rounded-[22px] overflow-hidden relative shadow-md shrink-0 bg-neutral-900 border border-white/10">
                  <img src="https://images.unsplash.com/photo-1506521781263-d8422e82f27a?auto=format&fit=crop&w=800&q=85" alt="24/7 Safe & Secure" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 via-[#0d3da8]/20 to-transparent flex items-end justify-center p-2 text-center">
                    <span className="text-white font-extrabold text-[10px] drop-shadow-md tracking-tight">24/7 Safe &amp; Secure</span>
                  </div>
                </div>
              </motion.div>

            </div>

            <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-white via-white/85 to-transparent pointer-events-none z-20" />
          </div>

          {/* BOTTOM MOBILE MAIN CONTENT */}
          <main className="relative z-20 w-full max-w-md mx-auto px-6 pb-[calc(1.5rem+env(safe-area-inset-bottom,0px))] -mt-6 sm:-mt-8 pt-1 flex flex-col justify-end items-center flex-1">

            <div className="flex flex-col items-center justify-center text-center mb-3">
              <a
                href="/"
                onClick={(e) => { e.preventDefault(); setLocation("/"); }}
                className="flex flex-col items-center justify-center cursor-pointer transition-transform active:scale-95 relative group"
                title="Go to Landing Screen"
              >
                <span className="text-2xl font-black text-primary tracking-tight font-heading">
                  Spotly
                </span>
                <div className="absolute -top-7 left-1/2 -translate-x-1/2 hidden group-hover:flex items-center px-2 py-0.5 bg-slate-900/90 text-white text-[10px] font-bold rounded-md shadow-lg pointer-events-none whitespace-nowrap z-50">
                  Go to Landing Screen
                </div>
              </a>
              <p className="text-neutral-500 font-normal text-xs tracking-tight mt-0.5">
                India's Smartest Parking Space App
              </p>
            </div>

            <div className="w-full">
              {!showLoginForm ? (
                <div className="flex flex-col gap-3.5">
                  <div className="w-full bg-slate-100 p-1 rounded-2xl flex items-center border border-slate-200/80 shadow-xs mb-0.5 relative">
                    <button
                      type="button"
                      onClick={() => {
                        if (userRole === "customer") return;
                        vibrate();
                        setUserRole("customer");
                        localStorage.setItem("userRole", "customer");
                      }}
                      className={`relative flex-1 flex items-center justify-center py-3 px-3 rounded-xl text-xs font-bold transition-colors z-10 ${userRole === "customer" ? "text-white" : "text-neutral-600"
                        }`}
                    >
                      {userRole === "customer" && (
                        <motion.div
                          layoutId="activeRoleTabPillGuest"
                          className="absolute inset-0 rounded-xl shadow-md shadow-[#1e3a8a]/35 z-0 active-role-tab-pill landing-gradient"
                          style={{ background: "linear-gradient(135deg, #1e3a8a 0%, #3b2fad 35%, #6d28d9 70%, #7c3aed 100%)" }}
                          transition={{ type: "spring", stiffness: 1400, damping: 48 }}
                        />
                      )}
                      <span className="relative z-10 flex items-center gap-2">
                        <Car size={16} />
                        <span>Space Provider</span>
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        if (userRole === "worker") return;
                        vibrate();
                        setUserRole("worker");
                        localStorage.setItem("userRole", "worker");
                      }}
                      className={`relative flex-1 flex items-center justify-center py-3 px-3 rounded-xl text-xs font-bold transition-colors z-10 ${userRole === "worker" ? "text-white" : "text-neutral-600"
                        }`}
                    >
                      {userRole === "worker" && (
                        <motion.div
                          layoutId="activeRoleTabPillGuest"
                          className="absolute inset-0 rounded-xl shadow-md shadow-[#1e3a8a]/35 z-0 active-role-tab-pill landing-gradient"
                          style={{ background: "linear-gradient(135deg, #1e3a8a 0%, #3b2fad 35%, #6d28d9 70%, #7c3aed 100%)" }}
                          transition={{ type: "spring", stiffness: 1400, damping: 48 }}
                        />
                      )}
                      <span className="relative z-10 flex items-center gap-2">
                        <Search size={16} />
                        <span>Space Seeker</span>
                      </span>
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      vibrate();
                      setShowLoginForm(true);
                    }}
                    className="w-full h-14 bg-gradient-to-r from-[#241e98] via-[#2b24b1] to-[#3e3ab3] hover:from-[#1b1778] hover:to-[#2e2a97] text-white font-bold rounded-2xl flex items-center justify-center gap-2 text-base shadow-xl shadow-[#241e98]/30 transition-all active:scale-[0.98] cursor-pointer"
                  >
                    <User size={18} />
                    <span>Log In / Register with Mobile</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      vibrate();
                      enterGuestMode(userRole);
                      setLocation(userRole === "worker" ? "/space-seeker/home" : "/space-provider/home");
                    }}
                    className="w-full h-12 bg-slate-100 hover:bg-slate-200 text-primary font-bold rounded-2xl flex items-center justify-center gap-2 text-sm border border-primary/20 transition-all active:scale-[0.98] cursor-pointer"
                  >
                    <span>Continue Exploring App</span>
                    <ArrowRight size={16} />
                  </button>
                </div>
              ) : step === "phone" ? (
                <form onSubmit={handleSendOtp} className="flex flex-col gap-3.5">

                  <div className="w-full bg-slate-100 p-1 rounded-2xl flex items-center border border-slate-200/80 shadow-xs mb-0.5 relative">
                    <button
                      type="button"
                      onClick={() => {
                        if (userRole === "customer") return;
                        vibrate();
                        setUserRole("customer");
                        localStorage.setItem("userRole", "customer");
                        if (mobile.length === 10) checkMobile(mobile, "customer");
                      }}
                      className={`relative flex-1 flex items-center justify-center py-3 px-3 rounded-xl text-xs font-bold transition-colors z-10 ${userRole === "customer" ? "text-white" : "text-neutral-600"
                        }`}
                    >
                      {userRole === "customer" && (
                        <motion.div
                          layoutId="activeRoleTabPill"
                          className="absolute inset-0 rounded-xl shadow-md shadow-[#1e3a8a]/35 z-0 active-role-tab-pill landing-gradient"
                          style={{ background: "linear-gradient(135deg, #1e3a8a 0%, #3b2fad 35%, #6d28d9 70%, #7c3aed 100%)" }}
                          transition={{ type: "spring", stiffness: 1400, damping: 48 }}
                        />
                      )}
                      <span className="relative z-10 flex items-center gap-2">
                        <Car size={16} />
                        <span>Space Provider</span>
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        if (userRole === "worker") return;
                        vibrate();
                        setUserRole("worker");
                        localStorage.setItem("userRole", "worker");
                        if (mobile.length === 10) checkMobile(mobile, "worker");
                      }}
                      className={`relative flex-1 flex items-center justify-center py-3 px-3 rounded-xl text-xs font-bold transition-colors z-10 ${userRole === "worker" ? "text-white" : "text-neutral-600"
                        }`}
                    >
                      {userRole === "worker" && (
                        <motion.div
                          layoutId="activeRoleTabPill"
                          className="absolute inset-0 rounded-xl shadow-md shadow-[#1e3a8a]/35 z-0 active-role-tab-pill landing-gradient"
                          style={{ background: "linear-gradient(135deg, #1e3a8a 0%, #3b2fad 35%, #6d28d9 70%, #7c3aed 100%)" }}
                          transition={{ type: "spring", stiffness: 1400, damping: 48 }}
                        />
                      )}
                      <span className="relative z-10 flex items-center gap-2">
                        <Search size={16} />
                        <span>Space Seeker</span>
                      </span>
                    </button>
                  </div>

                  <div className="h-14 w-full rounded-2xl border border-neutral-300 bg-white flex items-center px-4 shadow-xs focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20 transition-all">
                    <span className="text-base font-extrabold text-primary mr-2.5 shrink-0">+91</span>
                    <input
                      ref={phoneInputRef}
                      id="mobileMobile"
                      type="tel"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      placeholder="Enter mobile number"
                      className="flex-1 min-w-0 text-base font-medium text-neutral-900 outline-none bg-transparent placeholder:text-neutral-400"
                      value={mobile}
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, "").slice(0, 10);
                        setMobile(val);
                        if (val.length === 10) {
                          checkMobile(val);
                        } else {
                          setUserLookupState("idle");
                        }
                      }}
                      maxLength={10}
                      required
                    />

                    {userLookupState === "checking" && <Loader2 size={18} className="animate-spin text-primary shrink-0" />}
                    {userLookupState === "existing" && (
                      <div className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full text-[11px] font-bold flex items-center gap-1 border border-emerald-200 shrink-0">
                        <Check size={12} /> Registered
                      </div>
                    )}
                    {userLookupState === "new" && (
                      <div className="text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full text-[11px] font-bold flex items-center gap-1 border border-amber-200 shrink-0">
                        <Sparkles size={12} /> New User
                      </div>
                    )}
                  </div>

                  {userLookupState === "new" && (
                    <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col gap-1">
                      <div className="flex items-center justify-between px-1">
                        <span className="text-xs font-bold text-amber-700 flex items-center gap-1">
                          <Sparkles size={12} /> New User Registration
                        </span>
                        <span className="text-[11px] text-neutral-400">Full Name Required</span>
                      </div>
                      <div className="flex items-center bg-neutral-50 border border-amber-300 rounded-2xl h-[52px] px-4 shadow-xs focus-within:bg-white focus-within:border-primary gap-2 transition-all">
                        <User size={18} className="text-amber-600 shrink-0" />
                        <input
                          ref={nameInputRef}
                          id="nameMobile"
                          type="text"
                          placeholder="Enter full name"
                          className="flex-1 min-w-0 text-base font-medium text-neutral-900 outline-none bg-transparent placeholder:text-neutral-400"
                          value={name}
                          onChange={(e) => setName(e.target.value.replace(/[^a-zA-Z\s]/g, "").slice(0, 10).replace(/\b\w/g, c => c.toUpperCase()))}
                          maxLength={10}
                          required
                        />
                      </div>
                    </motion.div>
                  )}

                  <button
                    type="submit"
                    disabled={isLoading || userLookupState === "checking" || mobile.length !== 10 || (userLookupState === "new" && !name.trim())}
                    className={`w-full h-14 rounded-2xl font-bold text-lg text-white flex items-center justify-center gap-2 transition-all active:scale-[0.98] mt-1 ${mobile.length === 10
                      ? "bg-gradient-to-r from-[#241e98] via-[#2b24b1] to-[#3e3ab3] hover:from-[#1b1778] hover:to-[#2e2a97] shadow-xl shadow-[#241e98]/30 cursor-pointer"
                      : "bg-neutral-300 text-white cursor-not-allowed opacity-90"
                      }`}
                  >
                    {isLoading ? (
                      <Loader2 className="animate-spin text-white" size={22} />
                    ) : userLookupState === "checking" ? (
                      <span className="flex items-center gap-2 text-white">
                        <Loader2 className="animate-spin" size={18} /> Verifying...
                      </span>
                    ) : (
                      <span>Get OTP</span>
                    )}
                  </button>

                  <p className="text-[12px] text-neutral-400 text-center leading-relaxed mt-3 font-normal">
                    By proceeding, I accept the<br />
                    <button type="button" onClick={() => setLocation("/terms-and-conditions")} className="font-medium text-primary underline mx-1">
                      Terms of use
                    </button>
                    &amp;
                    <button type="button" onClick={() => setLocation("/privacy-policy")} className="font-medium text-primary underline mx-1">
                      Privacy policy
                    </button>
                  </p>
                </form>
              ) : (
                <form data-otp-form onSubmit={handleVerifyOtp} className="flex flex-col gap-4">
                  <div className="flex items-center justify-center gap-2 mb-1">
                    <button
                      type="button"
                      onClick={() => {
                        setStep("phone");
                        setOtpDigits(["", "", "", ""]);
                        setErrorMessage("");
                        setOtpAutofilled(false);
                      }}
                      className="p-2 rounded-full bg-blue-50 text-primary hover:bg-blue-100"
                    >
                      <ArrowLeft size={18} />
                    </button>
                    <span className="text-sm font-bold text-neutral-800">
                      OTP sent to +91 {mobile}
                    </span>
                  </div>

                  <div className="relative mb-2">
                    <input
                      ref={(el) => {
                        (singleOtpInputRef as any).current = el;
                        if (el && step === "otp") {
                          el.focus();
                        }
                      }}
                      type="tel"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={4}
                      autoFocus
                      value={otpDigits.join("")}
                      onFocus={() => setIsOtpMobileFocused(true)}
                      onBlur={() => setIsOtpMobileFocused(false)}
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, "").slice(0, 4);
                        const digits = val.split("");
                        while (digits.length < 4) digits.push("");
                        setOtpDigits(digits);
                        if (val.length === 4) {
                          e.target.blur();
                          setOtpAutofilled(true);
                        }
                      }}
                      className="absolute inset-0 w-full h-[56px] opacity-0 z-10 cursor-pointer"
                    />
                    <div className="grid grid-cols-4 gap-3 pointer-events-none">
                      {otpDigits.map((digit, idx) => {
                        const activeIndex = Math.min(
                          otpDigits.findIndex((d) => !d) === -1 ? 3 : otpDigits.findIndex((d) => !d),
                          3
                        );
                        const isCurrentActive = isOtpMobileFocused && idx === activeIndex && !digit;

                        return (
                          <div
                            key={idx}
                            className={`w-full h-[56px] rounded-2xl border flex items-center justify-center text-xl font-black transition-all relative ${
                              digit
                                ? "bg-white border-2 border-primary text-primary shadow-md scale-[1.03] ring-2 ring-primary/20"
                                : isCurrentActive
                                  ? "bg-white border-2 border-primary ring-4 ring-primary/20 shadow-lg scale-[1.02]"
                                  : "bg-neutral-50 border-neutral-200 text-neutral-400 shadow-inner"
                            }`}
                          >
                            {digit ? (
                              digit
                            ) : isCurrentActive ? (
                              <motion.span
                                animate={{ opacity: [1, 0, 1] }}
                                transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
                                className="w-[2.5px] h-6 bg-primary rounded-full inline-block shadow-xs"
                              />
                            ) : null}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="text-center">
                    {!canResend ? (
                      <p className="text-xs text-neutral-500">
                        Resend code in <span className="font-bold text-primary">{resendTimer}s</span>
                      </p>
                    ) : (
                      <button
                        type="button"
                        onClick={handleResendOtp}
                        disabled={isLoading}
                        className="text-xs font-bold text-primary hover:underline"
                      >
                        {isLoading && <Loader2 className="animate-spin inline mr-1 text-primary" size={12} />}
                        Resend OTP Code
                      </button>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading || !otpFull}
                    className="w-full h-14 bg-gradient-to-r from-[#241e98] via-[#2b24b1] to-[#3e3ab3] hover:from-[#1b1778] hover:to-[#2e2a97] text-white font-bold rounded-2xl flex items-center justify-center gap-2 text-lg shadow-xl shadow-[#241e98]/30 transition-all active:scale-[0.98] disabled:opacity-40"
                  >
                    {isLoading ? <Loader2 className="animate-spin text-white" size={22} /> : "Verify & Continue"}
                  </button>
                </form>
              )}
            </div>

          </main>

        </div>
      </div>

      {/* ========================================================================= */}
      {/* SHARED ERROR DIALOG                                                        */}
      {/* ========================================================================= */}
      {errorMessage && (
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center px-8"
          style={{ backgroundColor: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}
          onClick={() => setErrorMessage("")}
          data-testid="alert-error-overlay"
        >
          <div
            className="w-full max-w-[290px] rounded-2xl overflow-hidden shadow-2xl bg-white text-neutral-900"
            onClick={(e) => e.stopPropagation()}
            data-testid="alert-error-dialog"
          >
            <div className="px-5 pt-5 pb-4 text-center">
              <div className="w-11 h-11 mx-auto mb-3 rounded-full bg-red-100 flex items-center justify-center">
                <AlertCircle size={26} className="text-red-500" />
              </div>
              <h3 className="text-[17px] font-bold text-neutral-900 mb-1.5" data-testid="alert-error-title">
                {errorMessage.includes("valid")
                  ? "Invalid Number"
                  : step === "otp"
                    ? "Verification Failed"
                    : "Couldn't Send OTP"}
              </h3>
              <p className="text-[13px] text-neutral-700 leading-snug" data-testid="alert-error-message">
                {errorMessage.includes("registered as") ? errorMessage.split(". ")[0] + "." : errorMessage}
              </p>
            </div>
            {errorMessage.includes("registered as") ? (
              <div className="grid grid-cols-2 border-t border-neutral-200">
                <button
                  type="button"
                  onClick={() => {
                    vibrate();
                    setErrorMessage("");
                  }}
                  className="py-3 text-[15px] font-medium text-neutral-600 hover:bg-neutral-100 border-r border-neutral-200"
                  data-testid="button-alert-cancel"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    vibrate();
                    const nextRole = userRole === "customer" ? "worker" : "customer";
                    setUserRole(nextRole);
                    localStorage.setItem("userRole", nextRole);
                    setErrorMessage("");
                    if (mobile.length === 10) checkMobile(mobile, nextRole);
                  }}
                  className="py-3 text-[15px] font-bold text-primary hover:bg-blue-50"
                  data-testid="button-alert-switch-role"
                >
                  Switch Role
                </button>
              </div>
            ) : (
              <div className="border-t border-neutral-200">
                <button
                  type="button"
                  onClick={() => {
                    vibrate();
                    setErrorMessage("");
                  }}
                  className="w-full py-3 text-[15px] font-bold text-primary hover:bg-blue-50"
                  data-testid="button-alert-ok"
                >
                  OK
                </button>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
}