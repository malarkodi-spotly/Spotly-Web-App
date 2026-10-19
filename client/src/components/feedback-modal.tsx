import { useState, useEffect, useCallback } from "react";
import { useLocation } from "wouter";
import { Star, CheckCircle2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { getApiUrl } from "@/lib/api-config";
import { motion, AnimatePresence } from "framer-motion";

export function FeedbackModal() {
  const [location] = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [rating, setRating] = useState<number>(0);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [comments, setComments] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const [userInfo, setUserInfo] = useState<{
    id: string;
    name: string;
    role: string;
    mobile: string;
  } | null>(null);

  // Check eligibility whenever user logs in, route changes, or page loads
  const checkEligibility = useCallback(async () => {
    try {
      // Clear legacy global flag that could unintentionally block different users on same browser
      localStorage.removeItem("spotly_user_feedback_done");

      // 1. Strict Home Page check: Modal only appears on the Home page after login!
      const isHomePage =
        location === "/space-seeker/home" ||
        location === "/space-provider/home" ||
        location === "/home" ||
        (location === "/" && (localStorage.getItem("userId") || localStorage.getItem("userMobile")));

      if (!isHomePage) {
        setIsOpen(false);
        return;
      }

      // Check user authentication
      let userId = localStorage.getItem("userId");
      const userMobile = localStorage.getItem("userMobile");
      const storedRole = localStorage.getItem("userRole") || "space-seeker";

      // If user logged in with mobile number, ensure fallback
      if (!userId && userMobile) {
        userId = userMobile;
      }

      if (!userId || userId.startsWith("explore_")) {
        setIsOpen(false);
        return;
      }

      // Clean up any stale exploreMode flag if user is logged in
      if (localStorage.getItem("exploreMode") === "true") {
        localStorage.removeItem("exploreMode");
      }

      // 2. Strict check: If user has ALREADY submitted feedback, NEVER show modal again!
      const isAlreadySubmittedLocally =
        localStorage.getItem(`spotly_feedback_submitted_${userId}`) === "true" ||
        (userMobile && localStorage.getItem(`spotly_feedback_submitted_${userMobile}`) === "true");

      if (isAlreadySubmittedLocally) {
        setIsOpen(false);
        return;
      }

      const storedName = localStorage.getItem("userName") || (storedRole === "customer" ? "Space Provider" : "Space Seeker");

      setUserInfo({
        id: userId,
        name: storedName,
        role: storedRole,
        mobile: userMobile || "",
      });

      console.log("[Spotly Feedback Modal] Checking eligibility on home page for:", userId, "location:", location);

      const res = await fetch(getApiUrl(`/api/feedbacks/eligibility/${userId}`));
      if (res.ok) {
        const data = await res.json();
        console.log("[Spotly Feedback Modal] Eligibility result:", data);

        // 3. Strict check: If server says already submitted, mark locally and DO NOT SHOW
        if (data.alreadySubmitted) {
          localStorage.setItem(`spotly_feedback_submitted_${userId}`, "true");
          if (userMobile) localStorage.setItem(`spotly_feedback_submitted_${userMobile}`, "true");
          setIsOpen(false);
          return;
        }

        // 4. User is on home page for the first time and eligible!
        if (data.eligible) {
          setIsOpen(true);
        } else {
          setIsOpen(false);
        }
      } else {
        console.warn("[Spotly Feedback Modal] Eligibility check returned HTTP status:", res.status);
      }
    } catch (err) {
      console.error("[Spotly Feedback Modal] Error checking eligibility:", err);
    }
  }, [location]);

  useEffect(() => {
    // Check eligibility immediately when on home page
    checkEligibility();

    // Also check after 500ms to allow smooth completion of route transitions & state hydration
    const timer = setTimeout(() => {
      checkEligibility();
    }, 500);

    // Listen to immediate login success event
    const handleLogin = () => {
      setTimeout(() => {
        checkEligibility();
      }, 400);
    };

    window.addEventListener("spotly_login_success", handleLogin);
    window.addEventListener("storage", handleLogin);

    return () => {
      clearTimeout(timer);
      window.removeEventListener("spotly_login_success", handleLogin);
      window.removeEventListener("storage", handleLogin);
    };
  }, [checkEligibility]);

  const ratingLabels: Record<number, string> = {
    1: "Poor",
    2: "Fair",
    3: "Good",
    4: "Very Good",
    5: "Excellent",
  };

  const activeRating = hoverRating || rating;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0) {
      setErrorMessage("Please select a star rating (1 to 5).");
      return;
    }
    if (!comments.trim() || comments.trim().length < 5) {
      setErrorMessage("Please enter at least 5 characters.");
      return;
    }

    setErrorMessage("");
    setIsSubmitting(true);

    try {
      const activeUserId = userInfo?.id || localStorage.getItem("userId") || localStorage.getItem("userMobile") || "user";
      const userMobile = userInfo?.mobile || localStorage.getItem("userMobile") || "";

      const payload = {
        userId: activeUserId,
        userName: userInfo?.name || localStorage.getItem("userName") || "Valued User",
        userRole: userInfo?.role || localStorage.getItem("userRole") || "space-seeker",
        userMobile: userMobile,
        rating,
        comments: comments.trim(),
      };

      const res = await fetch(getApiUrl("/api/feedbacks"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to submit feedback");
      }

      setIsSubmitted(true);

      // Permanently mark feedback as completed across all keys so modal NEVER appears again
      localStorage.setItem(`spotly_feedback_submitted_${activeUserId}`, "true");
      if (userMobile) {
        localStorage.setItem(`spotly_feedback_submitted_${userMobile}`, "true");
      }
      const rawUserId = localStorage.getItem("userId");
      if (rawUserId) {
        localStorage.setItem(`spotly_feedback_submitted_${rawUserId}`, "true");
      }

      // Auto close after 1.5 seconds on successful submission and NEVER reopen
      setTimeout(() => {
        setIsOpen(false);
      }, 1500);
    } catch (err: any) {
      console.error("Error submitting feedback:", err);
      setErrorMessage(err.message || "Failed to submit feedback. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200 cursor-pointer"
      style={{ touchAction: "none" }}
      onClick={() => setIsOpen(false)}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.94, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.2, ease: "easeOut" }}
        className="w-full max-w-[420px] bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden relative cursor-default"
        data-testid="feedback-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <AnimatePresence mode="wait">
          {isSubmitted ? (
            <motion.div
              key="submitted-state"
              initial={{ opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="p-8 text-center flex flex-col items-center justify-center space-y-3"
            >
              <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shadow-inner">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <h3 className="text-lg font-bold text-slate-800">
                  Thank You!
                </h3>
                <p className="text-xs text-slate-500">
                  Your feedback has been submitted successfully.
                </p>
              </div>
            </motion.div>
          ) : (
            <div className="p-6">
              {/* Minimal Clean Header */}
              <div className="text-center mb-5">
                <div className="w-11 h-11 mx-auto mb-2.5 rounded-xl bg-amber-50 border border-amber-100/80 text-amber-500 flex items-center justify-center shadow-xs">
                  <Star className="w-5 h-5 fill-amber-400 text-amber-500" />
                </div>
                <h2 className="text-lg font-bold tracking-tight text-slate-900">
                  Rate Your Experience
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  How was your experience with Spotly?
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* 5-Star Rating */}
                <div className="text-center space-y-1.5">
                  <div className="flex items-center justify-center gap-1.5">
                    {[1, 2, 3, 4, 5].map((starValue) => {
                      const isFilled = (hoverRating || rating) >= starValue;
                      return (
                        <button
                          key={starValue}
                          type="button"
                          onClick={() => setRating(starValue)}
                          onMouseEnter={() => setHoverRating(starValue)}
                          onMouseLeave={() => setHoverRating(0)}
                          className="p-1 transition-transform hover:scale-120 active:scale-95 focus:outline-none"
                          data-testid={`star-rating-${starValue}`}
                          aria-label={`${starValue} star`}
                        >
                          <Star
                            className={`w-8 h-8 transition-colors ${isFilled
                                ? "fill-amber-400 text-amber-400 drop-shadow-[0_2px_6px_rgba(251,191,36,0.45)]"
                                : "text-slate-200 fill-slate-50 hover:text-amber-200"
                              }`}
                          />
                        </button>
                      );
                    })}
                  </div>

                  <div className="h-4 flex items-center justify-center">
                    {activeRating > 0 ? (
                      <span className="text-xs font-semibold text-amber-600">
                        {ratingLabels[activeRating]}
                      </span>
                    ) : (
                      <span className="text-[11px] text-slate-400">
                        Tap a star to rate
                      </span>
                    )}
                  </div>
                </div>

                {/* Feedback Comments Textarea */}
                <div className="space-y-1">
                  <label
                    htmlFor="feedback-comments"
                    className="text-xs font-medium text-slate-700 flex items-center justify-between"
                  >
                    <span>Comments <span className="text-rose-500">*</span></span>
                    {comments.trim().length > 0 && (
                      <span className="text-[10px] text-slate-400">
                        {comments.trim().length} chars
                      </span>
                    )}
                  </label>

                  <Textarea
                    id="feedback-comments"
                    rows={3}
                    value={comments}
                    onChange={(e) => setComments(e.target.value)}
                    placeholder="Tell us what you think or how we can improve..."
                    className="w-full resize-none rounded-xl border-slate-200 focus:border-indigo-600 focus:ring-indigo-600 text-xs leading-relaxed p-3 shadow-none min-h-[85px]"
                    data-testid="textarea-feedback-comments"
                  />
                </div>

                {/* Error Banner */}
                {errorMessage && (
                  <div className="p-2 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium text-center">
                    {errorMessage}
                  </div>
                )}

                {/* Submit Button */}
                <div className="pt-1">
                  <Button
                    type="submit"
                    disabled={isSubmitting || rating === 0 || comments.trim().length < 5}
                    className="w-full h-11 rounded-xl text-sm font-semibold bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-600/20 transition-all active:scale-[0.99] disabled:opacity-40 disabled:cursor-not-allowed"
                    data-testid="btn-submit-feedback"
                  >
                    {isSubmitting ? (
                      <span className="flex items-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Submitting...
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4" />
                        Submit Feedback
                      </span>
                    )}
                  </Button>
                </div>
              </form>
            </div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
