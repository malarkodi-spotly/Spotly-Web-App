import { useEffect, useState, useMemo } from "react";
import { Link, useLocation } from "wouter";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Star,
  MessageSquare,
  ShieldCheck,
  CheckCircle2,
  Filter,
  Search,
  Sparkles,
  Users,
  Building,
  Car,
  Quote,
} from "lucide-react";
import logo from "@assets/Logos/spotly_full-white.png";
import { getApiUrl } from "@/lib/api-config";

interface FeedbackItem {
  id: string;
  userId?: string;
  userName: string;
  userRole: string; // 'customer' | 'worker' | 'space-provider' | 'space-seeker'
  userMobile?: string;
  rating: number;
  comments: string;
  isActive: boolean;
  createdAt?: string;
}

export default function CustomerFeedbackPage() {
  const [location, setLocation] = useLocation();
  const [feedbacks, setFeedbacks] = useState<FeedbackItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedRole, setSelectedRole] = useState<string>("all");
  const [selectedRating, setSelectedRating] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const fetchFeedbacks = async () => {
      try {
        setIsLoading(true);
        const res = await fetch(getApiUrl("/api/feedbacks"));
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data.feedbacks)) {
            setFeedbacks(data.feedbacks);
          }
        }
      } catch (err) {
        console.error("Failed to fetch customer feedbacks:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchFeedbacks();
  }, []);

  const handleBackHome = () => {
    setLocation("/");
  };

  // Aggregation statistics
  const totalCount = feedbacks.length;
  const averageRating = useMemo(() => {
    if (totalCount === 0) return 5.0;
    const sum = feedbacks.reduce((acc, f) => acc + (f.rating || 5), 0);
    return (sum / totalCount).toFixed(1);
  }, [feedbacks, totalCount]);

  const ratingCounts = useMemo(() => {
    const counts: Record<number, number> = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    feedbacks.forEach((f) => {
      if (f.rating >= 1 && f.rating <= 5) {
        counts[f.rating] = (counts[f.rating] || 0) + 1;
      }
    });
    return counts;
  }, [feedbacks]);

  // Filtering
  const filteredFeedbacks = useMemo(() => {
    return feedbacks.filter((item) => {
      // Role filter
      if (selectedRole === "provider") {
        if (item.userRole !== "customer" && item.userRole !== "space-provider") return false;
      } else if (selectedRole === "seeker") {
        if (item.userRole !== "worker" && item.userRole !== "space-seeker") return false;
      }

      // Rating filter
      if (selectedRating !== "all") {
        const targetRating = parseInt(selectedRating);
        if (item.rating !== targetRating) return false;
      }

      // Search query filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesName = item.userName?.toLowerCase().includes(query);
        const matchesComments = item.comments?.toLowerCase().includes(query);
        if (!matchesName && !matchesComments) return false;
      }

      return true;
    });
  }, [feedbacks, selectedRole, selectedRating, searchQuery]);

  const getRoleLabel = (role: string) => {
    if (role === "customer" || role === "space-provider") {
      return {
        label: "Space Provider",
        color: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
        icon: Building,
      };
    }
    return {
      label: "Space Seeker",
      color: "bg-indigo-500/20 text-indigo-300 border-indigo-500/30",
      icon: Car,
    };
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "Recently";
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return "Recently";
      return d.toLocaleDateString("en-IN", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    } catch {
      return "Recently";
    }
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
      data-testid="page-customer-feedback"
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
        {/* Header & Navigation */}
        <header className="flex flex-col md:flex-row items-center justify-between gap-4 mb-8 border-b border-white/10 pb-6">
          <div className="flex items-center gap-3">
            <a
              href="/"
              onClick={(e) => {
                e.preventDefault();
                setLocation("/");
              }}
              className="inline-flex items-center cursor-pointer transition-transform active:scale-95 relative group"
              title="Go to Landing Screen"
            >
              <img src={logo} alt="Spotly Logo" className="h-10 w-auto" />
              <div className="absolute -bottom-8 left-0 hidden md:group-hover:flex items-center px-2.5 py-1 bg-slate-900/95 backdrop-blur-md text-white text-[10px] font-bold rounded-lg shadow-xl pointer-events-none whitespace-nowrap z-50 border border-white/20">
                Go to Landing Screen
              </div>
            </a>
            <div className="h-6 w-px bg-white/20 hidden sm:block" />
            <h1 className="text-xl font-heading font-semibold text-white/90">Customer Feedback</h1>
          </div>

          <div className="flex items-center gap-2 md:gap-3 flex-wrap justify-center md:justify-end">
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
              className="text-sm font-semibold px-3 py-1.5 rounded-lg transition-all bg-white/20 text-white border border-white/20"
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

        {/* Hero Section */}
        <div className="text-center max-w-3xl mx-auto mb-10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-xs font-semibold uppercase tracking-wider mb-4 text-indigo-200">
            <Sparkles className="w-4 h-4 text-amber-300" />
            <span>Community Voices &amp; Verified Reviews</span>
          </div>
          <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight mb-4 drop-shadow-md">
            What Our Community Says
          </h2>
          <p className="text-base md:text-lg text-white/80 leading-relaxed">
            Real feedback from Space Providers earning passive rent and Space Seekers finding instant, safe parking every single day.
          </p>
        </div>

        {/* Aggregated Rating Summary Card */}
        <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-6 md:p-8 mb-10 shadow-2xl">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
            {/* Score & Stars */}
            <div className="flex flex-col items-center justify-center text-center p-4 border-b md:border-b-0 md:border-r border-white/15">
              <span className="text-5xl md:text-6xl font-black text-amber-300 drop-shadow-lg">
                {averageRating}
              </span>
              <div className="flex items-center gap-1 my-2">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star
                    key={s}
                    className="w-5 h-5 fill-amber-400 text-amber-400 drop-shadow-[0_2px_6px_rgba(251,191,36,0.5)]"
                  />
                ))}
              </div>
              <p className="text-xs text-white/70 font-medium">
                Based on <strong className="text-white">{totalCount}</strong> verified community reviews
              </p>
            </div>

            {/* Rating Breakdown Bars */}
            <div className="space-y-2 px-2">
              {[5, 4, 3, 2, 1].map((stars) => {
                const count = ratingCounts[stars] || 0;
                const percentage = totalCount > 0 ? (count / totalCount) * 100 : 0;
                return (
                  <div key={stars} className="flex items-center gap-3 text-xs">
                    <span className="w-12 text-right font-semibold text-white/80 flex items-center justify-end gap-1">
                      {stars} <Star className="w-3 h-3 fill-amber-400 text-amber-400 inline" />
                    </span>
                    <div className="flex-1 h-2 rounded-full bg-white/15 overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-amber-400 to-amber-300 rounded-full transition-all duration-500"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <span className="w-8 text-left text-white/60 text-[11px] font-mono">
                      {count}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Platform Highlights */}
            <div className="flex flex-col justify-center space-y-3 p-2 border-t md:border-t-0 md:border-l border-white/15">
              <div className="flex items-center gap-3 p-2.5 rounded-xl bg-white/5 border border-white/10">
                <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
                <div className="text-xs">
                  <div className="font-bold text-white">100% Genuine Reviews</div>
                  <div className="text-white/60 text-[11px]">Submitted by active registered users</div>
                </div>
              </div>
              <div className="flex items-center gap-3 p-2.5 rounded-xl bg-white/5 border border-white/10">
                <Users className="w-5 h-5 text-indigo-300 shrink-0" />
                <div className="text-xs">
                  <div className="font-bold text-white">Both Providers &amp; Seekers</div>
                  <div className="text-white/60 text-[11px]">Equal voice for space owners and drivers</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 mb-8 bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/15">
          {/* Role Filters */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-semibold text-white/70 uppercase tracking-wider mr-1 flex items-center gap-1">
              <Filter className="w-3.5 h-3.5" /> Filter:
            </span>
            <button
              onClick={() => setSelectedRole("all")}
              className={`text-xs font-semibold px-3 py-1.5 rounded-xl transition-all ${
                selectedRole === "all"
                  ? "bg-white text-indigo-900 shadow-md font-bold"
                  : "bg-white/10 text-white/80 hover:bg-white/20"
              }`}
            >
              All Roles ({totalCount})
            </button>
            <button
              onClick={() => setSelectedRole("provider")}
              className={`text-xs font-semibold px-3 py-1.5 rounded-xl transition-all ${
                selectedRole === "provider"
                  ? "bg-emerald-400 text-slate-900 shadow-md font-bold"
                  : "bg-white/10 text-white/80 hover:bg-white/20"
              }`}
            >
              Space Providers
            </button>
            <button
              onClick={() => setSelectedRole("seeker")}
              className={`text-xs font-semibold px-3 py-1.5 rounded-xl transition-all ${
                selectedRole === "seeker"
                  ? "bg-indigo-400 text-slate-900 shadow-md font-bold"
                  : "bg-white/10 text-white/80 hover:bg-white/20"
              }`}
            >
              Space Seekers
            </button>
          </div>

          {/* Rating Filter & Search */}
          <div className="flex items-center gap-3">
            <select
              value={selectedRating}
              onChange={(e) => setSelectedRating(e.target.value)}
              className="bg-white/15 border border-white/20 text-white text-xs rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-white/30"
            >
              <option value="all" className="text-slate-900">All Stars</option>
              <option value="5" className="text-slate-900">5 Stars Only</option>
              <option value="4" className="text-slate-900">4 Stars Only</option>
              <option value="3" className="text-slate-900">3 Stars Only</option>
              <option value="2" className="text-slate-900">2 Stars Only</option>
              <option value="1" className="text-slate-900">1 Star Only</option>
            </select>

            <div className="relative flex-1 md:w-56">
              <Search className="w-3.5 h-3.5 text-white/50 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                placeholder="Search reviews..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 bg-white/15 border border-white/20 text-white placeholder-white/50 rounded-xl text-xs outline-none focus:ring-2 focus:ring-white/30"
              />
            </div>
          </div>
        </div>

        {/* Vertically Stacked Customer Feedback List */}
        <div className="space-y-4 mb-16">
          {isLoading ? (
            <div className="p-12 text-center text-white/70">
              <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin mx-auto mb-3" />
              <p className="text-sm">Loading community feedback...</p>
            </div>
          ) : filteredFeedbacks.length === 0 ? (
            <div className="bg-white/5 border border-white/15 rounded-2xl p-12 text-center">
              <MessageSquare className="w-12 h-12 text-white/40 mx-auto mb-3" />
              <h3 className="text-lg font-bold text-white mb-1">No feedback found</h3>
              <p className="text-sm text-white/70">
                No reviews match your selected filter criteria. Try clearing filters.
              </p>
            </div>
          ) : (
            filteredFeedbacks.map((item, index) => {
              const roleMeta = getRoleLabel(item.userRole);
              const RoleIcon = roleMeta.icon;
              return (
                <motion.div
                  key={item.id || index}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05, duration: 0.25 }}
                  className="bg-white/10 hover:bg-white/[0.14] transition-all backdrop-blur-xl border border-white/20 rounded-2xl p-5 md:p-6 shadow-xl relative group overflow-hidden"
                  data-testid={`feedback-card-${item.id}`}
                >
                  {/* Decorative faint quote */}
                  <Quote className="absolute right-4 bottom-3 w-16 h-16 text-white/[0.04] pointer-events-none" />

                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3 pb-3 border-b border-white/10">
                    {/* User profile info */}
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-400 text-white font-bold flex items-center justify-center text-sm shadow-md ring-2 ring-white/30">
                        {item.userName ? item.userName.charAt(0).toUpperCase() : "U"}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-white text-base leading-tight">
                            {item.userName}
                          </h4>
                          <span className="inline-flex items-center gap-0.5 text-[10px] text-emerald-300 bg-emerald-500/20 px-1.5 py-0.5 rounded-full font-medium border border-emerald-500/30">
                            <CheckCircle2 className="w-2.5 h-2.5" /> Verified
                          </span>
                        </div>
                        <div className="text-[11px] text-white/60">
                          {formatDate(item.createdAt)}
                        </div>
                      </div>
                    </div>

                    {/* Role Badge & Star Rating */}
                    <div className="flex items-center gap-3 justify-between sm:justify-end">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border ${roleMeta.color}`}
                      >
                        <RoleIcon className="w-3 h-3" />
                        {roleMeta.label}
                      </span>

                      <div className="flex items-center gap-0.5">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Star
                            key={s}
                            className={`w-4 h-4 ${
                              s <= item.rating
                                ? "fill-amber-400 text-amber-400 drop-shadow-[0_1px_4px_rgba(251,191,36,0.5)]"
                                : "text-white/20 fill-white/10"
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Comment message */}
                  <div className="text-white/90 text-sm md:text-base leading-relaxed whitespace-pre-wrap font-sans">
                    {item.comments}
                  </div>
                </motion.div>
              );
            })
          )}
        </div>

        {/* Footer info */}
        <footer className="text-center text-xs text-white/60 pt-8 border-t border-white/10">
          <p>© 2026 Spotly. All Rights Reserved. Designed for safe, seamless parking solutions.</p>
        </footer>
      </div>
    </div>
  );
}
