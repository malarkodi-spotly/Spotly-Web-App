import { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { motion } from "framer-motion";
import { Mail, Globe, ArrowLeft, Info, MapPin, Phone, ShieldCheck } from "lucide-react";
import logo from "@assets/Logos/spotly_full-white.png";
import { getApiUrl } from "@/lib/api-config";

export default function AboutPage() {
  const [location, setLocation] = useLocation();
  const [phone, setPhone] = useState("+91 97425 45584");
  const [email, setEmail] = useState("info@spotlyindia.org");
  const [website, setWebsite] = useState("spotlyindia.org");
  const [address, setAddress] = useState("Heeraa Technologies - 139/81, Unit 101 Oxford Towers, HAL Old Airport Road, Kodihalli, Bengaluru, Karnataka – 560008.");

  useEffect(() => {
    const fetchContactInfo = async () => {
      try {
        const [phoneRes, emailRes, websiteRes, addressRes] = await Promise.all([
          fetch(getApiUrl("/api/settings/support_phone")),
          fetch(getApiUrl("/api/settings/support_email")),
          fetch(getApiUrl("/api/settings/support_website")),
          fetch(getApiUrl("/api/settings/landing_address"))
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
        if (addressRes.ok) {
          const data = await addressRes.json();
          if (data.setting?.value) setAddress(data.setting.value);
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
      data-testid="page-about"
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
            <h1 className="text-xl font-heading font-semibold text-white/90">About Spotly</h1>
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
            <Info className="w-10 h-10 text-yellow-400 shrink-0" />
            <div>
              <h2 className="text-lg font-heading font-bold text-white">Discover Spotly</h2>
              <p className="text-xs text-white/60 mt-0.5">
                Connecting Space Providers and Space Seekers for hassle-free parking solution.
              </p>
            </div>
          </div>

          {/* Section 1: What is Spotly? */}
          <section className="space-y-4">
            <h3 className="text-xl font-heading font-bold text-yellow-400 flex items-center gap-2">
              <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-yellow-400/10 text-yellow-400 text-sm font-bold">1</span>
              What is Spotly?
            </h3>
            <div className="bg-white/5 p-5 rounded-2xl border border-white/5 space-y-3 pl-6 text-sm text-white/70 leading-relaxed">
              <p>
                Spotly is a mobile-first facilitator platform designed to bridge the gap between people with unused parking spaces and drivers looking for safe, convenient parking. 
              </p>
              <p>
                Whether you have an empty driveway, a secure garage, or a spare commercial space, Spotly lets you list your spot to generate extra income. At the same time, we help car and bike owners find, book, and navigate to verified parking spots nearby, avoiding city parking stress.
              </p>
            </div>
          </section>

          {/* Section 2: Service Coverage */}
          <section className="space-y-4">
            <h3 className="text-xl font-heading font-bold text-yellow-400 flex items-center gap-2">
              <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-yellow-400/10 text-yellow-400 text-sm font-bold">2</span>
              Service Coverage &amp; Availability
            </h3>
            <div className="bg-white/5 p-5 rounded-2xl border border-white/5 text-sm text-white/70 space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-yellow-400/10 flex items-center justify-center shrink-0 mt-0.5">
                  <ShieldCheck className="w-4 h-4 text-yellow-400" />
                </div>
                <div>
                  <p className="font-semibold text-white">Karnataka-Only Service (For Now)</p>
                  <p className="leading-relaxed mt-1">
                    Currently, Spotly is operational exclusively within the state of <strong>Karnataka</strong>. Our team is focused on optimising city parking in major tech hubs and urban spaces within the region.
                  </p>
                </div>
              </div>
              
              <div className="h-px bg-white/10" />

              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-400/10 flex items-center justify-center shrink-0 mt-0.5">
                  <Globe className="w-4 h-4 text-blue-300" />
                </div>
                <div>
                  <p className="font-semibold text-white">Future Expansion</p>
                  <p className="leading-relaxed mt-1">
                    We are planning updates to bring exciting expansion features soon. We aim to scale our operations and make Spotly available in other states and metropolitan areas in the near future.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Section 3: Contact details */}
          <section className="space-y-4">
            <h3 className="text-xl font-heading font-bold text-yellow-400 flex items-center gap-2">
              <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-yellow-400/10 text-yellow-400 text-sm font-bold">3</span>
              Contact Information
            </h3>
            <div className="bg-white/5 p-5 rounded-2xl border border-white/5 text-sm text-white/70 space-y-4">
              <p>For support, listing questions, or inquiries:</p>
              <div className="flex flex-col sm:flex-row flex-wrap gap-4 sm:gap-8 pb-2">
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

              <div className="h-px bg-white/10" />

              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center shrink-0 mt-0.5">
                  <MapPin className="w-4 h-4 text-blue-300" />
                </div>
                <div>
                  <p className="font-semibold text-white">Office Address</p>
                  <p className="text-white/70 leading-relaxed mt-1 text-sm whitespace-pre-line">{address}</p>
                </div>
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
