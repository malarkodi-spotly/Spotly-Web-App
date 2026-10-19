import React, { useMemo, useState, useEffect } from "react";
import { useLocation } from "wouter";
import DesktopHeader from "@/components/layout/desktop-header";
import StateSelectorModal from "@/components/state-selector-modal";
import { NotificationSheet } from "@/components/notifications/notification-sheet";
import { AnimatePresence, motion } from "framer-motion";
import { getApiUrl } from "@/lib/api-config";
import DesktopFeatureAdsColumn from "@/components/desktop-feature-ads-column";
import {
  MapPin,
  HelpCircle,
  Plus,
  ArrowRight,
  Camera,
  X,
  Navigation,
  Clock,
  Calendar,
  CalendarDays,
  Car,
  Bike,
  ShieldCheck,
  Building2,
  Home,
  AlertCircle,
  Star,
  CheckCircle2,
  Check,
  Info,
  SendHorizontal,
  Loader2,
  Lock,
  MessageSquare,
  Phone,
  Mail,
  LogOut,
  Bell,
} from "lucide-react";
import { isGuest } from "@/lib/guest";

interface ParkingTypeOption {
  id: string;
  name: string;
}

interface SpaceProviderDesktopPostSpaceProps {
  photos: string[];
  onPhotoUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemovePhoto: (index: number) => void;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  parkingDuration: string;
  setParkingDuration: (val: string) => void;
  isPublicRoadside?: boolean;
  setIsPublicRoadside?: (val: boolean) => void;
  needsDateTime?: boolean;
  startDate: string;
  setStartDate: (val: string) => void;
  startTime: string;
  setStartTime: (val: string) => void;
  endTime: string;
  setEndTime: (val: string) => void;
  parkingType: string;
  setParkingType: (val: string) => void;
  parkingTypes: ParkingTypeOption[];
  setSelectedServiceId: (val: string) => void;
  isCarSelected: boolean;
  vehicleSize: string;
  setVehicleSize: (val: string) => void;
  address: string;
  setAddress: (val: string) => void;
  onAutoDetect: () => void;
  isDetecting: boolean;
  onOpenMapPicker: () => void;
  rent: string;
  setRent: (val: string) => void;
  description: string;
  setDescription: (val: string) => void;
  isFormValid: boolean;
  missingFields: string[];
  onSubmit: () => void;
  isSubmitting: boolean;
  submitError: string;
  editMode: boolean;
  embedMode?: boolean;
  onSuccess?: () => void;
}

