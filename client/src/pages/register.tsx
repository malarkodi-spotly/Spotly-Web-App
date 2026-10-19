import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { Loader2, X, Car, Search, MapPin, Shield, Clock } from "lucide-react";
import { getApiUrl } from "@/lib/api-config";
import { vibrate } from "@/lib/vibrate";
import spotlyLogoWhite from "@assets/Logos/spotly_full-white.png";

export default function RegisterPage() {
  const [, setLocation] = useLocation();
  const [isLoading, setIsLoading] = useState(false);
  const [name, setName] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [userRole, setUserRole] = useState<"customer" | "worker">("customer");
  const nameInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const rawRole = params.get("role");
    let role: "customer" | "worker" | null = null;
    if (rawRole === "space-provider" || rawRole === "customer") {
      role = "customer";
    } else if (rawRole === "space-seeker" || rawRole === "worker") {
      role = "worker";
    }
    if (role) {
      setUserRole(role);
    } else {
      const storedRole = localStorage.getItem("userRole") as "customer" | "worker";
      if (storedRole) setUserRole(storedRole);
    }
    setTimeout(() => nameInputRef.current?.focus(), 400);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    vibrate();
    setIsLoading(true);
    setErrorMessage("");

    const userId = localStorage.getItem("userId");
    if (!userId) {
      setErrorMessage("Session expired. Please login again.");
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch(getApiUrl(`/api/users/${userId}`), {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim() }),
      });

      if (response.ok) {
        localStorage.setItem("userName", name.trim());

        if (userRole === "worker") {
          try {
            await fetch(getApiUrl("/api/workers/profile"), {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                userId,
                services: [],
              }),
            });
          } catch (err) {
            console.error("Failed to create worker profile:", err);
          }
        }

        setLocation("/disclaimer");
      } else {
        const data = await response.json();
        setErrorMessage(data.error || "Failed to save. Please try again.");
      }
      setIsLoading(false);
    } catch (error) {
      setIsLoading(false);
      setErrorMessage("Network error. Please try again.");
    }
  };

  const isProvider = userRole === "customer";
  const heroTagline = isProvider ? "List your space,\nearn monthly" : "Find parking\nnear you";

  return (
    <div className="fixed inset-0 w-screen h-screen overflow-hidden flex flex-col items-center justify-center">
      <div className="fixed inset-0 w-full h-full bg-gradient-to-br from-[#0d3da8] via-[#1a56db] to-[#2563eb]">
        <div className="absolute -top-24 -left-24 w-72 h-72 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute top-1/3 -right-20 w-64 h-64 rounded-full bg-blue-400/20 blur-3xl" />
        <div className="absolute -bottom-24 left-1/4 w-72 h-72 rounded-full bg-blue-300/15 blur-3xl" />
        {isProvider ? (
          <>
            <div className="absolute top-[14%] right-[8%] w-20 h-20 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center rotate-12 shadow-2xl backdrop-blur-sm">
              <span className="text-white/90 text-4xl font-black drop-shadow">P</span>
            </div>
            <div className="absolute top-[42%] left-[6%] w-14 h-14 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center -rotate-6 backdrop-blur-sm">
              <Car size={26} className="text-white/80" />
            </div>
            <div className="absolute bottom-[26%] right-[10%] w-12 h-12 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center rotate-6 backdrop-blur-sm">
              <span className="text-white/80 text-2xl">₹</span>
            </div>
            <div className="absolute top-[68%] left-[12%] w-10 h-10 rounded-lg bg-white/10 border border-white/20 flex items-center justify-center rotate-12 backdrop-blur-sm">
              <Shield size={18} className="text-white/70" />
            </div>
            <svg className="absolute inset-0 w-full h-full opacity-[0.06]" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <pattern id="park-grid-reg" width="60" height="60" patternUnits="userSpaceOnUse">
                  <path d="M 30 5 L 30 55 M 5 30 L 55 30" fill="none" stroke="white" strokeWidth="1.5" strokeDasharray="4 4" />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#park-grid-reg)" />
            </svg>
          </>
        ) : (
          <>
            <div className="absolute top-[16%] right-[10%] w-16 h-16 rounded-full bg-white/10 border border-white/20 flex items-center justify-center backdrop-blur-sm shadow-2xl">
              <MapPin size={28} className="text-white/85" />
            </div>
            <div className="absolute top-[40%] left-[8%] w-14 h-14 rounded-full bg-white/10 border border-white/20 flex items-center justify-center backdrop-blur-sm">
              <Search size={24} className="text-white/80" />
            </div>
            <div className="absolute bottom-[28%] right-[12%] w-12 h-12 rounded-full bg-white/10 border border-white/20 flex items-center justify-center backdrop-blur-sm">
              <Car size={22} className="text-white/75" />
            </div>
            <div className="absolute top-[70%] left-[14%] w-10 h-10 rounded-full bg-white/10 border border-white/20 flex items-center justify-center backdrop-blur-sm">
              <Clock size={18} className="text-white/70" />
            </div>
            <svg className="absolute inset-0 w-full h-full opacity-[0.07]" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <pattern id="dots-reg" width="32" height="32" patternUnits="userSpaceOnUse">
                  <circle cx="16" cy="16" r="1.5" fill="white" />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#dots-reg)" />
            </svg>
          </>
        )}
      </div>

      <div className="relative w-full max-w-[430px] mx-auto z-10 h-full flex flex-col overflow-hidden safe-area-top safe-area-bottom">
        <div className="p-5 pb-2 text-left">
          <div className="mb-1">
            <a
              href="/"
              onClick={(e) => { e.preventDefault(); setLocation("/"); }}
              className="inline-flex items-center cursor-pointer transition-transform active:scale-95 relative group"
              title="Go to Landing Screen"
            >
              <img src={spotlyLogoWhite} alt="Spotly" className="h-10 object-contain drop-shadow-lg" />
              <div className="absolute -bottom-8 left-0 hidden group-hover:flex items-center px-2.5 py-1 bg-slate-900/95 backdrop-blur-md text-white text-[10px] font-bold rounded-lg shadow-xl pointer-events-none whitespace-nowrap z-50 border border-white/20">
                Go to Landing Screen
              </div>
            </a>
          </div>
          <h1 className="text-white text-[1.75rem] font-extrabold leading-[1.15] mt-2 whitespace-pre-line drop-shadow-lg">{heroTagline}</h1>
        </div>

        <div className="flex-1 flex items-center justify-center px-4">
          <div className="w-full max-w-[360px] rounded-3xl shadow-2xl shadow-black/20 px-5 pt-5 pb-[36px] border border-white/30" style={{ background: "rgba(255,255,255,0.15)", backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)" }}>
            <form onSubmit={handleSubmit}>
              <h2 className="text-lg font-extrabold text-white mb-4" data-testid="text-register-title">What's your name?</h2>
              <div className="mb-4">
                <p className="text-sm font-semibold text-white/80 mb-2">Enter your name <span className="text-red-300">*</span></p>
                <div className="flex items-center border-2 border-white/30 rounded-xl overflow-hidden focus-within:border-white/60 transition-colors h-[50px]" style={{ background: "rgba(255,255,255,0.12)" }}>
                  <input ref={nameInputRef} id="name" type="text" placeholder="Enter your full name" className="flex-1 px-4 text-base font-medium text-white outline-none bg-transparent placeholder:text-white/40" value={name} onChange={(e) => setName(e.target.value.replace(/[0-9]/g, '').slice(0, 10).replace(/\b\w/g, c => c.toUpperCase()))} onFocus={(e) => setTimeout(() => e.target.scrollIntoView({ behavior: "smooth", block: "center" }), 300)} maxLength={10} data-testid="input-name" required minLength={2} />
                  {name && (<button type="button" onClick={() => setName("")} className="pr-3 text-white/50 hover:text-white/80"><X size={18} /></button>)}
                </div>
              </div>
              {errorMessage && (<div className="bg-red-50 border border-red-200 rounded-xl p-3 mb-4"><p className="text-red-600 text-sm text-center" data-testid="error-register">{errorMessage}</p></div>)}
              <button type="submit" disabled={isLoading || name.trim().length < 2} className="w-full h-[50px] flex items-center justify-center text-base font-extrabold rounded-xl text-[#0d3da8] shadow-xl shadow-black/15 transition-all active:scale-[0.98] disabled:opacity-40 disabled:shadow-none mb-3 bg-white" data-testid="button-register-submit">{isLoading ? <Loader2 className="animate-spin" size={22} /> : "Continue"}</button>
              <p className="text-[11px] text-white/50 text-center leading-relaxed px-2">By continuing, you agree to Spotly's Terms of service & Privacy policy</p>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}