import { useLocation } from "wouter";
import { startTransition, useCallback, useState, useRef, useEffect } from "react";
import {
  MapPin,
  Bell,
  ParkingCircle,
  Heart,
  User,
  ChevronDown,
  LayoutDashboard,
  Calendar,
  IndianRupee,
  LogOut,
  LogIn,
  Car,
  ArrowRight,
  X,
} from "lucide-react";
import { isGuest } from "@/lib/guest";
import { capitalizeName } from "@/lib/utils";
import { useAuthGuard } from "@/contexts/auth-guard";

// Preload functions for lazy-loaded route chunks
const preloadSeekerHome = () => import("@/pages/space-seeker/home");
const preloadSeekerAccount = () => import("@/pages/space-seeker/account");
const preloadProviderHome = () => import("@/pages/space-provider/home");
const preloadProviderAccount = () => import("@/pages/space-provider/account");

interface DesktopHeaderProps {
  userRole?: "seeker" | "provider";
  activeTab?: string;
  userName?: string;
  onNotificationsOpen?: () => void;
  unreadCount?: number;
  onShowCitySelector?: () => void;
  onTabChange?: (tab: string) => void;
  locationLabel?: string;
}

export default function DesktopHeader({
  userRole = "seeker",
  activeTab = "spaces",
  userName = "",
  onNotificationsOpen,
  unreadCount = 0,
  onShowCitySelector,
  onTabChange,
  locationLabel,
}: DesktopHeaderProps) {
  const [, setLocation] = useLocation();
  const { requireLogin } = useAuthGuard();
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [showCityDropdown, setShowCityDropdown] = useState(false);
  const [showSwitchRoleConfirm, setShowSwitchRoleConfirm] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const cityDropdownRef = useRef<HTMLDivElement>(null);
  const userCity = localStorage.getItem("userDetectedCity") || localStorage.getItem("selectedServiceAreaName") || "Bengaluru";
  const displayLocation = locationLabel || userCity;
  const isGuestUser = isGuest();

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowUserDropdown(false);
      }
      if (cityDropdownRef.current && !cityDropdownRef.current.contains(e.target as Node)) {
        setShowCityDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Non-blocking navigation using startTransition
  const navigateTo = useCallback((path: string) => {
    startTransition(() => {
      setLocation(path);
    });
  }, [setLocation]);

  const handleTabClick = (tabKey: string, path: string) => {
    if (onTabChange) {
      onTabChange(tabKey);
      if (typeof window !== "undefined" && window.location.pathname === path) {
        return;
      }
    }
    const finalPath = tabKey === "dashboard" || tabKey === "spaces" || tabKey === "my-spaces" ? path : `${path}?tab=${tabKey}`;
    navigateTo(finalPath);
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("userId");
    localStorage.removeItem("isLoggedIn");
    localStorage.removeItem("userMobile");
    localStorage.removeItem("userName");
    localStorage.removeItem("sessionToken");
    localStorage.removeItem("workerAge");
    localStorage.removeItem("workerGender");
    localStorage.removeItem("workerServices");
    localStorage.removeItem("workerConditions");
    localStorage.removeItem("isNewRegistration");
    localStorage.removeItem("disclaimerAccepted");
    localStorage.removeItem("exploreMode");
    localStorage.removeItem("isGuest");
    localStorage.removeItem("customerPremiumStatus");
    setLocation("/");
  };

  return (
    <header
      className="fixed top-0 left-0 right-0 z-[100] h-14 shadow-md"
      style={{ background: "linear-gradient(135deg, #1e3a8a 0%, #3b2fad 35%, #6d28d9 70%, #7c3aed 100%)" }}
    >
      <div className="h-full max-w-[1920px] mx-auto px-5 flex items-center justify-between">
        {/* Left: Logo + Nav Tabs */}
        <div className="flex items-center gap-6">
          {/* Logo */}
          <a
            href="/"
            onClick={(e) => { e.preventDefault(); navigateTo("/"); }}
            className="flex items-center gap-2 cursor-pointer shrink-0"
          >
            <img src="/images/spotly-logo-white.png" alt="Spotly" className="h-9 w-auto object-contain drop-shadow-sm" />
          </a>

          {/* Navigation Tabs */}
          <nav className="flex items-center gap-1.5 ml-2">
            {userRole === "provider" ? (
              <>
                <button
                  type="button"
                  onClick={() => {
                    if (isGuestUser) {
                      if (!requireLogin("view your listed spaces")) return;
                    }
                    handleTabClick("my-spaces", "/space-provider/home");
                  }}
                  onMouseEnter={preloadProviderHome}
                  className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-[12px] font-bold transition-all cursor-pointer ${
                    activeTab === "my-spaces" || activeTab === "dashboard"
                      ? "bg-white text-[#241e98] shadow-sm"
                      : "text-white/80 hover:bg-white/10 hover:text-white"
                  }`}
                  data-testid="header-tab-myspaces"
                >
                  <MapPin size={13} />
                  My Spaces
                </button>
                <button
                  type="button"
                  onClick={() => navigateTo("/space-provider/account")}
                  onMouseEnter={preloadProviderAccount}
                  className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-[12px] font-bold transition-all cursor-pointer ${
                    activeTab === "profile"
                      ? "bg-white text-[#241e98] shadow-sm"
                      : "text-white/80 hover:bg-white/10 hover:text-white"
                  }`}
                  data-testid="header-tab-profile"
                >
                  <User size={13} />
                  Profile
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => {
                    onTabChange?.("spaces");
                    navigateTo("/space-seeker/home");
                  }}
                  onMouseEnter={preloadSeekerHome}
                  className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-[12px] font-bold transition-all cursor-pointer ${
                    activeTab === "spaces"
                      ? "bg-white text-[#241e98] shadow-sm"
                      : "text-white/80 hover:bg-white/10 hover:text-white"
                  }`}
                  data-testid="header-tab-spaces"
                >
                  <ParkingCircle size={13} />
                  Spaces
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (isGuestUser) {
                      if (!requireLogin("view your saved spaces")) return;
                    }
                    onTabChange?.("saved");
                    navigateTo("/space-seeker/home?filter=favourites");
                  }}
                  onMouseEnter={preloadSeekerHome}
                  className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-[12px] font-bold transition-all cursor-pointer ${
                    activeTab === "saved"
                      ? "bg-white text-[#241e98] shadow-sm"
                      : "text-white/80 hover:bg-white/10 hover:text-white"
                  }`}
                  data-testid="header-tab-saved"
                >
                  <Heart size={13} />
                  Saved
                </button>
                <button
                  type="button"
                  onClick={() => navigateTo("/space-seeker/account")}
                  onMouseEnter={preloadSeekerAccount}
                  className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-[12px] font-bold transition-all cursor-pointer ${
                    activeTab === "profile"
                      ? "bg-white text-[#241e98] shadow-sm"
                      : "text-white/80 hover:bg-white/10 hover:text-white"
                  }`}
                  data-testid="header-tab-profile-seeker"
                >
                  <User size={13} />
                  Profile
                </button>
              </>
            )}
          </nav>
        </div>

        {/* Right: City + Bell + User */}
        <div className="flex items-center gap-3">
          {/* City Selector Pill */}
          <div className="relative" ref={cityDropdownRef}>
            <button
              type="button"
              onClick={() => {
                if (onShowCitySelector) {
                  onShowCitySelector();
                } else {
                  setShowCityDropdown(!showCityDropdown);
                }
              }}
              className="flex items-center gap-1.5 border border-white/30 rounded-full px-3.5 py-1.5 text-white text-[12px] font-semibold hover:bg-white/10 transition-all cursor-pointer"
              data-testid="header-city-pill"
            >
              <MapPin size={12} />
              {displayLocation}
              <ChevronDown size={11} className={`opacity-60 transition-transform ${showCityDropdown ? "rotate-180" : ""}`} />
            </button>

            {showCityDropdown && (
              <div className="absolute right-0 mt-2 w-44 bg-white rounded-2xl shadow-2xl border border-gray-100 py-1.5 z-[110] animate-in fade-in slide-in-from-top-2 duration-150">
                <div className="px-3 py-1.5 border-b border-gray-100 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Select Location
                </div>
                {[
                  { name: "Bengaluru", state: "Karnataka" },
                  { name: "Chennai", state: "Tamil Nadu" },
                ].map((c) => (
                  <button
                    key={c.name}
                    type="button"
                    onClick={() => {
                      localStorage.setItem("userDetectedCity", c.name);
                      localStorage.setItem("selectedServiceAreaName", c.name);
                      localStorage.setItem("userSelectedState", c.state);
                      localStorage.setItem("userState", c.state);
                      localStorage.setItem("workerState", c.state);
                      localStorage.setItem("selectedCity", c.name.toLowerCase() === "bengaluru" ? "bengaluru-id-fallback" : "chennai-id-fallback");
                      localStorage.removeItem("userLatitude");
                      localStorage.removeItem("userLongitude");
                      localStorage.removeItem("userDetectedAddress");
                      localStorage.removeItem("gpsLatitude");
                      localStorage.removeItem("gpsLongitude");
                      localStorage.removeItem("gpsDetectedCity");
                      setShowCityDropdown(false);
                      window.location.reload();
                    }}
                    className={`w-full flex items-center justify-between px-3.5 py-2 text-xs font-semibold text-left transition-colors cursor-pointer ${
                      displayLocation.toLowerCase().includes(c.name.toLowerCase())
                        ? "bg-indigo-50 text-[#241e98] font-black"
                        : "text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    <span>{c.name}</span>
                    <span className="text-[10px] text-slate-400 font-normal">{c.state}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Bell */}
          <button
            type="button"
            onClick={() => {
              if (isGuestUser) {
                if (!requireLogin("view notifications")) return;
              }
              if (onNotificationsOpen) onNotificationsOpen();
            }}
            className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-all relative cursor-pointer"
            data-testid="header-notifications-bell"
          >
            <Bell size={16} />
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 rounded-full text-white text-[9px] font-bold flex items-center justify-center ring-2 ring-[#241e98]">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </button>

          {/* User Avatar + Dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              type="button"
              onClick={() => setShowUserDropdown(!showUserDropdown)}
              className="flex items-center gap-2 cursor-pointer hover:opacity-95 transition-opacity px-2 py-1 rounded-full hover:bg-white/10"
              data-testid="header-user-menu-button"
            >
              <div className="w-8 h-8 rounded-full bg-indigo-100 text-[#241e98] font-black flex items-center justify-center text-xs shadow-inner">
                {isGuestUser ? <User size={15} /> : (userName || (userRole === "provider" ? "Provider" : "User")).charAt(0).toUpperCase()}
              </div>
              <div className="flex items-center gap-1 text-white">
                <span className="text-[12px] font-semibold hidden lg:inline max-w-[110px] truncate">
                  {isGuestUser ? "Guest" : userRole === "provider" ? "Provider" : capitalizeName(userName || "User")}
                </span>
                <ChevronDown size={11} className={`opacity-70 transition-transform ${showUserDropdown ? "rotate-180" : ""}`} />
              </div>
            </button>

            {/* Dropdown Menu */}
            {showUserDropdown && (
              <div className="absolute right-0 mt-2 w-52 bg-white rounded-2xl shadow-2xl border border-gray-100 py-1.5 z-[110] animate-in fade-in slide-in-from-top-2 duration-150">
                <div className="px-4 py-2 border-b border-gray-100">
                  <p className="text-xs text-gray-400 font-medium">
                    {isGuestUser ? "Browsing as" : "Logged in as"}
                  </p>
                  <p className="text-sm font-bold text-gray-900 truncate">
                    {isGuestUser ? "Guest User" : capitalizeName(userName || (userRole === "provider" ? "Space Provider" : "User"))}
                  </p>
                  <span className={`inline-block mt-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    isGuestUser ? "bg-amber-50 text-amber-700" : "bg-indigo-50 text-[#241e98]"
                  }`}>
                    {isGuestUser
                      ? `Guest (${userRole === "provider" ? "Provider" : "Seeker"})`
                      : userRole === "provider" ? "Space Provider" : "Space Seeker"}
                  </span>
                </div>

                <div className="py-1">
                  <button
                    type="button"
                    onClick={() => {
                      setShowUserDropdown(false);
                      navigateTo(userRole === "provider" ? "/space-provider/account" : "/space-seeker/account");
                    }}
                    className="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 text-left transition-colors cursor-pointer"
                  >
                    <User size={14} className="text-gray-400" />
                    Manage Profile
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setShowUserDropdown(false);
                      setShowSwitchRoleConfirm(true);
                    }}
                    className="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 text-left transition-colors cursor-pointer"
                    data-testid="button-header-switch-role"
                  >
                    <Car size={14} className="text-gray-400" />
                    Switch to {userRole === "provider" ? "Space Seeker" : "Space Provider"}
                  </button>
                </div>

                <div className="border-t border-gray-100 pt-1">
                  {isGuestUser ? (
                    <button
                      type="button"
                      onClick={() => {
                        setShowUserDropdown(false);
                        navigateTo(userRole === "provider" ? "/auth?role=space-provider" : "/auth?role=space-seeker");
                      }}
                      className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs font-bold text-[#241e98] hover:bg-indigo-50 text-left transition-colors cursor-pointer"
                      data-testid="button-header-login"
                    >
                      <LogIn size={14} className="text-[#241e98]" />
                      Log In / Register
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        setShowUserDropdown(false);
                        handleLogout();
                      }}
                      className="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 text-left transition-colors cursor-pointer"
                      data-testid="button-header-logout"
                    >
                      <LogOut size={14} />
                      Log Out
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ═══ ROLE SWITCH CONFIRMATION MODAL ═══ */}
      {showSwitchRoleConfirm && (
        <div
          className="fixed inset-0 z-[9999] bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 font-sans select-none"
          onClick={() => setShowSwitchRoleConfirm(false)}
        >
          <div
            className="w-full max-w-[340px] rounded-3xl overflow-hidden shadow-2xl bg-white relative font-sans border border-slate-100"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              type="button"
              onClick={() => setShowSwitchRoleConfirm(false)}
              className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 backdrop-blur-md flex items-center justify-center text-white z-10 cursor-pointer border border-white/20 transition-all"
              data-testid="button-close-switch-role"
              aria-label="Close"
            >
              <X size={15} />
            </button>

            {/* Gradient Top Header */}
            <div className="bg-gradient-to-br from-[#1b1675] via-[#241e98] to-[#3e3ab3] px-6 pt-7 pb-5 text-center relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-[#3e3ab3]/40 rounded-full blur-2xl -translate-y-6 translate-x-6 pointer-events-none" />
              <div className="absolute bottom-0 left-0 w-24 h-24 bg-amber-400/20 rounded-full blur-xl translate-y-4 -translate-x-4 pointer-events-none" />

              <div className="relative z-10">
                <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-[#241e98] border border-white/25 flex items-center justify-center shadow-xl shadow-indigo-950/60">
                  <LogOut size={24} className="text-white translate-x-0.5" />
                </div>
                <h3 className="text-white text-lg font-black mb-1 font-heading tracking-tight">
                  Switch to {userRole === "provider" ? "Space Seeker" : "Space Provider"}
                </h3>
                <p className="text-white/85 text-[11px] font-medium leading-relaxed">
                  {userRole === "provider"
                    ? "Find safe & affordable parking spots"
                    : "Rent your space & earn monthly income"}
                </p>
              </div>
            </div>

            {/* White Body with Info & Action Buttons */}
            <div className="px-6 pt-5 pb-6 bg-white">
              <p className="text-xs text-slate-600 text-center font-medium leading-relaxed mb-5">
                You will be logged out of your current session to switch to the{" "}
                <span className="font-bold text-slate-900">
                  {userRole === "provider" ? "Space Seeker" : "Space Provider"}
                </span>{" "}
                portal. Please log in or register to continue.
              </p>
              <button
                type="button"
                onClick={() => {
                  // Clear all session/auth data from localStorage on role switch
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
                  localStorage.removeItem("exploreMode");
                  localStorage.removeItem("isGuest");
                  localStorage.removeItem("token");
                  localStorage.removeItem("isLoggedIn");
                  localStorage.removeItem("customerPremiumStatus");

                  setShowSwitchRoleConfirm(false);
                  if (userRole === "provider") {
                    localStorage.setItem("userRole", "worker");
                    navigateTo("/auth?role=space-seeker");
                  } else {
                    localStorage.setItem("userRole", "customer");
                    navigateTo("/auth?role=space-provider");
                  }
                }}
                className="w-full h-12 rounded-2xl bg-gradient-to-r from-[#241e98] via-[#2b24b1] to-[#3e3ab3] hover:from-[#1b1778] hover:to-[#2e2a97] text-white font-black text-xs uppercase tracking-wider shadow-xl shadow-[#241e98]/30 active:scale-[0.98] transition-all cursor-pointer flex items-center justify-center gap-2"
                data-testid="button-confirm-switch-role"
              >
                <span>Logout &amp; Switch</span>
                <ArrowRight size={15} />
              </button>
              <button
                type="button"
                onClick={() => setShowSwitchRoleConfirm(false)}
                className="w-full h-10 mt-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs active:scale-[0.98] transition-all cursor-pointer"
                data-testid="button-cancel-switch-role"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
