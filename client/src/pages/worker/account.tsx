import { useLocation } from "wouter";
import MobileLayout from "@/components/layout/mobile-layout";
import { User, FileText, HelpCircle, LogOut, ChevronRight, Crown, Loader2, CheckCircle, Phone, Mail, Trash2, Share2, Pencil, CreditCard, AlertTriangle, Download } from "lucide-react";
import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getApiUrl } from "@/lib/api-config";
import { motion, AnimatePresence } from "framer-motion";
import { isGuest } from "@/lib/guest";
import GuestAccountView from "@/components/guest-account-view";
import TermsContent from "@/components/terms-content";
import { capitalizeName } from "@/lib/utils";
import { useRegisterModalBack } from "@/contexts/mobile-back-context";

interface PremiumStatus {
  isActive: boolean;
  activatedAt: string | null;
  amount: number;
}

interface UserProfile {
  id: string;
  name: string;
  mobile: string;
  email: string | null;
  role: string;
  isPremium?: boolean;
  premiumPlan?: string;
  premiumExpiresAt?: string | null;
  premiumActivatedAt?: string | null;
  premiumViewsRemaining?: number | null;
}

export default function WorkerAccount() {
  const [, setLocation] = useLocation();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showSecondDeleteConfirm, setShowSecondDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showProfileDialog, setShowProfileDialog] = useState(false);
  const [showSaveSuccess, setShowSaveSuccess] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [premiumStatus, setPremiumStatus] = useState<PremiumStatus | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [appVersion, setAppVersion] = useState("1.0.0");
  const [supportPhone, setSupportPhone] = useState("+91 9742545584");
  const [supportEmail, setSupportEmail] = useState("info@spotlyindia.org");
  const [showShareModal, setShowShareModal] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [showSubscriptionDetails, setShowSubscriptionDetails] = useState(false);

  const [isPremium, setIsPremium] = useState(false);
  const [premiumPlan, setPremiumPlan] = useState("");
  const [premiumExpiresAt, setPremiumExpiresAt] = useState<string | null>(null);
  const [premiumActivatedAt, setPremiumActivatedAt] = useState<string | null>(null);
  const [premiumViewsRemaining, setPremiumViewsRemaining] = useState<number | null>(null);
  const [paymentHistory, setPaymentHistory] = useState<any[]>([]);
  const [showPolicies, setShowPolicies] = useState(false);
  const [showHelpSupport, setShowHelpSupport] = useState(false);
  const [isBackingUp, setIsBackingUp] = useState(false);

  // Register modals with Android Back Button handler
  useRegisterModalBack(showLogoutConfirm, () => setShowLogoutConfirm(false), "worker-logout-confirm");
  useRegisterModalBack(showDeleteConfirm, () => setShowDeleteConfirm(false), "worker-delete-confirm");
  useRegisterModalBack(showSecondDeleteConfirm, () => setShowSecondDeleteConfirm(false), "worker-second-delete-confirm");
  useRegisterModalBack(showProfileDialog, () => setShowProfileDialog(false), "worker-profile-dialog");
  useRegisterModalBack(showShareModal, () => setShowShareModal(false), "worker-share-modal");
  useRegisterModalBack(showSubscriptionDetails, () => setShowSubscriptionDetails(false), "worker-subscription-details");
  useRegisterModalBack(showPolicies, () => setShowPolicies(false), "worker-policies-modal");
  useRegisterModalBack(showHelpSupport, () => setShowHelpSupport(false), "worker-help-support-modal");

  useEffect(() => {
    const saved = localStorage.getItem("seekerPremiumStatus") || localStorage.getItem("workerPremiumStatus") || localStorage.getItem("customerPremiumStatus");
    if (saved) {
      try {
        setPremiumStatus(JSON.parse(saved));
      } catch (e) { }
    }

    // Fetch user profile and payment history from API
    const fetchUserProfile = async () => {
      const userId = localStorage.getItem("userId");
      if (userId) {
        try {
          const response = await fetch(getApiUrl(`/api/users/${userId}`));
          if (response.ok) {
            const data = await response.json();
            setUserProfile(data);
            setIsPremium(data.isPremium || false);
            setPremiumPlan(data.premiumPlan || "");
            setPremiumExpiresAt(data.premiumExpiresAt || null);
            setPremiumActivatedAt(data.premiumActivatedAt || null);
            setPremiumViewsRemaining(data.premiumViewsRemaining != null ? data.premiumViewsRemaining : null);
          }

          const paymentsResponse = await fetch(getApiUrl(`/api/users/${userId}/payments`));
          if (paymentsResponse.ok) {
            const paymentsData = await paymentsResponse.json();
            setPaymentHistory(paymentsData.payments || []);
          }
        } catch (error) {
          console.error("Failed to fetch user profile:", error);
        }
      }
      setIsLoading(false);
    };

    // Fetch app version and support info from settings
    const fetchSettings = async () => {
      try {
        const [versionRes, phoneRes, emailRes] = await Promise.all([
          fetch(getApiUrl("/api/settings/app_version")),
          fetch(getApiUrl("/api/settings/support_phone")),
          fetch(getApiUrl("/api/settings/support_email"))
        ]);
        if (versionRes.ok) {
          const data = await versionRes.json();
          if (data.setting?.value) {
            setAppVersion(data.setting.value);
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
      } catch (error) {
        console.error("Failed to fetch settings:", error);
      }
    };

    fetchUserProfile();
    fetchSettings();
  }, []);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const handleLogoutConfirm = () => {
    // Clear all user data from localStorage on logout
    localStorage.removeItem("userId");
    localStorage.removeItem("userName");
    localStorage.removeItem("userMobile");
    localStorage.removeItem("userRole");
    localStorage.removeItem("sessionToken");
    localStorage.removeItem("workerAge");
    localStorage.removeItem("workerGender");
    localStorage.removeItem("workerServices");
    localStorage.removeItem("workerConditions");
    localStorage.removeItem("isNewRegistration");
    localStorage.removeItem("disclaimerAccepted");
    localStorage.setItem("userRole", "worker");

    setShowLogoutConfirm(false);
    setLocation("/auth?role=space-seeker");
  };

  const handleDeleteAccount = async () => {
    const userId = localStorage.getItem("userId");
    const sessionToken = localStorage.getItem("sessionToken");
    if (!userId) return;

    if (!sessionToken) {
      alert("Session expired. Please log in again to delete your account.");
      localStorage.clear();
      setLocation("/auth?role=space-seeker");
      return;
    }

    setIsDeleting(true);
    try {
      const response = await fetch(getApiUrl(`/api/users/${userId}`), {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${sessionToken}`
        }
      });

      if (response.ok) {
        localStorage.clear();
        setShowDeleteConfirm(false);
        setShowSecondDeleteConfirm(false);
        setLocation("/auth?role=space-seeker");
      } else if (response.status === 401) {
        alert("Session expired. Please log in again to delete your account.");
        localStorage.clear();
        setLocation("/auth?role=space-seeker");
      } else {
        const data = await response.json();
        alert(data.error || "Failed to delete account. Please try again.");
      }
    } catch (error) {
      console.error("Failed to delete account:", error);
      alert("Network error. Please try again.");
    }
    setIsDeleting(false);
  };

  const handleShareApp = () => {
    setShowShareModal(true);
  };

  const handleOpenProfile = () => {
    setEditName(userProfile?.name || localStorage.getItem("userName") || "");
    setEditEmail(userProfile?.email || "");
    setShowProfileDialog(true);
  };

  const handleSaveProfile = async () => {
    const userId = userProfile?.id || localStorage.getItem("userId");
    if (!userId) {
      alert("Session not found. Please log in again.");
      return;
    }

    const trimmedName = editName.trim();
    if (!trimmedName) {
      alert("Please enter a valid name.");
      return;
    }

    setIsSaving(true);
    try {
      const response = await fetch(getApiUrl(`/api/users/${userId}`), {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: trimmedName,
          email: editEmail.trim() ? editEmail.trim() : null
        })
      });

      if (response.ok) {
        const data = await response.json();
        setUserProfile(data.user);
        localStorage.setItem("userName", data.user?.name || trimmedName);
        setShowProfileDialog(false);
        setShowSaveSuccess(true);
        setTimeout(() => setShowSaveSuccess(false), 2000);
      } else {
        const errData = await response.json().catch(() => ({}));
        alert(errData.error || "Failed to save profile. Please try again.");
      }
    } catch (error) {
      console.error("Failed to save profile:", error);
      alert("Network error. Please try again.");
    }
    setIsSaving(false);
  };

  const handleFullBackup = async () => {
    setIsBackingUp(true);
    try {
      const response = await fetch(getApiUrl("/api/backup/download"));
      if (!response.ok) {
        throw new Error("Failed to generate backup");
      }
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      const timestamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
      a.href = url;
      a.download = `Spotly_Full_Backup_${timestamp}.xlsx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Backup failed:", error);
      alert("Failed to download backup. Please try again.");
    }
    setIsBackingUp(false);
  };

  const menuGroup1 = [
    { icon: User, label: "Edit Profile", subtitle: "Update your personal details", action: handleOpenProfile, iconBg: "bg-indigo-50 text-[#241e98]" },
    { icon: Share2, label: "Share App", subtitle: "Invite your friends to Spotly", action: handleShareApp, iconBg: "bg-indigo-50 text-[#241e98]" },
    { icon: FileText, label: "Terms & Conditions", subtitle: "Read our terms and policies", action: () => setShowPolicies(true), iconBg: "bg-emerald-50 text-emerald-600" },
    { icon: HelpCircle, label: "Help & Support", subtitle: "Get help and support", action: () => setShowHelpSupport(true), iconBg: "bg-amber-50 text-amber-600" },
    { icon: Crown, label: "Subscription Details", subtitle: "View your subscription plan", action: () => setShowSubscriptionDetails(true), iconBg: "bg-purple-50 text-purple-600" },
  ];

  const menuGroup2 = [
    { icon: LogOut, label: "Logout", subtitle: "Sign out from your account", action: () => setShowLogoutConfirm(true), danger: true, iconBg: "bg-rose-50 text-rose-500" },
    { icon: Trash2, label: "Delete Account", subtitle: "Permanently delete your account", action: () => setShowDeleteConfirm(true), danger: true, iconBg: "bg-rose-50 text-rose-500" },
  ];

  if (isGuest()) {
    return <GuestAccountView role="worker" />;
  }

  return (
    <MobileLayout showNav userType="worker">
      <div className="pb-10 min-h-full bg-slate-50/50">
        {/* Sticky Top Profile Section */}
        <div className="sticky top-0 z-30 bg-slate-50/95 backdrop-blur-md pb-1 shadow-xs">
          {/* Gradient Header */}
          <div
            className="px-6 pt-[calc(1.5rem+env(safe-area-inset-top,0px))] pb-14 relative overflow-hidden"
            style={{ background: "linear-gradient(135deg, #1e3a8a 0%, #3b2fad 35%, #6d28d9 70%, #7c3aed 100%)" }}
          >
            {/* Subtle Glows */}
            <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-br from-[#3e3ab3]/30 to-purple-600/30 rounded-full blur-3xl"></div>
            <div className="absolute bottom-0 left-0 w-40 h-40 bg-purple-500/15 rounded-full blur-2xl"></div>

            {/* Reused Header Graphic (Original source artwork cutout PNG) */}
            <div className="absolute right-0 bottom-0 top-0 w-[85%] pointer-events-none overflow-hidden flex items-end justify-end z-0">
              <img
                src="/header_parking_cars_transparent.png"
                alt="Spotly Parking Cars Scene"
                className="h-[79px] mb-[20px] sm:h-[135px] max-w-none object-contain object-right-bottom filter drop-shadow-sm translate-y-1"
              />
            </div>

            <h2 className="text-2xl font-black font-heading text-white relative z-10 tracking-tight">My Profile</h2>
            <p className="text-indigo-200 text-xs font-semibold relative z-10 mt-0.5">Space Seeker</p>
          </div>

          {/* Floating User Profile Card */}
          <div className="px-5 -mt-7 relative z-20">
            <div className="bg-white rounded-[26px] p-4 shadow-xl shadow-[#241e98]/10 border border-slate-100/90 flex items-center justify-between gap-3">
              {isLoading ? (
                <div className="flex items-center gap-3 w-full">
                  <div className="bg-indigo-50 rounded-full animate-pulse w-14 h-14 shrink-0" />
                  <div className="flex-1">
                    <div className="h-4 bg-indigo-50 rounded w-28 mb-1.5 animate-pulse" />
                    <div className="h-3 bg-indigo-50 rounded w-24 animate-pulse" />
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-3.5 min-w-0 flex-1">
                    <div className="relative shrink-0">
                      <div className="w-14 h-14 bg-[#241e98] rounded-full flex items-center justify-center text-white font-black text-xl shadow-md shadow-[#241e98]/25 ring-2 ring-white">
                        {(userProfile?.name || localStorage.getItem("userName") || "U")?.charAt(0)?.toUpperCase() || "U"}
                      </div>
                      <div className="absolute -bottom-0.5 -right-0.5 w-5 h-5 bg-emerald-500 rounded-full border-2 border-white flex items-center justify-center shadow-xs">
                        <CheckCircle size={11} className="text-white stroke-[3]" />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-black text-slate-900 text-base leading-tight truncate capitalize" data-testid="text-user-name">
                        {capitalizeName(userProfile?.name || localStorage.getItem("userName") || "User")}
                      </h3>
                      <div className="flex items-center gap-1.5 mt-1 text-slate-500">
                        <Phone size={12} className="text-[#241e98] shrink-0" />
                        <p className="text-xs font-semibold truncate" data-testid="text-user-mobile">
                          +91 {userProfile?.mobile || localStorage.getItem("userMobile") || ""}
                        </p>
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleOpenProfile}
                    className="px-3.5 py-2 text-white text-xs font-extrabold rounded-2xl flex items-center gap-1.5 shadow-md shadow-[#1e3a8a]/25 active:scale-95 transition-all cursor-pointer shrink-0"
                    style={{ background: "linear-gradient(135deg, #1e3a8a 0%, #3b2fad 35%, #6d28d9 70%, #7c3aed 100%)" }}
                    data-testid="button-edit-profile-header"
                  >
                    <Pencil size={13} />
                    <span>Edit Profile</span>
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Content Body */}
        <div className="px-5 space-y-4 relative z-10">
          {/* Premium Membership Card */}
          {(isPremium || (premiumStatus?.isActive && premiumStatus.activatedAt)) && (
            <div className="bg-gradient-to-br from-amber-400 via-amber-500 to-yellow-500 rounded-[24px] p-4 text-white relative overflow-hidden shadow-lg shadow-amber-500/20" data-testid="premium-membership-card">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center shrink-0 border border-white/30">
                  <Crown size={24} className="text-white fill-white/20" />
                </div>
                <div className="flex-1">
                  <span className="font-black text-base block">Premium Member</span>
                  <p className="text-white/90 text-xs mt-0.5 font-medium">
                    {premiumStatus?.amount ? `Paid ₹${premiumStatus.amount} ` : ""}{premiumActivatedAt || premiumStatus?.activatedAt ? `Activated on ${formatDate(premiumActivatedAt || premiumStatus?.activatedAt || "")}` : "Active Subscription"}
                  </p>
                  <div className="flex gap-4 mt-2 text-xs text-white/80">
                    <span className="font-medium">Basic: {paymentHistory.filter(p => p.amount === 19900).length}</span>
                    <span className="font-medium">Standard: {paymentHistory.filter(p => p.amount === 29900).length}</span>
                    <span className="font-medium">Premium: {paymentHistory.filter(p => p.amount === 39900).length}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Group 1 Menu Card */}
          <div className="bg-white rounded-[26px] border border-slate-100/90 shadow-xl shadow-slate-200/40 overflow-hidden divide-y divide-slate-100/80">
            {menuGroup1.map((item, index) => (
              <button
                key={index}
                onClick={item.action}
                className="w-full flex items-center justify-between p-3.5 hover:bg-slate-50/80 transition-colors group cursor-pointer"
                data-testid={`menu-item-${item.label.toLowerCase().replace(/\s+/g, "-")}`}
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-105 ${item.iconBg}`}>
                    <item.icon size={20} />
                  </div>
                  <div className="text-left min-w-0">
                    <span className="font-extrabold text-slate-900 text-sm block leading-tight">
                      {item.label}
                    </span>
                    <span className="text-xs text-slate-400 font-medium block mt-0.5 truncate">
                      {item.subtitle}
                    </span>
                  </div>
                </div>
                <ChevronRight size={18} className="text-slate-300 group-hover:text-slate-400 group-hover:translate-x-0.5 transition-all shrink-0" />
              </button>
            ))}
          </div>

          {/* Group 2 Menu Card (Logout & Delete) */}
          <div className="bg-white rounded-[26px] border border-slate-100/90 shadow-xl shadow-slate-200/40 overflow-hidden divide-y divide-slate-100/80">
            {menuGroup2.map((item, index) => (
              <button
                key={index}
                onClick={item.action}
                className="w-full flex items-center justify-between p-3.5 hover:bg-rose-50/30 transition-colors group cursor-pointer"
                data-testid={`menu-item-${item.label.toLowerCase().replace(/\s+/g, "-")}`}
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-105 ${item.iconBg}`}>
                    <item.icon size={20} />
                  </div>
                  <div className="text-left min-w-0">
                    <span className="font-extrabold text-rose-600 text-sm block leading-tight">
                      {item.label}
                    </span>
                    <span className="text-xs text-slate-400 font-medium block mt-0.5 truncate">
                      {item.subtitle}
                    </span>
                  </div>
                </div>
                <ChevronRight size={18} className="text-rose-300 group-hover:text-rose-400 group-hover:translate-x-0.5 transition-all shrink-0" />
              </button>
            ))}
          </div>

          {/* Full Backup Card */}
          <div className="bg-white rounded-[26px] border border-slate-100/90 shadow-xl shadow-slate-200/40 overflow-hidden">
            <button
              onClick={handleFullBackup}
              disabled={isBackingUp}
              className="w-full flex items-center justify-between p-3.5 hover:bg-emerald-50/40 transition-colors group cursor-pointer disabled:opacity-60"
              data-testid="menu-item-full-backup"
            >
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-105 bg-emerald-50 text-emerald-600">
                  {isBackingUp ? <Loader2 size={20} className="animate-spin" /> : <Download size={20} />}
                </div>
                <div className="text-left min-w-0">
                  <span className="font-extrabold text-slate-900 text-sm block leading-tight">
                    Full Backup
                  </span>
                  <span className="text-xs text-slate-400 font-medium block mt-0.5 truncate">
                    {isBackingUp ? "Generating Excel file..." : "Download Seekers, Providers & Spaces as Excel"}
                  </span>
                </div>
              </div>
              <ChevronRight size={18} className="text-emerald-300 group-hover:text-emerald-400 group-hover:translate-x-0.5 transition-all shrink-0" />
            </button>
          </div>

          <div className="text-center pt-2">
            <p className="text-xs font-semibold text-slate-400">Version {appVersion}</p>
          </div>
        </div>

        <AnimatePresence>
          {showProfileDialog && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6 overflow-y-auto" onClick={() => setShowProfileDialog(false)}>
              <motion.div initial={{ scale: 0.85, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.85, opacity: 0 }} className="bg-white rounded-3xl p-6 shadow-2xl max-w-sm w-full my-auto" onClick={(e) => e.stopPropagation()}>
                <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-4">
                  <User size={32} className="text-primary" />
                </div>
                <h3 className="text-lg font-bold text-neutral-900 text-center mb-1">Edit Profile</h3>
                <p className="text-neutral-500 text-xs text-center mb-5">Update your personal information</p>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-name">Full Name</Label>
                    <Input id="edit-name" value={editName} onChange={(e) => setEditName(e.target.value.replace(/[^a-zA-Z\s]/g, "").slice(0, 10).replace(/\b\w/g, c => c.toUpperCase()))} maxLength={10} placeholder="Enter your name" className="h-12 rounded-xl" data-testid="input-edit-name" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-email">Email</Label>
                    <Input id="edit-email" type="email" value={editEmail} onChange={(e) => setEditEmail(e.target.value)} placeholder="Enter your email" className="h-12 rounded-xl" data-testid="input-edit-email" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-mobile">Mobile Number</Label>
                    <Input id="edit-mobile" value={userProfile?.mobile ? `+91 ${userProfile.mobile}` : localStorage.getItem("userMobile") ? `+91 ${localStorage.getItem("userMobile")}` : ""} disabled className="h-12 rounded-xl bg-neutral-100 text-neutral-500 cursor-not-allowed" data-testid="input-edit-mobile" />
                    <p className="text-xs text-neutral-400">Mobile number cannot be changed</p>
                  </div>
                </div>
                <div className="flex gap-3 mt-5">
                  <button onClick={() => setShowProfileDialog(false)} className="flex-1 py-3 bg-neutral-100 text-neutral-700 font-bold rounded-2xl hover:bg-neutral-200 transition-colors">Cancel</button>
                <button
                  onClick={handleSaveProfile}
                  disabled={isSaving || !editName.trim()}
                  className="flex-1 py-3 text-white font-extrabold rounded-2xl shadow-xl shadow-[#1e3a8a]/25 transition-all disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
                  style={{ background: "linear-gradient(135deg, #1e3a8a 0%, #3b2fad 35%, #6d28d9 70%, #7c3aed 100%)" }}
                  data-testid="button-save-profile"
                >
                  {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save Changes"}
                </button>
                </div>
              </motion.div>
            </motion.div>
          )}

          {showSaveSuccess && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-xs flex items-center justify-center px-6" onClick={() => setShowSaveSuccess(false)}>
              <motion.div initial={{ scale: 0.85, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.85, opacity: 0 }} className="bg-white rounded-3xl p-6 text-center shadow-2xl max-w-sm w-full" onClick={(e) => e.stopPropagation()}>
                <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                  <CheckCircle size={32} className="text-green-600" />
                </div>
                <h3 className="text-lg font-bold text-neutral-900 mb-2">Profile Updated!</h3>
                <p className="text-neutral-500 text-xs mb-2">Your profile has been updated successfully.</p>
              </motion.div>
            </motion.div>
          )}

          {showPolicies && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-xs flex items-center justify-center px-4" onClick={() => setShowPolicies(false)}>
              <motion.div initial={{ scale: 0.85, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.85, opacity: 0 }} className="bg-white rounded-3xl p-6 shadow-2xl max-w-lg w-full max-h-[85vh] overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
                <div className="w-16 h-16 rounded-full bg-indigo-50 flex items-center justify-center mx-auto mb-4">
                  <FileText size={32} className="text-[#241e98]" />
                </div>
                <h3 className="text-lg font-bold text-neutral-900 text-center mb-4">Terms & Conditions</h3>
                <div className="flex-1 overflow-y-auto pr-2 space-y-5 text-sm">
                  <TermsContent />
                </div>
                <button onClick={() => setShowPolicies(false)} className="w-full py-3 bg-[#241e98] hover:bg-[#1c177c] text-white font-extrabold rounded-2xl shadow-xl shadow-[#241e98]/25 transition-colors mt-4" data-testid="button-close-policies">Close</button>
              </motion.div>
            </motion.div>
          )}

          {showHelpSupport && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-xs flex items-center justify-center px-6" onClick={() => setShowHelpSupport(false)}>
              <motion.div initial={{ scale: 0.85, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.85, opacity: 0 }} className="bg-white rounded-3xl p-6 text-center shadow-2xl max-w-sm w-full" onClick={(e) => e.stopPropagation()}>
                <div className="w-16 h-16 rounded-full bg-indigo-50 flex items-center justify-center mx-auto mb-4">
                  <Phone size={32} className="text-[#241e98]" />
                </div>
                <h3 className="text-lg font-bold text-neutral-900 mb-1">Help & Support</h3>
                <p className="text-neutral-500 text-xs mb-5">We're here to help!</p>
                <div className="space-y-2 text-left">
                  <a href={`tel:${supportPhone.replace(/\s/g, '')}`} className="flex items-center gap-3 p-3 bg-green-50 rounded-xl hover:bg-green-100 transition-colors no-underline" data-testid="link-call-support">
                    <div className="w-9 h-9 bg-green-500 rounded-full flex items-center justify-center"><Phone className="w-4 h-4 text-white" /></div>
                    <div className="text-left"><p className="font-semibold text-neutral-900 text-sm">Call Us</p><p className="text-xs text-neutral-600">{supportPhone}</p></div>
                  </a>
                  <a href={`mailto:${supportEmail}`} className="flex items-center gap-3 p-3 bg-indigo-50/70 rounded-xl hover:bg-indigo-100 transition-colors no-underline" data-testid="link-email-support">
                    <div className="w-9 h-9 bg-[#241e98] rounded-full flex items-center justify-center"><Mail className="w-4 h-4 text-white" /></div>
                    <div className="text-left"><p className="font-semibold text-neutral-900 text-sm">Email Us</p><p className="text-xs text-neutral-600">{supportEmail}</p></div>
                  </a>
                </div>
                <button onClick={() => setShowHelpSupport(false)} className="mt-5 w-full py-3 bg-[#241e98] hover:bg-[#1c177c] text-white font-extrabold rounded-2xl shadow-xl shadow-[#241e98]/25 transition-colors" data-testid="button-close-help">Close</button>
              </motion.div>
            </motion.div>
          )}

          {showSubscriptionDetails && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-xs flex items-center justify-center px-6" onClick={() => setShowSubscriptionDetails(false)}>
              <motion.div initial={{ scale: 0.85, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.85, opacity: 0 }} className="bg-white rounded-3xl p-6 shadow-2xl max-w-sm w-full" onClick={(e) => e.stopPropagation()}>
                <div className="w-16 h-16 rounded-full bg-indigo-50 flex items-center justify-center mx-auto mb-4">
                  <CreditCard size={32} className="text-[#241e98]" />
                </div>
                <h3 className="text-lg font-bold text-neutral-900 text-center mb-1">Subscription Details</h3>
                <p className="text-neutral-500 text-xs text-center mb-4">Your membership plan and status</p>

                {/* Subscription details container */}
                <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
                  {/* Current Subscription Section */}
                  {(isPremium || premiumStatus?.isActive) ? (
                    <div className="p-4 bg-green-50/80 border-2 border-green-500 rounded-2xl shadow-sm text-left">
                      <div className="flex items-center justify-between border-b border-green-200 pb-2 mb-2">
                        <span className="text-xs font-bold text-green-800 flex items-center gap-1.5 font-heading">
                          <span className="w-2 h-2 rounded-full bg-green-500 animate-ping"></span>
                          Current Subscription
                        </span>
                        <span className="text-[10px] font-extrabold bg-green-200 text-green-800 px-2.5 py-0.5 rounded-full uppercase tracking-wider font-sans">
                          Active
                        </span>
                      </div>

                      <div className="space-y-2 text-xs text-green-900 font-sans">
                        <div className="flex justify-between">
                          <span className="text-green-700/80 font-medium">Plan Type</span>
                          <span className="font-bold capitalize">{premiumPlan || "Premium"} Plan</span>
                        </div>

                        {(() => {
                          const activePayment = paymentHistory && paymentHistory.length > 0 ? paymentHistory[0] : null;
                          const amountVal = activePayment ? Math.round(activePayment.amount / 100) : (premiumStatus?.amount || (premiumPlan === "basic" ? 199 : premiumPlan === "standard" ? 299 : premiumPlan === "premium" ? 399 : null));
                          return amountVal ? (
                            <div className="flex justify-between font-medium">
                              <span className="text-green-700/80 font-medium">Amount Paid</span>
                              <span className="font-extrabold text-green-950">₹{amountVal}</span>
                            </div>
                          ) : null;
                        })()}

                        {premiumViewsRemaining !== null && (
                          <div className="flex justify-between">
                            <span className="text-green-700/80 font-medium">Views Remaining</span>
                            <span className="font-extrabold">{premiumViewsRemaining} views</span>
                          </div>
                        )}

                        {(premiumActivatedAt || premiumStatus?.activatedAt) && (
                          <div className="flex justify-between">
                            <span className="text-green-700/80 font-medium">Activated At</span>
                            <span>{formatDate(premiumActivatedAt || premiumStatus?.activatedAt || "")}</span>
                          </div>
                        )}

                        {premiumExpiresAt && (
                          <div className="flex justify-between font-bold text-green-950">
                            <span>Expires On</span>
                            <span>{formatDate(premiumExpiresAt)}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="p-4 bg-neutral-50 border border-neutral-200 rounded-2xl text-center space-y-3">
                      <p className="text-xs font-semibold text-neutral-500">No Active Subscription Plan</p>
                      <button
                        onClick={() => { setShowSubscriptionDetails(false); setLocation("/space-seeker/home#subscription"); }}
                        className="w-full py-2.5 bg-[#241e98] hover:bg-[#1c177c] text-white text-xs font-bold rounded-xl shadow-md transition-colors"
                        data-testid="button-subscribe-now-modal"
                      >
                        Subscribe Now
                      </button>
                    </div>
                  )}

                  {/* Previous Subscriptions Section */}
                  <div className="space-y-2 text-left">
                    <h4 className="text-xs font-bold text-neutral-500 font-heading uppercase tracking-wider pl-1 pt-2">
                      Previous Subscriptions
                    </h4>

                    {((isPremium ? paymentHistory.slice(1) : paymentHistory).length > 0) ? (
                      (isPremium ? paymentHistory.slice(1) : paymentHistory).map((pm: any) => {
                        const paidDate = new Date(pm.paidAt);
                        const displayAmount = Math.round(pm.amount / 100);
                        let inferredPlan = "Basic Plan";
                        if (displayAmount === 299 || pm.amount === 29900) inferredPlan = "Standard Plan";
                        if (displayAmount === 399 || pm.amount === 39900) inferredPlan = "Premium Plan";

                        return (
                          <div key={pm.id} className="p-3.5 bg-neutral-100/70 border border-neutral-200/80 rounded-2xl space-y-2 relative overflow-hidden">
                            <div className="flex items-center justify-between border-b border-neutral-200/40 pb-1.5">
                              <span className="text-xs font-bold text-neutral-700 capitalize">{inferredPlan}</span>
                              <span className="text-[9px] font-extrabold bg-neutral-200 text-neutral-600 px-2 py-0.5 rounded-full uppercase tracking-wider">
                                Expired
                              </span>
                            </div>

                            <div className="space-y-1 text-xs text-neutral-600 font-sans">
                              <div className="flex justify-between font-medium">
                                <span>Amount Paid</span>
                                <span className="text-neutral-700 font-semibold">₹{displayAmount}</span>
                              </div>
                              <div className="flex justify-between text-[10px]">
                                <span>Payment Date</span>
                                <span>
                                  {paidDate.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })} at {paidDate.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                                </span>
                              </div>
                              <div className="flex justify-between text-[10px]">
                                <span>Reference ID</span>
                                <span className="font-mono text-neutral-500 truncate max-w-[140px]">{pm.reference}</span>
                              </div>
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="p-4 border border-dashed border-neutral-200 rounded-2xl text-center text-xs text-neutral-400 italic">
                        No expired subscriptions found.
                      </div>
                    )}
                  </div>
                </div>

                <button onClick={() => setShowSubscriptionDetails(false)} className="mt-5 w-full py-3 bg-neutral-100 text-neutral-700 font-bold rounded-2xl hover:bg-neutral-200 transition-colors" data-testid="button-close-subscription">Close</button>
              </motion.div>
            </motion.div>
          )}

          {showLogoutConfirm && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-xs flex items-center justify-center px-6" onClick={() => setShowLogoutConfirm(false)}>
              <motion.div initial={{ scale: 0.85, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.85, opacity: 0 }} className="bg-white rounded-3xl p-6 text-center shadow-2xl max-w-sm w-full" onClick={(e) => e.stopPropagation()}>
                <div className="w-16 h-16 rounded-full bg-orange-100 flex items-center justify-center mx-auto mb-4">
                  <LogOut size={32} className="text-orange-500" />
                </div>
                <h3 className="text-lg font-bold text-neutral-900 mb-2">Logout?</h3>
                <p className="text-neutral-500 text-xs mb-5">Are you sure you want to logout from your account?</p>
                <div className="flex gap-3">
                  <button onClick={() => setShowLogoutConfirm(false)} className="flex-1 py-3 bg-neutral-100 text-neutral-700 font-bold rounded-2xl hover:bg-neutral-200 transition-colors" data-testid="button-cancel-logout">Cancel</button>
                  <button onClick={handleLogoutConfirm} className="flex-1 py-3 bg-red-600 text-white font-bold rounded-2xl hover:bg-red-700 transition-colors flex items-center justify-center gap-2" data-testid="button-confirm-logout"><LogOut size={16} /> Logout</button>
                </div>
              </motion.div>
            </motion.div>
          )}

          {showDeleteConfirm && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-xs flex items-center justify-center px-6" onClick={() => setShowDeleteConfirm(false)}>
              <motion.div initial={{ scale: 0.85, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.85, opacity: 0 }} className="bg-white rounded-3xl p-6 text-center shadow-2xl max-w-sm w-full" onClick={(e) => e.stopPropagation()}>
                <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
                  <Trash2 size={32} className="text-red-500" />
                </div>
                <h3 className="text-lg font-bold text-neutral-900 mb-2">Delete Account?</h3>
                <p className="text-neutral-500 text-xs mb-5">This action cannot be undone. All your data, bookings, and history will be permanently deleted.</p>
                <div className="flex gap-3">
                  <button onClick={() => setShowDeleteConfirm(false)} className="flex-1 py-3 bg-neutral-100 text-neutral-700 font-bold rounded-2xl hover:bg-neutral-200 transition-colors" data-testid="button-cancel-delete">Cancel</button>
                  <button onClick={() => { setShowDeleteConfirm(false); setShowSecondDeleteConfirm(true); }} className="flex-1 py-3 bg-red-600 text-white font-bold rounded-2xl hover:bg-red-700 transition-colors flex items-center justify-center gap-2" data-testid="button-confirm-delete">
                    <Trash2 size={16} /> Delete
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}

          {showSecondDeleteConfirm && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-xs flex items-center justify-center px-6" onClick={() => !isDeleting && setShowSecondDeleteConfirm(false)}>
              <motion.div initial={{ scale: 0.85, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.85, opacity: 0 }} className="bg-white rounded-3xl p-6 text-center shadow-2xl max-w-sm w-full" onClick={(e) => e.stopPropagation()}>
                <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4 ring-8 ring-red-50">
                  <AlertTriangle size={32} className="text-red-600" />
                </div>
                <h3 className="text-lg font-bold text-neutral-900 mb-2">Are you sure?</h3>
                <p className="text-neutral-600 text-xs mb-5 font-medium leading-relaxed">
                  Are you really sure you want to delete your account? You will permanently lose all profile data and history.
                </p>
                <div className="flex flex-col gap-2.5">
                  <button onClick={handleDeleteAccount} disabled={isDeleting} className="w-full py-3 bg-red-600 text-white font-bold text-sm rounded-2xl hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-red-600/20" data-testid="button-confirm-final-delete">
                    {isDeleting ? <Loader2 size={16} className="animate-spin" /> : <><Trash2 size={16} /> Yes, Delete My Account</>}
                  </button>
                  <button onClick={() => setShowSecondDeleteConfirm(false)} className="w-full py-3 bg-neutral-100 text-neutral-700 font-bold text-sm rounded-2xl hover:bg-neutral-200 transition-colors" disabled={isDeleting}>
                    Cancel
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}

          {/* Share App Bottom Sheet Modal */}
          {showShareModal && (
            <div className="fixed inset-0 z-[9999] flex items-end justify-center">
              {/* Backdrop */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.6 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-neutral-950 cursor-pointer"
                onClick={() => setShowShareModal(false)}
              />
              {/* Bottom Sheet Drawer */}
              <motion.div
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                exit={{ y: "100%" }}
                transition={{ type: "spring", damping: 25, stiffness: 200 }}
                className="relative w-full max-w-[430px] bg-white rounded-t-[2.5rem] p-6 pb-10 shadow-2xl border-t border-neutral-100 flex flex-col items-center z-10"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Drag handle decoration */}
                <div className="w-12 h-1.5 bg-neutral-200 rounded-full mb-6" />

                <h3 className="text-lg font-bold text-neutral-900 mb-2">Share Spotly App</h3>
                <p className="text-xs text-neutral-500 mb-6 text-center max-w-[280px]">
                  Invite your friends and family to find and list parking spaces easily!
                </p>

                {/* App URL display box */}
                <div className="w-full bg-neutral-50 border border-neutral-200 rounded-2xl p-3.5 flex items-center justify-between gap-3 mb-6">
                  <span className="text-xs text-neutral-600 truncate flex-1 font-mono">https://spotlyindia.org/</span>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText("https://spotlyindia.org/");
                      setCopiedLink(true);
                      setTimeout(() => setCopiedLink(false), 2000);
                    }}
                    className="shrink-0 text-xs font-bold px-4 py-2 rounded-xl text-white shadow-md active:scale-95 transition-all cursor-pointer"
                    style={{
                      background: copiedLink ? "#10b981" : "linear-gradient(135deg, #1e3a8a 0%, #3b2fad 35%, #6d28d9 70%, #7c3aed 100%)",
                    }}
                  >
                    {copiedLink ? "Copied!" : "Copy"}
                  </button>
                </div>

                {/* Share Options Grid */}
                <div className="grid grid-cols-4 gap-4 w-full mb-6">
                  <button
                    onClick={() => {
                      const shareText = "Find parking spaces easily with Spotly app. Download now! https://spotlyindia.org/";
                      window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(shareText)}`, '_blank');
                    }}
                    className="flex flex-col items-center gap-2 cursor-pointer"
                  >
                    <div className="w-12 h-12 bg-green-100 text-green-600 rounded-2xl flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-sm">
                      <svg viewBox="0 0 24 24" className="w-6 h-6 fill-current">
                        <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.513 2.262 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.5-5.739-1.446L0 24zm6.59-4.846c1.6.95 3.188 1.449 4.825 1.451 5.436 0 9.86-4.37 9.864-9.799.002-2.623-1.023-5.09-2.885-6.956C16.59 1.984 14.12 1.96 12.01 1.96c-5.44 0-9.866 4.372-9.87 9.802 0 1.714.463 3.39 1.337 4.888L2.5 21.562l4.147-1.408zm11.233-5.462c-.3-.149-1.772-.874-2.046-.974-.276-.101-.476-.149-.676.149-.2.3-.778 1.001-.95 1.201-.176.199-.35.224-.65.074-1.059-.519-1.797-1.026-2.502-2.228-.19-.317-.19-.513.003-.708.173-.176.3-.35.45-.526.15-.175.2-.299.3-.5.1-.2.05-.375-.025-.525-.075-.15-.676-1.628-.925-2.228-.243-.584-.489-.505-.676-.514-.175-.009-.375-.01-.575-.01-.2 0-.525.075-.8.375-.275.3-1.05 1.026-1.05 2.5 0 1.475 1.075 2.899 1.225 3.1 1.082 1.42 2.158 2.378 3.593 2.923.856.326 1.528.349 2.063.268.597-.09 1.772-.724 2.022-1.424.25-.7.25-1.3 1.75-1.424z" />
                      </svg>
                    </div>
                    <span className="text-[10px] font-semibold text-neutral-600">WhatsApp</span>
                  </button>
                  <button
                    onClick={() => {
                      const shareText = "Find parking spaces easily with Spotly app. Download now! https://spotlyindia.org/";
                      window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}`, '_blank');
                    }}
                    className="flex flex-col items-center gap-2 cursor-pointer"
                  >
                    <div className="w-12 h-12 bg-neutral-100 text-neutral-800 rounded-2xl flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-sm">
                      <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current">
                        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                      </svg>
                    </div>
                    <span className="text-[10px] font-semibold text-neutral-600">Twitter / X</span>
                  </button>
                  <button
                    onClick={() => {
                      const shareText = "Find parking spaces easily with Spotly app. Download now! https://spotlyindia.org/";
                      window.open(`mailto:?subject=${encodeURIComponent("Spotly - Car & Bike Parking")}&body=${encodeURIComponent(shareText)}`);
                    }}
                    className="flex flex-col items-center gap-2 cursor-pointer"
                  >
                    <div className="w-12 h-12 bg-indigo-100 text-[#241e98] rounded-2xl flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-sm">
                      <Mail size={20} />
                    </div>
                    <span className="text-[10px] font-semibold text-neutral-600">Email</span>
                  </button>
                  {navigator.share && (
                    <button
                      onClick={async () => {
                        try {
                          await navigator.share({
                            title: 'Spotly - Car & Bike Parking',
                            text: 'Find parking spaces easily with Spotly app. Download now!',
                            url: 'https://spotlyindia.org/'
                          });
                        } catch { }
                      }}
                      className="flex flex-col items-center gap-2 cursor-pointer"
                    >
                      <div className="w-12 h-12 bg-indigo-100 text-[#241e98] rounded-2xl flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-sm">
                        <Share2 size={20} />
                      </div>
                      <span className="text-[10px] font-semibold text-neutral-600">More</span>
                    </button>
                  )}
                </div>

                <button
                  onClick={() => setShowShareModal(false)}
                  className="w-full py-3.5 bg-neutral-100 text-neutral-700 font-bold rounded-2xl hover:bg-neutral-200 transition-colors"
                >
                  Cancel
                </button>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </MobileLayout>
  );
}

