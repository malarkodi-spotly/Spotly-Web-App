import { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { motion } from "framer-motion";
import { Mail, Globe, ArrowLeft, Shield, CheckCircle, Info, Lock, Eye, CheckSquare, Phone, MapPin } from "lucide-react";
import logo from "@assets/Logos/spotly_full-white.png";
import { getApiUrl } from "@/lib/api-config";

export default function TermsAndConditionsPage() {
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
      data-testid="page-terms-and-conditions"
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
            <h1 className="text-xl font-heading font-semibold text-white/90">Terms &amp; Conditions</h1>
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
              <h2 className="text-lg font-heading font-bold text-white">Terms of Use</h2>
              <p className="text-xs text-white/60 mt-0.5">
                Effective Date: July 16, 2026. Please review these Terms &amp; Conditions carefully before using Spotly services.
              </p>
            </div>
          </div>

          {/* Section 1 */}
          <section className="space-y-4">
            <h3 className="text-xl font-heading font-bold text-yellow-400 flex items-center gap-2">
              <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-yellow-400/10 text-yellow-400 text-sm font-bold">1</span>
              Terms of Service
            </h3>
            <div className="space-y-4 pl-2">
              <div className="bg-white/5 p-4 rounded-xl border border-white/5">
                <h4 className="font-semibold text-white mb-2">1.1 Platform Overview</h4>
                <p className="text-sm text-white/70 leading-relaxed">
                  Spotly is a mobile-based platform that connects individuals who have available parking spaces (&ldquo;Space Providers&rdquo;) with users seeking parking (&ldquo;Space Seekers&rdquo;).
                  Spotly acts only as a technology facilitator and does not own, control, manage, or verify any parking spaces listed on the platform.
                </p>
              </div>

              <div className="bg-white/5 p-4 rounded-xl border border-white/5">
                <h4 className="font-semibold text-white mb-2">1.2 User Roles</h4>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-blue-300 font-bold uppercase tracking-wider mb-2">Space Providers</p>
                    <ul className="text-sm text-white/70 space-y-1 list-disc pl-4">
                      <li>Can list available parking spaces (car/bike)</li>
                      <li>Provide details such as location, rent, and images</li>
                      <li>Agree that their listing information will be visible to registered users</li>
                    </ul>
                  </div>
                  <div>
                    <p className="text-xs text-blue-300 font-bold uppercase tracking-wider mb-2">Space Seekers</p>
                    <ul className="text-sm text-white/70 space-y-1 list-disc pl-4">
                      <li>Can browse available parking listings</li>
                      <li>Can contact Space Providers after unlocking contact details (if applicable)</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="bg-white/5 p-4 rounded-xl border border-white/5">
                <h4 className="font-semibold text-white mb-2">1.3 User Responsibilities</h4>
                <p className="text-sm text-white/70 mb-3">By using Spotly, you agree to:</p>
                <ul className="text-sm text-white/70 space-y-1 list-disc pl-4 mb-3">
                  <li>Provide accurate and truthful information</li>
                  <li>Use the platform in good faith and for lawful purposes only</li>
                  <li>Take full responsibility for all interactions, agreements, and transactions</li>
                </ul>
                <p className="text-xs text-yellow-300 font-semibold leading-relaxed">
                  All agreements, payments, and arrangements are strictly between users. Spotly is not a party to any transaction.
                </p>
              </div>

              <div className="bg-white/5 p-4 rounded-xl border border-white/5">
                <h4 className="font-semibold text-white mb-2">1.4 No Verification &amp; No Guarantee</h4>
                <p className="text-sm text-white/70 mb-2">Spotly:</p>
                <ul className="text-sm text-white/70 space-y-1 list-disc pl-4 mb-2">
                  <li>Does not verify users or listings</li>
                  <li>Does not guarantee availability, pricing, or quality of parking spaces</li>
                  <li>Does not act as an agent, broker, employer, or contractor</li>
                </ul>
                <p className="text-xs text-white/50 italic">
                  Users are strongly advised to verify details independently before making any commitments.
                </p>
              </div>

              <div className="bg-white/5 p-4 rounded-xl border border-white/5">
                <h4 className="font-semibold text-white mb-2">1.5 Prohibited Use</h4>
                <p className="text-sm text-white/70 mb-2">Users must not:</p>
                <ul className="text-sm text-white/70 space-y-1 list-disc pl-4">
                  <li>Engage in fraud, scams, or illegal activities</li>
                  <li>Harass, abuse, or harm other users</li>
                  <li>Provide false or misleading information</li>
                  <li>Impersonate another person or entity</li>
                </ul>
                <p className="text-xs text-red-400 font-semibold mt-2">
                  Violation may result in account suspension or permanent ban.
                </p>
              </div>
            </div>
          </section>

          {/* Section 2 */}
          <section className="space-y-4">
            <h3 className="text-xl font-heading font-bold text-yellow-400 flex items-center gap-2">
              <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-yellow-400/10 text-yellow-400 text-sm font-bold">2</span>
              Privacy &amp; Data Usage
            </h3>
            <div className="grid md:grid-cols-2 gap-4 pl-2">
              <div className="bg-white/5 p-4 rounded-xl border border-white/5">
                <h4 className="font-semibold text-white mb-2">2.1 Information Collected</h4>
                <div className="space-y-2">
                  <div>
                    <p className="text-xs text-blue-300 font-bold">From Space Providers:</p>
                    <ul className="text-sm text-white/70 list-disc pl-4">
                      <li>Name, Mobile number</li>
                      <li>Parking space details (location, rent, photos)</li>
                    </ul>
                  </div>
                  <div>
                    <p className="text-xs text-blue-300 font-bold">From Space Seekers:</p>
                    <ul className="text-sm text-white/70 list-disc pl-4">
                      <li>Name, Mobile number</li>
                      <li>Location preferences</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="bg-white/5 p-4 rounded-xl border border-white/5">
                <h4 className="font-semibold text-white mb-2">2.2 Purpose of Data Collection</h4>
                <ul className="text-sm text-white/70 space-y-1 list-disc pl-4">
                  <li>Facilitate connections between users</li>
                  <li>Display relevant parking listings</li>
                  <li>Enable communication between Providers and Seekers</li>
                  <li>Improve app functionality and user experience</li>
                </ul>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4 pl-2">
              <div className="bg-white/5 p-4 rounded-xl border border-white/5">
                <h4 className="font-semibold text-white mb-2">2.3 Consent to Share Information</h4>
                <ul className="text-sm text-white/70 space-y-1 list-disc pl-4">
                  <li>Space Providers consent to sharing their listing and contact details</li>
                  <li>Space Seekers agree to use this information only for parking-related purposes</li>
                </ul>
              </div>

              <div className="bg-white/5 p-4 rounded-xl border border-white/5">
                <h4 className="font-semibold text-white mb-2">2.4 Data Security</h4>
                <p className="text-sm text-white/70 leading-relaxed mb-1">
                  Spotly implements reasonable security measures to protect user data. However, we are not responsible for user actions outside the platform.
                </p>
                <p className="text-xs text-yellow-300 font-semibold">
                  Users should exercise caution when sharing personal or financial information.
                </p>
              </div>
            </div>
          </section>

          {/* Section 3 */}
          <section className="space-y-4">
            <h3 className="text-xl font-heading font-bold text-yellow-400 flex items-center gap-2">
              <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-yellow-400/10 text-yellow-400 text-sm font-bold">3</span>
              Payment &amp; Subscription Policy
            </h3>
            <div className="grid md:grid-cols-2 gap-4 pl-2">
              <div className="bg-white/5 p-4 rounded-xl border border-white/5">
                <h4 className="font-semibold text-white mb-2">3.1 Premium Features</h4>
                <p className="text-sm text-white/70 mb-2">Spotly may offer paid features such as:</p>
                <ul className="text-sm text-white/70 list-disc pl-4">
                  <li>Access to contact details</li>
                  <li>Enhanced listing visibility</li>
                  <li>Subscription plans (Basic / Premium)</li>
                </ul>
              </div>

              <div className="bg-white/5 p-4 rounded-xl border border-white/5">
                <h4 className="font-semibold text-white mb-2">3.2 Payments</h4>
                <ul className="text-sm text-white/70 list-disc pl-4">
                  <li>All payments must be completed through authorized payment methods provided in the App</li>
                  <li>Users are responsible for verifying payment details before confirming</li>
                </ul>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4 pl-2">
              <div className="bg-white/5 p-4 rounded-xl border border-white/5">
                <h4 className="font-semibold text-white mb-2">3.3 Refund Policy</h4>
                <ul className="text-sm text-white/70 list-disc pl-4">
                  <li>All payments are non-refundable</li>
                  <li>Once a subscription is activated, it cannot be cancelled for a refund</li>
                  <li>Users are advised to review features before purchasing</li>
                </ul>
              </div>

              <div className="bg-white/5 p-4 rounded-xl border border-white/5">
                <h4 className="font-semibold text-white mb-2">3.4 User Responsibility</h4>
                <ul className="text-sm text-white/70 list-disc pl-4">
                  <li>Managing subscriptions</li>
                  <li>Ensuring timely payments</li>
                  <li>Maintaining access to their accounts</li>
                </ul>
              </div>
            </div>
          </section>

          {/* Section 4 */}
          <section className="space-y-4">
            <h3 className="text-xl font-heading font-bold text-yellow-400 flex items-center gap-2">
              <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-yellow-400/10 text-yellow-400 text-sm font-bold">4</span>
              Liability &amp; Disputes
            </h3>
            <div className="bg-white/5 p-5 rounded-2xl border border-white/5 space-y-4">
              <div>
                <h4 className="font-semibold text-white mb-1">4.1 Platform Limitation</h4>
                <p className="text-sm text-white/70">
                  Spotly is only a facilitator platform. We do not participate in transactions, guarantee service quality, or ensure user reliability.
                </p>
              </div>
              <div className="h-px bg-white/10" />
              <div>
                <h4 className="font-semibold text-white mb-1">4.2 Limitation of Liability</h4>
                <p className="text-sm text-white/70 mb-2">Spotly shall not be liable for:</p>
                <ul className="text-sm text-white/70 list-disc pl-5">
                  <li>Any disputes between users</li>
                  <li>Financial loss, fraud, or damages</li>
                  <li>Parking-related issues (availability, safety, pricing)</li>
                </ul>
                <p className="text-xs text-yellow-300 font-semibold mt-2">Use of the platform is at your own risk.</p>
              </div>
              <div className="h-px bg-white/10" />
              <div>
                <h4 className="font-semibold text-white mb-1">4.3 Dispute Resolution</h4>
                <p className="text-sm text-white/70">
                  Users must resolve disputes directly with each other. Spotly does not mediate or intervene in conflicts.
                </p>
              </div>
            </div>
          </section>

          {/* Section 5 */}
          <section className="space-y-4">
            <h3 className="text-xl font-heading font-bold text-yellow-400 flex items-center gap-2">
              <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-yellow-400/10 text-yellow-400 text-sm font-bold">5</span>
              Account Suspension &amp; Termination
            </h3>
            <div className="bg-white/5 p-5 rounded-2xl border border-white/5 text-sm text-white/70 space-y-2">
              <p>Spotly reserves the right to:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Suspend or terminate accounts for violations</li>
                <li>Remove listings that are misleading or inappropriate</li>
              </ul>
            </div>
          </section>

          {/* Section 6 */}
          <section className="space-y-4">
            <h3 className="text-xl font-heading font-bold text-yellow-400 flex items-center gap-2">
              <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-yellow-400/10 text-yellow-400 text-sm font-bold">6</span>
              Changes to Terms
            </h3>
            <p className="text-sm text-white/70 bg-white/5 p-5 rounded-2xl border border-white/5 leading-relaxed">
              We may update these Terms &amp; Conditions at any time. Updated versions will be posted within the App and on the website with a revised effective date.
            </p>
          </section>

          {/* Section 7 */}
          <section className="space-y-4">
            <h3 className="text-xl font-heading font-bold text-yellow-400 flex items-center gap-2">
              <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-yellow-400/10 text-yellow-400 text-sm font-bold">7</span>
              Contact Information
            </h3>
            <div className="bg-white/5 p-5 rounded-2xl border border-white/5 text-sm text-white/70 space-y-4">
              <p>For support or inquiries:</p>
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
