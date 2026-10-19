import { useState, useRef, useEffect } from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import spotlyLogo from "@assets/Logos/Spotly-3.png";

/* ─── colour tokens (matching the standalone HTML design) ─── */
const C = {
  navy: "#171E52",
  blue: "#241e98",
  purple: "#4a3dbf",
  grad: "linear-gradient(135deg, #1e3a8a 0%, #3b2fad 35%, #6d28d9 70%, #7c3aed 100%)",
  gradSoft: "linear-gradient(135deg, rgba(30,58,138,0.10) 0%, rgba(109,40,217,0.10) 100%)",
  sky: "#F5F5FF",
  sky2: "#ECEAFF",
  white: "#FFFFFF",
  yellow: "#F5E663",
  muted: "#5B6390",
  line: "#DDD9F5",
} as const;



/* ─── shared animation variants ─── */
const rise = (delay = 0) => ({
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.55, delay, ease: "easeOut" as const } },
});

const stagger = {
  visible: { transition: { staggerChildren: 0.12 } },
};

const cardHover = {
  rest: { y: 0, boxShadow: "0 4px 20px -10px rgba(23,30,82,0.12)" },
  hover: { y: -6, boxShadow: "0 18px 36px -18px rgba(23,30,82,0.28)", transition: { duration: 0.22 } },
};

/* ─── FAQ data ─── */
const FAQ_DATA = [
  { q: "Do I need to be home when a renter parks?", a: "No. Most owners set fixed access hours or share a gate code — you don't need to be present for the renter to use the space." },
  { q: "What if my society doesn't allow subletting parking?", a: "Check with your association first. Many societies allow it informally between residents — our team can share a sample agreement if it helps." },
  { q: "How do I get paid?", a: "Renters pay you directly each month — by UPI, bank transfer, or cash, whichever you agree on. Spotly doesn't take a cut of your monthly rate." },
  { q: "Can I remove my listing later?", a: "Yes, anytime from your Spotly account — pausing or deleting a listing takes one tap." },
];

/* ─── earnings data ─── */
const EARNINGS = [
  { label: "Open slot", pct: 55, amt: "₹1,800" },
  { label: "Covered slot", pct: 75, amt: "₹2,600" },
  { label: "Gated society", pct: 88, amt: "₹3,200" },
];

/* ─── areas data ─── */
const AREAS = [
  { tag: "KORAMANGALA", name: "Koramangala", desc: "Startup offices and dense apartment blocks mean parking is scarce almost every hour of the day." },
  { tag: "INDIRANAGAR", name: "Indiranagar", desc: "High footfall from restaurants and offices, alongside residential lanes with spare driveway space." },
  { tag: "HSR LAYOUT", name: "HSR Layout", desc: "Close to the tech corridor, with large gated communities and independent houses ready to list." },
  { tag: "JP NAGAR", name: "JP Nagar", desc: "A sprawling residential hub with busy commercial stretches where finding a safe parking spot is a daily struggle." },
  { tag: "JAYANAGAR", name: "Jayanagar", desc: "One of Bengaluru's most established neighbourhoods — packed markets and narrow lanes make parking painfully scarce." },
  { tag: "ELECTRONIC CITY", name: "Electronic City", desc: "Thousands of IT professionals commute daily, creating massive demand for affordable, secure parking near tech parks." },
];

