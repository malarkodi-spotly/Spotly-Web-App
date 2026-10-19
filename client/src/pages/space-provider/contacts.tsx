import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import MobileLayout from "@/components/layout/mobile-layout";
import { User, FileText, HelpCircle, LogOut, ChevronRight, Loader2, CheckCircle, Phone, Mail, Trash2, Share2, AlertTriangle } from "lucide-react";
import { getApiUrl } from "@/lib/api-config";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { motion, AnimatePresence } from "framer-motion";
import TermsContent from "@/components/terms-content";

interface UserProfile {
  id: string;
  name: string;
  mobile: string;
  email: string | null;
  role: string;
}

import { isGuest } from "@/lib/guest";
import { useRegisterModalBack } from "@/contexts/mobile-back-context";

export default function CustomerContacts() {
  const [, setLocation] = useLocation();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showSecondDeleteConfirm, setShowSecondDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showProfileDialog, setShowProfileDialog] = useState(false);
  const [showSaveSuccess, setShowSaveSuccess] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [appVersion, setAppVersion] = useState("1.0.0");
  const [supportPhone, setSupportPhone] = useState("+91 97425 45584");
  const [supportEmail, setSupportEmail] = useState("info@spotlyindia.org");
  const [showPolicies, setShowPolicies] = useState(false);
  const [showHelpSupport, setShowHelpSupport] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // Register modals with Android Back Button handler
  useRegisterModalBack(showLogoutConfirm, () => setShowLogoutConfirm(false), "sp-contacts-logout");
  useRegisterModalBack(showDeleteConfirm, () => setShowDeleteConfirm(false), "sp-contacts-delete");
  useRegisterModalBack(showSecondDeleteConfirm, () => setShowSecondDeleteConfirm(false), "sp-contacts-second-delete");
  useRegisterModalBack(showProfileDialog, () => setShowProfileDialog(false), "sp-contacts-profile");
  useRegisterModalBack(showShareModal, () => setShowShareModal(false), "sp-contacts-share");
  useRegisterModalBack(showPolicies, () => setShowPolicies(false), "sp-contacts-policies");
  useRegisterModalBack(showHelpSupport, () => setShowHelpSupport(false), "sp-contacts-support");

  useEffect(() => {
    if (isGuest() || !localStorage.getItem("userId") || localStorage.getItem("exploreMode") === "true") {
      setLocation("/auth?role=space-provider");
      return;
    }
    const fetchUserProfile = async () => {
      const userId = localStorage.getItem("userId");
      if (userId) {
        try {
          const response = await fetch(getApiUrl(`/api/users/${userId}`));
          if (response.ok) {
            const data = await response.json();
            if (data.role && data.role !== "customer") {
              localStorage.removeItem("userId");
              localStorage.removeItem("userName");
              localStorage.removeItem("userMobile");
              localStorage.removeItem("sessionToken");
              localStorage.setItem("userRole", "customer");
              setLocation("/auth?role=space-provider");
              return;
            }
            setUserProfile(data);
          }
        } catch (error) {
          console.error("Failed to fetch user profile:", error);
        }
      }
      setIsLoading(false);
    };
    
    const fetchSettings = async () => {
      try {
        const [versionRes, phoneRes, emailRes] = await Promise.all([
          fetch(getApiUrl("/api/settings/app_version")),
          fetch(getApiUrl("/api/settings/support_phone")),
          fetch(getApiUrl("/api/settings/support_email"))
        ]);
        if (versionRes.ok) {
          const data = await versionRes.json();
          if (data.setting?.value) setAppVersion(data.setting.value);
        }
        if (phoneRes.ok) {
          const data = await phoneRes.json();
          if (data.setting?.value) setSupportPhone(data.setting.value);
        }
        if (emailRes.ok) {
          const data = await emailRes.json();
          if (data.setting?.value) setSupportEmail(data.setting.value);
        }
      } catch (error) {
        console.error("Failed to fetch settings:", error);
      }
    };
    
    fetchUserProfile();
    fetchSettings();
  }, []);

  const handleLogoutConfirm = () => {
    localStorage.removeItem("userId");
    localStorage.removeItem("userName");
    localStorage.removeItem("userMobile");
    localStorage.removeItem("sessionToken");
    localStorage.removeItem("workerAge");
    localStorage.removeItem("workerGender");
    localStorage.removeItem("workerServices");
    localStorage.removeItem("workerConditions");
    localStorage.removeItem("isNewRegistration");
    localStorage.removeItem("disclaimerAccepted");
    localStorage.setItem("userRole", "customer");
    setShowLogoutConfirm(false);
    setLocation("/auth?role=space-provider");
  };

  const handleDeleteAccount = async () => {
    const userId = localStorage.getItem("userId");
    const sessionToken = localStorage.getItem("sessionToken");
    if (!userId) return;
    
    if (!sessionToken) {
      alert("Session expired. Please log in again to delete your account.");
      localStorage.clear();
      setLocation("/auth");
      return;
    }
    
    setIsDeleting(true);
    try {
      const response = await fetch(getApiUrl(`/api/users/${userId}`), {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${sessionToken}` }
      });
      
      if (response.ok) {
        localStorage.clear();
        setShowDeleteConfirm(false);
        setShowSecondDeleteConfirm(false);
        setLocation("/auth");
      } else if (response.status === 401) {
        alert("Session expired. Please log in again to delete your account.");
        localStorage.clear();
        setLocation("/auth");
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
    setEditName(userProfile?.name || "");
    setEditEmail(userProfile?.email || "");
    setShowProfileDialog(true);
  };

  const handleSaveProfile = async () => {
    if (!userProfile?.id) return;
    
    setIsSaving(true);
    try {
      const response = await fetch(getApiUrl(`/api/users/${userProfile.id}`), {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: editName, email: editEmail || "" })
      });
      
      if (response.ok) {
        const data = await response.json();
        setUserProfile(data.user);
        localStorage.setItem("userName", editName);
        setShowProfileDialog(false);
        setShowSaveSuccess(true);
        setTimeout(() => setShowSaveSuccess(false), 2000);
      }
    } catch (error) {
      console.error("Failed to save profile:", error);
    }
    setIsSaving(false);
  };

  const menuItems = [
    { icon: User, label: "Edit Profile", action: handleOpenProfile },
    { icon: Share2, label: "Share App", action: handleShareApp },
    { icon: FileText, label: "Terms & Conditions", action: () => setShowPolicies(true) },
    { icon: HelpCircle, label: "Help & Support", action: () => setShowHelpSupport(true) },
    { icon: LogOut, label: "Logout", action: () => setShowLogoutConfirm(true), danger: true },
    { icon: Trash2, label: "Delete Account", action: () => setShowDeleteConfirm(true), danger: true },
  ];

  return (
    <MobileLayout showNav userType="customer">
      <div className="pb-8">
        <div className="sticky top-0 z-30 bg-[#f8fafc] pb-2">
          <div
            className="px-6 pt-[calc(1.5rem+env(safe-area-inset-top,0px))] pb-8 relative overflow-hidden"
            style={{ background: "linear-gradient(135deg, #1e3a8a 0%, #3b2fad 35%, #6d28d9 70%, #7c3aed 100%)" }}
          >
            <div className="absolute inset-0">
              <div className="absolute top-1 right-3 w-16 h-16 rounded-full bg-white/10 blur-sm" />
              <div className="absolute -bottom-2 -left-2 w-18 h-18 rounded-full bg-pink-400/15 blur-md" />
              <div className="absolute top-3 left-1/3 w-8 h-8 rounded-full bg-yellow-300/10" />
              <div className="absolute bottom-3 right-1/4 w-6 h-6 rounded-full bg-cyan-300/10" />
            </div>
            <div className="absolute bottom-0 left-0 right-0 h-6 bg-gradient-to-t from-black/10 to-transparent" />
            <h2 className="text-xl font-bold font-heading text-white relative z-10 drop-shadow-md">My Profile</h2>
            <p className="text-white/80 text-sm relative z-10 mt-1">Space Provider</p>
          </div>

          <div className="px-6 -mt-4 relative z-10">
            <div className="flex items-center gap-3 p-3 bg-white rounded-2xl border border-blue-100" style={{ boxShadow: "0 3px 14px rgba(36,30,152,0.10), 0 1px 3px rgba(0,0,0,0.05)" }}>
              {isLoading ? (
                <div className="flex items-center gap-3 w-full">
                  <div className="bg-blue-100 rounded-full animate-pulse w-12 h-12 shrink-0" />
                  <div className="flex-1">
                    <div className="h-4 bg-blue-100 rounded w-28 mb-1.5 animate-pulse" />
                    <div className="h-3 bg-blue-100 rounded w-24 animate-pulse" />
                  </div>
                </div>
              ) : (
                <>
                  <div className="relative shrink-0">
                    <div className="w-12 h-12 bg-gradient-to-br from-[#241e98] via-[#2b24b1] to-[#3e3ab3] rounded-full flex items-center justify-center text-white font-bold text-lg shadow-md shadow-[#241e98]/30 ring-2 ring-white">
                      {userProfile?.name?.charAt(0)?.toUpperCase() || "U"}
                    </div>
                    <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-green-400 rounded-full border-2 border-white flex items-center justify-center">
                      <CheckCircle size={10} className="text-white" />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-base text-neutral-900 truncate" data-testid="text-user-name">
                      {userProfile?.name || "User"}
                    </h3>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <Phone size={13} className="text-[#1d4ed8] shrink-0" />
                      <p className="text-neutral-600 text-xs font-medium" data-testid="text-user-mobile">
                        +91 {userProfile?.mobile || ""}
                      </p>
                    </div>
                    {userProfile?.email && (
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <Mail size={13} className="text-[#1d4ed8] shrink-0" />
                        <p className="text-neutral-500 text-xs truncate" data-testid="text-user-email">{userProfile.email}</p>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="px-6 pt-2 pb-5 space-y-4">
          <div className="bg-white rounded-3xl border border-neutral-100 overflow-hidden">
            {menuItems.map((item, index) => (
              <button
                key={index}
                onClick={item.action}
                className={`w-full flex items-center justify-between p-4 hover:bg-neutral-50 transition-colors ${
                  index !== menuItems.length - 1 ? "border-b border-neutral-100" : ""
                }`}
                data-testid={`button-menu-${item.label.toLowerCase().replace(/\s+/g, '-')}`}
              >
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    item.danger ? "bg-red-50 text-red-500" : "bg-neutral-100 text-neutral-600"
                  }`}>
                    <item.icon size={18} />
                  </div>
                  <span className={`font-medium ${item.danger ? "text-red-500" : "text-neutral-900"}`}>
                    {item.label}
                  </span>
                </div>
                <ChevronRight size={16} className="text-neutral-300" />
              </button>
            ))}
          </div>
          
          <div className="text-center">
            <p className="text-xs text-neutral-400">Version {appVersion}</p>
          </div>
        </div>

        <AnimatePresence>
        {showProfileDialog && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center px-6" onClick={() => setShowProfileDialog(false)}>
            <motion.div initial={{ scale: 0.85, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.85, opacity: 0 }} className="bg-white rounded-3xl p-6 shadow-2xl max-w-sm w-full" onClick={(e) => e.stopPropagation()}>
              <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-4">
                <User size={32} className="text-primary" />
              </div>
              <h3 className="text-lg font-bold text-neutral-900 text-center mb-1">Edit Profile</h3>
              <p className="text-neutral-500 text-xs text-center mb-5">Update your personal information</p>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-name">Full Name</Label>
                  <Input id="edit-name" value={editName} onChange={(e) => { const val = e.target.value.replace(/[^a-zA-Z\s]/g, "").slice(0, 10).replace(/\b\w/g, c => c.toUpperCase()); setEditName(val); }} maxLength={10} placeholder="Enter your name" className="h-12 rounded-xl" data-testid="input-edit-name" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-email">Email</Label>
                  <Input id="edit-email" type="email" value={editEmail} onChange={(e) => setEditEmail(e.target.value)} placeholder="Enter your email" className="h-12 rounded-xl" data-testid="input-edit-email" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-mobile">Mobile Number</Label>
                  <Input id="edit-mobile" value={userProfile?.mobile ? `+91 ${userProfile.mobile}` : ""} disabled className="h-12 rounded-xl bg-neutral-100 text-neutral-500 cursor-not-allowed" data-testid="input-edit-mobile" />
                  <p className="text-xs text-neutral-400">Mobile number cannot be changed</p>
                </div>
              </div>
              <div className="flex gap-3 mt-5">
                <button onClick={() => setShowProfileDialog(false)} className="flex-1 py-3 bg-neutral-100 text-neutral-700 font-bold rounded-2xl hover:bg-neutral-200 transition-colors">Cancel</button>
                <button onClick={handleSaveProfile} disabled={isSaving || !editName.trim()} className="flex-1 py-3 bg-gradient-to-r from-[#0d3da8] to-[#1d4ed8] text-white font-bold rounded-2xl hover:from-[#092c7d] hover:to-[#1a56db] shadow-xl shadow-[#0d3da8]/25 transition-colors disabled:opacity-50 flex items-center justify-center gap-2" data-testid="button-save-profile">
                  {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save Changes"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}

        {showSaveSuccess && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center px-6" onClick={() => setShowSaveSuccess(false)}>
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
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center px-4" onClick={() => setShowPolicies(false)}>
            <motion.div initial={{ scale: 0.85, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.85, opacity: 0 }} className="bg-white rounded-3xl p-6 shadow-2xl max-w-lg w-full max-h-[85vh] overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
              <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-4">
                <FileText size={32} className="text-primary" />
              </div>
              <h3 className="text-lg font-bold text-neutral-900 text-center mb-4">Terms & Conditions</h3>
              <div className="flex-1 overflow-y-auto pr-2 space-y-5 text-sm">
                <TermsContent />
              </div>
              <button onClick={() => setShowPolicies(false)} className="w-full py-3 bg-gradient-to-r from-[#0d3da8] to-[#1d4ed8] text-white font-bold rounded-2xl hover:from-[#092c7d] hover:to-[#1a56db] shadow-xl shadow-[#0d3da8]/25 transition-colors mt-4">Close</button>
            </motion.div>
          </motion.div>
        )}

        {showHelpSupport && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center px-6" onClick={() => setShowHelpSupport(false)}>
            <motion.div initial={{ scale: 0.85, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.85, opacity: 0 }} className="bg-white rounded-3xl p-6 text-center shadow-2xl max-w-sm w-full" onClick={(e) => e.stopPropagation()}>
              <div className="w-16 h-16 rounded-full bg-indigo-50 flex items-center justify-center mx-auto mb-4 text-[#241e98]">
                <Phone size={32} />
              </div>
              <h3 className="text-lg font-bold text-neutral-900 mb-1">Help & Support</h3>
              <p className="text-neutral-500 text-xs mb-5">We're here to help!</p>
              <div className="space-y-2 text-left">
                <a href={`tel:${supportPhone.replace(/\s/g, '')}`} className="flex items-center gap-3 p-3 bg-emerald-50 rounded-2xl hover:bg-emerald-100/70 border border-emerald-100 transition-colors no-underline" data-testid="link-call-support">
                  <div className="w-9 h-9 bg-emerald-500 rounded-full flex items-center justify-center"><Phone className="w-4 h-4 text-white" /></div>
                  <div className="text-left"><p className="font-semibold text-neutral-900 text-sm">Call Us</p><p className="text-xs text-neutral-600">{supportPhone}</p></div>
                </a>
                <a href={`mailto:${supportEmail}`} className="flex items-center gap-3 p-3 bg-indigo-50/70 rounded-2xl hover:bg-indigo-100/70 border border-indigo-100 transition-colors no-underline" data-testid="link-email-support">
                  <div className="w-9 h-9 bg-gradient-to-br from-[#1b1675] via-[#241e98] to-[#3e3ab3] rounded-full flex items-center justify-center"><Mail className="w-4 h-4 text-white" /></div>
                  <div className="text-left"><p className="font-semibold text-neutral-900 text-sm">Email Us</p><p className="text-xs text-neutral-600">{supportEmail}</p></div>
                </a>
              </div>
              <button onClick={() => setShowHelpSupport(false)} className="mt-5 w-full py-3.5 bg-gradient-to-r from-[#1b1675] via-[#241e98] to-[#3e3ab3] hover:from-[#15115c] hover:to-[#1b1675] text-white font-extrabold text-sm rounded-2xl shadow-xl shadow-[#241e98]/30 active:scale-95 transition-all cursor-pointer" data-testid="button-close-help">Close</button>
            </motion.div>
          </motion.div>
        )}

        {showLogoutConfirm && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center px-6" onClick={() => setShowLogoutConfirm(false)}>
            <motion.div initial={{ scale: 0.85, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.85, opacity: 0 }} className="bg-white rounded-3xl p-6 text-center shadow-2xl max-w-sm w-full" onClick={(e) => e.stopPropagation()}>
              <div className="w-16 h-16 rounded-full bg-orange-100 flex items-center justify-center mx-auto mb-4">
                <LogOut size={32} className="text-orange-500" />
              </div>
              <h3 className="text-lg font-bold text-neutral-900 mb-2">Logout?</h3>
              <p className="text-neutral-500 text-xs mb-5">Are you sure you want to logout?</p>
              <div className="flex gap-3">
                <button onClick={() => setShowLogoutConfirm(false)} className="flex-1 py-3 bg-neutral-100 text-neutral-700 font-bold rounded-2xl hover:bg-neutral-200 transition-colors">Cancel</button>
                <button onClick={handleLogoutConfirm} className="flex-1 py-3 bg-red-600 text-white font-bold rounded-2xl hover:bg-red-700 transition-colors flex items-center justify-center gap-2"><LogOut size={16} /> Logout</button>
              </div>
            </motion.div>
          </motion.div>
        )}

        {showDeleteConfirm && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center px-6" onClick={() => setShowDeleteConfirm(false)}>
            <motion.div initial={{ scale: 0.85, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.85, opacity: 0 }} className="bg-white rounded-3xl p-6 text-center shadow-2xl max-w-sm w-full" onClick={(e) => e.stopPropagation()}>
              <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
                <Trash2 size={32} className="text-red-500" />
              </div>
              <h3 className="text-lg font-bold text-neutral-900 mb-2">Delete Account?</h3>
              <p className="text-neutral-500 text-xs mb-5">This action cannot be undone. All your data will be permanently deleted.</p>
              <div className="flex gap-3">
                <button onClick={() => setShowDeleteConfirm(false)} className="flex-1 py-3 bg-neutral-100 text-neutral-700 font-bold rounded-2xl hover:bg-neutral-200 transition-colors">Cancel</button>
                <button onClick={() => { setShowDeleteConfirm(false); setShowSecondDeleteConfirm(true); }} className="flex-1 py-3 bg-red-600 text-white font-bold rounded-2xl hover:bg-red-700 transition-colors flex items-center justify-center gap-2">
                  <Trash2 size={16} /> Delete
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}

        {showSecondDeleteConfirm && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center px-6" onClick={() => !isDeleting && setShowSecondDeleteConfirm(false)}>
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
          <div className="fixed inset-0 z-50 flex items-end justify-center">
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
                Your empty space could become an earning opportunity!
              </p>

              {/* App URL display box */}
              <div className="w-full bg-neutral-50 border border-neutral-200 rounded-2xl p-3.5 flex items-center justify-between gap-3 mb-6">
                <span className="text-xs text-neutral-600 truncate flex-1 font-mono">https://spotlyindia.org/</span>
                <button
                  onClick={() => {
                    const shareText = "Your empty space could become an earning opportunity!\n🌐 Get started: https://spotlyindia.org/\nSpotly — Your Space, Your Opportunity!";
                    navigator.clipboard.writeText(shareText);
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
                    const shareText = "Your empty space could become an earning opportunity!\n🌐 Get started: https://spotlyindia.org/\nSpotly — Your Space, Your Opportunity!";
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
                    const shareText = "Your empty space could become an earning opportunity!\n🌐 Get started: https://spotlyindia.org/\nSpotly — Your Space, Your Opportunity!";
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
                    const shareText = "Your empty space could become an earning opportunity!\n🌐 Get started: https://spotlyindia.org/\nSpotly — Your Space, Your Opportunity!";
                    window.open(`mailto:?subject=${encodeURIComponent("Spotly — Your Space, Your Opportunity!")}&body=${encodeURIComponent(shareText)}`);
                  }}
                  className="flex flex-col items-center gap-2 cursor-pointer"
                >
                  <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-sm">
                    <Mail size={20} />
                  </div>
                  <span className="text-[10px] font-semibold text-neutral-600">Email</span>
                </button>
                {navigator.share && (
                  <button
                    onClick={async () => {
                      try {
                        const shareText = "Your empty space could become an earning opportunity!\n🌐 Get started: https://spotlyindia.org/\nSpotly — Your Space, Your Opportunity!";
                        await navigator.share({
                          title: 'Spotly — Your Space, Your Opportunity!',
                          text: shareText,
                        });
                      } catch {}
                    }}
                    className="flex flex-col items-center gap-2 cursor-pointer"
                  >
                    <div className="w-12 h-12 bg-blue-100 text-[#1e3a8a] rounded-2xl flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-sm">
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
