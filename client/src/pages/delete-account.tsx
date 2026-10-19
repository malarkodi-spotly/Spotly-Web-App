import { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Trash2,
  SmartphoneIcon,
  Mail,
  AlertTriangle,
  ChevronRight,
  ShieldCheck,
} from "lucide-react";
import logo from "@assets/Logos/spotly_full-white.png";
import { getApiUrl } from "@/lib/api-config";

export default function DeleteAccountPage() {
  const [location, setLocation] = useLocation();
  const [email, setEmail] = useState("info@spotlyindia.org");

  useEffect(() => {
    document.title = "Delete Your Spotly Account | Spotly";
    const fetchEmail = async () => {
      try {
        const res = await fetch(getApiUrl("/api/settings/support_email"));
        if (res.ok) {
          const data = await res.json();
          if (data.setting?.value) setEmail(data.setting.value);
        }
      } catch {
        // keep default
      }
    };
    fetchEmail();
  }, []);

  return (
    <div
      className="relative w-full min-h-screen overflow-x-hidden flex flex-col text-white px-4 py-8 md:py-16 spotly-inner-page-bg"
      style={{
        backgroundImage:
          "radial-gradient(ellipse at 100% 0%, rgba(225, 75, 255, 0.95) 0%, transparent 36%), radial-gradient(ellipse at 72% 5%, rgba(83, 30, 255, 0.9) 0%, transparent 40%), radial-gradient(ellipse at 58% 65%, rgba(24, 28, 220, 0.7) 0%, transparent 46%), linear-gradient(115deg, #020b50 0%, #061b9e 48%, #2410c9 76%, #740dff 100%)",
        backgroundRepeat: "no-repeat",
        backgroundColor: "#020b50",
        backgroundAttachment: "fixed",
      }}
      data-testid="page-delete-account"
    >
      {/* Background Dots Grid */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute inset-0 opacity-[0.06]"
          style={{
            backgroundImage: "radial-gradient(circle at 1px 1px, white 1px, transparent 0)",
            backgroundSize: "20px 20px",
          }}
        />
      </div>

      <div className="max-w-6xl w-full mx-auto relative z-10 flex-1 flex flex-col">
        {/* Header */}
        <header className="flex flex-col md:flex-row items-center justify-between gap-4 mb-8 border-b border-white/10 pb-6">
          <div className="flex items-center gap-3">
            <a
              href="/"
              onClick={(e) => { e.preventDefault(); setLocation("/"); }}
              className="inline-flex items-center cursor-pointer transition-transform active:scale-95 relative group"
              title="Go to Landing Screen"
            >
              <img src={logo} alt="Spotly Logo" className="h-10 w-auto" />
              <div className="absolute -bottom-8 left-0 hidden md:group-hover:flex items-center px-2.5 py-1 bg-slate-900/95 backdrop-blur-md text-white text-[10px] font-bold rounded-lg shadow-xl pointer-events-none whitespace-nowrap z-50 border border-white/20">
                Go to Landing Screen
              </div>
            </a>
            <div className="h-6 w-px bg-white/20 hidden sm:block" />
            <h1 className="text-xl font-heading font-semibold text-white/90">Delete Account</h1>
          </div>

          <div className="flex items-center gap-3 md:gap-4 flex-wrap justify-center md:justify-end">
            <Link
              href="/privacy-policy"
              className={`text-sm font-semibold px-3 py-1.5 rounded-lg transition-all ${location === "/privacy-policy"
                  ? "bg-white/20 text-white border border-white/20"
                  : "text-white/70 hover:text-white hover:bg-white/5"
                }`}
            >
              Privacy Policy
            </Link>
            <Link
              href="/terms-and-conditions"
              className={`text-sm font-semibold px-3 py-1.5 rounded-lg transition-all ${location === "/terms-and-conditions"
                  ? "bg-white/20 text-white border border-white/20"
                  : "text-white/70 hover:text-white hover:bg-white/5"
                }`}
            >
              Terms &amp; Conditions
            </Link>
            <Link
              href="/subscription-policy"
              className={`text-sm font-semibold px-3 py-1.5 rounded-lg transition-all ${location === "/subscription-policy"
                  ? "bg-white/20 text-white border border-white/20"
                  : "text-white/70 hover:text-white hover:bg-white/5"
                }`}
            >
              Subscription Policy
            </Link>
            <Link
              href="/about"
              className={`text-sm font-semibold px-3 py-1.5 rounded-lg transition-all ${location === "/about"
                  ? "bg-white/20 text-white border border-white/20"
                  : "text-white/70 hover:text-white hover:bg-white/5"
                }`}
            >
              About Spotly
            </Link>
            <Link
              href="/delete-account"
              className={`text-sm font-semibold px-3 py-1.5 rounded-lg transition-all ${location === "/delete-account"
                  ? "bg-red-400/20 text-red-300 border border-red-400/30"
                  : "text-red-300/70 hover:text-red-300 hover:bg-red-400/10"
                }`}
            >
              Delete Account
            </Link>
            <div className="h-6 w-px bg-white/20 hidden sm:block mx-1" />
            <button
              onClick={() => setLocation("/")}
              className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 active:scale-95 border border-white/20 rounded-xl text-sm font-semibold transition-all shadow-lg font-sans"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Home
            </button>
          </div>
        </header>

        <div className="max-w-3xl w-full mx-auto">

          {/* Main card */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
            className="bg-white/10 backdrop-blur-md border border-white/15 rounded-3xl p-6 md:p-10 text-white/90 shadow-2xl space-y-8"
          >
            {/* Title banner */}
            <div className="flex items-center gap-4 bg-red-500/10 border border-red-400/20 p-5 rounded-2xl">
              <Trash2 className="w-10 h-10 text-red-400 shrink-0" />
              <div>
                <h1 className="text-xl md:text-2xl font-bold text-white leading-tight">
                  Delete Your Spotly Account
                </h1>
                <p className="text-xs text-white/60 mt-1">
                  This action is permanent and cannot be undone.
                </p>
              </div>
            </div>

            {/* Primary method — in-app */}
            <section className="space-y-4">
              <h2 className="text-lg font-bold text-yellow-400 flex items-center gap-2">
                <ShieldCheck className="w-5 h-5" />
                Delete from the App
              </h2>
              <p className="text-sm text-white/75 leading-relaxed">
                The easiest way to delete your account and all associated data is directly through the Spotly app:
              </p>

              {/* Step chips */}
              <div className="flex flex-wrap items-center gap-2 py-1">
                {[
                  { Icon: SmartphoneIcon, label: "Open Spotly app" },
                  { Icon: ChevronRight, label: null },
                  { Icon: ChevronRight, label: "Profile" },
                  { Icon: ChevronRight, label: null },
                  { Icon: ChevronRight, label: "Settings" },
                  { Icon: ChevronRight, label: null },
                  { Icon: Trash2, label: "Delete Account" },
                ].map((step, idx) =>
                  step.label === null ? (
                    <ChevronRight key={idx} className="w-4 h-4 text-white/30 shrink-0 hidden sm:block" />
                  ) : (
                    <div
                      key={idx}
                      className="flex items-center gap-2 bg-white/10 border border-white/10 rounded-xl px-4 py-2.5 text-sm font-medium"
                    >
                      <step.Icon className="w-4 h-4 text-yellow-300 shrink-0" />
                      <span>{step.label}</span>
                    </div>
                  )
                )}
              </div>

              {/* Callout path */}
              <div className="bg-white/5 border border-white/10 rounded-xl px-5 py-4 text-sm text-white/80 flex items-center gap-3">
                <span className="text-white/40 shrink-0">→</span>
                <span>
                  <span className="text-yellow-300 font-semibold">Profile</span>
                  {" → "}
                  <span className="text-yellow-300 font-semibold">Settings</span>
                  {" → "}
                  <span className="text-yellow-300 font-semibold">Delete Account</span>
                </span>
              </div>
            </section>

            <div className="h-px bg-white/10" />

            {/* Fallback — email support */}
            <section className="space-y-4">
              <h2 className="text-lg font-bold text-yellow-400 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-yellow-400" />
                Can't Access Your Account?
              </h2>
              <p className="text-sm text-white/75 leading-relaxed">
                If you cannot log in to the Spotly app, contact our support team and we'll handle the deletion for you:
              </p>

              <a
                href={`mailto:${email}`}
                className="inline-flex items-center gap-3 bg-white/10 hover:bg-white/20 border border-white/15 hover:border-yellow-400/40 rounded-2xl px-5 py-4 transition-all group active:scale-95"
              >
                <span className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center shrink-0 group-hover:bg-yellow-400/10 transition-colors">
                  <Mail className="w-4 h-4 text-blue-300 group-hover:text-yellow-300 transition-colors" />
                </span>
                <div>
                  <p className="text-xs text-white/50 mb-0.5">Email us at</p>
                  <p className="text-sm font-semibold text-white group-hover:text-yellow-300 transition-colors">
                    {email}
                  </p>
                </div>
              </a>

              <p className="text-xs text-white/50 leading-relaxed">
                Please include the mobile number linked to your account. Requests are processed within 7 business days.
              </p>
            </section>

            {/* Warning box */}
            <div className="bg-red-500/10 border border-red-400/20 rounded-2xl px-5 py-4 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
              <div className="text-sm text-white/75 space-y-1">
                <p className="font-semibold text-white">What gets permanently deleted:</p>
                <ul className="list-disc pl-4 space-y-0.5 text-white/65">
                  <li>Your profile and personal details</li>
                  <li>Your booking history</li>
                  <li>Any active listings or spaces you manage</li>
                  <li>All app data associated with your account</li>
                </ul>
                <p className="text-red-300 font-medium pt-1">This action is irreversible.</p>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Footer */}
        <footer className="text-center text-white/40 text-xs py-8">
          &copy; {new Date().getFullYear()} Spotly. All Rights Reserved.
        </footer>
      </div>
    </div>
  );
}
