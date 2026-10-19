import { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { motion } from "framer-motion";
import { Mail, ArrowLeft, Shield, CheckCircle, Info, Sparkles, Phone, CreditCard, Calendar, Eye } from "lucide-react";
import logo from "@assets/Logos/spotly_full-white.png";
import { getApiUrl } from "@/lib/api-config";

interface PremiumPlan {
  name: string;
  price: number;
  views: number;
  validity: number;
  key: string;
  enabled: boolean;
}

export default function SubscriptionPolicyPage() {
  const [location, setLocation] = useLocation();
  const [phone, setPhone] = useState("+91 97425 45584");
  const [email, setEmail] = useState("info@spotlyindia.org");
  const [plans, setPlans] = useState<PremiumPlan[]>([]);
  const [isLoadingPlans, setIsLoadingPlans] = useState(true);

  useEffect(() => {
    const fetchContactInfo = async () => {
      try {
        const [phoneRes, emailRes, plansRes] = await Promise.all([
          fetch(getApiUrl("/api/settings/support_phone")),
          fetch(getApiUrl("/api/settings/support_email")),
          fetch(getApiUrl("/api/settings/premium-plans"))
        ]);

        if (phoneRes.ok) {
          const data = await phoneRes.json();
          if (data.setting?.value) setPhone(data.setting.value);
        }
        if (emailRes.ok) {
          const data = await emailRes.json();
          if (data.setting?.value) setEmail(data.setting.value);
        }
        if (plansRes.ok) {
          const data = await plansRes.json();
          if (data.plans) {
            setPlans(data.plans.filter((p: PremiumPlan) => p.enabled));
          }
        }
      } catch (error) {
        console.error("Failed to fetch page data:", error);
      } finally {
        setIsLoadingPlans(false);
      }
    };
    fetchContactInfo();
  }, []);

  const handleBackHome = () => {
    setLocation("/");
  };

  return (
    <div
      className="relative w-full min-h-screen overflow-x-hidden flex flex-col text-white px-4 py-8 md:py-16 animate-fade-in spotly-inner-page-bg"
      style={{
        backgroundImage:
          "radial-gradient(ellipse at 100% 0%, rgba(225, 75, 255, 0.95) 0%, transparent 36%), radial-gradient(ellipse at 72% 5%, rgba(83, 30, 255, 0.9) 0%, transparent 40%), radial-gradient(ellipse at 58% 65%, rgba(24, 28, 220, 0.7) 0%, transparent 46%), linear-gradient(115deg, #020b50 0%, #061b9e 48%, #2410c9 76%, #740dff 100%)",
        backgroundRepeat: "no-repeat",
        backgroundColor: "#020b50",
        backgroundAttachment: "fixed",
      }}
      data-testid="page-subscription-policy"
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
            <h1 className="text-xl font-heading font-semibold text-white/90">Subscription Policy</h1>
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
          className="bg-white/10 backdrop-blur-md border border-white/15 rounded-3xl p-6 md:p-10 text-white/90 shadow-2xl flex-1 space-y-8 animate-contact-reveal font-sans"
        >
          <div className="flex items-center justify-between border-b border-white/10 pb-5">
            <div>
              <h2 className="text-2xl md:text-3xl font-bold text-white tracking-tight">Subscription &amp; Refund Policy</h2>
              <p className="text-white/60 text-sm mt-1.5">Effective Date: 16 July 2026</p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center border border-white/20 hidden sm:flex shrink-0">
              <Shield size={24} className="text-blue-300" />
            </div>
          </div>

          <div className="space-y-6 text-white/80 leading-relaxed text-sm md:text-base">
            <section className="space-y-3">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <span className="w-7 h-7 rounded-lg bg-white/10 text-blue-300 flex items-center justify-center text-sm font-bold">1</span>
                Subscription Plans
              </h3>
              <p>
                Spotly offers paid subscription plans for Space Seekers to access contact details of parking space providers. Available plans are loaded dynamically below and only display when active:
              </p>

              {/* Dynamic Subscription Option Pricing Module */}
              <div className="my-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                {isLoadingPlans ? (
                  <div className="col-span-full py-8 text-center text-white/50 flex flex-col items-center gap-2">
                    <div className="w-8 h-8 rounded-full border-4 border-blue-400 border-t-transparent animate-spin" />
                    <p className="text-xs">Fetching active subscription plan settings...</p>
                  </div>
                ) : plans.length === 0 ? (
                  <div className="col-span-full py-6 text-center text-white/50 bg-white/5 rounded-2xl border border-white/10">
                    <p className="text-sm">No subscription plans are currently active from the admin panel.</p>
                  </div>
                ) : (
                  plans.map((plan) => (
                    <div 
                      key={plan.key} 
                      className="bg-white/5 border border-white/10 rounded-2xl p-5 flex flex-col justify-between hover:bg-white/10 hover:border-white/25 transition-all shadow-md relative overflow-hidden group"
                    >
                      {plan.views === -1 && (
                        <div className="absolute top-0 right-0 bg-yellow-400 text-neutral-900 font-extrabold text-[9px] uppercase tracking-wider py-1 px-3 rounded-bl-lg shadow-sm flex items-center gap-1">
                          <Sparkles size={8} /> Popular
                        </div>
                      )}
                      <div>
                        <h4 className="text-base font-extrabold text-white mb-2 uppercase tracking-wider text-blue-300">{plan.name} Plan</h4>
                        <div className="flex items-baseline gap-1 mb-4">
                          <span className="text-3xl font-black text-white">₹{plan.price}</span>
                          <span className="text-white/60 text-xs font-semibold">/ month</span>
                        </div>
                        <ul className="space-y-2.5 text-xs text-white/70 border-t border-white/10 pt-4 mb-5">
                          <li className="flex items-center gap-2 font-medium">
                            <Eye size={14} className="text-blue-300 shrink-0" />
                            <span>
                              {plan.views === -1 ? "Unlimited Contact Views" : `Up to ${plan.views} Contact Views`}
                            </span>
                          </li>
                          <li className="flex items-center gap-2 font-medium">
                            <Calendar size={14} className="text-blue-300 shrink-0" />
                            <span>{plan.validity} Days Plan Validity</span>
                          </li>
                          <li className="flex items-center gap-2 font-medium">
                            <CreditCard size={14} className="text-blue-300 shrink-0" />
                            <span>One-Time Payment</span>
                          </li>
                        </ul>
                      </div>
                    </div>
                  ))
                )}
              </div>
              <p className="text-xs text-white/60">
                * Note: Individual plans can be enabled, disabled, and configured dynamically via the Admin Settings Dashboard. Validity counts start from the time of purchase.
              </p>
            </section>

            <section className="space-y-3">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <span className="w-7 h-7 rounded-lg bg-white/10 text-blue-300 flex items-center justify-center text-sm font-bold">2</span>
                Subscription Usage
              </h3>
              <ul className="list-disc pl-5 space-y-2 text-white/80">
                <li>Subscriptions allow users to view contact details of parking space providers listed on the platform.</li>
                <li>Once a contact detail is accessed, it will remain available to the user even after the subscription expires.</li>
                <li>After subscription expiry, users will not be able to access new or unviewed contacts unless they renew or purchase a new subscription.</li>
              </ul>
            </section>

            <section className="space-y-3">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <span className="w-7 h-7 rounded-lg bg-white/10 text-blue-300 flex items-center justify-center text-sm font-bold">3</span>
                Payment Terms
              </h3>
              <ul className="list-disc pl-5 space-y-2 text-white/80">
                <li>All payments are processed securely through supported payment methods such as UPI, debit/credit cards, or other enabled gateways.</li>
                <li>All prices are listed in Indian Rupees (INR) and are inclusive of applicable taxes unless stated otherwise.</li>
                <li>Spotly reserves the right to revise subscription pricing at any time without prior notice.</li>
              </ul>
            </section>

            <section className="space-y-3">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <span className="w-7 h-7 rounded-lg bg-white/10 text-blue-300 flex items-center justify-center text-sm font-bold">4</span>
                Refund Policy
              </h3>
              <p>
                All subscription purchases are non-refundable and non-transferable. Once a user has accessed any contact details, the service is considered consumed in full. No refunds will be provided under the following circumstances:
              </p>
              <ul className="list-disc pl-5 space-y-2 text-white/80">
                <li>Unused subscription duration</li>
                <li>Partial usage of the plan</li>
                <li>User’s change of mind or decision</li>
              </ul>
            </section>

            <section className="space-y-3">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <span className="w-7 h-7 rounded-lg bg-white/10 text-blue-300 flex items-center justify-center text-sm font-bold">5</span>
                Exceptions
              </h3>
              <p>Refunds may be considered only under the following conditions:</p>
              <ul className="list-disc pl-5 space-y-2 text-white/80">
                <li>Duplicate payment made for the same transaction.</li>
                <li>Verified technical error resulting in failure of service delivery.</li>
              </ul>
              <p>To be eligible:</p>
              <ul className="list-disc pl-5 space-y-2 text-white/80">
                <li>Users must report the issue within 48 hours of the transaction.</li>
                <li>Requests will be reviewed and processed at Spotly’s sole discretion.</li>
              </ul>
            </section>

            <section className="space-y-3">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <span className="w-7 h-7 rounded-lg bg-white/10 text-blue-300 flex items-center justify-center text-sm font-bold">6</span>
                Cancellation
              </h3>
              <ul className="list-disc pl-5 space-y-2 text-white/80">
                <li>All subscriptions are one-time (non-recurring) payments.</li>
                <li>No manual cancellation is required.</li>
                <li>Access automatically expires at the end of the subscription period.</li>
              </ul>
            </section>

            <section className="space-y-3">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <span className="w-7 h-7 rounded-lg bg-white/10 text-blue-300 flex items-center justify-center text-sm font-bold">7</span>
                Service Disclaimer
              </h3>
              <p>
                Spotly is a technology platform that connects Space Seekers with Space Providers. We do not guarantee:
              </p>
              <ul className="list-disc pl-5 space-y-2 text-white/80">
                <li>Availability of parking spaces</li>
                <li>Accuracy of listings</li>
                <li>Response or communication from providers</li>
              </ul>
              <p>
                Users are solely responsible for verifying all details before making any decisions or payments outside the platform.
              </p>
            </section>

            <section className="space-y-3">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <span className="w-7 h-7 rounded-lg bg-white/10 text-blue-300 flex items-center justify-center text-sm font-bold">8</span>
                Limitation of Liability
              </h3>
              <p>Spotly shall not be held liable for:</p>
              <ul className="list-disc pl-5 space-y-2 text-white/80">
                <li>Any disputes between users and providers</li>
                <li>Loss, damage, or inconvenience arising from use of the platform</li>
                <li>Any indirect or consequential damages</li>
              </ul>
            </section>

            <section className="space-y-3">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <span className="w-7 h-7 rounded-lg bg-white/10 text-blue-300 flex items-center justify-center text-sm font-bold">9</span>
                Changes to Policy
              </h3>
              <p>
                Spotly reserves the right to modify this policy at any time. Updates will be posted on the website and mobile application with a revised effective date.
              </p>
            </section>

            <section className="space-y-3">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <span className="w-7 h-7 rounded-lg bg-white/10 text-blue-300 flex items-center justify-center text-sm font-bold">10</span>
                Contact Us
              </h3>
              <p>For any questions or refund-related requests, please contact us:</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
                <div className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-2xl p-4">
                  <Mail className="text-blue-300 shrink-0" size={20} />
                  <div>
                    <p className="text-[10px] text-white/50 uppercase font-semibold">Email Support</p>
                    <a href={`mailto:${email}`} className="text-sm font-medium text-white hover:text-blue-300 transition-colors">{email}</a>
                  </div>
                </div>
                <div className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-2xl p-4">
                  <Phone className="text-blue-300 shrink-0" size={20} />
                  <div>
                    <p className="text-[10px] text-white/50 uppercase font-semibold">Phone Support</p>
                    <a href={`tel:${phone}`} className="text-sm font-medium text-white hover:text-blue-300 transition-colors">{phone}</a>
                  </div>
                </div>
              </div>
            </section>
          </div>
        </motion.div>

        {/* Footer */}
        <footer className="mt-8 text-center text-white/40 text-xs pb-6">
          <p>© {new Date().getFullYear()} Spotly India. All rights reserved.</p>
        </footer>
      </div>
    </div>
  );
}
