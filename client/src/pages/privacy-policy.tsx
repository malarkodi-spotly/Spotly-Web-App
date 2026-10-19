import { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { motion } from "framer-motion";
import { Mail, Globe, ArrowLeft, Shield, CheckCircle, Info, Lock, Eye, CheckSquare, Phone } from "lucide-react";
import logo from "@assets/Logos/spotly_full-white.png";
import { getApiUrl } from "@/lib/api-config";

export default function PrivacyPolicyPage() {
  const [location, setLocation] = useLocation();
  const [phone, setPhone] = useState("+91 97425 45584");
  const [email, setEmail] = useState("info@spotlyindia.org");
  const [website, setWebsite] = useState("spotlyindia.org");

  useEffect(() => {
    const fetchContactInfo = async () => {
      try {
        const [phoneRes, emailRes, websiteRes] = await Promise.all([
          fetch(getApiUrl("/api/settings/support_phone")),
          fetch(getApiUrl("/api/settings/support_email")),
          fetch(getApiUrl("/api/settings/support_website"))
        ]);

        if (phoneRes.ok) {
          const data = await phoneRes.json();
          if (data.setting?.value) setPhone(data.setting.value);
        }
        if (emailRes.ok) {
          const data = await emailRes.json();
          if (data.setting?.value) setEmail(data.setting.value);
        }
        if (websiteRes.ok) {
          const data = await websiteRes.json();
          if (data.setting?.value) setWebsite(data.setting.value);
        }
      } catch (error) {
        console.error("Failed to fetch support contact details:", error);
      }
    };
    fetchContactInfo();
  }, []);

  const handleBackHome = () => {
    setLocation("/");
  };

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
      data-testid="page-privacy-policy"
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
            <h1 className="text-xl font-heading font-semibold text-white/90">Privacy Policy</h1>
          </div>
          <div className="flex items-center gap-3 md:gap-4 flex-wrap justify-center md:justify-end">
            <Link
              href="/privacy-policy"
              className={`text-sm font-semibold px-3 py-1.5 rounded-lg transition-all ${
                location === "/privacy-policy"
                  ? "bg-white/20 text-white border border-white/20"
                  : "text-white/70 hover:text-white hover:bg-white/5"
              }`}
            >
              Privacy Policy
            </Link>
            <Link
              href="/terms-and-conditions"
              className={`text-sm font-semibold px-3 py-1.5 rounded-lg transition-all ${
                location === "/terms-and-conditions"
                  ? "bg-white/20 text-white border border-white/20"
                  : "text-white/70 hover:text-white hover:bg-white/5"
              }`}
            >
              Terms &amp; Conditions
            </Link>
            <Link
              href="/subscription-policy"
              className={`text-sm font-semibold px-3 py-1.5 rounded-lg transition-all ${
                location === "/subscription-policy"
                  ? "bg-white/20 text-white border border-white/20"
                  : "text-white/70 hover:text-white hover:bg-white/5"
              }`}
            >
              Subscription Policy
            </Link>
            <Link
              href="/about"
              className={`text-sm font-semibold px-3 py-1.5 rounded-lg transition-all ${
                location === "/about"
                  ? "bg-white/20 text-white border border-white/20"
                  : "text-white/70 hover:text-white hover:bg-white/5"
              }`}
            >
              About Spotly
            </Link>
            <Link
              href="/customer-feedback"
              className={`text-sm font-semibold px-3 py-1.5 rounded-lg transition-all ${
                location === "/customer-feedback"
                  ? "bg-white/20 text-white border border-white/20"
                  : "text-white/70 hover:text-white hover:bg-white/5"
              }`}
            >
              Customer Feedback
            </Link>
            <Link
              href="/delete-account"
              className={`text-sm font-semibold px-3 py-1.5 rounded-lg transition-all ${
                location === "/delete-account"
                  ? "bg-red-400/20 text-red-300 border border-red-400/30"
                  : "text-red-300/70 hover:text-red-300 hover:bg-red-400/10"
              }`}
            >
              Delete Account
            </Link>
            <div className="h-6 w-px bg-white/20 hidden sm:block mx-1" />
            <button
              onClick={handleBackHome}
              className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 active:scale-95 border border-white/20 rounded-xl text-sm font-semibold transition-all shadow-lg font-sans"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Home
            </button>
          </div>
        </header>

        {/* Content Card */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="bg-white/10 backdrop-blur-md border border-white/15 rounded-3xl p-6 md:p-10 text-white/90 shadow-2xl flex-1 space-y-8 animate-contact-reveal"
        >
          {/* Main Title Banner */}
          <div className="flex items-center gap-4 bg-white/5 border border-white/10 p-5 rounded-2xl">
            <Shield className="w-10 h-10 text-yellow-400 shrink-0" />
            <div>
              <h2 className="text-lg font-heading font-bold text-white">Your Privacy Matters</h2>
              <p className="text-xs text-white/60 mt-0.5">
                Effective Date: July 16, 2026. Please read this Privacy Policy carefully to understand how we manage your information.
              </p>
            </div>
          </div>

          {/* Section 1 */}
          <section className="space-y-4">
            <h3 className="text-xl font-heading font-bold text-yellow-400 flex items-center gap-2">
              <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-yellow-400/10 text-yellow-400 text-sm font-bold">1</span>
              Information We Collect
            </h3>
            <div className="grid md:grid-cols-3 gap-4 pl-2">
              <div className="bg-white/5 p-4 rounded-xl border border-white/5">
                <h4 className="font-semibold text-white flex items-center gap-2 mb-2">
                  <Lock className="w-4 h-4 text-blue-300" />
                  a) Personal Info
                </h4>
                <ul className="text-sm text-white/70 space-y-1 list-disc pl-4">
                  <li>Mobile number (for login & OTP verification)</li>
                  <li>Basic profile details (if provided)</li>
                </ul>
              </div>
              <div className="bg-white/5 p-4 rounded-xl border border-white/5">
                <h4 className="font-semibold text-white flex items-center gap-2 mb-2">
                  <Eye className="w-4 h-4 text-blue-300" />
                  b) Location Data
                </h4>
                <p className="text-sm text-white/70">
                  We collect your device location to:
                </p>
                <ul className="text-sm text-white/70 space-y-1 list-disc pl-4 mt-1">
                  <li>Show nearby parking spaces</li>
                  <li>Improve search accuracy and user experience</li>
                </ul>
              </div>
              <div className="bg-white/5 p-4 rounded-xl border border-white/5">
                <h4 className="font-semibold text-white flex items-center gap-2 mb-2">
                  <Info className="w-4 h-4 text-blue-300" />
                  c) Usage Data
                </h4>
                <ul className="text-sm text-white/70 space-y-1 list-disc pl-4">
                  <li>App interactions</li>
                  <li>Search preferences</li>
                  <li>Device and log information (for performance monitoring)</li>
                </ul>
              </div>
            </div>
          </section>

          {/* Section 2 */}
          <section className="space-y-4">
            <h3 className="text-xl font-heading font-bold text-yellow-400 flex items-center gap-2">
              <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-yellow-400/10 text-yellow-400 text-sm font-bold">2</span>
              How We Use Your Information
            </h3>
            <div className="bg-white/5 p-5 rounded-2xl border border-white/5">
              <p className="text-sm text-white/80 mb-3">We use your information to:</p>
              <div className="grid sm:grid-cols-2 gap-3 pl-2">
                {[
                  "Provide parking search functionality",
                  "Connect users with parking providers",
                  "Enable communication between users and providers",
                  "Improve app performance and user experience",
                  "Provide premium features (such as contact access)"
                ].map((item, idx) => (
                  <div key={idx} className="flex items-start gap-2 text-sm text-white/70">
                    <CheckCircle className="w-4 h-4 text-green-400 shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Section 3 */}
          <section className="space-y-4">
            <h3 className="text-xl font-heading font-bold text-yellow-400 flex items-center gap-2">
              <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-yellow-400/10 text-yellow-400 text-sm font-bold">3</span>
              Data Sharing
            </h3>
            <div className="bg-white/5 p-5 rounded-2xl border border-white/5 space-y-3">
              <p className="text-sm font-semibold text-white">We do not sell your personal data.</p>
              <div className="h-px bg-white/10 my-2" />
              <p className="text-sm text-white/80">We may share:</p>
              <ul className="text-sm text-white/70 list-disc pl-5 space-y-2">
                <li>Contact details only when a user unlocks them via premium subscription.</li>
                <li>Data with service providers (such as hosting, SMS, analytics).</li>
                <li>Information with legal authorities if required by law.</li>
              </ul>
            </div>
          </section>

          {/* Section 4 */}
          <section className="space-y-4">
            <h3 className="text-xl font-heading font-bold text-yellow-400 flex items-center gap-2">
              <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-yellow-400/10 text-yellow-400 text-sm font-bold">4</span>
              Third-Party Services
            </h3>
            <div className="bg-white/5 p-5 rounded-2xl border border-white/5 space-y-3">
              <p className="text-sm text-white/80">We may use trusted third-party services such as:</p>
              <div className="grid sm:grid-cols-3 gap-3 pl-2">
                {[
                  "Google Maps (for location services)",
                  "SMS/OTP providers (for login verification)",
                  "Cloud hosting services"
                ].map((item, idx) => (
                  <div key={idx} className="bg-white/5 p-3 rounded-lg border border-white/5 text-center text-sm text-white/80 font-sans">
                    {item}
                  </div>
                ))}
              </div>
              <p className="text-xs text-white/50 italic mt-2">
                These providers may process data as required to perform their services.
              </p>
            </div>
          </section>

          {/* Section 5 */}
          <section className="space-y-4">
            <h3 className="text-xl font-heading font-bold text-yellow-400 flex items-center gap-2">
              <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-yellow-400/10 text-yellow-400 text-sm font-bold">5</span>
              Data Retention
            </h3>
            <div className="bg-white/5 p-5 rounded-2xl border border-white/5 text-sm text-white/70 space-y-2">
              <p>We retain your data:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>As long as your account is active</li>
                <li>Or as required for legal and operational purposes</li>
              </ul>
              <p className="text-xs text-yellow-300 font-semibold mt-2">
                Users may request deletion of their data (see Section 7).
              </p>
            </div>
          </section>

          {/* Section 6 */}
          <section className="space-y-4">
            <h3 className="text-xl font-heading font-bold text-yellow-400 flex items-center gap-2">
              <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-yellow-400/10 text-yellow-400 text-sm font-bold">6</span>
              Data Security
            </h3>
            <p className="text-sm text-white/70 bg-white/5 p-5 rounded-2xl border border-white/5 leading-relaxed">
              We implement reasonable industry-standard security measures to protect your data from unauthorized access, misuse, or disclosure.
            </p>
          </section>

          {/* Section 7 */}
          <section className="space-y-4">
            <h3 className="text-xl font-heading font-bold text-yellow-400 flex items-center gap-2">
              <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-yellow-400/10 text-yellow-400 text-sm font-bold">7</span>
              User Rights & Control
            </h3>
            <div className="bg-white/5 p-5 rounded-2xl border border-white/5 text-sm text-white/70 space-y-2">
              <p>Users can:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Disable location access through device settings</li>
                <li>Request account deletion by contacting us</li>
                <li>Stop using the app at any time</li>
              </ul>
            </div>
          </section>

          {/* Section 8 */}
          <section className="space-y-4">
            <h3 className="text-xl font-heading font-bold text-yellow-400 flex items-center gap-2">
              <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-yellow-400/10 text-yellow-400 text-sm font-bold">8</span>
              Permissions
            </h3>
            <div className="bg-white/5 p-5 rounded-2xl border border-white/5 text-sm text-white/70 space-y-2">
              <p>Spotly may request the following permissions:</p>
              <ul className="space-y-2 pl-2">
                <li className="flex items-start gap-2">
                  <CheckSquare className="w-4 h-4 text-blue-300 mt-0.5 shrink-0" />
                  <span><strong>Location Access</strong> – to display nearby parking spaces</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckSquare className="w-4 h-4 text-blue-300 mt-0.5 shrink-0" />
                  <span><strong>Internet Access</strong> – to fetch and update data</span>
                </li>
              </ul>
            </div>
          </section>

          {/* Section 9 */}
          <section className="space-y-4">
            <h3 className="text-xl font-heading font-bold text-yellow-400 flex items-center gap-2">
              <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-yellow-400/10 text-yellow-400 text-sm font-bold">9</span>
              Children’s Privacy
            </h3>
            <div className="bg-white/5 p-5 rounded-2xl border border-white/5 text-sm text-white/70 space-y-2">
              <p>Spotly is not intended for users under the age of 18.</p>
              <p>We do not knowingly collect data from children.</p>
            </div>
          </section>

          {/* Section 10 */}
          <section className="space-y-4">
            <h3 className="text-xl font-heading font-bold text-yellow-400 flex items-center gap-2">
              <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-yellow-400/10 text-yellow-400 text-sm font-bold">10</span>
              Changes to This Policy
            </h3>
            <p className="text-sm text-white/70 bg-white/5 p-5 rounded-2xl border border-white/5 leading-relaxed">
              We may update this Privacy Policy from time to time. Updates will be posted on this page with a revised effective date.
            </p>
          </section>

          {/* Section 11 */}
          <section className="space-y-4">
            <h3 className="text-xl font-heading font-bold text-yellow-400 flex items-center gap-2">
              <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-yellow-400/10 text-yellow-400 text-sm font-bold">11</span>
              Contact Us
            </h3>
            <div className="bg-white/5 p-5 rounded-2xl border border-white/5 text-sm text-white/70 space-y-3">
              <p>For any questions or support:</p>
              <div className="flex flex-col sm:flex-row gap-4 sm:gap-8 pt-2">
                <a
                  href={`tel:${phone.replace(/[^+\d]/g, "")}`}
                  className="flex items-center gap-2.5 hover:text-yellow-300 font-medium transition-colors"
                >
                  <span className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
                    <Phone className="w-4 h-4 text-blue-300" />
                  </span>
                  {phone}
                </a>
                <a
                  href={`mailto:${email}`}
                  className="flex items-center gap-2.5 hover:text-yellow-300 font-medium transition-colors"
                >
                  <span className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
                    <Mail className="w-4 h-4 text-blue-300" />
                  </span>
                  {email}
                </a>
                <a
                  href={website.startsWith("http") ? website : `https://${website}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2.5 hover:text-yellow-300 font-medium transition-colors"
                >
                  <span className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
                    <Globe className="w-4 h-4 text-blue-300" />
                  </span>
                  {website}
                </a>
              </div>
            </div>
          </section>
        </motion.div>

        {/* Footer */}
        <footer className="text-center text-white/40 text-xs py-8">
          &copy; {new Date().getFullYear()} Spotly. All Rights Reserved.
        </footer>
      </div>
    </div>
  );
}
