import React, { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import DesktopHeader from "@/components/layout/desktop-header";
import {
  MapPin,
  Calendar,
  IndianRupee,
  Wallet,
  Star,
  Bell,
  HelpCircle,
  Plus,
  ParkingCircle,
  MoreVertical,
  Clock,
  Check,
  X,
  ArrowUpRight,
  TrendingUp,
  Car,
  Bike,
  Sparkles,
  Phone,
  Mail,
  ChevronRight,
  Eye,
  Settings,
  Trash2,
  LogOut,
  ArrowRight,
  Pencil,
  ChevronLeft,
  Image as ImageIcon,
  AlertTriangle,
  Flame,
  ThumbsUp,
  Heart,
  Navigation,
  Lock,
  LogIn,
  CheckCircle2,
  MessageSquare,
} from "lucide-react";
import { useAuthGuard } from "@/contexts/auth-guard";
import { isGuest } from "@/lib/guest";
import { getTimeGreeting, capitalizeName } from "@/lib/utils";
import { getApiUrl } from "@/lib/api-config";
import SpaceProviderDesktopPostSpace from "@/components/space-provider-desktop-post-space";
import { useSpacePostForm } from "@/hooks/use-space-post-form";
import SwiggyLocationPicker from "@/components/swiggy-location-picker";
import DesktopFeatureAdsColumn from "@/components/desktop-feature-ads-column";
import GuestSpacesCard from "@/components/guest-spaces-card";
import {
  ProviderDesktopSpaceSkeleton,
  ProviderModalListSkeleton,
} from "@/components/provider-space-skeleton";

export const DELETE_SPACE_REASONS = [
  { id: "rented", label: "Space already rented / occupied" },
  { id: "other", label: "Other reason" },
];

export interface ProviderSpaceItem {
  id: string;
  title: string;
  location: string;
  locationShort?: string;
  rent: number;
  rentUnit?: string;
  status: "Active" | "Pending" | "Inactive";
  occupancyPercent: number | null;
  photoUrl: string;
  photos?: string[];
  type: "car" | "bike" | "both";
  duration?: string;
  vehicleSize?: string;
  postedDate?: string | null;
  postedTimeFormatted?: string | null;
  dateText?: string | null;
  timeText?: string | null;
  endTimeText?: string | null;
  interestCount?: number;
  description?: string;
  rating?: number;
  reviewsCount?: number;
}

interface BookingRequestItem {
  id: string;
  userName: string;
  avatar: string;
  amount: number;
  vehicleType: string;
  dates: string;
  timeAgo: string;
  status: "pending" | "accepted" | "declined";
}

interface SpaceProviderDesktopHomeProps {
  myBookings?: any[];
  userName?: string;
  onNotificationsOpen?: () => void;
  unreadCount?: number;
  onShowCitySelector?: () => void;
  interestCounts?: Record<string, number>;
  onDeleteSpace?: (bookingId: string) => void | Promise<void>;
  locationLabel?: string;
  isLoading?: boolean;
}

export default function SpaceProviderDesktopHome({
  myBookings = [],
  userName = "",
  onNotificationsOpen,
  unreadCount = 0,
  onShowCitySelector,
  interestCounts = {},
  onDeleteSpace,
  locationLabel,
  isLoading = false,
}: SpaceProviderDesktopHomeProps) {
  const [, setLocation] = useLocation();
  const { requireLogin } = useAuthGuard();

  const getInitialTab = () => {
    if (typeof window !== "undefined") {
      const paramTab = new URLSearchParams(window.location.search).get("tab");
      if (paramTab && ["add-space", "my-spaces"].includes(paramTab)) {
        return paramTab;
      }
    }
    return "my-spaces";
  };

  const [activeTab, setActiveTab] = useState<string>(getInitialTab);

  const handleTabChange = React.useCallback((tab: string) => {
    setActiveTab(tab);
    if (typeof window !== "undefined") {
      const search = tab === "my-spaces" ? "" : `?tab=${tab}`;
      const newUrl = `/space-provider/home${search}`;
      window.history.replaceState(null, "", newUrl);
    }
  }, []);

  useEffect(() => {
    const handlePopState = () => {
      const paramTab = new URLSearchParams(window.location.search).get("tab") || "my-spaces";
      setActiveTab(paramTab);
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  const postForm = useSpacePostForm({
    onSuccess: () => {
      handleTabChange("my-spaces");
    },
  });
  const [spaceFilter, setSpaceFilter] = useState<"all" | "active" | "pending">("all");
  const [selectedSpaceForView, setSelectedSpaceForView] = useState<ProviderSpaceItem | null>(null);
  const [modalPhotoIndex, setModalPhotoIndex] = useState<number>(0);
  const [selectedSpaceForManage, setSelectedSpaceForManage] = useState<ProviderSpaceItem | null>(null);
  const [showSupportModal, setShowSupportModal] = useState(false);
  const [emailCopiedDesktop, setEmailCopiedDesktop] = useState(false);
  const [showEarningsModal, setShowEarningsModal] = useState(false);
  const [showRequestsModal, setShowRequestsModal] = useState(false);
  const [showSeekerLogoutConfirm, setShowSeekerLogoutConfirm] = useState(false);
  const [activeBarHover, setActiveBarHover] = useState<string | null>("Sep");
  const [deleteSpaceId, setDeleteSpaceId] = useState<string | null>(null);
  const [deleteConfirmStep, setDeleteConfirmStep] = useState<"step1" | "step2">("step1");
  const [selectedDeleteReason, setSelectedDeleteReason] = useState<string | null>(null);
  const [otherDeleteReason, setOtherDeleteReason] = useState<string>("");
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  const [localInterestCounts, setLocalInterestCounts] = useState<Record<string, number>>(interestCounts);

  useEffect(() => {
    if (interestCounts && Object.keys(interestCounts).length > 0) {
      setLocalInterestCounts(interestCounts);
    }
  }, [interestCounts]);

  // Live polling so contact view / interest count updates automatically
  useEffect(() => {
    if (!myBookings || myBookings.length === 0) return;
    const fetchInterests = async () => {
      const ids = myBookings.map((b: any) => b.id).filter(Boolean).join(",");
      if (!ids) return;
      try {
        const res = await fetch(getApiUrl(`/api/interests/counts?ids=${ids}`));
        if (res.ok) {
          const data = await res.json();
          setLocalInterestCounts(data.counts || {});
        }
      } catch { }
    };
    fetchInterests();
    const interval = setInterval(fetchInterests, 8000);
    return () => clearInterval(interval);
  }, [myBookings]);

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

  // Booking requests state
  const [requests, setRequests] = useState<BookingRequestItem[]>([]);

  // Transform real provider bookings if available, else empty when not logged in or no spaces
  const displayedSpaces: ProviderSpaceItem[] = React.useMemo(() => {
    if (!isProviderLoggedIn || !myBookings || myBookings.length === 0) {
      return [];
    }

    const parsedReal = myBookings.map((b: any, index: number) => {
      const rentMatch = b.comments?.match(/Rent:\s*₹?(\d+)\/?(\w+)?/i);
      const rentAmount = rentMatch ? parseInt(rentMatch[1], 10) : (b.totalAmount || 5000);
      const rentUnit = rentMatch && rentMatch[2] ? rentMatch[2] : "month";

      const durationMatch = b.comments?.match(/\|\s*Duration:\s*([^|\[]+)/i);
      const durationText = durationMatch ? durationMatch[1].trim() : "Monthly";

      const sizeMatch = b.comments?.match(/Vehicle Size:\s*([^|\[]+)/i) || b.comments?.match(/Size:\s*([^|\[]+)/i);
      const vehicleSizeText = sizeMatch ? sizeMatch[1].trim() : "All";

      const dateMatch = b.comments?.match(/\|\s*Date:\s*([^|\[]+)/i);
      const dateText = dateMatch ? dateMatch[1].trim() : null;

      const timeMatch = b.comments?.match(/\|\s*Time:\s*([^|\[]+)/i);
      const timeText = timeMatch ? timeMatch[1].trim() : null;

      const endTimeMatch = b.comments?.match(/\|\s*End Time:\s*([^|\[]+)/i);
      const endTimeText = endTimeMatch ? endTimeMatch[1].trim() : null;

      let allPhotos: string[] = [];
      if (Array.isArray(b.photos) && b.photos.length > 0) {
        allPhotos = b.photos;
      } else if (b.comments) {
        const photosMatch = b.comments.match(/\[PHOTOS\]([\s\S]*?)\[\/PHOTOS\]/);
        if (photosMatch) {
          try {
            const arr = JSON.parse(photosMatch[1]);
            if (Array.isArray(arr) && arr.length > 0) allPhotos = arr;
          } catch { }
        }
      }
      if (allPhotos.length === 0) {
        if (b.photoUrl) allPhotos.push(b.photoUrl);
        else if (b.imageUrl) allPhotos.push(b.imageUrl);
      }
      if (allPhotos.length === 0) {
        allPhotos.push(
          b.parkingType === "bike"
            ? "https://images.unsplash.com/photo-1558981806-ec527fa84c39?auto=format&fit=crop&w=800&q=80"
            : "https://images.unsplash.com/photo-1590674899484-d5640e854abe?auto=format&fit=crop&w=800&q=80"
        );
      }

      // Clean actual description from comments
      const cleanDescription = (b.comments || "")
        .replace(/\[PHOTOS\][\s\S]*?\[\/PHOTOS\]/, "")
        .replace(/\[PHOTOS_COUNT:\d+\]/, "")
        .replace(/Rent:[^|]*/i, "")
        .replace(/\|\s*Duration:[^|]*/i, "")
        .replace(/\|\s*Date:[^|]*/i, "")
        .replace(/\|\s*Time:[^|]*/i, "")
        .replace(/\|\s*End Time:[^|]*/i, "")
        .replace(/Vehicle Size:[^|]*/i, "")
        .replace(/\|/g, " ")
        .trim();

      const pDate = b.bookedAt ? new Date(b.bookedAt) : new Date();
      const postedDate = pDate.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
      const postedTimeFormatted = `${postedDate} at ${pDate.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }).toLowerCase()}`;
      const locationShort = b.location?.split(",").slice(0, 2).join(",").trim() || b.location || "Bengaluru";
      const intCount = (localInterestCounts && localInterestCounts[b.id]) || (interestCounts && interestCounts[b.id]) || 0;

      return {
        id: b.id || `real-${index}`,
        title: b.serviceName || "Parking Space",
        location: b.location || "Bengaluru",
        locationShort: locationShort,
        rent: rentAmount,
        rentUnit: rentUnit,
        status: (b.status === "pending" ? "Pending" : "Active") as "Active" | "Pending",
        occupancyPercent: b.status === "pending" ? null : 75,
        photoUrl: allPhotos[0],
        photos: allPhotos,
        type: (b.parkingType || "car") as "car" | "bike" | "both",
        duration: durationText,
        vehicleSize: vehicleSizeText,
        postedDate: postedDate,
        postedTimeFormatted: postedTimeFormatted,
        dateText: dateText,
        timeText: timeText,
        endTimeText: endTimeText,
        interestCount: intCount,
        description: cleanDescription || "No additional description provided.",
      };
    });

    return parsedReal;
  }, [isProviderLoggedIn, myBookings, localInterestCounts, interestCounts]);

  const handleRequestAction = (id: string, action: "accepted" | "declined") => {
    setRequests((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status: action } : r))
    );
  };

  const pendingRequestsCount = requests.filter((r) => r.status === "pending").length;

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-800">
      {/* ═══════════════════════════════════════════════ */}
      {/* TOP DESKTOP HEADER (Shared Gradient Header)   */}
      {/* ═══════════════════════════════════════════════ */}
      <DesktopHeader
        userRole="provider"
        activeTab={activeTab}
        onTabChange={(tab) => handleTabChange(tab)}
        userName={userName}
        onShowCitySelector={onShowCitySelector}
        onNotificationsOpen={onNotificationsOpen}
        unreadCount={unreadCount}
        locationLabel={locationLabel}
      />

      {/* ═══════════════════════════════════════════════ */}
      {/* MAIN LAYOUT: Left Sidebar + Center + Right    */}
      {/* ═══════════════════════════════════════════════ */}
      <div className="flex pt-14 min-h-[calc(100vh-3.5rem)]">
        {/* ───────────────────────────────────────────── */}
        {/* LEFT SIDEBAR (210px fixed)                    */}
        {/* ───────────────────────────────────────────── */}
        <aside className="w-[210px] shrink-0 bg-white border-r border-slate-200/80 fixed top-14 bottom-0 left-0 z-30 flex flex-col justify-between overflow-y-auto">
          {/* Top navigation list */}
          <div className="py-4 px-3">
            <nav className="space-y-1">
              {[
                { id: "my-spaces", label: "My Spaces", icon: MapPin, badge: isProviderLoggedIn && displayedSpaces.length > 0 ? displayedSpaces.length : undefined },
                { id: "add-space", label: "Add Space", icon: Plus },
                { id: "notifications", label: "Notifications", icon: Bell, badge: isProviderLoggedIn && unreadCount > 0 ? unreadCount : undefined },
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
                        if (!requireLogin("view notifications")) return;
                        if (onNotificationsOpen) onNotificationsOpen();
                      } else if (item.id === "add-space") {
                        if (!requireLogin("add a parking space")) return;
                        handleTabChange(item.id);
                      } else if (item.id === "my-spaces") {
                        if (!requireLogin("view your listed spaces")) return;
                        handleTabChange(item.id);
                      } else if (item.id === "favourites") {
                        setLocation("/space-seeker/home?filter=favourites");
                      } else if (item.id === "earnings") {
                        if (!requireLogin("view your earnings")) return;
                        setShowEarningsModal(true);
                      } else if (item.id === "requests") {
                        if (!requireLogin("view booking requests")) return;
                        setShowRequestsModal(true);
                      } else {
                        handleTabChange(item.id);
                      }
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-[13px] font-medium transition-all cursor-pointer ${isActive
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
                      <span className={`w-5 h-5 rounded-full text-[10px] font-bold flex items-center justify-center ${isActive ? "bg-white text-[#241e98]" : "bg-[#241e98] text-white"}`}>
                        {item.badge}
                      </span>
                    ) : null}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Bottom CTA Card: "Become a Seeker" */}
          <div className="px-3 pb-4">
            <div className="bg-gradient-to-br from-[#eae8ff] to-[#d6d2ff] rounded-xl p-4 border border-[#d0ccff]">
              {/* Car illustration */}
              <div className="flex justify-center mb-3">
                <div className="relative">
                  <svg width="80" height="60" viewBox="0 0 80 60" fill="none">
                    {/* Road line */}
                    <rect x="5" y="48" width="70" height="2" rx="1" fill="#241e98" opacity="0.12" />
                    {/* Car body */}
                    <path d="M15 38 L15 32 Q15 28 19 28 L22 28 L28 20 Q30 18 34 18 L46 18 Q50 18 52 20 L58 28 L61 28 Q65 28 65 32 L65 38 Q65 40 63 40 L17 40 Q15 40 15 38 Z" fill="#241e98" opacity="0.85" />
                    {/* Windows */}
                    <path d="M30 28 L34 21 Q35 20 37 20 L43 20 Q45 20 46 21 L50 28 Z" fill="#8b85e0" opacity="0.7" />
                    {/* Headlights */}
                    <rect x="16" y="32" width="4" height="2" rx="1" fill="#fbbf24" opacity="0.9" />
                    <rect x="60" y="32" width="4" height="2" rx="1" fill="#fbbf24" opacity="0.9" />
                    {/* Wheels */}
                    <circle cx="27" cy="41" r="5" fill="#1a1464" />
                    <circle cx="27" cy="41" r="2.5" fill="#444" />
                    <circle cx="53" cy="41" r="5" fill="#1a1464" />
                    <circle cx="53" cy="41" r="2.5" fill="#444" />
                    {/* P bubble */}
                    <circle cx="56" cy="10" r="10" fill="#241e98" />
                    <circle cx="56" cy="10" r="10" fill="#241e98" stroke="white" strokeWidth="1.5" />
                    <text x="56" y="14" textAnchor="middle" fontSize="12" fill="white" fontWeight="bold">P</text>
                    {/* Bubble tail */}
                    <path d="M50 17 L53 22 L48 20 Z" fill="#241e98" />
                  </svg>
                </div>
              </div>
              <p className="text-[13px] font-bold text-gray-800 leading-tight">Need a parking<br />space?</p>
              <p className="text-[10px] text-gray-500 mt-1.5 leading-relaxed">Find safe &amp; affordable<br />parking spots near you.</p>
              <button
                type="button"
                onClick={handleBecomeSeekerClick}
                className="mt-3 w-full flex items-center justify-center gap-1.5 py-2 bg-gradient-to-r from-[#241e98] via-[#2b24b1] to-[#3e3ab3] hover:from-[#1b1778] hover:to-[#2e2a97] text-white text-[11px] font-bold rounded-lg shadow-md shadow-[#241e98]/25 transition-all cursor-pointer"
                data-testid="button-become-seeker"
              >
                Become a Seeker <ArrowRight size={12} />
              </button>
            </div>
          </div>
        </aside>

        {/* ───────────────────────────────────────────── */}
        {/* MAIN CONTENT (Full width)                     */}
        {/* ───────────────────────────────────────────── */}
        <main className="flex-1 ml-[210px] px-8 py-6 overflow-y-auto min-h-screen">
          {activeTab === "my-spaces" ? (
            /* ═══ MY SPACES TAB ONLY: YOUR PARKING SPACES ═══ */
            <div className="flex gap-8 justify-center min-w-0 w-full">
              {/* ── Main Spaces Column ── */}
              <div className="flex-1 min-w-0">
                {!isProviderLoggedIn ? (
                  <GuestSpacesCard
                    badgeText="PARKING SPACES"
                    title="Sign in to explore parking spaces"
                    description="Create a free account or sign in to discover parking options and manage your listings."
                    buttonText="Sign in or create account"
                    onAction={() => requireLogin("view your listed spaces")}
                    footerText="Free to create an account · Your parking journey starts here"
                    testIdPrefix="myspaces-guest"
                  />
                ) : isLoading ? (
                  <ProviderDesktopSpaceSkeleton count={3} />
                ) : displayedSpaces.length === 0 ? (
                  <div className="flex flex-col items-center justify-center min-h-[460px] text-center p-8 bg-white rounded-3xl border border-slate-200/80 shadow-xs max-w-xl mx-auto my-6">
                    <div className="w-20 h-20 rounded-3xl bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-400 mb-5 shadow-sm">
                      <MapPin size={36} />
                    </div>
                    <h2 className="text-2xl font-black text-slate-900 tracking-tight mb-2">
                      No Parking Spaces Listed Yet
                    </h2>
                    <p className="text-sm text-slate-500 max-w-md leading-relaxed mb-6">
                      You haven't listed any parking spaces yet. Start earning monthly passive income by adding your first parking space today!
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        if (!requireLogin("add a parking space")) return;
                        handleTabChange("add-space");
                      }}
                      className="px-6 py-3 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-black text-xs shadow-md shadow-amber-500/20 transition-all cursor-pointer inline-flex items-center gap-2 active:scale-95"
                      data-testid="button-add-first-space"
                    >
                      <Plus size={16} className="stroke-[3]" />
                      Add Your First Space
                    </button>
                  </div>
                ) : (
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <div className="flex items-center gap-2.5">
                          <h2 className="text-xl font-black text-slate-900 tracking-tight">Your Parking Spaces</h2>
                          <span
                            className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-black text-white shadow-xs"
                            style={{
                              background: "linear-gradient(135deg, #1e3a8a 0%, #3b2fad 35%, #6d28d9 70%, #7c3aed 100%)",
                            }}
                            data-testid="badge-post-count"
                          >
                            {displayedSpaces.length} {displayedSpaces.length === 1 ? "Space" : "Spaces"}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">
                          Manage and monitor all your {displayedSpaces.length} listed parking spot{displayedSpaces.length === 1 ? "" : "s"}.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          if (!requireLogin("add a parking space")) return;
                          handleTabChange("add-space");
                        }}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-bold text-xs shadow-sm active:scale-95 transition-all cursor-pointer"
                        data-testid="button-add-space-myspaces"
                      >
                        <Plus size={14} className="stroke-[3]" />
                        Add New Space
                      </button>
                    </div>

                    {/* Spaces Cards List (All listed spaces directly displayed) */}
                    <div className="space-y-3.5">
                      {displayedSpaces.map((space) => {
                        const isPending = space.status === "Pending";
                        const interestCount = space.interestCount || 0;

                        return (
                          <div
                            key={space.id}
                            className="bg-white rounded-3xl border border-slate-200/90 p-5 shadow-xs hover:shadow-md hover:border-indigo-200 transition-all duration-200 flex flex-col xl:flex-row xl:items-center justify-between gap-5 group"
                          >
                            {/* Left Section: Image Thumbnail + Details */}
                            <div className="flex items-start sm:items-center gap-4 sm:gap-5 min-w-0 flex-1">
                              {/* Image Thumbnail with category badge and count */}
                              <div
                                className="w-32 h-26 sm:w-36 sm:h-28 rounded-2xl overflow-hidden bg-slate-900 shrink-0 relative shadow-xs cursor-pointer group/img"
                                onClick={() => {
                                  setModalPhotoIndex(0);
                                  setSelectedSpaceForView(space);
                                }}
                                title="Click to view full photos"
                              >
                                <img
                                  src={space.photoUrl}
                                  alt={space.title}
                                  className="w-full h-full object-cover group-hover/img:scale-105 transition-transform duration-300"
                                  onError={(e) => {
                                    (e.currentTarget as HTMLImageElement).src =
                                      "https://images.unsplash.com/photo-1590674899484-d5640e854abe?auto=format&fit=crop&w=400&q=80";
                                  }}
                                />
                                {/* Category Pill Top-Left (Exact styling from mobile) */}
                                <div className="absolute top-2 left-2 bg-[#241e98] text-white text-[10px] font-extrabold px-2.5 py-0.5 rounded-lg uppercase tracking-wider shadow-xs z-10">
                                  {space.type === "both" ? "CAR & BIKE" : space.type === "bike" ? "BIKE" : "CAR"}
                                </div>
                                {/* Photos Count Bottom-Left */}
                                {space.photos && space.photos.length > 0 && (
                                  <div className="absolute bottom-2 left-2 bg-slate-950/70 backdrop-blur-xs text-white text-[10px] font-extrabold px-2 py-0.5 rounded-lg flex items-center gap-1 z-10">
                                    <ImageIcon size={11} />
                                    <span>{space.photos.length}</span>
                                  </div>
                                )}
                              </div>

                              {/* Info Column */}
                              <div className="min-w-0 flex-1 space-y-1.5">
                                {/* Location Row & Status Badges */}
                                <div className="flex items-center gap-2 flex-wrap">
                                  <div className="flex items-center gap-1.5 min-w-0">
                                    <MapPin size={15} className="text-slate-400 shrink-0" />
                                    <h4
                                      className="font-extrabold text-slate-800 text-[13.5px] leading-tight truncate"
                                      title={space.location}
                                    >
                                      {space.locationShort || space.location}
                                    </h4>
                                  </div>

                                  {/* Interest Alert Badge (Based on seekers who viewed contact number) */}
                                  {interestCount > 0 ? (
                                    <div
                                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 text-white text-[11.5px] font-black shadow-xs shrink-0"
                                      title={`${interestCount} seeker${interestCount === 1 ? "" : "s"} viewed your contact number`}
                                      data-testid={`badge-interest-${space.id}`}
                                    >
                                      <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                                      <Heart size={12} className="fill-white stroke-[2]" />
                                      <span>{interestCount} {interestCount === 1 ? "seeker" : "seekers"} Interested</span>
                                    </div>
                                  ) : (
                                    <div
                                      className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-500 text-[11px] font-semibold border border-slate-200/70 shrink-0"
                                      title="No seekers have viewed contact details yet"
                                      data-testid={`badge-interest-${space.id}`}
                                    >
                                      <Heart size={11} className="text-slate-400 fill-slate-300" />
                                      <span>0 seekers Interested</span>
                                    </div>
                                  )}
                                </div>

                                {/* Date and Time Row */}
                                <div className="flex items-center gap-1.5 text-slate-500 text-[11.5px] font-medium">
                                  <Clock size={13} className="text-slate-400 shrink-0" />
                                  <span>
                                    {space.postedTimeFormatted || space.postedDate || "Recently Listed"}
                                  </span>
                                </div>

                                {/* Badges Row (Rent + Duration + Vehicle Spec + Slots) */}
                                <div className="flex items-center gap-2 flex-wrap pt-0.5">
                                  {/* Rent Pill */}
                                  <span className="bg-[#E7FAEE] text-[#10B981] text-xs font-black px-3 py-1 rounded-full border border-[#10B981]/20 shadow-2xs">
                                    ₹{space.rent ? space.rent.toLocaleString() : "1"}/{space.rentUnit || "month"}
                                  </span>


                                  {/* Vehicle Spec Pill */}
                                  <span className="bg-[#ECEBFF] text-[#241e98] text-[11px] font-black px-3 py-1 rounded-full border border-[#241e98]/20 flex items-center gap-1 shadow-2xs">
                                    <Car size={11} />
                                    {space.vehicleSize || "All"}
                                  </span>

                                  {/* Slot Date / Time if available */}
                                  {(space.dateText || space.timeText) && (
                                    <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500">
                                      {space.dateText && (
                                        <span className="flex items-center gap-1 bg-slate-50 border border-slate-200 px-2 py-0.5 rounded-lg">
                                          📆 {new Date(space.dateText).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                                        </span>
                                      )}
                                      {space.timeText && (
                                        <span className="flex items-center gap-1 bg-slate-50 border border-slate-200 px-2 py-0.5 rounded-lg">
                                          ⏰ {space.timeText}{space.endTimeText ? ` → ${space.endTimeText}` : ""}
                                        </span>
                                      )}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* Right Section: Action Buttons Stacked Line-by-Line Vertically */}
                            <div className="flex flex-col gap-2 shrink-0 w-full sm:w-36 pt-3 xl:pt-0 border-t xl:border-t-0 border-slate-100 justify-center">
                              {/* Edit Space Button */}
                              <button
                                type="button"
                                onClick={() => {
                                  if (space.id && !space.id.startsWith("sample-")) {
                                    setLocation(`/space-provider/bookings?edit=${space.id}`);
                                  } else {
                                    setLocation("/space-provider/bookings");
                                  }
                                }}
                                className="w-full py-2 px-3 bg-[#ECEBFF] hover:bg-[#DEDCFF] text-[#241e98] font-extrabold text-xs rounded-xl flex items-center justify-center gap-1.5 active:scale-95 transition-all shadow-2xs border border-[#241e98]/20 cursor-pointer"
                                data-testid={`button-edit-space-${space.id}`}
                              >
                                <Pencil size={13} />
                                <span>Edit Space</span>
                              </button>

                              {/* Delete Space Button */}
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedDeleteReason(null);
                                  setOtherDeleteReason("");
                                  setDeleteSpaceId(space.id);
                                  setDeleteConfirmStep("step1");
                                }}
                                className="w-full py-2 px-3 bg-[#FFF1F2] hover:bg-[#FFE4E6] text-[#E11D48] font-extrabold text-xs rounded-xl flex items-center justify-center gap-1.5 active:scale-95 transition-all shadow-2xs border border-[#E11D48]/15 cursor-pointer"
                                data-testid={`button-delete-space-${space.id}`}
                              >
                                <Trash2 size={13} />
                                <span>Delete Space</span>
                              </button>

                              {/* View Button */}
                              <button
                                type="button"
                                onClick={() => {
                                  setModalPhotoIndex(0);
                                  setSelectedSpaceForView(space);
                                }}
                                className="w-full py-2 px-3 rounded-xl border border-slate-200 hover:border-slate-300 text-slate-700 hover:bg-slate-50 text-xs font-bold transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-1.5"
                                data-testid={`button-view-space-${space.id}`}
                                title="View Full Details"
                              >
                                <Eye size={13} />
                                <span>View</span>
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Bottom Dashed "Add New Space" full-width button */}
                    <button
                      type="button"
                      onClick={() => {
                        if (!requireLogin("add a parking space")) return;
                        handleTabChange("add-space");
                      }}
                      className="mt-4 w-full py-3.5 rounded-2xl border-2 border-dashed border-indigo-200 bg-indigo-50/30 hover:bg-indigo-50 text-[#241e98] font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-2xs"
                      data-testid="dashed-button-add-space"
                    >
                      <Plus size={16} className="stroke-[3]" />
                      Add New Space
                    </button>
                  </div>
                )}
              </div>

              {/* ── Right Column: Feature Cards & Support ── */}
              <DesktopFeatureAdsColumn
                onContactSupport={() => setShowSupportModal(true)}
                testId="myspaces-right-column"
              />
            </div>
          ) : activeTab === "add-space" ? (
            /* ═══ ADD SPACE TAB (IN-PLACE POST SPACE FORM) ═══ */
            !isProviderLoggedIn ? (
              <div className="flex gap-8 justify-center min-w-0 w-full">
                {/* ── Main Column ── */}
                <div className="flex-1 min-w-0">
                  <GuestSpacesCard
                    badgeText="ADD PARKING SPACE"
                    title="Sign in to add a parking space"
                    description="Create a free account or sign in to list your unused parking space and start earning monthly passive income."
                    buttonText="Sign in or create account"
                    onAction={() => requireLogin("add a parking space")}
                    footerText="Free to create an account · Start earning monthly income today"
                    testIdPrefix="addspace-guest"
                  />
                </div>

                {/* ── Right Column: Feature Cards & Support ── */}
                <DesktopFeatureAdsColumn
                  onContactSupport={() => setShowSupportModal(true)}
                  testId="addspace-guest-right-column"
                />
              </div>
            ) : (
              <div className="w-full">
                <SpaceProviderDesktopPostSpace
                  embedMode={true}
                  onSuccess={() => handleTabChange("my-spaces")}
                  photos={postForm.photos}
                  onPhotoUpload={postForm.handlePhotoUpload}
                  onRemovePhoto={postForm.removePhoto}
                  fileInputRef={postForm.fileInputRef}
                  parkingDuration={postForm.parkingDuration}
                  setParkingDuration={postForm.setParkingDuration}
                  isPublicRoadside={postForm.isPublicRoadside}
                  setIsPublicRoadside={postForm.setIsPublicRoadside}
                  startDate={postForm.startDate}
                  setStartDate={postForm.setStartDate}
                  startTime={postForm.startTime}
                  setStartTime={postForm.setStartTime}
                  endTime={postForm.endTime}
                  setEndTime={postForm.setEndTime}
                  parkingType={postForm.parkingType}
                  setParkingType={postForm.setParkingType}
                  parkingTypes={postForm.parkingTypes}
                  setSelectedServiceId={postForm.setSelectedServiceId}
                  isCarSelected={postForm.isCarSelected}
                  vehicleSize={postForm.vehicleSize}
                  setVehicleSize={postForm.setVehicleSize}
                  address={postForm.address}
                  setAddress={postForm.setAddress}
                  onAutoDetect={postForm.handleAutoDetect}
                  isDetecting={postForm.isDetecting}
                  onOpenMapPicker={() => postForm.setShowLocationPickerModal(true)}
                  rent={postForm.rent}
                  setRent={postForm.setRent}
                  description={postForm.description}
                  setDescription={postForm.setDescription}
                  isFormValid={postForm.isFormValid}
                  missingFields={postForm.missingFields}
                  onSubmit={postForm.handleSubmit}
                  isSubmitting={postForm.isSubmitting}
                  submitError={postForm.submitError}
                  editMode={postForm.editMode}
                />
              </div>
            )
          ) : null}
        </main>

      </div>

      {/* ═══════════════════════════════════════════════ */}
      {/* MODAL: View Space Details                      */}
      {/* ═══════════════════════════════════════════════ */}
      <AnimatePresence>
        {selectedSpaceForView && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs cursor-pointer" onClick={() => setSelectedSpaceForView(null)}>
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl border border-slate-100 font-sans cursor-default"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Photo Area with Navigation */}
              <div className="relative h-64 bg-slate-900 overflow-hidden select-none">
                {(() => {
                  const photos =
                    selectedSpaceForView.photos && selectedSpaceForView.photos.length > 0
                      ? selectedSpaceForView.photos
                      : [selectedSpaceForView.photoUrl];
                  const currentPhoto = photos[modalPhotoIndex] || photos[0];

                  return (
                    <>
                      <img
                        key={currentPhoto}
                        src={currentPhoto}
                        alt={selectedSpaceForView.title}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.currentTarget as HTMLImageElement).src =
                            "https://images.unsplash.com/photo-1590674899484-d5640e854abe?auto=format&fit=crop&w=800&q=80";
                        }}
                      />

                      {/* Close Button */}
                      <button
                        type="button"
                        onClick={() => setSelectedSpaceForView(null)}
                        className="absolute top-3 right-3 w-8 h-8 rounded-full bg-slate-900/70 hover:bg-slate-900 text-white flex items-center justify-center transition-colors cursor-pointer z-20"
                        aria-label="Close modal"
                      >
                        <X size={16} />
                      </button>

                      {/* Status Badge */}
                      <span
                        className={`absolute bottom-3 left-4 px-2.5 py-1 rounded-full text-xs font-extrabold text-white z-10 ${selectedSpaceForView.status === "Pending" ? "bg-amber-500" : "bg-emerald-500"
                          }`}
                      >
                        {selectedSpaceForView.status === "Pending" ? "✦ Pending Approval" : "✓ Active"}
                      </span>

                      {/* Image Navigation Arrows (if multiple photos) */}
                      {photos.length > 1 && (
                        <>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setModalPhotoIndex((prev) => (prev > 0 ? prev - 1 : photos.length - 1));
                            }}
                            className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-slate-900/60 hover:bg-slate-900/90 text-white flex items-center justify-center transition-all cursor-pointer backdrop-blur-xs z-10"
                            aria-label="Previous image"
                          >
                            <ChevronLeft size={18} />
                          </button>

                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setModalPhotoIndex((prev) => (prev < photos.length - 1 ? prev + 1 : 0));
                            }}
                            className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-slate-900/60 hover:bg-slate-900/90 text-white flex items-center justify-center transition-all cursor-pointer backdrop-blur-xs z-10"
                            aria-label="Next image"
                          >
                            <ChevronRight size={18} />
                          </button>

                          {/* Image Counter Badge */}
                          <div className="absolute top-3 left-3 px-2 py-0.5 rounded-lg bg-slate-950/70 text-white text-[11px] font-bold backdrop-blur-xs flex items-center gap-1 z-10">
                            <ImageIcon size={12} />
                            <span>
                              {modalPhotoIndex + 1} / {photos.length}
                            </span>
                          </div>

                          {/* Dots */}
                          <div className="absolute bottom-3 right-4 flex items-center gap-1.5 z-10">
                            {photos.map((_, i) => (
                              <button
                                key={i}
                                type="button"
                                onClick={() => setModalPhotoIndex(i)}
                                className={`h-1.5 rounded-full transition-all cursor-pointer ${modalPhotoIndex === i ? "w-5 bg-white" : "w-1.5 bg-white/50 hover:bg-white/80"
                                  }`}
                              />
                            ))}
                          </div>
                        </>
                      )}
                    </>
                  );
                })()}
              </div>

              {/* Space Details Body (Only Actual Data, NO Dummy Ratings!) */}
              <div className="p-6">
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div>
                    <h3 className="text-xl font-bold text-slate-900 leading-tight">
                      {selectedSpaceForView.title}
                    </h3>
                    <p className="text-xs text-slate-500 flex items-center gap-1.5 mt-1">
                      <MapPin size={14} className="text-slate-400 shrink-0" />
                      <span>{selectedSpaceForView.location}</span>
                    </p>
                  </div>
                  <span className="px-2.5 py-1 rounded-xl bg-indigo-50 text-[#241e98] text-xs font-bold shrink-0 capitalize">
                    {selectedSpaceForView.type === "both" ? "Car & Bike" : selectedSpaceForView.type}
                  </span>
                </div>

                {/* Actual Data Metrics */}
                <div className="grid grid-cols-3 gap-2.5 p-3.5 rounded-2xl bg-slate-50 border border-slate-100 my-4 text-xs">
                  <div>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Rent</p>
                    <p className="text-base font-black text-slate-900 mt-0.5">
                      ₹{selectedSpaceForView.rent.toLocaleString()}
                      <span className="text-[11px] text-slate-500 font-normal">
                        /{selectedSpaceForView.rentUnit || "month"}
                      </span>
                    </p>
                  </div>

                  <div>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Duration</p>
                    <p className="text-xs font-bold text-slate-800 mt-1 flex items-center gap-1">
                      <Clock size={12} className="text-slate-400" />
                      {selectedSpaceForView.duration || "Monthly"}
                    </p>
                  </div>

                  <div>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Vehicle Fit</p>
                    <p className="text-xs font-bold text-slate-800 mt-1 capitalize truncate">
                      {selectedSpaceForView.vehicleSize ||
                        (selectedSpaceForView.type === "bike" ? "Two-Wheeler" : "Standard Car")}
                    </p>
                  </div>
                </div>

                {/* Actual Description */}
                <div className="mb-6">
                  <p className="text-[11px] text-slate-400 font-bold uppercase tracking-wider mb-1">
                    Space Description
                  </p>
                  <p className="text-xs text-slate-700 leading-relaxed bg-slate-50/70 p-3 rounded-xl border border-slate-100">
                    {selectedSpaceForView.description && selectedSpaceForView.description.trim().length > 0
                      ? selectedSpaceForView.description
                      : "No additional description provided."}
                  </p>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      const id = selectedSpaceForView.id;
                      setSelectedSpaceForView(null);
                      if (id && !id.startsWith("sample-")) {
                        setLocation(`/space-provider/bookings?edit=${id}`);
                      } else {
                        setLocation("/space-provider/bookings");
                      }
                    }}
                    className="flex-1 py-3 rounded-xl bg-[#241e98] hover:bg-[#1b1778] text-white text-xs font-bold transition-all shadow-md active:scale-95 cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <Pencil size={14} />
                    <span>Update Space</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedSpaceForView(null)}
                    className="px-5 py-3 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-bold transition-all active:scale-95 cursor-pointer"
                  >
                    Close
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ═══════════════════════════════════════════════ */}
      {/* MODAL: Manage Space Quick Actions              */}
      {/* ═══════════════════════════════════════════════ */}
      <AnimatePresence>
        {selectedSpaceForManage && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs cursor-pointer" onClick={() => setSelectedSpaceForManage(null)}>
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 cursor-default"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-[#241e98] flex items-center justify-center font-bold">
                    <Settings size={20} />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900">Manage Space</h3>
                    <p className="text-xs text-slate-500 truncate max-w-[240px]">
                      {selectedSpaceForManage.title}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedSpaceForManage(null)}
                  className="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="space-y-2.5 my-5">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedSpaceForManage(null);
                    setLocation(`/space-provider/bookings?edit=${selectedSpaceForManage.id}`);
                  }}
                  className="w-full flex items-center justify-between p-3.5 rounded-2xl border border-slate-200/80 hover:bg-indigo-50/50 hover:border-indigo-200 transition-all text-left cursor-pointer group"
                >
                  <div>
                    <p className="text-xs font-bold text-slate-900 group-hover:text-[#241e98]">
                      Edit Space Details &amp; Pricing
                    </p>
                    <p className="text-[11px] text-slate-500">
                      Update rent, parking duration, and photos
                    </p>
                  </div>
                  <ChevronRight size={16} className="text-slate-400 group-hover:text-[#241e98]" />
                </button>

                <button
                  type="button"
                  onClick={() => {
                    alert(`Status updated for ${selectedSpaceForManage.title}`);
                    setSelectedSpaceForManage(null);
                  }}
                  className="w-full flex items-center justify-between p-3.5 rounded-2xl border border-slate-200/80 hover:bg-slate-50 transition-all text-left cursor-pointer"
                >
                  <div>
                    <p className="text-xs font-bold text-slate-900">
                      Toggle Availability Status
                    </p>
                    <p className="text-[11px] text-slate-500">
                      Currently {selectedSpaceForManage.status}
                    </p>
                  </div>
                  <ChevronRight size={16} className="text-slate-400" />
                </button>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedSpaceForManage(null)}
                  className="w-full py-2.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-bold transition-all cursor-pointer"
                >
                  Done
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ═══════════════════════════════════════════════ */}
      {/* MODAL: Help & Support                           */}
      {/* ═══════════════════════════════════════════════ */}
      <AnimatePresence>
        {showSupportModal && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs cursor-pointer" onClick={() => setShowSupportModal(false)}>
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-100 text-center cursor-default"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-[#241e98] flex items-center justify-center mx-auto mb-3">
                <Phone size={24} />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-1">Provider Support</h3>
              <p className="text-xs text-slate-500 mb-5">
                We're here to assist you with your parking space listings.
              </p>

              <div className="space-y-2.5 mb-6 text-left">
                <a
                  href="tel:+916374770456"
                  className="flex items-center gap-3 p-3 rounded-2xl bg-emerald-50 text-emerald-800 border border-emerald-100 hover:bg-emerald-100 transition-colors"
                >
                  <Phone size={16} className="text-emerald-600" />
                  <div>
                    <p className="text-xs font-bold">Call Support</p>
                    <p className="text-[11px] text-emerald-700">+91 63747 70456</p>
                  </div>
                </a>
                <div
                  onClick={() => {
                    if (navigator.clipboard) {
                      navigator.clipboard.writeText("info@spotlyindia.org");
                    }
                    window.location.href = "mailto:info@spotlyindia.org";
                    setEmailCopiedDesktop(true);
                    setTimeout(() => setEmailCopiedDesktop(false), 2500);
                  }}
                  className="flex items-center justify-between p-3 rounded-2xl bg-indigo-50 text-indigo-800 border border-indigo-100 hover:bg-indigo-100 transition-colors cursor-pointer select-none"
                  title="Click to copy email and open email client"
                >
                  <div className="flex items-center gap-3">
                    <Mail size={16} className="text-indigo-600 shrink-0" />
                    <div>
                      <p className="text-xs font-bold">Email Support</p>
                      <p className="text-[11px] text-indigo-700 select-all">info@spotlyindia.org</p>
                    </div>
                  </div>
                  {emailCopiedDesktop ? (
                    <span className="text-[10px] font-black text-emerald-700 bg-emerald-100/90 px-2.5 py-0.5 rounded-full border border-emerald-300">
                      Copied! ✓
                    </span>
                  ) : (
                    <span className="text-[10px] font-bold text-[#241e98] bg-white px-2 py-0.5 rounded-lg border border-indigo-100 shadow-2xs">
                      Copy &amp; Open
                    </span>
                  )}
                </div>
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

      {/* ═══════════════════════════════════════════════ */}
      {/* MODAL: Full Booking Requests Modal              */}
      {/* ═══════════════════════════════════════════════ */}
      <AnimatePresence>
        {showRequestsModal && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs cursor-pointer" onClick={() => setShowRequestsModal(false)}>
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 cursor-default"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-slate-900">All Booking Requests</h3>
                <button
                  type="button"
                  onClick={() => setShowRequestsModal(false)}
                  className="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
                {requests.length === 0 ? (
                  <div className="py-12 text-center">
                    <p className="text-sm font-bold text-slate-700">No booking requests yet</p>
                    <p className="text-xs text-slate-400 mt-1 max-w-[280px] mx-auto">
                      When space seekers send booking requests for your listed spots, they will appear here.
                    </p>
                  </div>
                ) : (
                  requests.map((req) => (
                    <div
                      key={req.id}
                      className="p-4 rounded-2xl border border-slate-200/80 bg-slate-50/60"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <img
                            src={req.avatar}
                            alt={req.userName}
                            className="w-10 h-10 rounded-full object-cover"
                          />
                          <div>
                            <p className="text-sm font-bold text-slate-900">{req.userName}</p>
                            <p className="text-xs text-slate-500">{req.vehicleType}</p>
                          </div>
                        </div>
                        <span className="text-base font-black text-slate-900">
                          ₹{req.amount.toLocaleString()}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-xs text-slate-500 mb-3 pt-2 border-t border-slate-200/60">
                        <span>📅 {req.dates}</span>
                        <span>{req.timeAgo}</span>
                      </div>

                      {req.status === "pending" ? (
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleRequestAction(req.id, "accepted")}
                            className="flex-1 py-2 rounded-xl bg-[#241e98] hover:bg-[#1b1778] text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
                          >
                            Accept
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRequestAction(req.id, "declined")}
                            className="flex-1 py-2 rounded-xl border border-slate-300 text-slate-700 hover:bg-white text-xs font-bold transition-all cursor-pointer"
                          >
                            Decline
                          </button>
                        </div>
                      ) : (
                        <div
                          className={`text-center py-1.5 rounded-xl text-xs font-bold ${req.status === "accepted"
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200/60"
                            : "bg-red-50 text-red-600 border border-red-200/60"
                            }`}
                        >
                          {req.status === "accepted" ? "✓ Accepted" : "✕ Declined"}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>

              <div className="mt-5">
                <button
                  type="button"
                  onClick={() => setShowRequestsModal(false)}
                  className="w-full py-2.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-bold transition-all cursor-pointer"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ═══════════════════════════════════════════════ */}
      {/* MODAL: Full Earnings Details Modal              */}
      {/* ═══════════════════════════════════════════════ */}
      <AnimatePresence>
        {showEarningsModal && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs cursor-pointer" onClick={() => setShowEarningsModal(false)}>
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 cursor-default"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-slate-900">Earnings Breakdown</h3>
                <button
                  type="button"
                  onClick={() => setShowEarningsModal(false)}
                  className="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>

              {(() => {
                const totalEarnings = displayedSpaces.reduce((sum, s) => sum + (s.rent || 0), 0);
                return (
                  <>
                    <div className="p-4 rounded-2xl bg-indigo-50/50 border border-indigo-100 mb-4">
                      <p className="text-xs text-slate-500 font-semibold">Total Monthly Potential</p>
                      <p className="text-3xl font-black text-slate-900 mt-1">₹{totalEarnings.toLocaleString()}</p>
                      <p className="text-[11px] text-emerald-600 font-semibold mt-1">
                        Across {displayedSpaces.length} listed parking {displayedSpaces.length === 1 ? "space" : "spaces"}
                      </p>
                    </div>

                    <div className="space-y-2 mb-6 max-h-[220px] overflow-y-auto">
                      {isLoading ? (
                        <ProviderModalListSkeleton count={displayedSpaces.length || 2} />
                      ) : displayedSpaces.length === 0 ? (
                        <div className="py-8 text-center bg-slate-50 rounded-xl border border-slate-100">
                          <p className="text-xs font-bold text-slate-600">No listed spaces yet</p>
                          <p className="text-[11px] text-slate-400 mt-0.5">List your parking space to start tracking earnings.</p>
                        </div>
                      ) : (
                        displayedSpaces.map((space) => (
                          <div
                            key={space.id}
                            className="flex items-center justify-between p-3 rounded-xl border border-slate-100 bg-slate-50/50 text-xs"
                          >
                            <div className="min-w-0 flex-1 mr-2">
                              <p className="font-bold text-slate-900 truncate">{space.title || space.locationShort}</p>
                              <p className="text-[11px] text-slate-400">{space.vehicleSize} • {space.duration || "Monthly"}</p>
                            </div>
                            <span className="font-black text-slate-900 shrink-0">₹{(space.rent || 0).toLocaleString()}</span>
                          </div>
                        ))
                      )}
                    </div>
                  </>
                );
              })()}

              <button
                type="button"
                onClick={() => setShowEarningsModal(false)}
                className="w-full py-2.5 rounded-xl bg-slate-900 text-white font-bold text-xs hover:bg-slate-800 transition-all cursor-pointer"
              >
                Close
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ═══ SEEKER LOGOUT CONFIRMATION MODAL (STYLED IDENTICALLY TO LOGIN POPUP) ═══ */}
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
              {/* Close Button */}
              <button
                onClick={() => setShowSeekerLogoutConfirm(false)}
                className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 backdrop-blur-md flex items-center justify-center text-white z-10 cursor-pointer border border-white/20"
                data-testid="button-close-seeker-logout"
                aria-label="Close"
              >
                <X size={16} />
              </button>

              {/* Gradient Top Header */}
              <div className="bg-gradient-to-br from-[#1b1675] via-[#241e98] to-[#3e3ab3] px-6 pt-7 pb-5 text-center relative overflow-hidden">
                {/* Decorative background shapes */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-[#3e3ab3]/40 rounded-full blur-2xl -translate-y-6 translate-x-6 pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-24 h-24 bg-amber-400/20 rounded-full blur-xl translate-y-4 -translate-x-4 pointer-events-none" />

                <div className="relative z-10">
                  <div className="w-16 h-16 mx-auto mb-3 rounded-2xl bg-[#241e98] border border-white/25 flex items-center justify-center shadow-xl shadow-indigo-950/60">
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

              {/* White Body with Info & Action Buttons */}
              <div className="px-6 pt-5 pb-6 bg-white">
                <p className="text-xs text-slate-600 text-center font-medium leading-relaxed mb-5">
                  You are currently signed in as a <span className="font-bold text-slate-800">Space Provider</span>. Please log out to access the Space Seeker portal.
                </p>
                <button
                  onClick={handleSeekerLogoutConfirm}
                  className="w-full h-13 rounded-2xl bg-gradient-to-r from-[#241e98] via-[#2b24b1] to-[#3e3ab3] hover:from-[#1b1778] hover:to-[#2e2a97] text-white font-black text-sm uppercase tracking-wider shadow-xl shadow-[#241e98]/30 active:scale-[0.98] transition-all cursor-pointer flex items-center justify-center gap-2"
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

      {/* ═══════════════════════════════════════════════ */}
      {/* MODAL: Delete Space Confirmation (Options)       */}
      {/* ═══════════════════════════════════════════════ */}
      <AnimatePresence>
        {deleteSpaceId && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs font-sans cursor-pointer" onClick={() => setDeleteSpaceId(null)}>
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-100 text-center max-h-[90vh] overflow-y-auto cursor-default"
              onClick={(e) => e.stopPropagation()}
            >
              <div>
                <div className="w-14 h-14 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto mb-3 border border-rose-100">
                  <Trash2 size={24} />
                </div>
                <h3 className="text-lg font-black text-slate-900 mb-1">Delete This Space?</h3>
                {/* Confirmation Reason Options */}
                <div className="space-y-2 mb-3.5 text-left">
                  {DELETE_SPACE_REASONS.map((reason) => {
                    const isSelected = selectedDeleteReason === reason.id;
                    return (
                      <button
                        key={reason.id}
                        type="button"
                        onClick={() => setSelectedDeleteReason(reason.id)}
                        className={`w-full flex items-center gap-2.5 p-2.5 rounded-xl border text-xs transition-all text-left cursor-pointer ${isSelected
                          ? "border-rose-500 bg-rose-50/70 text-rose-950 font-bold ring-1 ring-rose-500/20 shadow-xs"
                          : "border-slate-200/80 bg-slate-50/50 hover:bg-slate-100/70 text-slate-700 font-medium"
                          }`}
                      >
                        <span
                          className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 transition-all ${isSelected ? "border-rose-600 bg-rose-600" : "border-slate-300 bg-white"
                            }`}
                        >
                          {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                        </span>
                        <span className="flex-1 text-[11.5px] leading-snug">{reason.label}</span>
                      </button>
                    );
                  })}

                  {selectedDeleteReason === "other" && (
                    <input
                      type="text"
                      placeholder="Please specify reason (optional)"
                      value={otherDeleteReason}
                      onChange={(e) => setOtherDeleteReason(e.target.value)}
                      className="w-full mt-1.5 px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-rose-500 bg-white text-slate-800"
                      maxLength={100}
                    />
                  )}
                </div>

                {!selectedDeleteReason && (
                  <p className="text-[11px] text-amber-600 font-medium mb-3 flex items-center justify-center gap-1">
                    <span>⚠️</span> Please select an option above to confirm
                  </p>
                )}

                <div className="flex items-center gap-3 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setDeleteSpaceId(null);
                      setSelectedDeleteReason(null);
                      setOtherDeleteReason("");
                    }}
                    disabled={isDeleting}
                    className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-bold transition-all cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={async () => {
                      if (!deleteSpaceId || !selectedDeleteReason) return;
                      setIsDeleting(true);
                      try {
                        if (onDeleteSpace) {
                          await onDeleteSpace(deleteSpaceId);
                        } else {
                          await fetch(getApiUrl(`/api/bookings/${deleteSpaceId}`), {
                            method: "DELETE",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ reason: selectedDeleteReason, otherReason: otherDeleteReason }),
                          });
                        }
                      } catch (err) {
                        console.error("Failed to delete space:", err);
                      } finally {
                        setIsDeleting(false);
                        setDeleteSpaceId(null);
                        setSelectedDeleteReason(null);
                        setOtherDeleteReason("");
                      }
                    }}
                    disabled={isDeleting || !selectedDeleteReason}
                    className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-all shadow-md shadow-rose-600/20 cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <Trash2 size={14} />
                    {isDeleting ? "Deleting..." : selectedDeleteReason ? "Yes, Delete" : "Select Option"}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ═══════════════════════════════════════════════ */}
      {/* MODAL: Location Picker for Add Space            */}
      {/* ═══════════════════════════════════════════════ */}
      <AnimatePresence>
        {postForm.showLocationPickerModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9999] bg-black/70 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 font-sans"
            onClick={() => postForm.setShowLocationPickerModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-[98%] h-[94%] max-w-5xl bg-neutral-900 rounded-3xl overflow-hidden flex flex-col shadow-2xl border border-neutral-700 relative z-[9999]"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-3.5 bg-neutral-900 flex items-center justify-between text-white border-b border-neutral-800 shrink-0 relative z-[9101]">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-[#241e98] flex items-center justify-center text-white shadow-xs">
                    <Navigation size={16} />
                  </div>
                  <div>
                    <span className="font-extrabold text-sm block leading-tight">Select Space Location</span>
                    <span className="text-[10px] text-neutral-400 block">Pin exact spot or search destination</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => postForm.setShowLocationPickerModal(false)}
                  className="w-9 h-9 rounded-full bg-neutral-800 hover:bg-neutral-700 active:scale-95 flex items-center justify-center text-neutral-300 hover:text-white transition-all cursor-pointer border border-neutral-700"
                  title="Close"
                >
                  <X size={18} />
                </button>
              </div>
              <div className="flex-1 relative overflow-hidden">
                <SwiggyLocationPicker
                  availableServiceAreas={[
                    { id: "karnataka", displayName: "Bengaluru", stateName: "Karnataka" },
                    { id: "tamil-nadu", displayName: "Chennai", stateName: "Tamil Nadu" },
                  ]}
                  onConfirmLocation={(city: string, state: string, lat?: number, lng?: number, confirmedAddress?: string) => {
                    const finalAddr = confirmedAddress || `${city}, ${state}`;
                    postForm.setAddress(finalAddr);
                    if (lat !== undefined && lng !== undefined) {
                      postForm.setDetectedLat?.(lat);
                      postForm.setDetectedLng?.(lng);
                    }
                    postForm.setShowLocationPickerModal(false);
                  }}
                />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