export default function SpaceProviderDesktopPostSpace({
  photos,
  onPhotoUpload,
  onRemovePhoto,
  fileInputRef,
  parkingDuration,
  setParkingDuration,
  isPublicRoadside = false,
  setIsPublicRoadside,
  needsDateTime,
  startDate,
  setStartDate,
  startTime,
  setStartTime,
  endTime,
  setEndTime,
  parkingType,
  setParkingType,
  parkingTypes,
  setSelectedServiceId,
  isCarSelected,
  vehicleSize,
  setVehicleSize,
  address,
  onAutoDetect,
  isDetecting,
  onOpenMapPicker,
  rent,
  setRent,
  description,
  setDescription,
  isFormValid,
  missingFields,
  onSubmit,
  isSubmitting,
  submitError,
  editMode,
  embedMode = false,
  onSuccess,
}: SpaceProviderDesktopPostSpaceProps) {
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState<string>("add-space");
  const [showSupportModal, setShowSupportModal] = useState(false);
  const [showSeekerLogoutConfirm, setShowSeekerLogoutConfirm] = useState(false);
  const [showCitySelector, setShowCitySelector] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [isClearingNotifications, setIsClearingNotifications] = useState(false);

  const userName = localStorage.getItem("userName") || "Provider";
  const userCity =
    localStorage.getItem("userDetectedCity") ||
    localStorage.getItem("selectedServiceAreaName") ||
    "Bengaluru";
  const userState = localStorage.getItem("userSelectedState") || "Karnataka";

  useEffect(() => {
    const uid = localStorage.getItem("userId");
    if (!uid) return;
    const fetchNotifications = async () => {
      try {
        const res = await fetch(getApiUrl(`/api/notifications/${uid}`));
        if (res.ok) {
          const data = await res.json();
          setNotifications(data.notifications || []);
        }
      } catch {}
    };
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 10000);
    return () => clearInterval(interval);
  }, []);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const displayCities = useMemo(
    () => [
      { id: "bangalore", name: "Bengaluru", state: "Karnataka" },
      { id: "chennai", name: "Chennai", state: "Tamil Nadu" },
    ],
    []
  );

  const handleCityChange = (cityId: string) => {
    const cityName = cityId === "chennai" ? "Chennai" : "Bengaluru";
    const stateName = cityId === "chennai" ? "Tamil Nadu" : "Karnataka";
    localStorage.setItem("userDetectedCity", cityName);
    localStorage.setItem("selectedServiceAreaName", cityName);
    localStorage.setItem("userSelectedState", stateName);
    setShowCitySelector(false);
  };

  const handleClearNotifications = async () => {
    const uid = localStorage.getItem("userId");
    if (!uid) return;
    setIsClearingNotifications(true);
    try {
      await fetch(getApiUrl(`/api/notifications/${uid}`), { method: "DELETE" });
      setNotifications([]);
    } catch (err) {
      console.error("Failed to clear notifications:", err);
    } finally {
      setIsClearingNotifications(false);
    }
  };

  const isProviderLoggedIn = !!(
    localStorage.getItem("userId") &&
    !isGuest() &&
    localStorage.getItem("exploreMode") !== "true" &&
    !localStorage.getItem("userId")?.startsWith("explore_") &&
    !localStorage.getItem("userId")?.startsWith("guest_")
  );

  const handleBecomeSeekerClick = () => {
    setShowSeekerLogoutConfirm(true);
  };

  const handleSeekerLogoutConfirm = () => {
    localStorage.removeItem("userId");
    localStorage.removeItem("userName");
    localStorage.removeItem("userMobile");
    localStorage.removeItem("sessionToken");
    localStorage.removeItem("workerAge");
    localStorage.removeItem("workerGender");
    localStorage.removeItem("workerServices");
    localStorage.removeItem("workerConditions");
    localStorage.removeItem("isNewRegistration");
    localStorage.removeItem("exploreMode");
    localStorage.removeItem("isGuest");
    localStorage.setItem("userRole", "worker");

    setShowSeekerLogoutConfirm(false);
    setLocation("/auth?role=space-seeker");
  };

  // Progress Calculation
  const progressPercent = useMemo(() => {
    let filled = 0;
    if (photos.length > 0) filled++;
    if (address.trim()) filled++;
    if (parkingType) filled++;
    if (isPublicRoadside) {
      return Math.round((filled / 3) * 100);
    }
    if (parkingDuration) filled++;
    if (rent.trim()) filled++;
    if (description.trim()) filled++;
    return Math.round((filled / 6) * 100);
  }, [photos, address, parkingDuration, parkingType, rent, description, isPublicRoadside]);

  const progressLabel = useMemo(() => {
    if (progressPercent === 100) return "Ready to post!";
    if (progressPercent >= 80) return "Almost done";
    if (progressPercent >= 60) return "Good progress";
    if (progressPercent >= 40) return "Keep going";
    if (progressPercent >= 20) return "Just started";
    return "Get started";
  }, [progressPercent]);

  // Duration mapping
  const currentDurationKey = useMemo(() => {
    if (parkingDuration === "Hourly") return "Hourly";
    if (parkingDuration === "Days" || parkingDuration === "Daily") return "Daily";
    if (parkingDuration === "Monthly") return "Monthly";
    return "";
  }, [parkingDuration]);

  // Description / Feature Cards options
  const featureOptions = [
    {
      id: "gated-cctv",
      title: "GATED PLACE + CCTV",
      subtitle: "Gated community or secured premises with 24/7 security and CCTV surveillance.",
      icon: ShieldCheck,
      matchText: "Gated community or secured premises with 24/7 security and CCTV surveillance.",
    },
    {
      id: "home-cctv",
      title: "HOME + CCTV",
      subtitle: "Parking available at a private home with CCTV/security.",
      icon: Home,
      matchText: "Parking available at a private home with CCTV/security.",
    },
    {
      id: "apartment-safety",
      title: "APARTMENT FULL SAFETY",
      subtitle: "Parking inside an apartment/residential complex with security and controlled access.",
      icon: Building2,
      matchText: "Parking inside an apartment/residential complex with security and controlled access.",
    },
    {
      id: "independent-house",
      title: "INDEPENDENT HOUSE / VILLA",
      subtitle: "Private parking at an independent house or villa.",
      icon: Home,
      matchText: "Private parking at an independent house or villa.",
    },
  ];

  return (
    <div className={embedMode ? "w-full text-slate-800" : "min-h-screen bg-[#f8fafc] text-slate-800"}>
      {/* ═══════════════════════════════════════════════ */}
      {/* 1. TOP DESKTOP HEADER (Identical to Dashboard)  */}
      {/* ═══════════════════════════════════════════════ */}
      {!embedMode && (
        <DesktopHeader
          userRole="provider"
          activeTab={activeTab}
          onTabChange={(tab) => {
            setActiveTab(tab);
            if (tab === "dashboard") setLocation("/space-provider/home");
            else if (tab === "my-spaces") setLocation("/space-provider/home?tab=my-spaces");
            else if (tab === "profile") setLocation("/space-provider/account");
          }}
          userName={userName}
          onShowCitySelector={() => setShowCitySelector(true)}
          onNotificationsOpen={() => setNotificationsOpen(true)}
          unreadCount={unreadCount}
          locationLabel={userState}
        />
      )}

      {/* ═══════════════════════════════════════════════ */}
      {/* MAIN CONTAINER: Sidebar + Center + Right Card */}
      {/* ═══════════════════════════════════════════════ */}
      <div className={embedMode ? "w-full" : "flex pt-14 min-h-[calc(100vh-3.5rem)]"}>
        {/* ───────────────────────────────────────────── */}
        {/* 2. LEFT SIDEBAR (Identical to Dashboard)      */}
        {/* ───────────────────────────────────────────── */}
        {!embedMode && (
          <aside className="w-[210px] shrink-0 bg-white border-r border-slate-200/80 fixed top-14 bottom-0 left-0 z-30 flex flex-col justify-between overflow-y-auto select-none">
          {/* Top navigation list */}
          <div className="py-4 px-3">
            <nav className="space-y-1">
              {[
                { id: "my-spaces", label: "My Spaces", icon: MapPin },
                { id: "add-space", label: "Add Space", icon: Plus },
                { id: "notifications", label: "Notifications", icon: Bell, badge: unreadCount },
                { id: "support", label: "Help & Support", icon: HelpCircle },
              ].map((item) => {
                const isActive = activeTab === item.id;
                const IconComponent = item.icon;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      if (item.id === "support") {
                        setShowSupportModal(true);
                      } else if (item.id === "notifications") {
                        setNotificationsOpen(true);
                      } else if (item.id === "my-spaces") {
                        setLocation("/space-provider/home");
                      } else {
                        setActiveTab(item.id);
                      }
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-[13px] font-medium transition-all cursor-pointer ${
                      isActive
                        ? "text-white font-semibold shadow-md shadow-[#1e3a8a]/25"
                        : "text-gray-500 hover:bg-gray-50 hover:text-gray-800"
                    }`}
                    style={isActive ? { background: "linear-gradient(135deg, #1e3a8a 0%, #3b2fad 35%, #6d28d9 70%, #7c3aed 100%)" } : undefined}
                    data-testid={`sidebar-link-${item.id}`}
                  >
                    <div className="flex items-center gap-2.5">
                      <IconComponent
                        size={17}
                        className={isActive ? "text-white" : "text-gray-400"}
                      />
                      <span>{item.label}</span>
                    </div>
                    {item.badge && item.badge > 0 ? (
                      <span className={`w-5 h-5 rounded-full text-[10px] font-bold flex items-center justify-center ${isActive ? "bg-white text-[#3b2fad]" : "bg-[#3b2fad] text-white"}`}>
                        {item.badge}
                      </span>
                    ) : null}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Bottom CTA Card: "Become a Seeker" (Exact SVG & styling from Dashboard) */}
          <div className="px-3 pb-4">
            <div className="bg-gradient-to-br from-[#eae8ff] to-[#d6d2ff] rounded-xl p-4 border border-[#d0ccff]">
              <div className="flex justify-center mb-3">
                <div className="relative">
                  <svg width="80" height="60" viewBox="0 0 80 60" fill="none">
                    <rect x="5" y="48" width="70" height="2" rx="1" fill="#3b2fad" opacity="0.12" />
                    <path
                      d="M15 38 L15 32 Q15 28 19 28 L22 28 L28 20 Q30 18 34 18 L46 18 Q50 18 52 20 L58 28 L61 28 Q65 28 65 32 L65 38 Q65 40 63 40 L17 40 Q15 40 15 38 Z"
                      fill="#3b2fad"
                      opacity="0.85"
                    />
                    <path
                      d="M30 28 L34 21 Q35 20 37 20 L43 20 Q45 20 46 21 L50 28 Z"
                      fill="#8b85e0"
                      opacity="0.7"
                    />
                    <rect x="16" y="32" width="4" height="2" rx="1" fill="#fbbf24" opacity="0.9" />
                    <rect x="60" y="32" width="4" height="2" rx="1" fill="#fbbf24" opacity="0.9" />
                    <circle cx="27" cy="41" r="5" fill="#1a1464" />
                    <circle cx="27" cy="41" r="2.5" fill="#444" />
                    <circle cx="53" cy="41" r="5" fill="#1a1464" />
                    <circle cx="53" cy="41" r="2.5" fill="#444" />
                    <circle cx="56" cy="10" r="10" fill="#3b2fad" />
                    <circle cx="56" cy="10" r="10" fill="#3b2fad" stroke="white" strokeWidth="1.5" />
                    <text x="56" y="14" textAnchor="middle" fontSize="12" fill="white" fontWeight="bold">
                      P
                    </text>
                    <path d="M50 17 L53 22 L48 20 Z" fill="#3b2fad" />
                  </svg>
                </div>
              </div>
              <p className="text-[13px] font-bold text-gray-800 leading-tight">
                Need a parking
                <br />
                space?
              </p>
              <p className="text-[10px] text-gray-500 mt-1.5 leading-relaxed">
                Find safe &amp; affordable
                <br />
                parking spots near you.
              </p>
              <button
                type="button"
                onClick={handleBecomeSeekerClick}
                style={{ background: "linear-gradient(135deg, #1e3a8a 0%, #3b2fad 35%, #6d28d9 70%, #7c3aed 100%)" }}
                className="mt-3 w-full flex items-center justify-center gap-1.5 py-2 text-white text-[11px] font-bold rounded-lg shadow-md shadow-[#3b2fad]/25 hover:opacity-95 transition-all cursor-pointer"
                data-testid="button-become-seeker"
              >
                Become a Seeker <ArrowRight size={12} />
              </button>
            </div>
          </div>
        </aside>
        )}

        {/* ───────────────────────────────────────────── */}
        {/* 3. CENTER + RIGHT AREA                        */}
        {/* ───────────────────────────────────────────── */}
        <div className={`flex gap-8 justify-center min-w-0 ${embedMode ? "w-full" : "flex-1 ml-[210px] p-6 lg:p-8"}`}>
          {/* Main Form Center Column */}
          <div className="flex-1 max-w-[760px] min-w-0">
            {/* Top Hero Banner with Landing Page Gradient */}
            <div
              className="text-white rounded-2xl p-6 relative overflow-hidden flex items-center justify-between shadow-lg shadow-indigo-950/20"
              style={{ background: "linear-gradient(135deg, #1e3a8a 0%, #3b2fad 35%, #6d28d9 70%, #7c3aed 100%)" }}
            >
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute bottom-0 left-1/3 w-48 h-48 bg-purple-500/20 rounded-full blur-2xl pointer-events-none" />

              {/* Left Hero Title & Badge */}
              <div className="relative z-10 flex items-center gap-4">
                <div className="w-13 h-13 rounded-full bg-white/15 backdrop-blur-md border border-white/20 flex items-center justify-center text-white shrink-0 shadow-md">
                  <Car size={24} />
                </div>
                <div>
                  <h1 className="text-2xl font-black tracking-tight text-white font-heading">
                    {editMode ? "Edit Space" : "Post a Space"}
                  </h1>
                  <p className="text-xs font-medium text-indigo-100/90 mt-0.5 max-w-md">
                    {editMode
                      ? "Update your parking space details to keep listings accurate."
                      : "List your empty parking space and help someone find a safe place to park."}
                  </p>
                </div>
              </div>

              {/* Right Header Artwork Cutout */}
              <div className="relative z-10 hidden sm:flex items-center justify-end shrink-0 pl-4">
                <img
                  src="/header_parking_cars_transparent.png"
                  alt="Parking Scene"
                  className="h-20 lg:h-24 object-contain object-right drop-shadow-md"
                />
              </div>
            </div>

            {/* Main Form Container Card */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-6 lg:p-8 shadow-sm space-y-7 mt-5 relative">
              {/* 1. Form Completion Progress (Sticky while scrolling form content) */}
              <div className="sticky top-14 z-20 -mx-6 lg:-mx-8 -mt-6 lg:-mt-8 px-6 lg:px-8 py-4 bg-white/95 backdrop-blur-md border-b border-slate-200/80 rounded-t-2xl shadow-xs transition-all">
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span className="text-slate-800">1. Form Completion</span>
                    <span className="text-slate-500">
                      {progressPercent}% - {progressLabel}
                    </span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-300"
                      style={{
                        width: `${progressPercent}%`,
                        background: "linear-gradient(135deg, #1e3a8a 0%, #3b2fad 35%, #6d28d9 70%, #7c3aed 100%)",
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* 2. Photos Section */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-slate-800">Photos</span>
                    <span className="text-[10px] font-bold text-[#3b2fad] bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-200/80">
                      Optional
                    </span>
                  </div>
                  <span className="text-xs font-semibold text-slate-400">
                    {photos.length}/5 Photos
                  </span>
                </div>
                <p className="text-xs text-slate-500">
                  Upload up to 5 photos of your parking slot to get 3x more bookings.
                </p>

                {/* Photo Cards & Add Box */}
                <div className="flex flex-wrap gap-3 pt-1">
                  {photos.map((photo, index) => (
                    <div
                      key={index}
                      className="relative group w-24 h-24 rounded-xl overflow-hidden border border-indigo-200 bg-slate-100 shadow-xs"
                    >
                      <img
                        src={photo}
                        alt={`Uploaded photo ${index + 1}`}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                      {index === 0 && (
                        <span
                          style={{ background: "linear-gradient(135deg, #1e3a8a 0%, #3b2fad 50%, #7c3aed 100%)" }}
                          className="absolute bottom-1 left-1 text-white text-[9px] font-black uppercase px-1.5 py-0.5 rounded shadow-xs"
                        >
                          Cover
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={() => onRemovePhoto(index)}
                        className="absolute top-1 right-1 w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center hover:bg-red-600 transition-colors shadow-sm cursor-pointer"
                        title="Remove photo"
                      >
                        <X size={11} strokeWidth={3} />
                      </button>
                    </div>
                  ))}

                  {photos.length < 5 && (
                    <label
                      htmlFor="desktop-photo-upload-input"
                      className="w-24 h-24 rounded-xl border-2 border-dashed border-indigo-300 hover:border-[#3b2fad] bg-indigo-50/30 hover:bg-indigo-50/70 transition-all flex flex-col items-center justify-center gap-1.5 cursor-pointer text-center select-none"
                    >
                      <div
                        style={{ background: "linear-gradient(135deg, #1e3a8a 0%, #3b2fad 35%, #6d28d9 70%, #7c3aed 100%)" }}
                        className="w-8 h-8 rounded-full shadow-xs flex items-center justify-center text-white"
                      >
                        <Camera size={16} />
                      </div>
                      <span className="text-[11px] font-bold text-[#3b2fad]">
                        Add Photos
                      </span>
                      <input
                        id="desktop-photo-upload-input"
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        multiple
                        className="hidden"
                        onChange={onPhotoUpload}
                      />
                    </label>
                  )}
                </div>
              </div>

              {/* 3. Address / Location Section */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-bold text-slate-800 flex items-center gap-1">
                    <span>Address / Location</span>
                    <span className="text-red-500">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={onAutoDetect}
                    disabled={isDetecting}
                    style={{ background: "linear-gradient(135deg, #1e3a8a 0%, #3b2fad 35%, #6d28d9 70%, #7c3aed 100%)" }}
                    className="flex items-center gap-1.5 px-3 py-1 hover:opacity-95 active:scale-95 text-white text-xs font-bold rounded-full transition-all cursor-pointer shadow-md shadow-[#3b2fad]/20"
                  >
                    {isDetecting ? (
                      <Loader2 size={13} className="animate-spin" />
                    ) : (
                      <Navigation size={13} className="fill-white" />
                    )}
                    <span>{isDetecting ? "Detecting..." : "Auto Detect"}</span>
                  </button>
                </div>

                {/* Location selector box */}
                <div
                  onClick={onOpenMapPicker}
                  className={`p-4 rounded-xl border transition-all duration-200 cursor-pointer flex items-center justify-between gap-3 ${
                    address
                      ? "bg-indigo-50/30 border-indigo-200 hover:border-[#3b2fad]"
                      : "bg-indigo-50/20 border-dashed border-indigo-300 hover:border-[#3b2fad] hover:bg-indigo-50/40"
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      style={{ background: "linear-gradient(135deg, #1e3a8a 0%, #3b2fad 35%, #6d28d9 70%, #7c3aed 100%)" }}
                      className="w-10 h-10 rounded-xl text-white flex items-center justify-center shrink-0 shadow-sm shadow-[#3b2fad]/20"
                    >
                      <MapPin size={20} />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900">
                        <span>
                          {address ? "Location Selected" : "Click to select location on map"}
                        </span>
                        <Info size={13} className="text-indigo-400" />
                      </div>
                      <p className="text-xs text-slate-500 truncate mt-0.5">
                        {address || "Choose a street, building or pin exact spot on interactive map."}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onOpenMapPicker();
                    }}
                    style={{ background: "linear-gradient(135deg, #1e3a8a 0%, #3b2fad 35%, #6d28d9 70%, #7c3aed 100%)" }}
                    className="px-4 py-2 rounded-xl text-white text-xs font-bold shrink-0 transition-opacity hover:opacity-95 shadow-md shadow-[#3b2fad]/20 cursor-pointer"
                  >
                    Select
                  </button>
                </div>
              </div>

              {/* 4. Parking By (Owner / Spotly) Section */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-bold text-slate-800 flex items-center gap-1">
                    <span>Parking By (Owner / Spotly)</span>
                    <span className="text-red-500">*</span>
                  </label>
                  <span
                    className={`text-xs font-bold px-2.5 py-0.5 rounded-full border transition-all ${
                      isPublicRoadside
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                        : "bg-indigo-50 text-[#3b2fad] border-indigo-200"
                    }`}
                  >
                    {isPublicRoadside ? "By Spotly (Public)" : "Space Owner (Usual Form)"}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {/* Option 1: Space Owner */}
                  <div
                    role="button"
                    tabIndex={0}
                    onClick={() => {
                      if (isPublicRoadside) {
                        setIsPublicRoadside?.(false);
                        setParkingDuration("Monthly");
                      }
                    }}
                    className={`p-4 rounded-xl border-2 transition-all cursor-pointer flex flex-col justify-between gap-3 select-none relative ${
                      !isPublicRoadside
                        ? "border-[#3b2fad] bg-gradient-to-br from-indigo-50/80 via-white to-purple-50/30 shadow-sm shadow-[#3b2fad]/10"
                        : "border-slate-200 bg-white hover:border-[#3b2fad]/40"
                    }`}
                    data-testid="option-desktop-parking-by-owner"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div
                          style={
                            !isPublicRoadside
                              ? {
                                  background:
                                    "linear-gradient(135deg, #1e3a8a 0%, #3b2fad 35%, #6d28d9 70%, #7c3aed 100%)",
                                }
                              : undefined
                          }
                          className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-all ${
                            !isPublicRoadside
                              ? "text-white shadow-xs shadow-[#3b2fad]/25"
                              : "bg-slate-100 text-slate-600"
                          }`}
                        >
                          <Building2 size={20} />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-slate-900">
                              Space Owner
                            </span>
                            <span
                              className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                                !isPublicRoadside
                                  ? "bg-indigo-100 text-[#3b2fad]"
                                  : "bg-slate-100 text-slate-500"
                              }`}
                            >
                              {!isPublicRoadside ? "Selected" : "Usual Form"}
                            </span>
                          </div>
                          <span className="text-xs font-medium text-indigo-600/90 block mt-0.5">
                            Private Parking Space
                          </span>
                        </div>
                      </div>

                      <div
                        className={`w-5 h-5 rounded-full flex items-center justify-center transition-all shrink-0 mt-0.5 ${
                          !isPublicRoadside
                            ? "border-2 border-[#3b2fad] bg-[#3b2fad] text-white"
                            : "border-2 border-slate-300 bg-white"
                        }`}
                      >
                        {!isPublicRoadside && <Check size={12} strokeWidth={3} />}
                      </div>
                    </div>

                    <p className="text-xs text-slate-500 leading-relaxed">
                      List private space as usual. Set your custom rent, duration, and amenities.
                    </p>
                  </div>

                  {/* Option 2: By Spotly (Public Space Parking) */}
                  <div
                    role="button"
                    tabIndex={0}
                    onClick={() => {
                      if (!isPublicRoadside) {
                        setIsPublicRoadside?.(true);
                        setParkingDuration("Public Roadside");
                        setRent("");
                        setDescription("");
                        setVehicleSize("");
                        if (
                          parkingType.toLowerCase().includes("both") ||
                          parkingType.toLowerCase().includes("car and bike")
                        ) {
                          setParkingType("Car");
                          const matchingService = parkingTypes.find((s) =>
                            s.name.toLowerCase().includes("car")
                          );
                          setSelectedServiceId(matchingService?.id || "car");
                        }
                      }
                    }}
                    className={`p-4 rounded-xl border-2 transition-all cursor-pointer flex flex-col justify-between gap-3 select-none relative ${
                      isPublicRoadside
                        ? "border-[#3b2fad] bg-gradient-to-br from-indigo-50/80 via-white to-purple-50/30 shadow-sm shadow-[#3b2fad]/10"
                        : "border-slate-200 bg-white hover:border-[#3b2fad]/40"
                    }`}
                    data-testid="option-desktop-parking-by-spotly"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div
                          style={
                            isPublicRoadside
                              ? {
                                  background:
                                    "linear-gradient(135deg, #1e3a8a 0%, #3b2fad 35%, #6d28d9 70%, #7c3aed 100%)",
                                }
                              : undefined
                          }
                          className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-all ${
                            isPublicRoadside
                              ? "text-white shadow-xs shadow-[#3b2fad]/25"
                              : "bg-slate-100 text-slate-600"
                          }`}
                        >
                          <Navigation size={20} />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-slate-900">
                              By Spotly
                            </span>
                            <span
                              className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                                isPublicRoadside
                                  ? "bg-emerald-100 text-emerald-700 border border-emerald-200"
                                  : "bg-slate-100 text-slate-500"
                              }`}
                            >
                              {isPublicRoadside ? "Active" : "Free / Roadside"}
                            </span>
                          </div>
                          <span className="text-xs font-medium text-emerald-700/90 block mt-0.5">
                            Public Space Parking
                          </span>
                        </div>
                      </div>

                      <div
                        className={`w-5 h-5 rounded-full flex items-center justify-center transition-all shrink-0 mt-0.5 ${
                          isPublicRoadside
                            ? "border-2 border-[#3b2fad] bg-[#3b2fad] text-white"
                            : "border-2 border-slate-300 bg-white"
                        }`}
                      >
                        {isPublicRoadside && <Check size={12} strokeWidth={3} />}
                      </div>
                    </div>

                    <p className="text-xs text-slate-500 leading-relaxed">
                      Mark a free public roadside or open street spot. Hides rent and duration.
                    </p>
                  </div>
                </div>
              </div>

              {/* 5. Parking Duration Section (Hidden when Public Roadside is selected) */}
              {!isPublicRoadside && (
                <div className="space-y-2.5">
                  <label className="text-sm font-bold text-slate-800 flex items-center gap-1">
                    <span>Parking Duration</span>
                    <span className="text-red-500">*</span>
                  </label>

                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { key: "Hourly", label: "Hourly", sub: "(Short term)", icon: Clock },
                      { key: "Days", label: "Daily", sub: "(Per day)", icon: Calendar },
                      { key: "Monthly", label: "Monthly", sub: "(Long term)", icon: CalendarDays },
                    ].map((item) => {
                      const isSelected =
                        currentDurationKey === item.label ||
                        parkingDuration === item.key ||
                        parkingDuration === item.label;
                      const IconComponent = item.icon;
                      return (
                        <button
                          key={item.key}
                          type="button"
                          onClick={() => setParkingDuration(item.key)}
                          className={`py-3.5 px-3 rounded-xl border-2 transition-all flex flex-col items-center justify-center gap-1 text-center cursor-pointer ${
                            isSelected
                              ? "border-[#3b2fad] bg-indigo-50/70 text-[#3b2fad] shadow-xs"
                              : "border-slate-200 hover:border-indigo-300 bg-white text-slate-700"
                          }`}
                        >
                          <IconComponent
                            size={20}
                            className={isSelected ? "text-[#3b2fad]" : "text-slate-500"}
                          />
                          <span className="text-xs font-bold">{item.label}</span>
                          <span className="text-[10px] text-slate-400">{item.sub}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* 6. Parking Type Section */}
              <div className="space-y-2.5">
                <label className="text-sm font-bold text-slate-800 flex items-center gap-1">
                  <span>Parking Type</span>
                  <span className="text-red-500">*</span>
                </label>

                <div className={`grid gap-3 ${isPublicRoadside ? "grid-cols-2" : "grid-cols-3"}`}>
                  {[
                    { id: "car", name: "Car", sub: "(4 wheeler)", icon: Car },
                    { id: "bike", name: "Bike", sub: "(2 wheeler)", icon: Bike },
                    {
                      id: "both",
                      name: "Car and Bike",
                      sub: "(Combo / Multiple)",
                      icon: Car,
                      hasBike: true,
                    },
                  ]
                    .filter((type) => !isPublicRoadside || type.id !== "both")
                    .map((type) => {
                      const isSelected =
                        parkingType.toLowerCase() === type.name.toLowerCase() ||
                        (type.id === "both" &&
                          (parkingType.toLowerCase().includes("both") ||
                            parkingType.toLowerCase().includes("car and bike")));
                      const IconComponent = type.icon;

                      return (
                        <button
                          key={type.id}
                          type="button"
                          onClick={() => {
                            setParkingType(type.name);
                            const matchingService = parkingTypes.find((s) =>
                              s.name.toLowerCase().includes(type.id)
                            );
                            setSelectedServiceId(matchingService?.id || type.id);
                            if (type.id === "bike") setVehicleSize("");
                          }}
                          className={`py-3.5 px-3 rounded-xl border-2 transition-all flex flex-col items-center justify-center gap-1 text-center cursor-pointer ${
                            isSelected
                              ? "border-[#3b2fad] bg-indigo-50/70 text-[#3b2fad] shadow-xs"
                              : "border-slate-200 hover:border-indigo-300 bg-white text-slate-700"
                          }`}
                        >
                          <div className="flex items-center gap-1">
                            <IconComponent
                              size={20}
                              className={isSelected ? "text-[#3b2fad]" : "text-slate-500"}
                            />
                            {type.hasBike && (
                              <Bike
                                size={16}
                                className={isSelected ? "text-[#3b2fad]" : "text-slate-500"}
                              />
                            )}
                          </div>
                          <span className="text-xs font-bold">{type.name}</span>
                          <span className="text-[10px] text-slate-400">{type.sub}</span>
                        </button>
                      );
                    })}
                </div>

                {/* Vehicle Size Selection (When Car is selected) */}
                {isCarSelected && !isPublicRoadside && (
                  <div className="p-3 bg-indigo-50/30 rounded-xl border border-indigo-100 flex items-center justify-between gap-3 mt-2">
                    <span className="text-xs font-bold text-slate-700">Vehicle Size:</span>
                    <div className="flex gap-2">
                      {["Hatchback", "Sedan", "SUV", "All"].map((size) => {
                        const isSelected = vehicleSize === size;
                        return (
                          <button
                            key={size}
                            type="button"
                            onClick={() => setVehicleSize(isSelected ? "" : size)}
                            style={isSelected ? { background: "linear-gradient(135deg, #1e3a8a 0%, #3b2fad 35%, #6d28d9 70%, #7c3aed 100%)" } : undefined}
                            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                              isSelected
                                ? "text-white shadow-xs shadow-[#3b2fad]/25"
                                : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-50"
                            }`}
                          >
                            {size}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* 7. Monthly Rent Section (Hidden when Public Roadside is selected) */}
              {!isPublicRoadside && (
                <div className="space-y-2.5">
                  <label className="text-sm font-bold text-slate-800 flex items-center gap-1">
                    <span>
                      {currentDurationKey === "Hourly"
                        ? "Hourly Rent (₹)"
                        : currentDurationKey === "Daily"
                        ? "Daily Rent (₹)"
                        : "Monthly Rent (₹)"}
                    </span>
                    <span className="text-red-500">*</span>
                  </label>

                  <div className="flex items-center gap-3">
                    <div className="relative flex-1 flex items-center bg-white border border-slate-200 focus-within:border-[#3b2fad] focus-within:ring-2 focus-within:ring-indigo-100 rounded-xl p-2.5 transition-all">
                      <div
                        style={{ background: "linear-gradient(135deg, #1e3a8a 0%, #3b2fad 35%, #6d28d9 70%, #7c3aed 100%)" }}
                        className="w-8 h-8 rounded-full text-white flex items-center justify-center font-bold text-sm shrink-0 shadow-xs shadow-[#3b2fad]/20"
                      >
                        ₹
                      </div>
                      <input
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        value={rent}
                        onKeyDown={(e) => {
                          if (
                            ["Backspace", "Delete", "ArrowLeft", "ArrowRight", "Tab"].includes(e.key) ||
                            e.ctrlKey ||
                            e.metaKey
                          ) {
                            return;
                          }
                          if (!/^\d$/.test(e.key)) {
                            e.preventDefault();
                            return;
                          }
                          const target = e.currentTarget;
                          const isTextSelected = (target.selectionEnd ?? 0) - (target.selectionStart ?? 0) > 0;
                          if (target.value.length >= 4 && !isTextSelected) {
                            e.preventDefault();
                          }
                        }}
                        onPaste={(e) => {
                          e.preventDefault();
                          const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 4);
                          setRent(pasted);
                        }}
                        onChange={(e) => {
                          const val = e.target.value.replace(/\D/g, "").slice(0, 4);
                          setRent(val);
                        }}
                        maxLength={4}
                        placeholder="e.g. 2500"
                        className="w-full px-3 text-lg font-bold text-slate-900 placeholder:text-slate-300 outline-none bg-transparent"
                      />
                    </div>

                    {/* Unit Dropdown */}
                    <div className="px-4 py-3 bg-slate-100 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 shrink-0 select-none">
                      {currentDurationKey === "Hourly"
                        ? "/ hour"
                        : currentDurationKey === "Daily"
                        ? "/ day"
                        : "/ month"}
                    </div>
                  </div>
                </div>
              )}

              {/* 8. Description / Features Section (Hidden when Public Roadside is selected) */}
              {!isPublicRoadside && (
                <div className="space-y-2.5">
                  <label className="text-sm font-bold text-slate-800 flex items-center gap-1">
                    <span>Description / Features</span>
                    <span className="text-red-500">*</span>
                  </label>

                  <div className="grid grid-cols-2 gap-3">
                    {featureOptions.map((item) => {
                      const isSelected =
                        description === item.matchText ||
                        description.toLowerCase().includes(item.id);
                      const IconComponent = item.icon;

                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => setDescription(isSelected ? "" : item.matchText)}
                          className={`p-3.5 rounded-xl border transition-all text-left flex items-start justify-between gap-3 cursor-pointer ${
                            isSelected
                              ? "border-[#3b2fad] bg-indigo-50/50 shadow-xs"
                              : "border-slate-200 hover:border-indigo-300 bg-white"
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <div
                              style={isSelected ? { background: "linear-gradient(135deg, #1e3a8a 0%, #3b2fad 35%, #6d28d9 70%, #7c3aed 100%)" } : undefined}
                              className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                                isSelected
                                  ? "text-white shadow-xs shadow-[#3b2fad]/25"
                                  : "bg-slate-100 text-slate-600"
                              }`}
                            >
                              <IconComponent size={18} />
                            </div>
                            <div>
                              <h4
                                className={`text-xs font-extrabold uppercase tracking-wide leading-snug ${
                                  isSelected ? "text-[#3b2fad]" : "text-slate-800"
                                }`}
                              >
                                {item.title}
                              </h4>
                              <p className="text-[11px] text-slate-500 leading-tight mt-1 line-clamp-2">
                                {item.subtitle}
                              </p>
                            </div>
                          </div>

                          {/* Radio indicator */}
                          <div
                            style={isSelected ? { background: "linear-gradient(135deg, #1e3a8a 0%, #3b2fad 50%, #7c3aed 100%)" } : undefined}
                            className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 mt-1 ${
                              isSelected
                                ? "border-[#3b2fad] text-white shadow-xs"
                                : "border-slate-300 bg-white"
                            }`}
                          >
                            {isSelected && <Check size={10} className="text-white stroke-[3]" />}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* By Spotly - Public Roadside Parking Ready Banner */}
              {isPublicRoadside && (
                <div className="p-4 bg-emerald-50/90 border border-emerald-200 rounded-2xl flex items-center gap-3 shadow-xs">
                  <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                    <CheckCircle2 size={20} />
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-sm font-bold text-emerald-950">
                      By Spotly — Public Space Parking Ready
                    </h4>
                    <p className="text-xs text-emerald-700/90 mt-0.5 leading-snug">
                      Duration, rent, and description are omitted. Drivers can discover and navigate directly to this spot.
                    </p>
                  </div>
                </div>
              )}

              {/* Validation Warning Alert */}
              {!isFormValid && missingFields.length > 0 && (
                <div className="flex items-center gap-2.5 p-3.5 bg-amber-50 border border-amber-200/90 rounded-xl text-amber-900 text-xs font-semibold">
                  <AlertCircle size={16} className="text-amber-600 shrink-0" />
                  <span>
                    Please fill required fields:{" "}
                    <strong className="font-extrabold">{missingFields.join(", ")}</strong>
                  </span>
                </div>
              )}

              {/* Submit Error */}
              {submitError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs font-medium">
                  {submitError}
                </div>
              )}

              {/* Post My Space Button */}
              <button
                type="button"
                onClick={onSubmit}
                disabled={!isFormValid || isSubmitting}
                style={isFormValid ? { background: "linear-gradient(135deg, #1e3a8a 0%, #3b2fad 35%, #6d28d9 70%, #7c3aed 100%)" } : undefined}
                className={`w-full py-3.5 rounded-xl font-bold text-sm text-white flex items-center justify-center gap-2 transition-all shadow-md ${
                  isFormValid
                    ? "hover:opacity-95 active:scale-[0.99] cursor-pointer shadow-lg shadow-[#3b2fad]/25"
                    : "bg-slate-300 cursor-not-allowed opacity-70"
                }`}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    <span>{editMode ? "Updating..." : "Posting..."}</span>
                  </>
                ) : (
                  <>
                    <SendHorizontal size={16} />
                    <span>
                      {editMode
                        ? isPublicRoadside
                          ? "Update Roadside Parking"
                          : "Update My Space"
                        : isPublicRoadside
                        ? "Post Roadside Parking"
                        : "Post My Space"}
                    </span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* 4. RIGHT SIDEBAR (3 Cards) */}
          <DesktopFeatureAdsColumn
            onContactSupport={() => setShowSupportModal(true)}
            testId="postspace-right-column"
          />
        </div>
      </div>

      {/* Desktop: State / City Selector Modal */}
      <StateSelectorModal
        isOpen={showCitySelector}
        onClose={() => setShowCitySelector(false)}
        displayCities={displayCities}
        activeState={userState}
        onSelectCity={(cityId) => handleCityChange(cityId)}
        subtitle="Choose a state where you manage parking spaces"
      />

      {/* Desktop: Notifications Sheet */}
      <NotificationSheet
        open={notificationsOpen}
        onOpenChange={setNotificationsOpen}
        notifications={notifications}
        isClearing={isClearingNotifications}
        onClearAll={handleClearNotifications}
        onMarkAllRead={async () => {
          const uid = localStorage.getItem("userId");
          if (!uid) return;
          try {
            await fetch(getApiUrl(`/api/notifications/${uid}/read-all`), { method: "POST" });
            setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
          } catch (err) {
            console.error("Failed to mark all notifications as read:", err);
          }
        }}
        onNotificationClick={async (notification) => {
          try {
            await fetch(getApiUrl(`/api/notifications/${notification.id}/read`), { method: "PATCH" });
            setNotifications((prev) =>
              prev.map((n) => (n.id === notification.id ? { ...n, isRead: true } : n))
            );
          } catch (err) {
            console.error("Failed to mark notification as read:", err);
          }
          setNotificationsOpen(false);
        }}
      />

      {/* ═══ SUPPORT MODAL ═══ */}
      <AnimatePresence>
        {showSupportModal && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs font-sans cursor-pointer" onClick={() => setShowSupportModal(false)}>
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-100 text-center cursor-default"
              onClick={(e) => e.stopPropagation()}
            >
              <div
                style={{ background: "linear-gradient(135deg, #1e3a8a 0%, #3b2fad 35%, #6d28d9 70%, #7c3aed 100%)" }}
                className="w-14 h-14 rounded-2xl text-white flex items-center justify-center mx-auto mb-3 shadow-md shadow-[#3b2fad]/25"
              >
                <Phone size={24} />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-1">Provider Support</h3>
              <p className="text-xs text-slate-500 mb-5">
                We're here to assist you with your parking space listings.
              </p>

              <div className="space-y-2.5 mb-6 text-left">
                <a
                  href="tel:+919876543210"
                  className="flex items-center gap-3 p-3 rounded-2xl bg-emerald-50 text-emerald-800 border border-emerald-100 hover:bg-emerald-100 transition-colors"
                >
                  <Phone size={16} className="text-emerald-600" />
                  <div>
                    <p className="text-xs font-bold">Call Support</p>
                    <p className="text-[11px] text-emerald-700">+91 98765 43210</p>
                  </div>
                </a>
                <a
                  href="mailto:support@spotly.in"
                  className="flex items-center gap-3 p-3 rounded-2xl bg-indigo-50 text-indigo-800 border border-indigo-100 hover:bg-indigo-100 transition-colors"
                >
                  <Mail size={16} className="text-indigo-600" />
                  <div>
                    <p className="text-xs font-bold">Email Support</p>
                    <p className="text-[11px] text-indigo-700">support@spotly.in</p>
                  </div>
                </a>
              </div>

              <button
                type="button"
                onClick={() => setShowSupportModal(false)}
                className="w-full py-2.5 rounded-xl bg-slate-900 text-white font-bold text-xs hover:bg-slate-800 transition-all cursor-pointer"
              >
                Close
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ═══ SEEKER LOGOUT CONFIRMATION MODAL ═══ */}
      <AnimatePresence>
        {showSeekerLogoutConfirm && (
          <motion.div
            className="fixed inset-0 z-[10000] flex items-center justify-center px-6"
            style={{ backgroundColor: "rgba(0,0,0,0.55)", backdropFilter: "blur(4px)" }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowSeekerLogoutConfirm(false)}
            data-testid="dialog-switch-seeker"
          >
            <motion.div
              className="w-full max-w-[340px] rounded-3xl overflow-hidden shadow-2xl bg-white relative font-sans"
              initial={{ scale: 0.85, y: 20, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: "spring", stiffness: 320, damping: 26 }}
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setShowSeekerLogoutConfirm(false)}
                className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 backdrop-blur-md flex items-center justify-center text-white z-10 cursor-pointer border border-white/20"
                data-testid="button-close-seeker-logout"
                aria-label="Close"
              >
                <X size={16} />
              </button>

              <div
                style={{ background: "linear-gradient(135deg, #1e3a8a 0%, #3b2fad 35%, #6d28d9 70%, #7c3aed 100%)" }}
                className="px-6 pt-7 pb-5 text-center relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -translate-y-6 translate-x-6 pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-24 h-24 bg-amber-400/20 rounded-full blur-xl translate-y-4 -translate-x-4 pointer-events-none" />

                <div className="relative z-10">
                  <div className="w-16 h-16 mx-auto mb-3 rounded-2xl bg-white/20 border border-white/25 flex items-center justify-center shadow-xl shadow-indigo-950/40">
                    <LogOut size={28} className="text-white translate-x-0.5" />
                  </div>
                  <h3 className="text-white text-xl font-black mb-1 font-heading tracking-tight">
                    Switch to Seeker
                  </h3>
                  <p className="text-white/90 text-xs font-medium leading-relaxed">
                    Find safe &amp; affordable parking spots
                  </p>
                </div>
              </div>

              <div className="px-6 pt-5 pb-6 bg-white">
                <p className="text-xs text-slate-600 text-center font-medium leading-relaxed mb-5">
                  You are currently signed in as a <span className="font-bold text-slate-800">Space Provider</span>. Please log out to access the Space Seeker portal.
                </p>
                <button
                  onClick={handleSeekerLogoutConfirm}
                  style={{ background: "linear-gradient(135deg, #1e3a8a 0%, #3b2fad 35%, #6d28d9 70%, #7c3aed 100%)" }}
                  className="w-full h-13 rounded-2xl hover:opacity-95 text-white font-black text-sm uppercase tracking-wider shadow-xl shadow-[#3b2fad]/30 active:scale-[0.98] transition-all cursor-pointer flex items-center justify-center gap-2"
                  data-testid="button-confirm-seeker-logout"
                >
                  <span>Logout &amp; Login</span>
                  <ArrowRight size={16} />
                </button>
                <button
                  onClick={() => setShowSeekerLogoutConfirm(false)}
                  className="w-full h-11 mt-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs active:scale-[0.98] transition-all cursor-pointer"
                  data-testid="button-cancel-seeker-logout"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
