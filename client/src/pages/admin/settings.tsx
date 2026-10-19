import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getApiUrl, adminFetch } from "@/lib/api-config";
import {
  Settings,
  LogOut,
  TrendingUp,
  Users,
  Car,
  Briefcase,
  Wrench,
  Save,
  Loader2,
  Bell,
  Send,
  Rocket,
  Phone,
  Mail,
  Globe,
  Pencil,
  Database,
  Trash2,
  AlertTriangle,
  ShieldAlert,
  RefreshCcw,
  Gift,
  MessageSquare,
  ExternalLink,
  Navigation,
} from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import logo from "@assets/Logos/spotly_full-white.png";

export default function AdminSettings() {
  const [, setLocation] = useLocation();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  const [isEditingPremium, setIsEditingPremium] = useState(false);
  const [isEditingVersion, setIsEditingVersion] = useState(false);
  const [isEditingLanding, setIsEditingLanding] = useState(false);
  const [isEditingSupport, setIsEditingSupport] = useState(false);
  const [isEditingBroadcast, setIsEditingBroadcast] = useState(false);

  const [premiumBasicPrice, setPremiumBasicPrice] = useState("199");
  const [premiumBasicEnabled, setPremiumBasicEnabled] = useState(true);
  const [premiumBasicViews, setPremiumBasicViews] = useState("10");
  const [premiumBasicValidity, setPremiumBasicValidity] = useState("7");
  const [premiumStandardPrice, setPremiumStandardPrice] = useState("299");
  const [premiumStandardEnabled, setPremiumStandardEnabled] = useState(true);
  const [premiumStandardViews, setPremiumStandardViews] = useState("20");
  const [premiumStandardValidity, setPremiumStandardValidity] = useState("15");
  const [premiumPremiumPrice, setPremiumPremiumPrice] = useState("399");
  const [premiumPremiumEnabled, setPremiumPremiumEnabled] = useState(true);
  const [premiumPremiumValidity, setPremiumPremiumValidity] = useState("30");
  const [isSavingPlans, setIsSavingPlans] = useState(false);
  const [appVersion, setAppVersion] = useState("1.0.0");
  const [supportPhone, setSupportPhone] = useState("+91 9742545584");
  const [supportEmail, setSupportEmail] = useState("info@spotlyindia.org");
  const [supportWebsite, setSupportWebsite] = useState("spotlyindia.org");
  const [isSavingSupport, setIsSavingSupport] = useState(false);
  const [adVideoUrl, setAdVideoUrl] = useState("");
  const [isSavingVideo, setIsSavingVideo] = useState(false);
  const [videoFileName, setVideoFileName] = useState("");
  const [adVideoEnabled, setAdVideoEnabled] = useState(true);
  const [heroVideoUrl, setHeroVideoUrl] = useState("/attached_assets/login-ad-1.mp4");
  const [isSavingHeroVideo, setIsSavingHeroVideo] = useState(false);

  const [landingHeadline, setLandingHeadline] = useState("Your perfect parking spot. Right around the corner.");
  const [landingSubtitle, setLandingSubtitle] = useState("Find secure car & bike parking nearby — or earn from your unused space.");
  const [landingAddress, setLandingAddress] = useState("Heeraa Technologies: 139/81, Unit 101 Oxford Towers, HAL Old Airport Road, Kodihalli, Bengaluru, Karnataka – 560008.");
  const [landingPhone, setLandingPhone] = useState("+91-97425 45584");
  const [landingEmail, setLandingEmail] = useState("info@spotlyindia.org");
  const [landingCopyright, setLandingCopyright] = useState("©2026 Spotly. All Rights Reserved.");
  const [landingSpotsCount, setLandingSpotsCount] = useState("");
  const [landingProvidersCount, setLandingProvidersCount] = useState("");
  const [isSavingLanding, setIsSavingLanding] = useState(false);

  const [broadcastTitle, setBroadcastTitle] = useState("");
  const [broadcastMessage, setBroadcastMessage] = useState("");
  const [broadcastTarget, setBroadcastTarget] = useState<"workers" | "customers" | "all">("all");
  const [isBroadcasting, setIsBroadcasting] = useState(false);
  const [comingSoonMode, setComingSoonMode] = useState(false);
  const [isSavingComingSoon, setIsSavingComingSoon] = useState(false);
  const [showComingSoonConfirm, setShowComingSoonConfirm] = useState(false);
  const [pendingComingSoonValue, setPendingComingSoonValue] = useState(false);
  const [underConstructionMode, setUnderConstructionMode] = useState(false);
  const [isSavingUnderConstruction, setIsSavingUnderConstruction] = useState(false);
  const [showUnderConstructionConfirm, setShowUnderConstructionConfirm] = useState(false);
  const [pendingUnderConstructionValue, setPendingUnderConstructionValue] = useState(false);
  const [freeAccessMode, setFreeAccessMode] = useState(false);
  const [isSavingFreeAccess, setIsSavingFreeAccess] = useState(false);
  const [showFreeAccessConfirm, setShowFreeAccessConfirm] = useState(false);
  const [pendingFreeAccessValue, setPendingFreeAccessValue] = useState(false);

  // Spotly Roadside Navigation Directions Pricing state
  const [spotlyDirectionPaidEnabled, setSpotlyDirectionPaidEnabled] = useState(false);
  const [spotlyDirectionYearlyPrice, setSpotlyDirectionYearlyPrice] = useState("29");
  const [isEditingSpotlyDirection, setIsEditingSpotlyDirection] = useState(false);
  const [isSavingSpotlyDirection, setIsSavingSpotlyDirection] = useState(false);

  // Customer Feedback settings state
  const [feedbackTriggerDays, setFeedbackTriggerDays] = useState("7");
  const [feedbackTestModeImmediate, setFeedbackTestModeImmediate] = useState(true);
  const [isEditingFeedback, setIsEditingFeedback] = useState(false);
  const [isSavingFeedback, setIsSavingFeedback] = useState(false);

  // Customer Feedback Reset & Double Confirmation state
  type FeedbackResetTarget = "providers" | "seekers" | "all";
  const [feedbackStats, setFeedbackStats] = useState<{ total: number; providerCount: number; seekerCount: number }>({
    total: 0,
    providerCount: 0,
    seekerCount: 0,
  });
  const [feedbackResetModalOpen, setFeedbackResetModalOpen] = useState(false);
  const [feedbackResetStep, setFeedbackResetStep] = useState<1 | 2>(1);
  const [selectedFeedbackResetTarget, setSelectedFeedbackResetTarget] = useState<FeedbackResetTarget | null>(null);
  const [feedbackResetConfirmInput, setFeedbackResetConfirmInput] = useState("");
  const [isResettingFeedback, setIsResettingFeedback] = useState(false);

  // Data Cleanup & System Reset state
  type CleanupAction = "clear_seekers" | "clear_providers" | "clear_all";
  const [cleanupModalOpen, setCleanupModalOpen] = useState(false);
  const [cleanupStep, setCleanupStep] = useState<1 | 2>(1);
  const [selectedCleanupAction, setSelectedCleanupAction] = useState<CleanupAction | null>(null);
  const [confirmationInput, setConfirmationInput] = useState("");
  const [isCleaningData, setIsCleaningData] = useState(false);

  const getActionDetails = (action: CleanupAction | null) => {
    switch (action) {
      case "clear_seekers":
        return {
          title: "Clear All Space Seekers",
          keyword: "CLEAR SEEKERS",
          badge: "Seekers & Profiles",
          description: "Permanently delete all Space Seeker user accounts, seeker profiles, contact view logs, and expressed interest records.",
          impactList: [
            "Deletes all user accounts registered as Space Seekers (workers)",
            "Deletes all seeker profiles, skills, vehicle queries & contact logs",
            "Clears all interest requests submitted by seekers",
            "Reverts any booked space assignments back to available",
            "Space Providers & Listed Parking Spaces are PRESERVED safely"
          ],
        };
      case "clear_providers":
        return {
          title: "Clear All Space Providers",
          keyword: "CLEAR PROVIDERS",
          badge: "Providers & Parking Spaces",
          description: "Permanently delete all Space Provider user accounts, listed parking spots/spaces, parking photos, and provider payments.",
          impactList: [
            "Deletes all user accounts registered as Space Providers (customers)",
            "Deletes all parking spaces, spot listings, addresses & uploaded images",
            "Deletes all payments & transactions associated with providers",
            "Deletes all notifications & contact logs tied to provider spaces",
            "Space Seekers accounts & seeker profiles are PRESERVED"
          ],
        };
      case "clear_all":
        return {
          title: "Reset Entire System Data (Fresh Start)",
          keyword: "RESET ALL DATA",
          badge: "Full Database Reset",
          description: "Purges all users (both Seekers & Providers), all parking spaces, bookings, payments, interests, and notifications to return the system to 100% fresh state.",
          impactList: [
            "Deletes ALL Space Seekers & ALL Space Providers",
            "Deletes ALL parking spaces, listings, photos, and bookings",
            "Deletes ALL customer & provider payments and transactions",
            "Deletes ALL notifications, viewed contacts, and expressed interests",
            "PRESERVES your admin account, cities, serviceable pincodes, services, and app settings"
          ],
        };
      default:
        return {
          title: "",
          keyword: "",
          badge: "",
          description: "",
          impactList: [],
        };
    }
  };

  const openCleanupModal = (action: CleanupAction) => {
    setSelectedCleanupAction(action);
    setCleanupStep(1);
    setConfirmationInput("");
    setCleanupModalOpen(true);
  };

  const handleExecuteCleanup = async () => {
    if (!selectedCleanupAction) return;
    const details = getActionDetails(selectedCleanupAction);
    if (confirmationInput.trim() !== details.keyword) {
      alert(`Please type "${details.keyword}" exactly to proceed.`);
      return;
    }

    setIsCleaningData(true);
    try {
      const token = localStorage.getItem("adminToken");
      const res = await fetch(getApiUrl("/api/admin/data-cleanup"), {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: selectedCleanupAction,
          confirmationCode: confirmationInput.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Cleanup failed");
      }

      setSuccessMessage(data.message || "Data successfully cleared!");
      setCleanupModalOpen(false);
      setSelectedCleanupAction(null);
      setCleanupStep(1);
      setConfirmationInput("");
      setTimeout(() => setSuccessMessage(""), 6000);
    } catch (err: any) {
      console.error("Cleanup error:", err);
      alert(err.message || "Failed to execute cleanup.");
    } finally {
      setIsCleaningData(false);
    }
  };

  useEffect(() => {
    const validateAndFetch = async () => {
      const isAdmin = localStorage.getItem("isAdmin");
      const adminToken = localStorage.getItem("adminToken");
      if (!isAdmin || !adminToken) {
        setLocation("/admin");
        return;
      }

      // Validate session with server
      try {
        const sessionRes = await adminFetch("/api/admin/session");
        if (!sessionRes.ok) {
          // Session expired or invalid - clear and redirect to login
          localStorage.removeItem("isAdmin");
          localStorage.removeItem("adminLevel");
          localStorage.removeItem("adminToken");
          setLocation("/admin");
          return;
        }
      } catch (error) {
        console.error("Session validation failed:", error);
        setLocation("/admin");
        return;
      }

      fetchSettings();
    };
    validateAndFetch();
  }, []);

  const getAuthHeaders = () => {
    const token = localStorage.getItem("adminToken");
    return {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json"
    };
  };

  const fetchSettings = async () => {
    try {
      const [plansRes, versionRes, comingSoonRes, underConstructionRes, freeAccessRes, phoneRes, emailRes, websiteRes, videoRes, heroVideoRes] = await Promise.all([
        fetch(getApiUrl("/api/settings/premium-plans")),
        fetch(getApiUrl("/api/settings/app_version")),
        fetch(getApiUrl("/api/settings/coming_soon_mode")),
        fetch(getApiUrl("/api/settings/under_construction_mode")),
        fetch(getApiUrl("/api/settings/free_access_mode")),
        fetch(getApiUrl("/api/settings/support_phone")),
        fetch(getApiUrl("/api/settings/support_email")),
        fetch(getApiUrl("/api/settings/support_website")),
        fetch(getApiUrl("/api/settings/ad_video_url")),
        fetch(getApiUrl("/api/settings/hero_video_url"))
      ]);

      if (plansRes.ok) {
        const data = await plansRes.json();
        if (data.plans) {
          const basic = data.plans.find((p: any) => p.key === "basic");
          const standard = data.plans.find((p: any) => p.key === "standard");
          const premium = data.plans.find((p: any) => p.key === "premium");
          if (basic) { setPremiumBasicPrice(String(basic.price)); setPremiumBasicEnabled(basic.enabled); setPremiumBasicViews(String(basic.views)); setPremiumBasicValidity(String(basic.validity || "7")); }
          if (standard) { setPremiumStandardPrice(String(standard.price)); setPremiumStandardEnabled(standard.enabled); setPremiumStandardViews(String(standard.views)); setPremiumStandardValidity(String(standard.validity || "15")); }
          if (premium) { setPremiumPremiumPrice(String(premium.price)); setPremiumPremiumEnabled(premium.enabled); setPremiumPremiumValidity(String(premium.validity || "30")); }
        }
      }
      if (versionRes.ok) {
        const data = await versionRes.json();
        if (data.setting?.value) {
          setAppVersion(data.setting.value);
        }
      }
      if (comingSoonRes.ok) {
        const data = await comingSoonRes.json();
        if (data.setting?.value) {
          setComingSoonMode(data.setting.value === "true");
        }
      }
      if (underConstructionRes.ok) {
        const data = await underConstructionRes.json();
        if (data.setting?.value) {
          setUnderConstructionMode(data.setting.value === "true");
        }
      }
      if (freeAccessRes.ok) {
        const data = await freeAccessRes.json();
        if (data.setting?.value) {
          setFreeAccessMode(data.setting.value === "true");
        }
      }
      if (phoneRes.ok) {
        const data = await phoneRes.json();
        if (data.setting?.value) {
          setSupportPhone(data.setting.value);
        }
      }
      if (emailRes.ok) {
        const data = await emailRes.json();
        if (data.setting?.value) {
          setSupportEmail(data.setting.value);
        }
      }
      if (websiteRes.ok) {
        const data = await websiteRes.json();
        if (data.setting?.value) {
          setSupportWebsite(data.setting.value);
        }
      }
      if (videoRes.ok) {
        const data = await videoRes.json();
        if (data.setting?.value) {
          setAdVideoUrl(data.setting.value);
        }
      }
      if (heroVideoRes.ok) {
        const data = await heroVideoRes.json();
        // Use API value if present, otherwise keep the default local video
        if (data.setting?.value) {
          setHeroVideoUrl(data.setting.value);
        }
      }
      const videoEnabledRes = await fetch(getApiUrl("/api/settings/ad_video_enabled"));
      if (videoEnabledRes.ok) {
        const data = await videoEnabledRes.json();
        if (data.setting?.value !== undefined) {
          setAdVideoEnabled(data.setting.value === "true");
        }
      }

      const landingKeys = [
        ["landing_headline", setLandingHeadline],
        ["landing_subtitle", setLandingSubtitle],
        ["landing_address", setLandingAddress],
        ["landing_phone", setLandingPhone],
        ["landing_email", setLandingEmail],
        ["landing_copyright", setLandingCopyright],
        ["landing_spots_count", setLandingSpotsCount],
        ["landing_providers_count", setLandingProvidersCount],
      ] as const;
      await Promise.all(landingKeys.map(async ([key, setter]) => {
        try {
          const r = await fetch(getApiUrl(`/api/settings/${key}`));
          if (r.ok) {
            const d = await r.json();
            if (d.setting?.value) setter(d.setting.value);
          }
        } catch { }
      }));

      // Fetch customer feedback trigger settings
      try {
        const [feedbackDaysRes, feedbackTestModeRes] = await Promise.all([
          fetch(getApiUrl("/api/settings/feedback_trigger_days")),
          fetch(getApiUrl("/api/settings/feedback_test_mode_immediate"))
        ]);
        if (feedbackDaysRes.ok) {
          const d = await feedbackDaysRes.json();
          if (d.setting?.value) setFeedbackTriggerDays(d.setting.value);
        }
        if (feedbackTestModeRes.ok) {
          const d = await feedbackTestModeRes.json();
          if (d.setting?.value !== undefined) setFeedbackTestModeImmediate(d.setting.value === "true");
        }
      } catch { }

      // Fetch customer feedback statistics
      try {
        const statsRes = await adminFetch("/api/admin/feedbacks/stats");
        if (statsRes.ok) {
          const stats = await statsRes.json();
          setFeedbackStats(stats);
        }
      } catch { }

      // Fetch Spotly roadside directions pricing config
      try {
        const [spotlyPaidRes, spotlyPriceRes] = await Promise.all([
          fetch(getApiUrl("/api/settings/spotly_direction_paid_enabled")),
          fetch(getApiUrl("/api/settings/spotly_direction_yearly_price")),
        ]);
        if (spotlyPaidRes.ok) {
          const d = await spotlyPaidRes.json();
          if (d.setting?.value !== undefined) setSpotlyDirectionPaidEnabled(d.setting.value === "true");
        }
        if (spotlyPriceRes.ok) {
          const d = await spotlyPriceRes.json();
          if (d.setting?.value) setSpotlyDirectionYearlyPrice(d.setting.value);
        }
      } catch { }
    } catch (error) {
      console.error("Failed to fetch settings:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const [errorMessage, setErrorMessage] = useState("");

  const handleSaveSpotlyDirectionSettings = async () => {
    setIsSavingSpotlyDirection(true);
    setErrorMessage("");
    try {
      const items = [
        {
          key: "spotly_direction_paid_enabled",
          value: String(spotlyDirectionPaidEnabled),
          description: "Enable paid subscription for Spotly roadside directions (false = Free for all)",
        },
        {
          key: "spotly_direction_yearly_price",
          value: spotlyDirectionYearlyPrice.trim() || "29",
          description: "Annual subscription price in INR for Spotly roadside directions",
        },
        {
          key: "spotly_direction_validity_days",
          value: "365",
          description: "Validity in days for Spotly roadside pass",
        },
      ];
      for (const s of items) {
        const res = await adminFetch("/api/admin/settings", {
          method: "POST",
          headers: getAuthHeaders(),
          body: JSON.stringify(s),
        });
        if (!res.ok) throw new Error(`Failed to update ${s.key}`);
      }
      setSuccessMessage("Spotly roadside directions settings saved successfully!");
      setIsEditingSpotlyDirection(false);
      setTimeout(() => setSuccessMessage(""), 4000);
    } catch (err: any) {
      console.error("Save spotly direction settings error:", err);
      setErrorMessage(err.message || "Failed to save settings");
    } finally {
      setIsSavingSpotlyDirection(false);
    }
  };

  const handleSaveFeedbackSettings = async () => {
    setIsSavingFeedback(true);
    try {
      const items = [
        { key: "feedback_trigger_days", value: feedbackTriggerDays.trim() || "7", description: "Days after registration to prompt user for feedback" },
        { key: "feedback_test_mode_immediate", value: String(feedbackTestModeImmediate), description: "Immediate feedback modal display for testing" },
      ];
      for (const s of items) {
        const res = await adminFetch("/api/admin/settings", {
          method: "POST",
          headers: getAuthHeaders(),
          body: JSON.stringify(s),
        });
        if (!res.ok) throw new Error(`Failed to update ${s.key}`);
      }
      setSuccessMessage("Customer feedback settings saved successfully!");
      setIsEditingFeedback(false);
      setTimeout(() => setSuccessMessage(""), 4000);
    } catch (err: any) {
      alert(err.message || "Failed to save feedback settings");
    } finally {
      setIsSavingFeedback(false);
    }
  };

  const getFeedbackResetDetails = (target: FeedbackResetTarget | null) => {
    switch (target) {
      case "providers":
        return {
          title: "Reset Space Provider Feedback",
          keyword: "RESET PROVIDER FEEDBACK",
          badge: "Space Providers Only",
          description: `Permanently delete all feedback ratings and reviews (${feedbackStats.providerCount} records) submitted by Space Providers.`,
          impactList: [
            `Deletes ${feedbackStats.providerCount} feedback review entries submitted by Space Providers`,
            "Resets feedback prompt eligibility so all Space Providers will be prompted with the feedback modal again on their next home screen visit",
            "Customer Feedback public reviews page will update immediately",
            "Space Seeker reviews and account profiles remain completely untouched"
          ],
        };
      case "seekers":
        return {
          title: "Reset Space Seeker Feedback",
          keyword: "RESET SEEKER FEEDBACK",
          badge: "Space Seekers Only",
          description: `Permanently delete all feedback ratings and reviews (${feedbackStats.seekerCount} records) submitted by Space Seekers.`,
          impactList: [
            `Deletes ${feedbackStats.seekerCount} feedback review entries submitted by Space Seekers`,
            "Resets feedback prompt eligibility so all Space Seekers will be prompted with the feedback modal again on their next home screen visit",
            "Customer Feedback public reviews page will update immediately",
            "Space Provider reviews and parking listings remain completely untouched"
          ],
        };
      case "all":
        return {
          title: "Reset All Feedback Reviews",
          keyword: "RESET ALL FEEDBACK",
          badge: "Full Feedback Reset",
          description: `Permanently wipe all customer feedback ratings and reviews (${feedbackStats.total} records) across the entire platform.`,
          impactList: [
            `Deletes all ${feedbackStats.total} feedback reviews from both Space Providers and Space Seekers`,
            "Resets modal eligibility for all users across the platform",
            "Customer Feedback page will be reset to an empty state",
            "User accounts, parking listings, and bookings are completely preserved"
          ],
        };
      default:
        return {
          title: "Reset Feedback",
          keyword: "RESET FEEDBACK",
          badge: "Feedback",
          description: "Reset feedback records.",
          impactList: [],
        };
    }
  };

  const openFeedbackResetModal = (target: FeedbackResetTarget) => {
    setSelectedFeedbackResetTarget(target);
    setFeedbackResetStep(1);
    setFeedbackResetConfirmInput("");
    setFeedbackResetModalOpen(true);
  };

  const handleExecuteFeedbackReset = async () => {
    if (!selectedFeedbackResetTarget) return;
    const details = getFeedbackResetDetails(selectedFeedbackResetTarget);
    if (feedbackResetConfirmInput.trim() !== details.keyword) return;

    setIsResettingFeedback(true);
    try {
      const res = await adminFetch("/api/admin/feedbacks/reset", {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({ target: selectedFeedbackResetTarget }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to reset feedback records");
      }

      setSuccessMessage(data.message || "Feedback records reset successfully!");
      setFeedbackResetModalOpen(false);
      setSelectedFeedbackResetTarget(null);
      setFeedbackResetConfirmInput("");

      // Refresh feedback stats
      const statsRes = await adminFetch("/api/admin/feedbacks/stats");
      if (statsRes.ok) {
        const stats = await statsRes.json();
        setFeedbackStats(stats);
      }

      setTimeout(() => setSuccessMessage(""), 4000);
    } catch (err: any) {
      alert(err.message || "Failed to execute feedback reset");
    } finally {
      setIsResettingFeedback(false);
    }
  };

  const handleSavePremiumPlans = async () => {
    setIsSavingPlans(true);
    setErrorMessage("");
    try {
      const settings = [
        { key: "premium_basic_price", value: premiumBasicPrice, description: "Basic plan price in INR" },
        { key: "premium_basic_enabled", value: String(premiumBasicEnabled), description: "Basic plan enabled" },
        { key: "premium_basic_views", value: premiumBasicViews, description: "Basic plan view count" },
        { key: "premium_basic_validity", value: premiumBasicValidity, description: "Basic plan validity in days" },
        { key: "premium_standard_price", value: premiumStandardPrice, description: "Standard plan price in INR" },
        { key: "premium_standard_enabled", value: String(premiumStandardEnabled), description: "Standard plan enabled" },
        { key: "premium_standard_views", value: premiumStandardViews, description: "Standard plan view count" },
        { key: "premium_standard_validity", value: premiumStandardValidity, description: "Standard plan validity in days" },
        { key: "premium_premium_price", value: premiumPremiumPrice, description: "Premium plan price in INR" },
        { key: "premium_premium_enabled", value: String(premiumPremiumEnabled), description: "Premium plan enabled" },
        { key: "premium_premium_validity", value: premiumPremiumValidity, description: "Premium plan validity in days" },
      ];

      for (const s of settings) {
        const res = await adminFetch("/api/admin/settings", {
          method: "POST",
          body: JSON.stringify(s),
        });
        if (!res.ok) {
          const errorData = await res.json();
          setErrorMessage(errorData.error || "Failed to save premium plans.");
          return;
        }
      }
      setSuccessMessage("Premium plans saved successfully!");
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (error) {
      console.error("Failed to save premium plans:", error);
      setErrorMessage("Failed to save. Please check your connection.");
    } finally {
      setIsSavingPlans(false);
    }
  };

  const handleSaveAppVersion = async () => {
    setIsSaving(true);
    setErrorMessage("");
    try {
      const res = await adminFetch("/api/admin/settings", {
        method: "POST",
        body: JSON.stringify({
          key: "app_version",
          value: appVersion,
          description: "Current app version"
        }),
      });
      if (!res.ok) {
        const errorData = await res.json();
        setErrorMessage(errorData.error || "Failed to save app version.");
        return;
      }
      setSuccessMessage("App version saved successfully!");
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (error) {
      console.error("Failed to save app version:", error);
      setErrorMessage("Failed to save. Please check your connection.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveLandingContent = async () => {
    setIsSavingLanding(true);
    setErrorMessage("");
    try {
      const items = [
        { key: "landing_headline", value: landingHeadline, description: "Landing page headline" },
        { key: "landing_subtitle", value: landingSubtitle, description: "Landing page subtitle" },
        { key: "landing_address", value: landingAddress, description: "Landing page footer address" },
        { key: "landing_phone", value: landingPhone, description: "Landing page footer phone" },
        { key: "landing_email", value: landingEmail, description: "Landing page footer email" },
        { key: "landing_copyright", value: landingCopyright, description: "Landing page footer copyright" },
        { key: "landing_spots_count", value: landingSpotsCount.trim(), description: "Landing page custom spots count override" },
        { key: "landing_providers_count", value: landingProvidersCount.trim(), description: "Landing page custom providers count override" },
      ];
      for (const s of items) {
        const res = await adminFetch("/api/admin/settings", {
          method: "POST",
          body: JSON.stringify(s),
        });
        if (!res.ok) {
          const d = await res.json();
          setErrorMessage(d.error || "Failed to save landing content.");
          return;
        }
      }
      setSuccessMessage("Landing page content saved successfully!");
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch {
      setErrorMessage("Failed to save. Please check your connection.");
    } finally {
      setIsSavingLanding(false);
    }
  };

  const handleSaveSupportInfo = async () => {
    setIsSavingSupport(true);
    setErrorMessage("");
    try {
      const [phoneRes, emailRes, websiteRes] = await Promise.all([
        adminFetch("/api/admin/settings", {
          method: "POST",
          body: JSON.stringify({
            key: "support_phone",
            value: supportPhone,
            description: "Support phone number"
          }),
        }),
        adminFetch("/api/admin/settings", {
          method: "POST",
          body: JSON.stringify({
            key: "support_email",
            value: supportEmail,
            description: "Support email address"
          }),
        }),
        adminFetch("/api/admin/settings", {
          method: "POST",
          body: JSON.stringify({
            key: "support_website",
            value: supportWebsite,
            description: "Support website URL"
          }),
        })
      ]);
      if (!phoneRes.ok || !emailRes.ok || !websiteRes.ok) {
        const errorData = !phoneRes.ok ? await phoneRes.json() : (!emailRes.ok ? await emailRes.json() : await websiteRes.json());
        setErrorMessage(errorData.error || "Failed to save support info.");
        return;
      }
      setSuccessMessage("Customer care info saved successfully!");
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (error) {
      console.error("Failed to save support info:", error);
      setErrorMessage("Failed to save. Please check your connection.");
    } finally {
      setIsSavingSupport(false);
    }
  };

  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("video/")) {
      setErrorMessage("Please select a valid video file.");
      return;
    }
    if (file.size > 50 * 1024 * 1024) {
      setErrorMessage("Video file must be under 50MB.");
      return;
    }
    setIsSavingVideo(true);
    setErrorMessage("");
    setVideoFileName(file.name);

    const formData = new FormData();
    formData.append("video", file);

    try {
      const token = localStorage.getItem("adminToken");
      const res = await fetch(getApiUrl("/api/admin/upload-video"), {
        method: "POST",
        headers: { "Authorization": `Bearer ${token}` },
        body: formData,
      });
      if (!res.ok) {
        const errorData = await res.json();
        setErrorMessage(errorData.error || "Failed to upload video.");
        return;
      }
      const data = await res.json();
      setAdVideoUrl(data.url);
      setSuccessMessage("Ad video uploaded successfully!");
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (error) {
      console.error("Failed to upload video:", error);
      setErrorMessage("Failed to upload. Please check your connection.");
    } finally {
      setIsSavingVideo(false);
    }
  };

  const handleToggleVideo = async (enabled: boolean) => {
    setAdVideoEnabled(enabled);
    try {
      await adminFetch("/api/admin/settings", {
        method: "POST",
        body: JSON.stringify({
          key: "ad_video_enabled",
          value: String(enabled),
          description: "Ad video enabled/disabled"
        }),
      });
      setSuccessMessage(enabled ? "Ad video enabled!" : "Ad video disabled!");
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (error) {
      setAdVideoEnabled(!enabled);
    }
  };

  const handleSaveHeroVideo = async () => {
    setIsSavingHeroVideo(true);
    try {
      const res = await adminFetch("/api/admin/settings", {
        method: "POST",
        body: JSON.stringify({
          key: "hero_video_url",
          value: heroVideoUrl.trim(),
          description: "Login page background video (local path like /attached_assets/... or YouTube URL)"
        }),
      });
      if (res.ok) {
        setSuccessMessage("Login page video updated successfully!");
        setTimeout(() => setSuccessMessage(""), 3000);
      } else {
        setErrorMessage("Failed to save video URL.");
      }
    } catch (error) {
      setErrorMessage("Failed to save. Please check your connection.");
    } finally {
      setIsSavingHeroVideo(false);
    }
  };

  const handleRemoveVideo = async () => {
    setIsSavingVideo(true);
    setErrorMessage("");
    try {
      const res = await adminFetch("/api/admin/settings", {
        method: "POST",
        body: JSON.stringify({
          key: "ad_video_url",
          value: "",
          description: "Ad video URL for home pages"
        }),
      });
      if (res.ok) {
        setAdVideoUrl("");
        setVideoFileName("");
        setSuccessMessage("Ad video removed!");
        setTimeout(() => setSuccessMessage(""), 3000);
      }
    } catch (error) {
      setErrorMessage("Failed to remove video.");
    } finally {
      setIsSavingVideo(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("isAdmin");
    localStorage.removeItem("adminLevel");
    localStorage.removeItem("adminToken");
    setLocation("/admin");
  };

  const handleComingSoonSwitchChange = (enabled: boolean) => {
    setPendingComingSoonValue(enabled);
    setShowComingSoonConfirm(true);
  }

  const handleUnderConstructionSwitchChange = (enabled: boolean) => {
    setPendingUnderConstructionValue(enabled);
    setShowUnderConstructionConfirm(true);
  };

  const handleFreeAccessSwitchChange = (enabled: boolean) => {
    setPendingFreeAccessValue(enabled);
    setShowFreeAccessConfirm(true);
  };

  const handleConfirmFreeAccess = async () => {
    setShowFreeAccessConfirm(false);
    setIsSavingFreeAccess(true);
    setFreeAccessMode(pendingFreeAccessValue);
    try {
      const res = await adminFetch("/api/admin/settings", {
        method: "POST",
        body: JSON.stringify({
          key: "free_access_mode",
          value: pendingFreeAccessValue.toString(),
          description: "When enabled, users can access all contacts for free without subscription"
        }),
      });
      if (!res.ok) {
        setFreeAccessMode(!pendingFreeAccessValue);
        setErrorMessage("Failed to update Free Access mode");
        return;
      }
      setSuccessMessage(`Free Access mode ${pendingFreeAccessValue ? "enabled" : "disabled"} successfully!`);
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (error) {
      console.error("Failed to toggle free access mode:", error);
      setFreeAccessMode(!pendingFreeAccessValue);
      setErrorMessage("Failed to update. Please check your connection.");
    } finally {
      setIsSavingFreeAccess(false);
    }
  };

  const handleConfirmUnderConstruction = async () => {
    setShowUnderConstructionConfirm(false);
    setIsSavingUnderConstruction(true);
    setUnderConstructionMode(pendingUnderConstructionValue);
    try {
      const res = await adminFetch("/api/admin/settings", {
        method: "POST",
        body: JSON.stringify({
          key: "under_construction_mode",
          value: pendingUnderConstructionValue.toString(),
        }),
      });
      if (!res.ok) {
        setUnderConstructionMode(!pendingUnderConstructionValue);
        setErrorMessage("Failed to update Under Construction mode");
        return;
      }
      setSuccessMessage(`Under Construction mode ${pendingUnderConstructionValue ? "enabled" : "disabled"} successfully!`);
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (error) {
      console.error("Failed to toggle under construction mode:", error);
      setUnderConstructionMode(!pendingUnderConstructionValue);
      setErrorMessage("Failed to update. Please check your connection.");
    } finally {
      setIsSavingUnderConstruction(false);
    }
  };

  const handleConfirmComingSoon = async () => {
    setShowComingSoonConfirm(false);
    setIsSavingComingSoon(true);
    setComingSoonMode(pendingComingSoonValue);
    try {
      const res = await adminFetch("/api/admin/settings", {
        method: "POST",
        body: JSON.stringify({
          key: "coming_soon_mode",
          value: pendingComingSoonValue.toString(),
          description: "When enabled, shows 'Launching Soon' message to all users"
        }),
      });
      if (!res.ok) {
        setComingSoonMode(!pendingComingSoonValue);
        setErrorMessage("Failed to update Coming Soon mode");
        return;
      }
      setSuccessMessage(`Coming Soon mode ${pendingComingSoonValue ? "enabled" : "disabled"} successfully!`);
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (error) {
      console.error("Failed to toggle coming soon mode:", error);
      setComingSoonMode(!pendingComingSoonValue);
      setErrorMessage("Failed to update. Please check your connection.");
    } finally {
      setIsSavingComingSoon(false);
    }
  };

  const handleBroadcastNotification = async () => {
    if (!broadcastTitle.trim() || !broadcastMessage.trim()) {
      setErrorMessage("Title and message are required for broadcast");
      return;
    }

    setIsBroadcasting(true);
    setErrorMessage("");
    try {
      const res = await adminFetch("/api/admin/broadcast", {
        method: "POST",
        body: JSON.stringify({
          title: broadcastTitle,
          message: broadcastMessage,
          target: broadcastTarget
        }),
      });
      if (!res.ok) {
        const errorData = await res.json();
        setErrorMessage(errorData.error || "Failed to send broadcast");
        return;
      }
      setSuccessMessage(`Broadcast sent to ${broadcastTarget === 'all' ? 'all users' : broadcastTarget === 'customers' ? 'Space Providers' : 'Space Seekers'} successfully!`);
      setBroadcastTitle("");
      setBroadcastMessage("");
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (error) {
      console.error("Failed to send broadcast:", error);
      setErrorMessage("Failed to send broadcast. Please check your connection.");
    } finally {
      setIsBroadcasting(false);
    }
  };

  const navItems = [
    { icon: TrendingUp, label: "Dashboard", path: "/admin/dashboard" },
    { icon: Wrench, label: "Parking Types", path: "/admin/services" },
    { icon: Globe, label: "Service States", path: "/admin/pincodes" },
    { icon: Users, label: "Space Providers", path: "/admin/customers" },
    { icon: Briefcase, label: "Space Seekers", path: "/admin/workers" },
    { icon: Car, label: "By Owner Space", path: "/admin/bookings" },
    { icon: Navigation, label: "By Spotly Space", path: "/admin/spotly-spaces" },
    { icon: Settings, label: "Settings", path: "/admin/settings" },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <aside
        className="w-64 text-white min-h-screen p-4 hidden md:block shadow-xl"
        style={{ background: "linear-gradient(135deg, #1e3a8a 0%, #3b2fad 35%, #6d28d9 70%, #7c3aed 100%)" }}
      >
        <div className="flex items-center gap-3 mb-8 px-2">
          <img src={logo} alt="Spotly" className="h-8 w-auto object-contain" />
        </div>
        <nav className="space-y-2">
          {navItems.map((item) => (
            <button
              key={item.path}
              onClick={() => setLocation(item.path)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors ${item.path === "/admin/settings" ? "bg-white/20" : "hover:bg-white/10"
                }`}
              data-testid={`nav-${item.label.toLowerCase()}`}
            >
              <item.icon size={20} />
              {item.label}
            </button>
          ))}
        </nav>
        <button
          onClick={() => setShowLogoutConfirm(true)}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left hover:bg-white/10 mt-8 text-red-200"
          data-testid="button-logout"
        >
          <LogOut size={20} />
          Logout
        </button>
      </aside>

      <main className="flex-1 p-6">
        <div className="md:hidden flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <img src={logo} alt="Spotly" className="h-7 w-auto object-contain" />
          </div>
          <button
            onClick={() => setShowLogoutConfirm(true)}
            className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
            data-testid="button-logout-mobile"
          >
            <LogOut size={20} />
          </button>
        </div>

        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 bg-[#0d3da8]/10 rounded-xl flex items-center justify-center">
            <Settings className="text-[#0d3da8]" size={24} />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Settings</h2>
            <p className="text-gray-500">Manage app settings</p>
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="animate-spin text-[#0d3da8]" size={32} />
          </div>
        ) : (
          <div className="space-y-6">
            {/* Coming Soon Mode Toggle */}
            <div className={`rounded-xl shadow-sm border p-6 transition-all duration-200 ${
              comingSoonMode 
                ? 'bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200' 
                : 'bg-slate-50 border-slate-200'
            }`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center transition-colors ${
                    comingSoonMode ? 'bg-[#0d3da8] text-white' : 'bg-slate-200 text-slate-500'
                  }`}>
                    <Rocket size={20} />
                  </div>
                  <div>
                    <h3 className={`font-bold text-lg ${comingSoonMode ? 'text-[#082366]' : 'text-slate-700'}`}>
                      Coming Soon Mode
                    </h3>
                    <p className={`text-sm ${comingSoonMode ? 'text-blue-900' : 'text-slate-500'}`}>
                      When enabled, shows "Launching Soon" message to all app users
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {isSavingComingSoon && (
                    <Loader2 className="animate-spin text-[#0d3da8]" size={16} />
                  )}
                  <Switch
                    checked={comingSoonMode}
                    onCheckedChange={handleComingSoonSwitchChange}
                    disabled={isSavingComingSoon}
                    data-testid="switch-coming-soon"
                  />
                </div>
              </div>
              <div className={`mt-4 p-3 rounded-lg border transition-all ${
                comingSoonMode 
                  ? 'bg-blue-200/70 border-blue-300 text-blue-900' 
                  : 'bg-white border-slate-200 text-slate-500'
              }`}>
                <p className="text-sm font-medium">
                  {comingSoonMode
                    ? "✨ App is in pre-launch mode. Users will see 'Launching Soon' message."
                    : "App is live. Users can access all features normally."}
                </p>
              </div>
            </div>

            {/* Under Construction Mode Toggle */}
            <div className={`rounded-xl shadow-sm border p-6 transition-all duration-200 ${
              underConstructionMode
                ? 'bg-gradient-to-r from-orange-50 to-amber-100 border-amber-200'
                : 'bg-slate-50 border-slate-200'
            }`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center transition-colors ${
                    underConstructionMode ? 'bg-amber-600 text-white' : 'bg-slate-200 text-slate-500'
                  }`}>
                    <Wrench size={20} />
                  </div>
                  <div>
                    <h3 className={`font-bold text-lg ${underConstructionMode ? 'text-amber-900' : 'text-slate-700'}`}>
                      Under Construction Mode
                    </h3>
                    <p className={`text-sm ${underConstructionMode ? 'text-amber-800' : 'text-slate-500'}`}>
                      When enabled, shows "Under Construction" popup to all app users
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {isSavingUnderConstruction && (
                    <Loader2 className="animate-spin text-amber-700" size={16} />
                  )}
                  <Switch
                    checked={underConstructionMode}
                    onCheckedChange={handleUnderConstructionSwitchChange}
                    disabled={isSavingUnderConstruction}
                    data-testid="switch-under-construction"
                  />
                </div>
              </div>
              <div className={`mt-4 p-3 rounded-lg border transition-all ${
                underConstructionMode 
                  ? 'bg-amber-200/70 border-amber-300 text-amber-900' 
                  : 'bg-white border-slate-200 text-slate-500'
              }`}>
                <p className="text-sm font-medium">
                  {underConstructionMode
                    ? "🚧 App is under maintenance. Users will see 'Under Construction' message."
                    : "App is running normally. No maintenance message is shown."}
                </p>
              </div>
            </div>

            {/* Free Access Mode Toggle */}
            <div className={`rounded-xl shadow-sm border p-6 transition-all duration-200 ${
              freeAccessMode
                ? 'bg-gradient-to-r from-emerald-50 to-green-100 border-emerald-200'
                : 'bg-slate-50 border-slate-200'
            }`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center transition-colors ${
                    freeAccessMode ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-500'
                  }`}>
                    <Gift size={20} />
                  </div>
                  <div>
                    <h3 className={`font-bold text-lg ${freeAccessMode ? 'text-emerald-900' : 'text-slate-700'}`}>
                      Free Access Mode
                    </h3>
                    <p className={`text-sm ${freeAccessMode ? 'text-emerald-800' : 'text-slate-500'}`}>
                      When enabled, users can view all contacts for free without subscription
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {isSavingFreeAccess && (
                    <Loader2 className="animate-spin text-emerald-700" size={16} />
                  )}
                  <Switch
                    checked={freeAccessMode}
                    onCheckedChange={handleFreeAccessSwitchChange}
                    disabled={isSavingFreeAccess}
                    data-testid="switch-free-access"
                  />
                </div>
              </div>
              <div className={`mt-4 p-3 rounded-lg border transition-all ${
                freeAccessMode 
                  ? 'bg-emerald-200/70 border-emerald-300 text-emerald-900' 
                  : 'bg-white border-slate-200 text-slate-500'
              }`}>
                <p className="text-sm font-medium">
                  {freeAccessMode
                    ? "🎁 Free access is active. Users can view all contacts without paying for a subscription."
                    : "Subscription required. Users must purchase a plan to view contacts."}
                </p>
              </div>
            </div>

            {successMessage && (
              <div className="bg-green-50 text-green-700 px-4 py-3 rounded-lg text-sm">
                {successMessage}
              </div>
            )}

            {errorMessage && (
              <div className="bg-red-50 text-red-700 px-4 py-3 rounded-lg text-sm">
                {errorMessage}
              </div>
            )}

            <div className="bg-white rounded-xl shadow-sm border p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                    <span className="text-green-600 text-lg font-bold">₹</span>
                  </div>
                  <div>
                    <h3 className="font-bold text-lg">Space Seekers Premium</h3>
                    <p className="text-sm text-gray-500">Configure premium subscription plans for Space Seekers</p>
                  </div>
                </div>
                <Button
                  type="button"
                  variant={isEditingPremium ? "secondary" : "outline"}
                  size="sm"
                  onClick={() => setIsEditingPremium(!isEditingPremium)}
                  className="flex items-center gap-1.5 border-blue-200 text-[#0d3da8] hover:bg-blue-50"
                  data-testid="button-edit-pricing-top"
                >
                  <Pencil size={15} />
                  Edit Pricing Plans
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Basic Plan */}
                <div className={`rounded-xl p-5 border transition-all duration-200 ${
                  premiumBasicEnabled ? 'border-gray-200 bg-white' : 'border-slate-200 bg-slate-50/80 text-slate-500'
                }`}>
                  <div className="flex items-center justify-between mb-4">
                    <span className={`text-sm font-bold ${premiumBasicEnabled ? 'text-gray-900' : 'text-slate-500'}`}>Basic Plan</span>
                    <Switch
                      checked={premiumBasicEnabled}
                      onCheckedChange={setPremiumBasicEnabled}
                      disabled={!isEditingPremium}
                      data-testid="switch-basic-enabled"
                    />
                  </div>
                  <div className="space-y-3">
                    <div>
                      <Label htmlFor="basic-price" className="text-xs text-gray-500">Price (₹)</Label>
                      <Input
                        id="basic-price"
                        type="number"
                        value={premiumBasicPrice}
                        onChange={(e) => setPremiumBasicPrice(e.target.value)}
                        disabled={!isEditingPremium}
                        className="mt-1"
                        data-testid="input-basic-price"
                      />
                    </div>
                    <div>
                      <Label htmlFor="basic-views" className="text-xs text-gray-500">Contact Views Limit</Label>
                      <Input
                        id="basic-views"
                        type="number"
                        value={premiumBasicViews}
                        onChange={(e) => setPremiumBasicViews(e.target.value)}
                        disabled={!isEditingPremium}
                        className="mt-1"
                        data-testid="input-basic-views"
                      />
                    </div>
                    <div>
                      <Label htmlFor="basic-validity" className="text-xs text-gray-500">Validity (Days)</Label>
                      <Input
                        id="basic-validity"
                        type="number"
                        value={premiumBasicValidity}
                        onChange={(e) => setPremiumBasicValidity(e.target.value)}
                        disabled={!isEditingPremium}
                        className="mt-1"
                        data-testid="input-basic-validity"
                      />
                    </div>
                  </div>
                </div>

                {/* Standard Plan */}
                <div className={`rounded-xl p-5 relative transition-all duration-200 ${
                  premiumStandardEnabled 
                    ? 'border-2 border-[#0d3da8] bg-blue-50/30' 
                    : 'border border-slate-200 bg-slate-50/80 text-slate-500'
                }`}>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <span className={`text-sm font-bold ${premiumStandardEnabled ? 'text-[#0d3da8]' : 'text-slate-500'}`}>Standard Plan</span>
                      <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold ${
                        premiumStandardEnabled ? 'bg-[#0d3da8] text-white' : 'bg-slate-300 text-slate-600'
                      }`}>Popular</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-500">{premiumStandardEnabled ? "Active" : "Off"}</span>
                      <Switch
                        checked={premiumStandardEnabled}
                        onCheckedChange={setPremiumStandardEnabled}
                        disabled={!isEditingPremium}
                        data-testid="switch-standard-plan"
                      />
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <Label htmlFor="standard-price" className="text-xs text-gray-500">Price (₹)</Label>
                      <Input
                        id="standard-price"
                        type="number"
                        value={premiumStandardPrice}
                        onChange={(e) => setPremiumStandardPrice(e.target.value)}
                        disabled={!isEditingPremium}
                        className="mt-1"
                        data-testid="input-standard-price"
                      />
                    </div>
                    <div>
                      <Label htmlFor="standard-views" className="text-xs text-gray-500">Contact Views Limit</Label>
                      <Input
                        id="standard-views"
                        type="number"
                        value={premiumStandardViews}
                        onChange={(e) => setPremiumStandardViews(e.target.value)}
                        disabled={!isEditingPremium}
                        className="mt-1"
                        data-testid="input-standard-views"
                      />
                    </div>
                    <div>
                      <Label htmlFor="standard-validity" className="text-xs text-gray-500">Validity (Days)</Label>
                      <Input
                        id="standard-validity"
                        type="number"
                        value={premiumStandardValidity}
                        onChange={(e) => setPremiumStandardValidity(e.target.value)}
                        disabled={!isEditingPremium}
                        className="mt-1"
                        data-testid="input-standard-validity"
                      />
                    </div>
                  </div>
                </div>

                {/* Premium Plan */}
                <div className={`rounded-xl p-5 border transition-all duration-200 ${
                  premiumPremiumEnabled ? 'border-gray-200 bg-white' : 'border-slate-200 bg-slate-50/80 text-slate-500'
                }`}>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <span className={`text-sm font-bold ${premiumPremiumEnabled ? 'text-gray-900' : 'text-slate-500'}`}>Premium Plan</span>
                      <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold ${
                        premiumPremiumEnabled ? 'bg-yellow-500 text-white' : 'bg-slate-300 text-slate-600'
                      }`}>Unlimited</span>
                    </div>
                    <Switch
                      checked={premiumPremiumEnabled}
                      onCheckedChange={setPremiumPremiumEnabled}
                      disabled={!isEditingPremium}
                      data-testid="switch-premium-plan"
                    />
                  </div>
                  <div className="space-y-3">
                    <div>
                      <Label htmlFor="premium-price" className="text-xs text-gray-500">Price (₹)</Label>
                      <Input
                        id="premium-price"
                        type="number"
                        value={premiumPremiumPrice}
                        onChange={(e) => setPremiumPremiumPrice(e.target.value)}
                        disabled={!isEditingPremium}
                        className="mt-1"
                        data-testid="input-premium-price"
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-gray-500">Contact Views Limit</Label>
                      <Input
                        type="text"
                        value="Unlimited"
                        disabled
                        className="mt-1 bg-gray-50"
                      />
                    </div>
                    <div>
                      <Label htmlFor="premium-validity" className="text-xs text-gray-500">Validity (Days)</Label>
                      <Input
                        id="premium-validity"
                        type="number"
                        value={premiumPremiumValidity}
                        onChange={(e) => setPremiumPremiumValidity(e.target.value)}
                        disabled={!isEditingPremium}
                        className="mt-1"
                        data-testid="input-premium-validity"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 mt-6">
                {!isEditingPremium ? (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsEditingPremium(true)}
                    className="border-[#0d3da8] text-[#0d3da8] hover:bg-blue-50"
                    data-testid="button-edit-premium-bottom"
                  >
                    <Pencil className="mr-2" size={16} />
                    Edit Premium Plans
                  </Button>
                ) : (
                  <>
                    <Button
                      onClick={async () => {
                        await handleSavePremiumPlans();
                        setIsEditingPremium(false);
                      }}
                      disabled={isSavingPlans}
                      className="bg-[#0d3da8] hover:bg-[#092c7d]"
                      data-testid="button-save-premium"
                    >
                      {isSavingPlans ? (
                        <Loader2 className="animate-spin mr-2" size={16} />
                      ) : (
                        <Save className="mr-2" size={16} />
                      )}
                      Save Premium Plans
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => setIsEditingPremium(false)}
                      className="text-gray-500 hover:text-gray-700"
                    >
                      Cancel
                    </Button>
                  </>
                )}
              </div>
            </div>

            {/* ═══ Spotly Roadside Navigation Access & Pricing ═══ */}
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                    <Navigation className="text-emerald-700" size={20} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-lg">Spotly Roadside Directions Access & Pricing</h3>
                      <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
                        spotlyDirectionPaidEnabled
                          ? "bg-amber-100 text-amber-900 border border-amber-300"
                          : "bg-emerald-100 text-emerald-900 border border-emerald-300"
                      }`}>
                        {spotlyDirectionPaidEnabled ? "Paid Subscription Mode" : "Free Mode"}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500">
                      Configure whether seekers get directions to Spotly roadside spaces for Free or via an Annual Subscription.
                    </p>
                  </div>
                </div>
              </div>

              {/* Status Notice Banner */}
              <div className={`p-4 rounded-xl border mb-6 flex items-start gap-3 ${
                spotlyDirectionPaidEnabled
                  ? "bg-amber-50/80 border-amber-200 text-amber-900"
                  : "bg-emerald-50/80 border-emerald-200 text-emerald-900"
              }`}>
                {spotlyDirectionPaidEnabled ? (
                  <>
                    <AlertTriangle size={18} className="text-amber-600 shrink-0 mt-0.5" />
                    <div className="text-xs space-y-1">
                      <p className="font-bold text-[13px]">Paid Subscription Enabled (Annual Pass)</p>
                      <p>
                        Seekers will be charged an annual subscription fee of <strong>₹{spotlyDirectionYearlyPrice}/year</strong> to unlock directions to Spotly roadside parking spaces. Once subscribed, they receive 365 days of unlimited access.
                      </p>
                    </div>
                  </>
                ) : (
                  <>
                    <Gift size={18} className="text-emerald-600 shrink-0 mt-0.5" />
                    <div className="text-xs space-y-1">
                      <p className="font-bold text-[13px]">Free Access Mode Active</p>
                      <p>
                        All seekers can view and get GPS directions to Spotly public roadside spaces completely free of charge without any subscription or payment.
                      </p>
                    </div>
                  </>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                {/* Free vs Paid Toggle */}
                <div className="p-4 rounded-xl border border-gray-100 bg-gray-50/60 flex items-center justify-between">
                  <div>
                    <Label className="text-sm font-bold text-gray-800">Charge Seekers for Directions</Label>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Toggle ON for Paid Subscription, OFF for Free Access
                    </p>
                  </div>
                  <Switch
                    checked={spotlyDirectionPaidEnabled}
                    onCheckedChange={setSpotlyDirectionPaidEnabled}
                    disabled={!isEditingSpotlyDirection}
                    data-testid="switch-spotly-direction-paid"
                  />
                </div>

                {/* Annual Subscription Fee */}
                <div className="p-4 rounded-xl border border-gray-100 bg-gray-50/60">
                  <Label htmlFor="spotly-yearly-price" className="text-sm font-bold text-gray-800">
                    Annual Pass Fee (₹ / Year)
                  </Label>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-sm font-black text-gray-500">₹</span>
                    <Input
                      id="spotly-yearly-price"
                      type="number"
                      min="1"
                      value={spotlyDirectionYearlyPrice}
                      onChange={(e) => setSpotlyDirectionYearlyPrice(e.target.value)}
                      disabled={!isEditingSpotlyDirection || !spotlyDirectionPaidEnabled}
                      placeholder="e.g. 29"
                      className="max-w-[140px] font-bold"
                      data-testid="input-spotly-yearly-price"
                    />
                    <span className="text-xs text-gray-400 font-semibold">/ 365 days</span>
                  </div>
                  <p className="text-[11px] text-gray-400 mt-1">Single fee charged annually to seekers for unlimited roadside directions.</p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-3">
                {!isEditingSpotlyDirection ? (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsEditingSpotlyDirection(true)}
                    className="border-emerald-600 text-emerald-700 hover:bg-emerald-50 cursor-pointer"
                    data-testid="button-edit-spotly-direction"
                  >
                    <Pencil className="mr-2" size={16} />
                    Edit Direction Pricing
                  </Button>
                ) : (
                  <>
                    <Button
                      onClick={async () => {
                        await handleSaveSpotlyDirectionSettings();
                      }}
                      disabled={isSavingSpotlyDirection}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer"
                      data-testid="button-save-spotly-direction"
                    >
                      {isSavingSpotlyDirection ? (
                        <Loader2 className="animate-spin mr-2" size={16} />
                      ) : (
                        <Save className="mr-2" size={16} />
                      )}
                      Save Direction Settings
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => setIsEditingSpotlyDirection(false)}
                      className="text-gray-500 hover:text-gray-700 cursor-pointer"
                    >
                      Cancel
                    </Button>
                  </>
                )}
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <span className="text-blue-600 text-sm font-bold">V</span>
                  </div>
                  <div>
                    <h3 className="font-bold text-lg">App Version</h3>
                    <p className="text-sm text-gray-500">Set the current app version</p>
                  </div>
                </div>
              </div>

              <div className="mb-6">
                <Label htmlFor="app-version" className="text-sm font-medium">Version</Label>
                <Input
                  id="app-version"
                  type="text"
                  value={appVersion}
                  onChange={(e) => setAppVersion(e.target.value)}
                  disabled={!isEditingVersion}
                  placeholder="e.g., 1.0.0"
                  className="mt-2 max-w-[200px]"
                  data-testid="input-app-version"
                />
                <p className="text-xs text-gray-400 mt-1">Current version displayed in the app</p>
              </div>

              <div className="flex items-center gap-3">
                {!isEditingVersion ? (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsEditingVersion(true)}
                    className="border-[#0d3da8] text-[#0d3da8] hover:bg-blue-50"
                    data-testid="button-edit-version-bottom"
                  >
                    <Pencil className="mr-2" size={16} />
                    Edit App Version
                  </Button>
                ) : (
                  <>
                    <Button
                      onClick={async () => {
                        await handleSaveAppVersion();
                        setIsEditingVersion(false);
                      }}
                      disabled={isSaving}
                      className="bg-[#0d3da8] hover:bg-[#092c7d]"
                      data-testid="button-save-version"
                    >
                      {isSaving ? (
                        <Loader2 className="animate-spin mr-2" size={16} />
                      ) : (
                        <Save className="mr-2" size={16} />
                      )}
                      Save App Version
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => setIsEditingVersion(false)}
                      className="text-gray-500 hover:text-gray-700"
                    >
                      Cancel
                    </Button>
                  </>
                )}
              </div>
            </div>

            {/* Landing Page Content */}
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                    <Globe className="text-indigo-600" size={20} />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg">Landing Page Content</h3>
                    <p className="text-sm text-gray-500">Edit headline, subtitle and footer details shown on the public landing page</p>
                  </div>
                </div>
              </div>

              <div className="space-y-4 mb-6">
                <div>
                  <Label htmlFor="landing-headline" className="text-sm font-medium">Headline</Label>
                  <Input
                    id="landing-headline"
                    value={landingHeadline}
                    onChange={(e) => setLandingHeadline(e.target.value)}
                    disabled={!isEditingLanding}
                    placeholder="Rent your parking spot. Find secure parking nearby."
                    className="mt-2"
                    data-testid="input-landing-headline"
                  />
                </div>
                <div>
                  <Label htmlFor="landing-subtitle" className="text-sm font-medium">Subtitle</Label>
                  <Input
                    id="landing-subtitle"
                    value={landingSubtitle}
                    onChange={(e) => setLandingSubtitle(e.target.value)}
                    disabled={!isEditingLanding}
                    placeholder="Your Spot. Their Convenience."
                    className="mt-2"
                    data-testid="input-landing-subtitle"
                  />
                </div>
                <div>
                  <Label htmlFor="landing-address" className="text-sm font-medium">Footer Address</Label>
                  <Input
                    id="landing-address"
                    value={landingAddress}
                    onChange={(e) => setLandingAddress(e.target.value)}
                    disabled={!isEditingLanding}
                    placeholder="Full registered office address"
                    className="mt-2"
                    data-testid="input-landing-address"
                  />
                </div>

                <div>
                  <Label htmlFor="landing-copyright" className="text-sm font-medium">Footer Copyright</Label>
                  <Input
                    id="landing-copyright"
                    value={landingCopyright}
                    onChange={(e) => setLandingCopyright(e.target.value)}
                    disabled={!isEditingLanding}
                    placeholder="©2026 Spotly. All Rights Reserved."
                    className="mt-2"
                    data-testid="input-landing-copyright"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="landing-spots-count" className="text-sm font-medium">Spots Count Display (Optional Override)</Label>
                    <Input
                      id="landing-spots-count"
                      value={landingSpotsCount}
                      onChange={(e) => setLandingSpotsCount(e.target.value)}
                      disabled={!isEditingLanding}
                      placeholder="Leave empty for auto live count (e.g., 8+)"
                      className="mt-2"
                      data-testid="input-landing-spots-count"
                    />
                    <p className="text-xs text-gray-400 mt-1">Leave empty to calculate automatically from active listings.</p>
                  </div>
                  <div>
                    <Label htmlFor="landing-providers-count" className="text-sm font-medium">Providers Count Display (Optional Override)</Label>
                    <Input
                      id="landing-providers-count"
                      value={landingProvidersCount}
                      onChange={(e) => setLandingProvidersCount(e.target.value)}
                      disabled={!isEditingLanding}
                      placeholder="Leave empty for auto live count (e.g., 1+)"
                      className="mt-2"
                      data-testid="input-landing-providers-count"
                    />
                    <p className="text-xs text-gray-400 mt-1">Leave empty to calculate automatically from registered providers.</p>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                {!isEditingLanding ? (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsEditingLanding(true)}
                    className="border-[#0d3da8] text-[#0d3da8] hover:bg-blue-50"
                    data-testid="button-edit-landing-bottom"
                  >
                    <Pencil className="mr-2" size={16} />
                    Edit Landing Content
                  </Button>
                ) : (
                  <>
                    <Button
                      onClick={async () => {
                        await handleSaveLandingContent();
                        setIsEditingLanding(false);
                      }}
                      disabled={isSavingLanding}
                      className="bg-[#0d3da8] hover:bg-[#092c7d]"
                      data-testid="button-save-landing"
                    >
                      {isSavingLanding ? (
                        <Loader2 className="animate-spin mr-2" size={16} />
                      ) : (
                        <Save className="mr-2" size={16} />
                      )}
                      Save Landing Content
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => setIsEditingLanding(false)}
                      className="text-gray-500 hover:text-gray-700"
                    >
                      Cancel
                    </Button>
                  </>
                )}
              </div>
            </div>

            {/* Customer Feedback & Reviews Settings */}
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                    <MessageSquare className="text-amber-600" size={20} />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg">Customer Feedback &amp; Reviews Prompt</h3>
                    <p className="text-sm text-gray-500">Configure modal popup trigger days &amp; testing mode for Space Providers &amp; Seekers</p>
                  </div>
                </div>
                <a
                  href="/customer-feedback"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-indigo-50 text-indigo-700 hover:bg-indigo-100 transition-colors border border-indigo-200"
                >
                  <ExternalLink size={13} />
                  View Feedback Page
                </a>
              </div>

              <div className="space-y-5 mb-6">
                <div>
                  <Label htmlFor="feedback-days" className="text-sm font-medium">
                    Prompt Trigger Delay (Days after Registration)
                  </Label>
                  <Input
                    id="feedback-days"
                    type="number"
                    min="1"
                    max="365"
                    value={feedbackTriggerDays}
                    onChange={(e) => setFeedbackTriggerDays(e.target.value)}
                    disabled={!isEditingFeedback}
                    placeholder="7"
                    className="mt-2 max-w-xs"
                    data-testid="input-feedback-trigger-days"
                  />
                  <p className="text-xs text-gray-400 mt-1">
                    Number of days after user registration before prompting them with the mandatory 5-star rating &amp; 5-line feedback modal (Default: 7 days).
                  </p>
                </div>

                <div className={`p-4 rounded-xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 transition-colors ${
                  feedbackTestModeImmediate 
                    ? 'bg-amber-50/70 border-amber-200' 
                    : 'bg-slate-50 border-slate-200'
                }`}>
                  <div className="space-y-0.5">
                    <div className={`text-sm font-bold flex items-center gap-2 ${
                      feedbackTestModeImmediate ? 'text-amber-900' : 'text-slate-700'
                    }`}>
                      <span>Testing Mode: Immediate Display on Login</span>
                      {feedbackTestModeImmediate ? (
                        <span className="px-2 py-0.5 text-[10px] font-bold uppercase rounded-full bg-amber-200 text-amber-800">
                          Active
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 text-[10px] font-bold uppercase rounded-full bg-slate-200 text-slate-600">
                          Inactive
                        </span>
                      )}
                    </div>
                    <p className={`text-xs max-w-lg ${
                      feedbackTestModeImmediate ? 'text-amber-800/80' : 'text-slate-500'
                    }`}>
                      When enabled, the 5-star feedback popup modal displays immediately upon user login without waiting for 7 days. Useful for testing UI, rating, and feedback submissions.
                    </p>
                  </div>
                  <Switch
                    checked={feedbackTestModeImmediate}
                    onCheckedChange={(checked) => {
                      if (isEditingFeedback) {
                        setFeedbackTestModeImmediate(checked);
                      }
                    }}
                    disabled={!isEditingFeedback}
                    data-testid="switch-feedback-test-mode"
                  />
                </div>
              </div>

              <div className="flex items-center gap-3">
                {!isEditingFeedback ? (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsEditingFeedback(true)}
                    className="border-[#0d3da8] text-[#0d3da8] hover:bg-blue-50"
                    data-testid="button-edit-feedback-settings"
                  >
                    <Pencil className="mr-2" size={16} />
                    Edit Feedback Settings
                  </Button>
                ) : (
                  <>
                    <Button
                      onClick={handleSaveFeedbackSettings}
                      disabled={isSavingFeedback}
                      className="bg-[#0d3da8] hover:bg-[#092c7d]"
                      data-testid="button-save-feedback-settings"
                    >
                      {isSavingFeedback ? (
                        <Loader2 className="animate-spin mr-2" size={16} />
                      ) : (
                        <Save className="mr-2" size={16} />
                      )}
                      Save Feedback Settings
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => setIsEditingFeedback(false)}
                      className="text-gray-500 hover:text-gray-700"
                    >
                      Cancel
                    </Button>
                  </>
                )}
              </div>

              {/* Feedback Reset & Deletion Section */}
              <div className="mt-8 pt-6 border-t border-gray-200">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                  <div className="flex items-center gap-2">
                    <Trash2 className="w-4 h-4 text-rose-600" />
                    <h4 className="text-sm font-bold text-gray-900">
                      Feedback Reset &amp; Deletion Controls
                    </h4>
                    <span className="text-[10px] font-extrabold uppercase bg-rose-100 text-rose-700 px-2 py-0.5 rounded-full">
                      Double Confirmation
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs font-semibold">
                    <span className="px-2.5 py-1 rounded-lg bg-orange-50 text-orange-700 border border-orange-200">
                      Providers: <strong className="font-bold">{feedbackStats.providerCount}</strong>
                    </span>
                    <span className="px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-200">
                      Seekers: <strong className="font-bold">{feedbackStats.seekerCount}</strong>
                    </span>
                    <span className="px-2.5 py-1 rounded-lg bg-gray-100 text-gray-700 border border-gray-200">
                      Total: <strong className="font-bold">{feedbackStats.total}</strong>
                    </span>
                  </div>
                </div>
                <p className="text-xs text-gray-500 mb-4">
                  Deleting feedback allows users with that role to receive the feedback popup modal again on their next home screen visit. All deletions require double confirmation.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {/* Space Providers Reset Card */}
                  <div className="border border-orange-200 rounded-xl p-3.5 bg-orange-50/40 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-[10px] font-bold text-orange-800 bg-orange-100 px-2 py-0.5 rounded-md">
                          Space Providers
                        </span>
                        <span className="text-xs font-bold text-orange-900">
                          {feedbackStats.providerCount} reviews
                        </span>
                      </div>
                      <h5 className="text-xs font-bold text-gray-900">Reset Space Provider Feedback</h5>
                      <p className="text-[11px] text-gray-600 mt-1 leading-normal">
                        Deletes all reviews from Space Providers. Re-enables the prompt modal on their next home visit.
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => openFeedbackResetModal("providers")}
                      className="mt-3 w-full border-orange-500 text-orange-700 hover:bg-orange-100 font-bold text-xs h-9 cursor-pointer"
                      data-testid="btn-reset-provider-feedback"
                    >
                      <Trash2 className="w-3.5 h-3.5 mr-1.5 text-orange-600" />
                      Reset Provider Feedback
                    </Button>
                  </div>

                  {/* Space Seekers Reset Card */}
                  <div className="border border-indigo-200 rounded-xl p-3.5 bg-indigo-50/40 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-[10px] font-bold text-indigo-800 bg-indigo-100 px-2 py-0.5 rounded-md">
                          Space Seekers
                        </span>
                        <span className="text-xs font-bold text-indigo-900">
                          {feedbackStats.seekerCount} reviews
                        </span>
                      </div>
                      <h5 className="text-xs font-bold text-gray-900">Reset Space Seeker Feedback</h5>
                      <p className="text-[11px] text-gray-600 mt-1 leading-normal">
                        Deletes all reviews from Space Seekers. Re-enables the prompt modal on their next home visit.
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => openFeedbackResetModal("seekers")}
                      className="mt-3 w-full border-indigo-500 text-indigo-700 hover:bg-indigo-100 font-bold text-xs h-9 cursor-pointer"
                      data-testid="btn-reset-seeker-feedback"
                    >
                      <Trash2 className="w-3.5 h-3.5 mr-1.5 text-indigo-600" />
                      Reset Seeker Feedback
                    </Button>
                  </div>

                  {/* All Feedback Reset Card */}
                  <div className="border border-rose-200 rounded-xl p-3.5 bg-rose-50/40 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-[10px] font-bold text-rose-800 bg-rose-100 px-2 py-0.5 rounded-md">
                          All Reviews
                        </span>
                        <span className="text-xs font-bold text-rose-900">
                          {feedbackStats.total} total
                        </span>
                      </div>
                      <h5 className="text-xs font-bold text-gray-900">Reset All Feedback</h5>
                      <p className="text-[11px] text-gray-600 mt-1 leading-normal">
                        Purges all reviews across both Providers and Seekers. Re-enables prompt modal for everyone.
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => openFeedbackResetModal("all")}
                      className="mt-3 w-full border-rose-600 text-rose-700 hover:bg-rose-100 font-bold text-xs h-9 cursor-pointer"
                      data-testid="btn-reset-all-feedback"
                    >
                      <RefreshCcw className="w-3.5 h-3.5 mr-1.5 text-rose-600" />
                      Reset All Reviews
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            {/* Customer Care Info */}
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                    <Phone className="text-green-600" size={20} />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg">Customer Care Info</h3>
                    <p className="text-sm text-gray-500">Set contact details shown across the app</p>
                  </div>
                </div>
              </div>

              <div className="space-y-4 mb-6">
                <div>
                  <Label htmlFor="support-phone" className="text-sm font-medium flex items-center gap-2">
                    <Phone size={14} />
                    Phone Number
                  </Label>
                  <Input
                    id="support-phone"
                    type="tel"
                    value={supportPhone}
                    onChange={(e) => setSupportPhone(e.target.value)}
                    disabled={!isEditingSupport}
                    placeholder="+91 9845****"
                    className="mt-2"
                    data-testid="input-support-phone"
                  />
                </div>
                <div>
                  <Label htmlFor="support-email" className="text-sm font-medium flex items-center gap-2">
                    <Mail size={14} />
                    Email Address
                  </Label>
                  <Input
                    id="support-email"
                    type="email"
                    value={supportEmail}
                    onChange={(e) => setSupportEmail(e.target.value)}
                    disabled={!isEditingSupport}
                    placeholder="info@spotlyindia.org"
                    className="mt-2"
                    data-testid="input-support-email"
                  />
                </div>
                <div>
                  <Label htmlFor="support-website" className="text-sm font-medium flex items-center gap-2">
                    <Globe size={14} />
                    Website URL
                  </Label>
                  <Input
                    id="support-website"
                    type="text"
                    value={supportWebsite}
                    onChange={(e) => setSupportWebsite(e.target.value)}
                    disabled={!isEditingSupport}
                    placeholder="spotlyindia.org"
                    className="mt-2"
                    data-testid="input-support-website"
                  />
                </div>
              </div>

              <div className="flex items-center gap-3">
                {!isEditingSupport ? (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsEditingSupport(true)}
                    className="border-[#0d3da8] text-[#0d3da8] hover:bg-blue-50"
                    data-testid="button-edit-support-bottom"
                  >
                    <Pencil className="mr-2" size={16} />
                    Edit Customer Care Info
                  </Button>
                ) : (
                  <>
                    <Button
                      onClick={async () => {
                        await handleSaveSupportInfo();
                        setIsEditingSupport(false);
                      }}
                      disabled={isSavingSupport}
                      className="bg-[#0d3da8] hover:bg-[#092c7d]"
                      data-testid="button-save-support"
                    >
                      {isSavingSupport ? (
                        <Loader2 className="animate-spin mr-2" size={16} />
                      ) : (
                        <Save className="mr-2" size={16} />
                      )}
                      Save Customer Care Info
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => setIsEditingSupport(false)}
                      className="text-gray-500 hover:text-gray-700"
                    >
                      Cancel
                    </Button>
                  </>
                )}
              </div>
            </div>

            {/* Ad Video */}
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                  <Globe className="text-red-600" size={20} />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-lg">Ad Video</h3>
                  <p className="text-sm text-gray-500">Upload a video to auto-play on home pages</p>
                </div>
                <Switch
                  checked={adVideoEnabled}
                  onCheckedChange={handleToggleVideo}
                  data-testid="switch-ad-video"
                />
              </div>

              {adVideoUrl ? (
                <div className="mb-6">
                  <div className="relative aspect-[2/1] rounded-xl overflow-hidden bg-black mb-3">
                    <video
                      src={adVideoUrl}
                      className="w-full h-full object-cover"
                      autoPlay
                      loop
                      muted
                      playsInline
                    />
                  </div>
                  <p className="text-xs text-green-600 font-medium mb-3">Video uploaded and playing on home pages</p>
                  <Button
                    onClick={handleRemoveVideo}
                    disabled={isSavingVideo}
                    variant="destructive"
                    data-testid="button-remove-video"
                  >
                    {isSavingVideo ? (
                      <Loader2 className="animate-spin mr-2" size={16} />
                    ) : null}
                    Remove Video
                  </Button>
                </div>
              ) : (
                <div className="mb-6">
                  <label
                    htmlFor="ad-video-upload"
                    className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-[#0d3da8] hover:bg-blue-50/30 transition-colors"
                  >
                    {isSavingVideo ? (
                      <div className="flex flex-col items-center gap-2">
                        <Loader2 className="animate-spin text-[#0d3da8]" size={24} />
                        <span className="text-sm text-gray-500">Uploading {videoFileName}...</span>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-2">
                        <Globe className="text-gray-400" size={24} />
                        <span className="text-sm text-gray-500 font-medium">Click to upload video</span>
                        <span className="text-xs text-gray-400">MP4, WebM (max 50MB)</span>
                      </div>
                    )}
                  </label>
                  <input
                    id="ad-video-upload"
                    type="file"
                    accept="video/*"
                    className="hidden"
                    onChange={handleVideoUpload}
                    disabled={isSavingVideo}
                    data-testid="input-ad-video-upload"
                  />
                </div>
              )}
            </div>

            {/* Login Page Background Video */}
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                  <Globe className="text-indigo-600" size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-lg">Login Page Background Video</h3>
                  <p className="text-sm text-gray-500">Video shown on the left side of the login screen. Clear to use the default local video.</p>
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="hero-video-url" className="text-xs text-gray-500 font-semibold uppercase tracking-wide">Video URL (YouTube or Local Path)</Label>
                  <Input
                    id="hero-video-url"
                    type="text"
                    placeholder="https://www.youtube.com/watch?v=... or /attached_assets/..."
                    value={heroVideoUrl}
                    onChange={(e) => setHeroVideoUrl(e.target.value)}
                    className="mt-1.5"
                    data-testid="input-hero-video-url"
                  />
                  <p className="text-xs text-gray-400 mt-1.5">
                    Paste a YouTube URL or a local path (e.g. /attached_assets/login-ad-1.mp4).
                    <strong className="text-indigo-600"> Leave empty or clear to use the default local video.</strong>
                  </p>
                </div>
                {heroVideoUrl && (
                  <div className="rounded-xl overflow-hidden border border-gray-200 aspect-video bg-black">
                    {/youtu\.be\/|youtube\.com\//.test(heroVideoUrl) ? (
                      <iframe
                        src={`https://www.youtube.com/embed/${heroVideoUrl.match(/(?:v=|youtu\.be\/)([^&\s]+)/)?.[1]}?autoplay=0&mute=1&controls=1`}
                        className="w-full h-full"
                        title="Login Page Video Preview"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      />
                    ) : (
                      <video
                        src={heroVideoUrl}
                        className="w-full h-full object-cover"
                        controls
                        muted
                        playsInline
                      />
                    )}
                  </div>
                )}
                <div className="flex gap-3">
                  <Button
                    onClick={handleSaveHeroVideo}
                    disabled={isSavingHeroVideo}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white"
                    data-testid="button-save-hero-video"
                  >
                    {isSavingHeroVideo ? <Loader2 className="animate-spin mr-2" size={16} /> : <Save size={16} className="mr-2" />}
                    Save Video URL
                  </Button>
                  {heroVideoUrl && (
                    <Button
                      variant="outline"
                      onClick={async () => {
                        setHeroVideoUrl("");
                        // Save empty string to DB so default local video is used
                        await adminFetch("/api/admin/settings", {
                          method: "POST",
                          body: JSON.stringify({
                            key: "hero_video_url",
                            value: "",
                            description: "Login page background video (local path or YouTube URL)"
                          }),
                        });
                        setSuccessMessage("Cleared! Default local video will now play.");
                        setTimeout(() => setSuccessMessage(""), 3000);
                      }}
                      data-testid="button-clear-hero-video"
                    >
                      Reset to Default
                    </Button>
                  )}
                </div>
              </div>
            </div>

            {/* Broadcast Notification */}
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Bell className="text-[#0d3da8]" size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-lg">Broadcast Notification</h3>
                  <p className="text-sm text-gray-500">Send notification to all users</p>
                </div>
              </div>

              <div className="space-y-4 mb-6">
                <div>
                  <Label htmlFor="broadcast-target" className="text-sm font-medium">Send To</Label>
                  <div className="flex gap-2 mt-2">
                    {[
                      { value: "all", label: "All Users" },
                      { value: "customers", label: "Space Providers" },
                      { value: "workers", label: "Space Seekers" }
                    ].map((option) => (
                      <button
                        key={option.value}
                        disabled={!isEditingBroadcast}
                        onClick={() => setBroadcastTarget(option.value as "all" | "customers" | "workers")}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${broadcastTarget === option.value
                          ? "bg-[#0d3da8] text-white"
                          : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                          } ${!isEditingBroadcast ? "opacity-50 cursor-not-allowed" : ""}`}
                        data-testid={`button-target-${option.value}`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <Label htmlFor="broadcast-title" className="text-sm font-medium">Title</Label>
                  <Input
                    id="broadcast-title"
                    type="text"
                    value={broadcastTitle}
                    onChange={(e) => setBroadcastTitle(e.target.value)}
                    disabled={!isEditingBroadcast}
                    placeholder="Enter notification title"
                    className="mt-2"
                    data-testid="input-broadcast-title"
                  />
                </div>

                <div>
                  <Label htmlFor="broadcast-message" className="text-sm font-medium">Message</Label>
                  <textarea
                    id="broadcast-message"
                    value={broadcastMessage}
                    onChange={(e) => setBroadcastMessage(e.target.value)}
                    disabled={!isEditingBroadcast}
                    placeholder="Enter notification message"
                    className="mt-2 w-full p-3 border border-gray-200 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#0d3da8] disabled:bg-gray-100 disabled:opacity-60 disabled:cursor-not-allowed"
                    rows={3}
                    data-testid="input-broadcast-message"
                  />
                </div>
              </div>

              <div className="flex items-center gap-3">
                {!isEditingBroadcast ? (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsEditingBroadcast(true)}
                    className="border-[#0d3da8] text-[#0d3da8] hover:bg-blue-50"
                    data-testid="button-edit-broadcast-bottom"
                  >
                    <Pencil className="mr-2" size={16} />
                    Edit Broadcast Message
                  </Button>
                ) : (
                  <>
                    <Button
                      onClick={async () => {
                        await handleBroadcastNotification();
                        setIsEditingBroadcast(false);
                      }}
                      disabled={isBroadcasting || !broadcastTitle.trim() || !broadcastMessage.trim()}
                      className="bg-[#0d3da8] hover:bg-[#092c7d]"
                      data-testid="button-send-broadcast"
                    >
                      {isBroadcasting ? (
                        <Loader2 className="animate-spin mr-2" size={16} />
                      ) : (
                        <Send className="mr-2" size={16} />
                      )}
                      Send Broadcast
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => setIsEditingBroadcast(false)}
                      className="text-gray-500 hover:text-gray-700"
                    >
                      Cancel
                    </Button>
                  </>
                )}
              </div>
            </div>

            {/* DATABASE DATA MANAGEMENT & FRESH RESET (DANGER ZONE) */}
            <div className="bg-white rounded-xl shadow-sm border border-red-200 p-6">
              <div className="flex items-center gap-3 pb-4 border-b border-red-100">
                <div className="w-10 h-10 rounded-xl bg-red-100 text-red-600 flex items-center justify-center shrink-0">
                  <Database size={20} />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                    Database Data Cleanup &amp; Fresh Reset
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-red-100 text-red-700 uppercase tracking-wider">
                      Danger Zone
                    </span>
                  </h2>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Selectively clear Space Seekers, Space Providers, or execute a complete fresh start. All actions require double confirmation.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-5">
                {/* 1. Clear Seekers Card */}
                <div className="border border-gray-200 hover:border-amber-400 rounded-xl p-4 bg-amber-50/30 flex flex-col justify-between transition-all">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-md">
                        Space Seekers Only
                      </span>
                    </div>
                    <h3 className="text-sm font-bold text-gray-900">Clear Space Seekers</h3>
                    <p className="text-xs text-gray-600 mt-1 leading-relaxed">
                      Removes all seekers, seeker profiles, vehicle search queries, contact logs, and resets active booking requests.
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => openCleanupModal("clear_seekers")}
                    className="mt-4 w-full border-amber-600 text-amber-700 hover:bg-amber-100 font-bold text-xs cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5 mr-1.5" />
                    Clear Seekers Data
                  </Button>
                </div>

                {/* 2. Clear Providers Card */}
                <div className="border border-gray-200 hover:border-orange-400 rounded-xl p-4 bg-orange-50/30 flex flex-col justify-between transition-all">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-orange-800 bg-orange-100 px-2 py-0.5 rounded-md">
                        Space Providers Only
                      </span>
                    </div>
                    <h3 className="text-sm font-bold text-gray-900">Clear Space Providers</h3>
                    <p className="text-xs text-gray-600 mt-1 leading-relaxed">
                      Removes all parking space providers, listed parking spots/spaces, spot photos, and provider transactions.
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => openCleanupModal("clear_providers")}
                    className="mt-4 w-full border-orange-600 text-orange-700 hover:bg-orange-100 font-bold text-xs cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5 mr-1.5" />
                    Clear Providers Data
                  </Button>
                </div>

                {/* 3. Reset All System Data Card */}
                <div className="border border-red-300 hover:border-red-500 rounded-xl p-4 bg-red-50/40 flex flex-col justify-between transition-all shadow-xs">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-red-800 bg-red-100 px-2 py-0.5 rounded-md">
                        Full Fresh Reset
                      </span>
                    </div>
                    <h3 className="text-sm font-bold text-red-950">Complete Website Reset</h3>
                    <p className="text-xs text-gray-600 mt-1 leading-relaxed">
                      Wipes ALL users, spaces, bookings, and payments. Starts 100% fresh while preserving cities and app settings.
                    </p>
                  </div>
                  <Button
                    type="button"
                    onClick={() => openCleanupModal("clear_all")}
                    className="mt-4 w-full bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow-sm cursor-pointer"
                  >
                    <RefreshCcw className="w-3.5 h-3.5 mr-1.5" />
                    Reset Entire System
                  </Button>
                </div>
              </div>
            </div>

            <div className="md:hidden">
              <p className="text-xs text-gray-500 text-center mb-4">Quick Navigation</p>
              <div className="grid grid-cols-4 gap-2">
                {navItems.slice(0, 8).map((item) => (
                  <button
                    key={item.path}
                    onClick={() => setLocation(item.path)}
                    className={`p-3 rounded-lg text-center ${item.path === "/admin/settings"
                      ? "bg-[#0d3da8] text-white"
                      : "bg-white border hover:bg-gray-50"
                      }`}
                  >
                    <item.icon size={20} className="mx-auto mb-1" />
                    <span className="text-xs">{item.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>

      <ConfirmDialog
        isOpen={showLogoutConfirm}
        onCancel={() => setShowLogoutConfirm(false)}
        title="Logout"
        message="Are you sure you want to logout from the admin panel?"
        confirmText="Logout"
        onConfirm={handleLogout}
        variant="info"
      />

      <ConfirmDialog
        isOpen={showComingSoonConfirm}
        onCancel={() => setShowComingSoonConfirm(false)}
        title={pendingComingSoonValue ? "Enable Coming Soon Mode" : "Disable Coming Soon Mode"}
        message={pendingComingSoonValue
          ? "This will show a 'Launching Soon' message to all app users. They won't be able to use the app until you disable this mode. Are you sure?"
          : "This will allow all users to access the app normally. Are you sure you want to disable Coming Soon mode?"}
        confirmText={pendingComingSoonValue ? "Enable" : "Disable"}
        onConfirm={handleConfirmComingSoon}
        variant={pendingComingSoonValue ? "warning" : "info"}
      />

      <ConfirmDialog
        isOpen={showUnderConstructionConfirm}
        onCancel={() => setShowUnderConstructionConfirm(false)}
        title={pendingUnderConstructionValue ? "Enable Under Construction Mode" : "Disable Under Construction Mode"}
        message={pendingUnderConstructionValue
          ? "This will show an 'Under Construction' popup to all app users. Are you sure you want to enable maintenance mode?"
          : "This will remove the maintenance popup for all users. Are you sure you want to disable Under Construction mode?"}
        confirmText={pendingUnderConstructionValue ? "Enable" : "Disable"}
        onConfirm={handleConfirmUnderConstruction}
        variant={pendingUnderConstructionValue ? "warning" : "info"}
      />

      <ConfirmDialog
        isOpen={showFreeAccessConfirm}
        onCancel={() => setShowFreeAccessConfirm(false)}
        title={pendingFreeAccessValue ? "Enable Free Access Mode" : "Disable Free Access Mode"}
        message={pendingFreeAccessValue
          ? "This will allow all users to view contacts for free without purchasing a subscription. Are you sure you want to enable free access?"
          : "This will require users to purchase a subscription to view contacts again. Are you sure you want to disable Free Access mode?"}
        confirmText={pendingFreeAccessValue ? "Enable" : "Disable"}
        onConfirm={handleConfirmFreeAccess}
        variant={pendingFreeAccessValue ? "warning" : "info"}
      />

      {/* DOUBLE CONFIRMATION MODAL FOR FEEDBACK RESET */}
      {feedbackResetModalOpen && selectedFeedbackResetTarget && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 cursor-pointer"
          onClick={() => {
            if (!isResettingFeedback) {
              setFeedbackResetModalOpen(false);
              setSelectedFeedbackResetTarget(null);
            }
          }}
        >
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 border border-red-200 cursor-default" onClick={(e) => e.stopPropagation()}>
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-red-600 to-rose-700 text-white p-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
                  <ShieldAlert size={22} />
                </div>
                <div>
                  <h3 className="font-bold text-base leading-tight">
                    {getFeedbackResetDetails(selectedFeedbackResetTarget).title}
                  </h3>
                  <p className="text-xs text-red-100 mt-0.5 font-medium">
                    Step {feedbackResetStep} of 2 &bull; Double Confirmation
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  if (!isResettingFeedback) {
                    setFeedbackResetModalOpen(false);
                    setSelectedFeedbackResetTarget(null);
                  }
                }}
                className="text-white/80 hover:text-white text-lg font-bold p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6">
              {feedbackResetStep === 1 ? (
                /* STEP 1: Impact Review */
                <div className="space-y-4">
                  <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                    <div className="text-xs text-red-900 leading-relaxed">
                      <p className="font-bold mb-1 text-sm">Irreversible Feedback Deletion</p>
                      {getFeedbackResetDetails(selectedFeedbackResetTarget).description}
                    </div>
                  </div>

                  <div>
                    <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                      Impact breakdown:
                    </h4>
                    <ul className="space-y-2 text-xs text-gray-600 bg-gray-50 p-3.5 rounded-xl border border-gray-100">
                      {getFeedbackResetDetails(selectedFeedbackResetTarget).impactList.map((item, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <span className="text-red-500 font-bold mt-0.5">•</span>
                          <span className="leading-snug">{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="pt-4 flex items-center justify-end gap-3 border-t border-gray-100">
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => setFeedbackResetModalOpen(false)}
                      className="text-gray-600 hover:text-gray-800"
                    >
                      Cancel
                    </Button>
                    <Button
                      type="button"
                      onClick={() => setFeedbackResetStep(2)}
                      className="bg-red-600 hover:bg-red-700 text-white font-bold"
                      data-testid="btn-proceed-feedback-step-2"
                    >
                      Proceed to Final Confirmation &rarr;
                    </Button>
                  </div>
                </div>
              ) : (
                /* STEP 2: Explicit Verification Keyword Typing */
                <div className="space-y-4">
                  <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900">
                    <p className="font-bold mb-1 text-sm">Security Verification</p>
                    Please type{" "}
                    <span className="font-mono font-bold bg-amber-200/80 px-1.5 py-0.5 rounded text-amber-950">
                      {getFeedbackResetDetails(selectedFeedbackResetTarget).keyword}
                    </span>{" "}
                    in the field below to confirm permanent deletion.
                  </div>

                  <div>
                    <Label className="text-xs font-bold text-gray-700">
                      Type <span className="font-mono text-red-600">{getFeedbackResetDetails(selectedFeedbackResetTarget).keyword}</span> to confirm:
                    </Label>
                    <Input
                      type="text"
                      value={feedbackResetConfirmInput}
                      onChange={(e) => setFeedbackResetConfirmInput(e.target.value.toUpperCase())}
                      placeholder={getFeedbackResetDetails(selectedFeedbackResetTarget).keyword}
                      className="mt-1.5 font-mono text-sm uppercase tracking-wider"
                      autoFocus
                      data-testid="input-feedback-confirm-keyword"
                    />
                  </div>

                  <div className="pt-4 flex items-center justify-between gap-3 border-t border-gray-100">
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => setFeedbackResetStep(1)}
                      disabled={isResettingFeedback}
                      className="text-gray-600 hover:text-gray-800"
                    >
                      &larr; Back
                    </Button>

                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setFeedbackResetModalOpen(false)}
                        disabled={isResettingFeedback}
                      >
                        Cancel
                      </Button>
                      <Button
                        type="button"
                        onClick={handleExecuteFeedbackReset}
                        disabled={
                          isResettingFeedback ||
                          feedbackResetConfirmInput.trim() !== getFeedbackResetDetails(selectedFeedbackResetTarget).keyword
                        }
                        className="bg-red-600 hover:bg-red-700 text-white font-bold shadow-md disabled:opacity-50"
                        data-testid="btn-confirm-delete-feedback"
                      >
                        {isResettingFeedback ? (
                          <>
                            <Loader2 className="animate-spin mr-2" size={16} />
                            Deleting...
                          </>
                        ) : (
                          <>
                            <Trash2 className="mr-2" size={16} />
                            Confirm &amp; Delete
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* DOUBLE CONFIRMATION MODAL FOR DATA CLEANUP & RESET */}
      {cleanupModalOpen && selectedCleanupAction && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 cursor-pointer"
          onClick={() => {
            if (!isCleaningData) {
              setCleanupModalOpen(false);
              setSelectedCleanupAction(null);
            }
          }}
        >
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 border border-red-200 cursor-default" onClick={(e) => e.stopPropagation()}>
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-red-600 to-rose-700 text-white p-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
                  <ShieldAlert size={22} />
                </div>
                <div>
                  <h3 className="font-bold text-base leading-tight">
                    {getActionDetails(selectedCleanupAction).title}
                  </h3>
                  <p className="text-xs text-red-100 mt-0.5 font-medium">
                    Step {cleanupStep} of 2 &bull; Double Confirmation
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  if (!isCleaningData) {
                    setCleanupModalOpen(false);
                    setSelectedCleanupAction(null);
                  }
                }}
                className="text-white/80 hover:text-white text-lg font-bold p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6">
              {cleanupStep === 1 ? (
                /* STEP 1: Impact Review */
                <div className="space-y-4">
                  <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                    <div className="text-xs text-red-900 leading-relaxed">
                      <p className="font-bold mb-1 text-sm">Irreversible Action Warning</p>
                      {getActionDetails(selectedCleanupAction).description}
                    </div>
                  </div>

                  <div>
                    <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                      Impact breakdown:
                    </h4>
                    <ul className="space-y-2 text-xs text-gray-600 bg-gray-50 p-3.5 rounded-xl border border-gray-100">
                      {getActionDetails(selectedCleanupAction).impactList.map((item, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <span className="text-red-500 font-bold mt-0.5">•</span>
                          <span className="leading-snug">{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="pt-4 flex items-center justify-end gap-3 border-t border-gray-100">
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => setCleanupModalOpen(false)}
                      className="text-gray-600 hover:text-gray-800"
                    >
                      Cancel
                    </Button>
                    <Button
                      type="button"
                      onClick={() => setCleanupStep(2)}
                      className="bg-red-600 hover:bg-red-700 text-white font-bold"
                    >
                      Proceed to Final Confirmation &rarr;
                    </Button>
                  </div>
                </div>
              ) : (
                /* STEP 2: Explicit Verification Keyword Typing */
                <div className="space-y-4">
                  <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900">
                    <p className="font-bold mb-1 text-sm">Security Verification</p>
                    Please type{" "}
                    <span className="font-mono font-bold bg-amber-200/80 px-1.5 py-0.5 rounded text-amber-950">
                      {getActionDetails(selectedCleanupAction).keyword}
                    </span>{" "}
                    in the field below to unlock the permanent deletion button.
                  </div>

                  <div>
                    <Label className="text-xs font-bold text-gray-700">
                      Type <span className="font-mono text-red-600">{getActionDetails(selectedCleanupAction).keyword}</span> to confirm:
                    </Label>
                    <Input
                      type="text"
                      value={confirmationInput}
                      onChange={(e) => setConfirmationInput(e.target.value.toUpperCase())}
                      placeholder={getActionDetails(selectedCleanupAction).keyword}
                      className="mt-1.5 font-mono text-sm uppercase tracking-wider"
                      autoFocus
                    />
                  </div>

                  <div className="pt-4 flex items-center justify-between gap-3 border-t border-gray-100">
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => setCleanupStep(1)}
                      disabled={isCleaningData}
                      className="text-gray-600 hover:text-gray-800"
                    >
                      &larr; Back
                    </Button>

                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setCleanupModalOpen(false)}
                        disabled={isCleaningData}
                      >
                        Cancel
                      </Button>
                      <Button
                        type="button"
                        onClick={handleExecuteCleanup}
                        disabled={
                          isCleaningData ||
                          confirmationInput.trim() !== getActionDetails(selectedCleanupAction).keyword
                        }
                        className="bg-red-600 hover:bg-red-700 text-white font-bold shadow-md disabled:opacity-50"
                      >
                        {isCleaningData ? (
                          <>
                            <Loader2 className="animate-spin mr-2" size={16} />
                            Deleting Data...
                          </>
                        ) : (
                          <>
                            <Trash2 className="mr-2" size={16} />
                            Confirm &amp; Delete
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