/* ─── features data ─── */
const FEATURES = [
  {
    title: "List from any device",
    desc: "Add your space from your phone or laptop in minutes.",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><rect x="3" y="4" width="18" height="12" rx="1.5" stroke="#fff" strokeWidth="1.8" /><path d="M2 19h20" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" /></svg>
    ),
  },
  {
    title: "Manage anytime",
    desc: "Pause, update, or remove your listing whenever you like.",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><rect x="6" y="2" width="12" height="20" rx="2.5" stroke="#fff" strokeWidth="1.8" /><path d="M11 18h2" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" /></svg>
    ),
  },
  {
    title: "Verified renters only",
    desc: "Every driver is checked before they can book your space.",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M12 2l8 3v6c0 5-3.5 8.5-8 11-4.5-2.5-8-6-8-11V5l8-3z" stroke="#fff" strokeWidth="1.8" /><path d="M9 12l2 2 4-4" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
    ),
  },
  {
    title: "Book & earn",
    desc: "Get paid directly by your renter, every month, on time.",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" stroke="#fff" strokeWidth="1.8" /><path d="M12 7v5l3.5 2" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" /></svg>
    ),
  },
];

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   PAGE COMPONENT
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
export default function ListYourParkingSpacePage() {
  const [, setLocation] = useLocation();
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const ctaRef = useRef<HTMLDivElement>(null);

  const scrollToCta = () => {
    ctaRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  /* page-level title */
  useEffect(() => {
    document.title = "List Your Parking Space — Spotly";
  }, []);

  return (
    <div
      style={{ fontFamily: '"Inter", ui-sans-serif, system-ui, sans-serif', color: C.navy, background: C.white }}
      className="min-h-screen w-full overflow-x-hidden"
    >
      {/* ╔══════════════════ PROMO STRIP ══════════════════╗ */}
      <div style={{ background: C.grad }} className="relative z-50">
        <div className="max-w-[1140px] mx-auto px-6 py-2.5 flex items-center justify-center gap-3.5 flex-wrap text-center">
          <span className="text-white text-[13px] font-semibold">
            <span className="inline-block animate-[spark_1.8s_ease-in-out_infinite]">⚡</span>{" "}
            Launch week: list today, pay <strong>zero commission</strong> for 3 months
          </span>
          <button
            onClick={scrollToCta}
            className="bg-white text-[#241e98] border-none px-4 py-1.5 rounded-full font-bold text-[12.5px] cursor-pointer whitespace-nowrap hover:bg-[#F5E663] hover:text-[#171E52] transition-colors"
          >
            Claim offer →
          </button>
        </div>
      </div>

      {/* ╔══════════════════ STICKY HEADER ══════════════════╗ */}
      <header className="sticky top-0 z-40 bg-white/92 backdrop-blur-md border-b" style={{ borderColor: C.line }}>
        <div className="max-w-[1140px] mx-auto px-6 py-3 flex items-center justify-between">
          {/* logo */}
          <a
            href="/"
            onClick={(e) => { e.preventDefault(); setLocation("/"); }}
            className="flex items-center gap-2.5 cursor-pointer group"
          >
            <img src={spotlyLogo} alt="Spotly" className="h-10 w-auto" />
          </a>

          {/* CTA */}
          <button
            onClick={scrollToCta}
            className="hidden sm:inline-flex text-white border-none px-5 py-2.5 rounded-full font-semibold text-sm cursor-pointer animate-[pulse_2.4s_ease-in-out_infinite] hover:[animation-play-state:paused] hover:brightness-[1.08]"
            style={{ background: C.grad, boxShadow: "0 0 0 0 rgba(36,30,152,0.45)" }}
          >
            List your space
          </button>
        </div>
      </header>

      {/* ╔══════════════════ HERO ══════════════════╗ */}
      <section
        className="relative overflow-hidden py-14 md:py-16"
        style={{ background: `linear-gradient(180deg, ${C.sky} 0%, ${C.white} 100%)` }}
      >
        <motion.div
          className="max-w-[1140px] mx-auto px-6 grid grid-cols-1 md:grid-cols-[1.05fr_0.95fr] gap-11 items-center"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={stagger}
        >
          {/* left copy */}
          <div>
            <motion.span
              variants={rise(0.05)}
              className="inline-block text-white text-[12.5px] font-semibold px-4 py-1.5 rounded-full mb-5 tracking-wide"
              style={{ background: C.grad }}
            >
              🔥 Live now in Bengaluru
            </motion.span>

            <motion.h1
              variants={rise(0.15)}
              className="text-[clamp(30px,4.6vw,46px)] leading-[1.12] font-bold max-w-[13ch]"
              style={{ fontFamily: "Poppins, sans-serif", color: C.navy }}
            >
              Your empty parking slot is worth{" "}
              <span style={{ background: C.grad, WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent" }}>
                ₹2,000+ a month
              </span>
            </motion.h1>

            <motion.p variants={rise(0.25)} className="mt-5 text-[16.5px] max-w-[44ch]" style={{ color: C.muted }}>
              Stop letting it sit empty. List it on Spotly and get matched with a verified driver nearby — in as little as 2 minutes.
            </motion.p>

            <motion.div variants={rise(0.35)} className="flex gap-3 mt-7 flex-wrap">
              <button
                onClick={scrollToCta}
                className="text-white border-none px-7 py-3.5 rounded-full font-semibold text-[15px] cursor-pointer hover:brightness-[1.06] transition-all"
                style={{ background: C.grad, boxShadow: "0 10px 24px -10px rgba(36,30,152,0.45)" }}
              >
                List your space — free
              </button>
              <button
                onClick={() => document.getElementById("lyps-how")?.scrollIntoView({ behavior: "smooth" })}
                className="bg-white border-[1.5px] px-6 py-3 rounded-full font-semibold text-[15px] cursor-pointer hover:border-[#241e98] transition-colors"
                style={{ color: C.navy, borderColor: C.line }}
              >
                See how it works
              </button>
            </motion.div>

            <motion.div variants={rise(0.45)} className="flex gap-7 mt-8 flex-wrap">
              {[
                { big: "2 min", small: "to list a space" },
                { big: "₹2,000+", small: "avg. monthly per slot" },
              ].map((m) => (
                <div key={m.big} className="text-[13px]" style={{ color: C.muted }}>
                  <strong
                    className="block text-[19px] font-bold"
                    style={{ fontFamily: "Poppins, sans-serif", color: C.navy }}
                  >
                    {m.big}
                  </strong>
                  {m.small}
                </div>
              ))}
            </motion.div>
          </div>

          {/* right — browser mockup */}
          <motion.div variants={rise(0.25)} className="relative order-first md:order-last max-w-[420px] mx-auto md:mx-0 w-full">
            {/* sticker */}
            <div
              className="absolute -top-[6%] right-[2%] z-10 px-4 py-3 rounded-md -rotate-[4deg] text-[15px] leading-tight font-bold"
              style={{ fontFamily: "Kalam, cursive", background: C.yellow, color: C.navy, boxShadow: "0 10px 20px -8px rgba(23,30,82,0.25)" }}
            >
              Web app<br />live today!
            </div>

            {/* browser frame */}
            <div className="rounded-2xl border overflow-hidden" style={{ borderColor: C.line, background: C.white, boxShadow: "0 30px 60px -20px rgba(23,30,82,0.22)" }}>
              {/* dots bar */}
              <div className="flex items-center gap-1.5 px-3.5 py-2.5 border-b" style={{ background: C.sky2, borderColor: C.line }}>
                <span className="w-2 h-2 rounded-full" style={{ background: "#C9CFEE" }} />
                <span className="w-2 h-2 rounded-full" style={{ background: "#C9CFEE" }} />
                <span className="w-2 h-2 rounded-full" style={{ background: "#C9CFEE" }} />
              </div>
              {/* body */}
              <div className="p-5 pb-6">
                <div className="flex items-center gap-1.5 mb-4">
                  <img src={spotlyLogo} alt="Spotly" className="h-6 w-auto" />
                </div>
                <h3 className="text-[21px] font-bold leading-tight mb-2" style={{ fontFamily: "Poppins, sans-serif", color: C.navy }}>List Your Parking Space in Minutes</h3>
                <p className="text-[13px] max-w-[32ch] mb-4" style={{ color: C.muted }}>Property owners with a spare slot — get discovered by drivers nearby.</p>
                {/* search row */}
                <div className="flex gap-2 rounded-xl px-3 py-2.5 border mb-4" style={{ background: C.sky2, borderColor: C.line }}>
                  <span className="flex-1 text-[13px]" style={{ color: C.muted }}>Enter your area…</span>
                  <div className="w-[26px] h-[26px] rounded-lg flex items-center justify-center text-white text-xs" style={{ background: C.grad }}>➜</div>
                </div>
                {/* chips */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="rounded-lg px-3 py-2.5" style={{ background: C.sky2 }}>
                    <div className="text-xs font-bold" style={{ color: C.navy }}>🚗 For Drivers</div>
                    <div className="text-[10.5px] mt-0.5" style={{ color: C.muted }}>Find a safe spot</div>
                  </div>
                  <div className="rounded-lg px-3 py-2.5" style={{ background: C.sky2 }}>
                    <div className="text-xs font-bold" style={{ color: C.navy }}>🏠 For Owners</div>
                    <div className="text-[10.5px] mt-0.5" style={{ color: C.muted }}>Turn space into income</div>
                  </div>
                </div>
              </div>
            </div>

            {/* floating phone card */}
            <div
              className="absolute -right-[6%] -bottom-[9%] w-[36%] rounded-2xl border p-3 pb-4 hidden md:block"
              style={{ background: C.white, borderColor: C.line, boxShadow: "0 24px 50px -18px rgba(23,30,82,0.28)" }}
            >
              <div className="flex items-center gap-1.5 mb-2.5">
                <img src={spotlyLogo} alt="Spotly" className="h-4 w-auto" />
              </div>
              <div className="text-xs font-bold leading-tight mb-2.5">List your spot,<br />start earning</div>
              <div className="h-[52px] rounded-lg mb-2.5" style={{ background: C.gradSoft }} />
              <div className="text-white text-center rounded-lg text-[10.5px] font-bold py-2" style={{ background: C.grad }}>List My Space</div>
            </div>
          </motion.div>
        </motion.div>
      </section>

      {/* ╔══════════════════ HOW IT WORKS ══════════════════╗ */}
      <section id="lyps-how" className="py-16">
        <div className="max-w-[1140px] mx-auto px-6">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger} className="mb-10 max-w-[56ch]">
            <motion.span variants={rise()} className="inline-block text-[12.5px] font-bold tracking-wide mb-2.5" style={{ color: C.blue }}>HOW IT WORKS</motion.span>
            <motion.h2 variants={rise(0.1)} className="text-[clamp(23px,3.2vw,32px)] leading-[1.18] font-bold" style={{ fontFamily: "Poppins, sans-serif", color: C.navy }}>
              From empty slot to paying tenant in three steps
            </motion.h2>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {[
              { n: "1", t: "List your space", d: "Tell us where it is, what type of vehicle it fits, and when it's free. Takes about two minutes." },
              { n: "2", t: "Get verified", d: "Our team confirms the details and photos, then your listing goes live to drivers nearby." },
              { n: "3", t: "Start earning", d: "Approve a renter, agree on the monthly rate, and get paid directly — no fees on your first month." },
            ].map((s, i) => (
              <motion.div
                key={s.n}
                initial="rest"
                whileHover="hover"
                variants={cardHover}
                className="rounded-2xl border p-7"
                style={{ background: C.sky, borderColor: C.line }}
              >
                <div
                  className="w-[34px] h-[34px] rounded-xl flex items-center justify-center text-white text-sm font-bold mb-4"
                  style={{ fontFamily: "Poppins, sans-serif", background: C.grad }}
                >
                  {s.n}
                </div>
                <h3 className="text-lg font-bold mb-2" style={{ fontFamily: "Poppins, sans-serif", color: C.navy }}>{s.t}</h3>
                <p className="text-sm m-0" style={{ color: C.muted }}>{s.d}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ╔══════════════════ FEATURES ══════════════════╗ */}
      <section className="py-16">
        <div className="max-w-[1140px] mx-auto px-6">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger} className="mb-10 max-w-[56ch]">
            <motion.span variants={rise()} className="inline-block text-[12.5px] font-bold tracking-wide mb-2.5" style={{ color: C.blue }}>WHY OWNERS CHOOSE SPOTLY</motion.span>
            <motion.h2 variants={rise(0.1)} className="text-[clamp(23px,3.2vw,32px)] leading-[1.18] font-bold" style={{ fontFamily: "Poppins, sans-serif", color: C.navy }}>
              Same great experience, now built for property owners
            </motion.h2>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {FEATURES.map((f) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.45 }}
                className="flex gap-3 items-start"
              >
                <div className="w-11 h-11 rounded-full flex-shrink-0 flex items-center justify-center" style={{ background: C.grad }}>
                  {f.icon}
                </div>
                <div>
                  <h4 className="text-[14.5px] font-bold mb-1" style={{ color: C.navy }}>{f.title}</h4>
                  <p className="text-[12.5px] m-0" style={{ color: C.muted }}>{f.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ╔══════════════════ AREAS ══════════════════╗ */}
      <section className="py-16" style={{ background: C.sky }}>
        <div className="max-w-[1140px] mx-auto px-6">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger} className="mb-10 max-w-[56ch]">
            <motion.span variants={rise()} className="inline-block text-[12.5px] font-bold tracking-wide mb-2.5" style={{ color: C.blue }}>WHERE WE'RE LIVE</motion.span>
            <motion.h2 variants={rise(0.1)} className="text-[clamp(23px,3.2vw,32px)] leading-[1.18] font-bold" style={{ fontFamily: "Poppins, sans-serif", color: C.navy }}>
              Launching first in Bengaluru's busiest parking pockets
            </motion.h2>
            <motion.p variants={rise(0.2)} className="mt-3 text-[15.5px]" style={{ color: C.muted }}>
              If your property sits in or near one of these areas, demand from drivers is already highest.
            </motion.p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {AREAS.map((a) => (
              <motion.div
                key={a.tag}
                initial="rest"
                whileHover="hover"
                variants={cardHover}
                className="bg-white rounded-2xl border p-6"
                style={{ borderColor: C.line }}
              >
                <div className="inline-flex items-center gap-1.5 mb-3.5 text-xs font-bold" style={{ color: C.purple }}>📍 {a.tag}</div>
                <h3 className="text-[19px] font-bold mb-2" style={{ fontFamily: "Poppins, sans-serif", color: C.navy }}>{a.name}</h3>
                <p className="text-[13.5px] m-0" style={{ color: C.muted }}>{a.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ╔══════════════════ EARNINGS ══════════════════╗ */}
      <section className="py-16">
        <div className="max-w-[1140px] mx-auto px-6 grid grid-cols-1 md:grid-cols-2 gap-11 items-center">
          {/* left — bars */}
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger}>
            <motion.span variants={rise()} className="inline-block text-[12.5px] font-bold tracking-wide mb-2.5" style={{ color: C.blue }}>EARNING POTENTIAL</motion.span>
            <motion.h2 variants={rise(0.1)} className="text-[clamp(21px,2.8vw,28px)] leading-[1.18] font-bold mb-6" style={{ fontFamily: "Poppins, sans-serif", color: C.navy }}>
              What owners are earning per slot, per month
            </motion.h2>

            <div className="flex flex-col gap-4">
              {EARNINGS.map((e) => (
                <motion.div key={e.label} variants={rise(0.15)} className="grid items-center gap-3.5" style={{ gridTemplateColumns: "110px 1fr 80px" }}>
                  <span className="text-sm font-semibold" style={{ color: C.navy }}>{e.label}</span>
                  <div className="h-2.5 rounded-full overflow-hidden" style={{ background: C.sky2 }}>
                    <motion.div
                      className="h-full rounded-full"
                      style={{ background: C.grad }}
                      initial={{ width: 0 }}
                      whileInView={{ width: `${e.pct}%` }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.8, ease: "easeOut" }}
                    />
                  </div>
                  <span className="text-sm font-bold text-right" style={{ fontFamily: "Poppins, sans-serif", color: C.navy }}>{e.amt}</span>
                </motion.div>
              ))}
            </div>
            <p className="text-[13px] mt-5" style={{ color: C.muted }}>
              Estimates based on early listings in Koramangala, Indiranagar and HSR Layout. Actual rate depends on location and demand.
            </p>
          </motion.div>

          {/* right — card */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.55 }}
            className="rounded-2xl p-8 text-white"
            style={{ background: C.grad }}
          >
            <div className="text-base font-bold mb-2.5" style={{ fontFamily: "Poppins, sans-serif" }}>Zero listing cost</div>
            <p className="text-[14.5px] opacity-[0.92] mb-5">
              Spotly doesn't charge owners to list. You only decide the price a renter pays you directly.
            </p>
            <ul className="pl-4 text-sm opacity-95 space-y-2">
              <li>You set your own monthly rate</li>
              <li>You approve every renter before they move in</li>
              <li>Pause or remove your listing anytime</li>
            </ul>
          </motion.div>
        </div>
      </section>

      {/* ╔══════════════════ FAQ ══════════════════╗ */}
      <section className="py-16">
        <div className="max-w-[760px] mx-auto px-6">
          <div className="mb-2">
            <span className="inline-block text-[12.5px] font-bold tracking-wide mb-2.5" style={{ color: C.blue }}>COMMON QUESTIONS</span>
            <h2 className="text-[clamp(23px,3.2vw,32px)] leading-[1.18] font-bold" style={{ fontFamily: "Poppins, sans-serif", color: C.navy }}>Before you list</h2>
          </div>

          <div className="border-t" style={{ borderColor: C.line }}>
            {FAQ_DATA.map((faq, i) => {
              const isOpen = openFaq === i;
              return (
                <div key={i} className="border-b" style={{ borderColor: C.line }}>
                  <button
                    onClick={() => setOpenFaq(isOpen ? null : i)}
                    className="w-full text-left bg-transparent border-none cursor-pointer py-5 flex justify-between items-center text-[15.5px] font-semibold"
                    style={{ color: C.navy }}
                  >
                    {faq.q}
                    <span
                      className="text-xl font-normal transition-transform duration-200"
                      style={{ color: C.purple, transform: isOpen ? "rotate(45deg)" : "rotate(0deg)" }}
                    >
                      +
                    </span>
                  </button>
                  <div
                    className="overflow-hidden transition-all duration-300"
                    style={{ maxHeight: isOpen ? "200px" : "0px" }}
                  >
                    <div className="pb-5 text-sm max-w-[60ch]" style={{ color: C.muted }}>{faq.a}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ╔══════════════════ LEAD FORM / CTA ══════════════════╗ */}
      <section ref={ctaRef} className="py-16" style={{ background: C.sky }}>
        <div className="max-w-[1140px] mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.55 }}
            className="rounded-2xl p-10 md:p-14 text-center"
            style={{ background: C.grad }}
          >
            <h2 className="text-[clamp(24px,3.4vw,34px)] leading-[1.18] font-bold text-white max-w-[18ch] mx-auto" style={{ fontFamily: "Poppins, sans-serif" }}>
              Ready to list your space and start earning?
            </h2>
            <p className="mt-4 text-[15.5px] text-white/85 max-w-[48ch] mx-auto">
              Head over to Spotly — sign up, list your parking space, and get matched with verified drivers nearby.
            </p>

            <div className="mt-5 flex flex-wrap justify-center gap-4">
              {["Free to list, no fees", "You approve every renter", "Live within 24 hours"].map((t) => (
                <div key={t} className="flex items-center gap-2 text-sm text-white/90">
                  <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                    <path d="M3 8.5L6.5 12L13 4" stroke="#F5E663" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <span>{t}</span>
                </div>
              ))}
            </div>

            <a
              href="https://www.spotlyindia.org"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2.5 mt-8 px-9 py-4 rounded-full font-bold text-[16px] transition-all hover:scale-[1.03] hover:shadow-lg"
              style={{ background: C.white, color: C.navy, boxShadow: "0 10px 28px -10px rgba(0,0,0,0.35)" }}
            >
              Get started on Spotly
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path d="M5 12h14M13 6l6 6-6 6" stroke={C.navy} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </a>
            <p className="text-xs text-white/60 mt-4">spotlyindia.org · No download required</p>
          </motion.div>
        </div>
      </section>

      {/* ╔══════════════════ ACCESS BAR ══════════════════╗ */}
      <div className="py-7" style={{ background: C.navy }}>
        <div className="max-w-[1140px] mx-auto px-6 flex items-center justify-between flex-wrap gap-6">
          {/* visit */}
          <div className="flex items-center gap-3">
            <div className="w-[42px] h-[42px] rounded-full border-[1.5px] border-white/35 flex items-center justify-center">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" stroke="#fff" strokeWidth="1.6" /><path d="M3 12h18M12 3c2.5 2.7 2.5 15.3 0 18M12 3c-2.5 2.7-2.5 15.3 0 18" stroke="#fff" strokeWidth="1.6" /></svg>
            </div>
            <div>
              <div className="text-[13px]" style={{ color: "#C7CCF2" }}>Or visit</div>
              <a
                href="https://www.spotlyindia.org"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-white px-4 py-2 rounded-full font-bold text-sm mt-1"
                style={{ background: C.grad }}
              >
                spotlyindia.org →
              </a>
            </div>
          </div>

          {/* android */}
          <div className="flex items-center gap-3">
            <div className="w-[42px] h-[42px] rounded-full border-[1.5px] border-white/35 flex items-center justify-center">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><rect x="7" y="2" width="10" height="20" rx="2" stroke="#fff" strokeWidth="1.6" /><path d="M11 18h2" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" /></svg>
            </div>
            <div>
              <div className="text-[13px]" style={{ color: "#C7CCF2" }}>Android app</div>
              <div className="text-white font-bold text-[14.5px]">Available soon</div>
            </div>
          </div>

          {/* stay tuned */}
          <div className="text-white text-base font-bold" style={{ fontFamily: "Kalam, cursive" }}>Stay tuned!</div>
        </div>
      </div>

      {/* ╔══════════════════ FOOTER ══════════════════╗ */}
      <footer className="py-8 pb-10" style={{ background: C.sky2 }}>
        <div className="max-w-[1140px] mx-auto px-6">
          <div className="flex items-center justify-center gap-3.5 flex-wrap text-[13px] font-bold tracking-wide mb-5" style={{ color: C.purple }}>
            <span>YOUR SPACE</span>
            <span style={{ color: C.line }} className="font-normal">/</span>
            <span>YOUR PRICE</span>
            <span style={{ color: C.line }} className="font-normal">/</span>
            <span>YOUR INCOME</span>
          </div>

          {/* skyline */}
          <div className="flex justify-between items-end opacity-55">
            <svg viewBox="0 0 200 60" className="w-[200px] h-auto max-w-[45%]" xmlns="http://www.w3.org/2000/svg" stroke="#4a3dbf" strokeWidth="1.5" fill="none">
              <rect x="2" y="30" width="16" height="28" /><rect x="20" y="18" width="14" height="40" /><rect x="36" y="34" width="12" height="24" />
              <rect x="50" y="10" width="16" height="48" /><rect x="68" y="26" width="14" height="32" /><rect x="84" y="20" width="12" height="38" />
            </svg>
            <svg viewBox="0 0 200 60" className="w-[200px] h-auto max-w-[45%]" xmlns="http://www.w3.org/2000/svg" stroke="#241e98" strokeWidth="1.5" fill="none">
              <rect x="104" y="22" width="14" height="36" /><rect x="120" y="34" width="12" height="24" /><rect x="134" y="14" width="16" height="44" />
              <rect x="152" y="28" width="14" height="30" /><rect x="168" y="18" width="12" height="40" /><rect x="182" y="32" width="16" height="26" />
            </svg>
          </div>

          <div className="text-center mt-5 text-[12.5px]" style={{ color: C.muted }}>© 2026 Spotly · Bengaluru</div>
        </div>
      </footer>

      {/* ╔══════════════════ KEYFRAME INJECTOR ══════════════════╗ */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700;800&family=Kalam:wght@400;700&display=swap');
        @keyframes spark {
          0%,100% { transform: scale(1) rotate(0deg); }
          50% { transform: scale(1.25) rotate(-8deg); }
        }
        @keyframes pulse {
          0%   { box-shadow: 0 0 0 0 rgba(36,30,152,0.35); }
          70%  { box-shadow: 0 0 0 10px rgba(36,30,152,0); }
          100% { box-shadow: 0 0 0 0 rgba(36,30,152,0); }
        }
      `}</style>
    </div>
  );
}
