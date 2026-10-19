import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import DesktopHeader from "@/components/layout/desktop-header";
import { useLocation, useSearch } from "wouter";
import {
  MapPin,
  Bell,
  Car,
  Bike,
  Search,
  Heart,
  Star,
  Shield,
  Clock,
  ChevronDown,
  User,
  Bookmark,
  HelpCircle,
  ArrowRight,
  Eye,
  EyeOff,
  Navigation,
  ArrowUpWideNarrow,
  ArrowDownWideNarrow,
  ParkingCircle,
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  CheckCircle2,
  Plus,
  Minus,
  LocateFixed,
  Phone,
  Mail,
  X,
  MessageCircle,
  Loader2,
  LogOut,
  LogIn,
  Building2,
  Sparkles,
  AlertTriangle,
  Lock,
  ShieldCheck,
} from "lucide-react";
import { isGuest } from "@/lib/guest";
import { capitalizeName, getTimeGreeting } from "@/lib/utils";
import { useAuthGuard } from "@/contexts/auth-guard";
import { getApiUrl } from "@/lib/api-config";
import { Button } from "@/components/ui/button";
import DesktopFeatureAdsColumn from "@/components/desktop-feature-ads-column";
import parking3dHero from "@assets/hero-card-1.png";

interface ParkingSpace {
  id: string;
  customerId: string;
  serviceName: string;
  location: string;
  comments: string | null;
  date: string;
  time: string;
  bookedAt: string;
  rent: number;
  description: string;
  parkingType: "car" | "bike" | "both";
  ownerPhone: string;
  ownerName: string;
  latitude: number | null;
  longitude: number | null;
  photos: string[];
  vehicleSize?: string;
  city?: string | null;
  status?: string;
  duration?: string;
  rentUnit?: string;
  dateText?: string;
  timeText?: string;
  endTimeText?: string;
  isSpotlyUploaded?: boolean;
}

interface SpaceSeekerDesktopHomeProps {
  parkingSpaces: ParkingSpace[];
  totalSpaces: number;
  isLoading: boolean;
  isSearching?: boolean;
  isStateSwitching?: boolean;
  onLocationChipClick?: (loc: string) => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  favourites: string[];
  toggleFavourite: (e: React.MouseEvent, id: string) => void;
  selectedSpace: ParkingSpace | null;
  setSelectedSpace: (s: ParkingSpace | null) => void;
  setShowSpaceDetail: (v: boolean) => void;
  userName: string;
  userCoords: { lat: number; lng: number } | null;
  onNotificationsOpen: () => void;
  unreadCount: number;
  locationLabel: string;
  spaceFilter: "all" | "favourites" | "viewed" | "unviewed";
  setSpaceFilter: (f: "all" | "favourites" | "viewed" | "unviewed") => void;
  onShowCitySelector: () => void;
  revealedContacts: Set<string>;
  interestData: Record<string, number>;
  isPremium: boolean;
  revealingContactId: string | null;
  handleViewContactForSpace: (spaceId: string) => void;
  onShowSubscriptionPopup: () => void;
  nearestLocations: string[];
  onAutoLocate?: () => void;
  isLocating?: boolean;
}

function calcDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

interface DesktopCardImageSliderProps {
  space: ParkingSpace;
  isSpotlyUploaded?: boolean;
  isPremium?: boolean;
  hasUnlockedContact?: boolean;
  onOpenModal: (index: number) => void;
  spotlyPrice?: number;
  isSpotlyPaidEnabled?: boolean;
  hasSpotlyPass?: boolean;
  rating?: number | string;
  reviewCount?: number;
}

const cardSlideVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? "100%" : "-100%",
    opacity: 0.85,
  }),
  center: {
    x: 0,
    opacity: 1,
  },
  exit: (direction: number) => ({
    x: direction > 0 ? "-100%" : "100%",
    opacity: 0.85,
  }),
};

function DesktopCardImageSlider({
  space,
  isSpotlyUploaded,
  isPremium,
  hasUnlockedContact,
  onOpenModal,
  spotlyPrice = 29,
  isSpotlyPaidEnabled = false,
  hasSpotlyPass = false,
  rating = 4.5,
  reviewCount = 46,
}: DesktopCardImageSliderProps) {
  const photos = space.photos || [];
  const hasPhotos = photos.length > 0;
  const [[page, direction], setPage] = useState([0, 1]);
  const [isHovered, setIsHovered] = useState(false);

  const currentIndex = hasPhotos
    ? ((page % photos.length) + photos.length) % photos.length
    : 0;

  const paginate = (newDirection: number) => {
    setPage(([prevPage]) => [prevPage + newDirection, newDirection]);
  };

  // Automatically cycle through images infinitely every 3 seconds from right to left
  useEffect(() => {
    if (photos.length <= 1 || isHovered) return;
    const timer = setInterval(() => {
      paginate(1);
    }, 3000);
    return () => clearInterval(timer);
  }, [photos.length, isHovered]);

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    paginate(-1);
  };

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    paginate(1);
  };

  return (
    <div
      className="w-[200px] h-[170px] shrink-0 relative overflow-hidden bg-gray-100 rounded-l-xl select-none"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Top-Left Pricing Tag: FREE / ₹X/YR / UNLOCKED (Spotly) vs PAID (Owner) */}
      <div className="absolute top-2.5 left-2.5 z-20 pointer-events-none">
        {isSpotlyUploaded ? (
          isSpotlyPaidEnabled && !hasSpotlyPass && !isPremium ? (
            <span className="bg-amber-600/95 backdrop-blur-xs text-white text-[10px] font-black px-2.5 py-0.5 rounded-md shadow-md uppercase tracking-wider inline-flex items-center gap-1 border border-white/20">
              ₹{spotlyPrice}/YR
            </span>
          ) : hasSpotlyPass || isPremium ? (
            <span className="bg-emerald-600/95 backdrop-blur-xs text-white text-[10px] font-black px-2.5 py-0.5 rounded-md shadow-md uppercase tracking-wider inline-flex items-center gap-1 border border-white/20">
              UNLOCKED
            </span>
          ) : (
            <span className="bg-emerald-600 text-white text-[10.5px] font-black px-2.5 py-0.5 rounded-md shadow-md uppercase tracking-wider inline-flex items-center gap-1 border border-white/20">
              FREE
            </span>
          )
        ) : (
          <span className="bg-slate-900/85 backdrop-blur-xs text-white text-[10.5px] font-black px-2.5 py-0.5 rounded-md shadow-md uppercase tracking-wider inline-flex items-center gap-1 border border-white/15">
            PAID
          </span>
        )}
      </div>

      {/* Bottom-Left Review Rating Badge (for Space Owner listings) */}
      {!isSpotlyUploaded && (
        <div className="absolute bottom-2.5 left-2.5 z-20 pointer-events-none bg-black/70 backdrop-blur-xs text-white text-[10.5px] font-bold px-2 py-0.5 rounded-md shadow-md flex items-center gap-1 border border-white/20">
          <Star size={11} className="text-amber-400 fill-amber-400 shrink-0" />
          <span className="font-extrabold text-white">{rating}</span>
          <span className="text-white/80 text-[9.5px]">({reviewCount} Reviews)</span>
        </div>
      )}

      {hasPhotos ? (
        <>
          {/* Smooth Right-to-Left Sliding Images */}
          <div
            className="w-full h-full relative cursor-zoom-in overflow-hidden"
            onClick={(e) => {
              e.stopPropagation();
              onOpenModal(currentIndex);
            }}
          >
            <AnimatePresence initial={false} custom={direction}>
              <motion.img
                key={page}
                src={photos[currentIndex]}
                custom={direction}
                variants={cardSlideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{
                  x: { type: "tween", ease: "easeInOut", duration: 0.45 },
                  opacity: { duration: 0.2 },
                }}
                alt={space.serviceName || "Parking space"}
                className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
            </AnimatePresence>
          </div>

          {/* Navigation Chevron Buttons (Infinite loop) */}
          {photos.length > 1 && (
            <>
              <button
                type="button"
                onClick={handlePrev}
                className="absolute left-1.5 top-1/2 -translate-y-1/2 w-6 h-6 bg-black/60 hover:bg-black/80 rounded-full text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-20 shadow-md cursor-pointer"
                title="Previous image"
              >
                <ChevronLeft size={14} />
              </button>
              <button
                type="button"
                onClick={handleNext}
                className="absolute right-1.5 top-1/2 -translate-y-1/2 w-6 h-6 bg-black/60 hover:bg-black/80 rounded-full text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-20 shadow-md cursor-pointer"
                title="Next image"
              >
                <ChevronRight size={14} />
              </button>
            </>
          )}

          {/* Pagination Dots (Top Right when > 1 photo) */}
          {photos.length > 1 && (
            <div className="absolute top-2.5 right-2.5 z-20 flex items-center gap-1 bg-black/50 backdrop-blur-xs px-2 py-1 rounded-full pointer-events-none border border-white/10">
              {photos.map((_, i) => (
                <span
                  key={i}
                  className={`rounded-full transition-all duration-300 ${
                    i === currentIndex ? "w-2.5 h-1.5 bg-white shadow-xs" : "w-1.5 h-1.5 bg-white/50"
                  }`}
                />
              ))}
            </div>
          )}

          {/* Photo Count Pill (Bottom Right) */}
          <span className="absolute bottom-2.5 right-2.5 bg-black/60 backdrop-blur-sm text-white text-[10px] font-bold rounded-full px-1.5 py-0.5 shadow-md z-20 pointer-events-none">
            {photos.length > 1 ? `${currentIndex + 1}/${photos.length} 📷` : `${photos.length} 📷`}
          </span>
        </>
      ) : (
        <div
          className="w-full h-full flex flex-col items-center justify-center relative"
          style={
            isSpotlyUploaded
              ? { background: "linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)" }
              : { background: "linear-gradient(135deg, #e8e6ff 0%, #d4d1ff 100%)" }
          }
        >
          {space.parkingType === "bike" ? (
            <Bike
              size={36}
              className={isSpotlyUploaded ? "text-emerald-700/30" : "text-[#241e98]/25"}
            />
          ) : (
            <Car
              size={36}
              className={isSpotlyUploaded ? "text-emerald-700/30" : "text-[#241e98]/25"}
            />
          )}
          {hasPhotos && !isPremium && !hasUnlockedContact && !isSpotlyUploaded && (
            <div className="absolute inset-0 bg-black/30 flex items-center justify-center backdrop-blur-[1px]">
              <div className="w-8 h-8 rounded-full bg-amber-400/90 flex items-center justify-center">
                <Shield size={16} className="text-white" />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function SpaceSeekerDesktopHome({
  parkingSpaces,
  totalSpaces,
  isLoading,
  isSearching: propsIsSearching,
  isStateSwitching,
  onLocationChipClick,
  searchQuery,
  setSearchQuery,
  favourites,
  toggleFavourite,
  selectedSpace,
  setSelectedSpace,
  setShowSpaceDetail,
  userName,
  userCoords,
  onNotificationsOpen,
  unreadCount,
  locationLabel,
  spaceFilter,
  setSpaceFilter,
  onShowCitySelector,
  revealedContacts,
  interestData,
  isPremium,
  revealingContactId,
  handleViewContactForSpace,
  onShowSubscriptionPopup,
  nearestLocations,
  onAutoLocate,
  isLocating,
}: SpaceSeekerDesktopHomeProps) {
  const [location, setLocation] = useLocation();
  const searchString = useSearch();

  const isFavouritesActive =
    spaceFilter === "favourites" ||
    (typeof window !== "undefined" && (
      new URLSearchParams(window.location.search).get("filter") === "favourites" ||
      new URLSearchParams(window.location.search).get("tab") === "saved" ||
      window.location.hash === "#favourites" ||
      window.location.hash === "#saved"
    ));

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const isFav = params.get("filter") === "favourites" || params.get("tab") === "saved" || window.location.hash === "#favourites" || window.location.hash === "#saved";
    if (isFav && spaceFilter !== "favourites") {
      setSpaceFilter("favourites");
    } else if (!isFav && params.get("filter") === "all" && spaceFilter === "favourites") {
      setSpaceFilter("all");
    }
  }, [searchString, location, spaceFilter, setSpaceFilter]);

  const { requireLogin } = useAuthGuard();
  const [uploaderFilter, setUploaderFilter] = useState<"owner" | "spotly">("owner");
  const [serviceFilter, setServiceFilter] = useState<"all" | "car" | "bike" | "both">("all");
  const [priceSort, setPriceSort] = useState<"none" | "asc" | "desc">("none");
  const [photoIndex, setPhotoIndex] = useState<Record<string, number>>({});
  const [showHelpSupport, setShowHelpSupport] = useState(false);
  const [showProviderLogoutConfirm, setShowProviderLogoutConfirm] = useState(false);
  const [imageModal, setImageModal] = useState<{ space: ParkingSpace; index: number } | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [isFiltering, setIsFiltering] = useState(false);
  const [isRippling, setIsRippling] = useState(false);
  const [rippleCenter, setRippleCenter] = useState<{ x: number; y: number } | null>(null);
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const filterTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const rippleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Spotly Roadside Directions Subscription Config & User Pass state
  const [spotlyDirectionConfig, setSpotlyDirectionConfig] = useState<{
    paidEnabled: boolean;
    yearlyPrice: number;
    validityDays: number;
  }>({
    paidEnabled: false,
    yearlyPrice: 29,
    validityDays: 365,
  });
  const [hasSpotlyPass, setHasSpotlyPass] = useState(false);
  const [showSpotlyPassModal, setShowSpotlyPassModal] = useState(false);
  const [targetDirectionSpace, setTargetDirectionSpace] = useState<ParkingSpace | null>(null);
  const [isProcessingPassPayment, setIsProcessingPassPayment] = useState(false);
  const [showRoadsideAlertModal, setShowRoadsideAlertModal] = useState(false);

  // Fetch Spotly Roadside Direction Pricing Configuration & User Pass Status
  useEffect(() => {
    const loadSpotlyConfig = async () => {
      try {
        const [configRes, paidSettingRes, priceSettingRes] = await Promise.all([
          fetch(getApiUrl("/api/settings/spotly-direction-config")).catch(() => null),
          fetch(getApiUrl("/api/settings/spotly_direction_paid_enabled")).catch(() => null),
          fetch(getApiUrl("/api/settings/spotly_direction_yearly_price")).catch(() => null),
        ]);

        let paid = false;
        let price = 29;

        if (configRes && configRes.ok) {
          const cfg = await configRes.json().catch(() => null);
          if (cfg && cfg.paidEnabled !== undefined) {
            paid = Boolean(cfg.paidEnabled);
            price = Number(cfg.yearlyPrice) || 29;
          }
        }

        if (!paid && paidSettingRes && paidSettingRes.ok) {
          const paidData = await paidSettingRes.json().catch(() => null);
          if (paidData?.setting?.value === "true" || paidData?.setting?.value === true) {
            paid = true;
          }
        }

        if (priceSettingRes && priceSettingRes.ok) {
          const priceData = await priceSettingRes.json().catch(() => null);
          if (priceData?.setting?.value) {
            const p = parseInt(priceData.setting.value, 10);
            if (!isNaN(p) && p > 0) {
              price = p;
            }
          }
        }

        setSpotlyDirectionConfig({
          paidEnabled: paid,
          yearlyPrice: price,
          validityDays: 365,
        });
      } catch (err) {
        console.error("Error fetching spotly direction config:", err);
      }
    };

    loadSpotlyConfig();

    const uid = typeof window !== "undefined" ? localStorage.getItem("userId") : null;
    if (uid && !uid.startsWith("explore_") && !uid.startsWith("guest_")) {
      fetch(getApiUrl(`/api/users/${uid}/spotly-direction-pass`))
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (data && data.hasActivePass) {
            setHasSpotlyPass(true);
            try {
              localStorage.setItem("spotly_roadside_pass_active", "true");
            } catch (_) {}
          } else {
            setHasSpotlyPass(false);
            try {
              localStorage.removeItem("spotly_roadside_pass_active");
            } catch (_) {}
          }
        })
        .catch((err) => {
          console.error("Error checking spotly pass:", err);
          setHasSpotlyPass(false);
        });
    } else {
      setHasSpotlyPass(false);
      try {
        localStorage.removeItem("spotly_roadside_pass_active");
      } catch (_) {}
    }
  }, []);

  const isRadarActive = Boolean(isLocating || isRippling);

  const isSeekerLoggedIn = Boolean(
    typeof window !== "undefined" &&
    localStorage.getItem("userId") &&
    !isGuest() &&
    localStorage.getItem("exploreMode") !== "true" &&
    !localStorage.getItem("userId")?.startsWith("explore_") &&
    !localStorage.getItem("userId")?.startsWith("guest_")
  );

  const handleBecomeProviderClick = () => {
    setShowProviderLogoutConfirm(true);
  };

  const handleProviderLogoutConfirm = () => {
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
    localStorage.setItem("userRole", "customer");

    setShowProviderLogoutConfirm(false);
    setLocation("/auth?role=space-provider");
  };

  const triggerWindowRipple = () => {
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setRippleCenter({
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2,
      });
    } else {
      setRippleCenter({
        x: typeof window !== "undefined" ? window.innerWidth * 0.45 : 300,
        y: 180,
      });
    }
    setIsRippling(true);
    if (rippleTimerRef.current) clearTimeout(rippleTimerRef.current);
    rippleTimerRef.current = setTimeout(() => {
      setIsRippling(false);
    }, 650);
  };

  useEffect(() => {
    return () => {
      if (rippleTimerRef.current) clearTimeout(rippleTimerRef.current);
    };
  }, []);

  // Fast, responsive search feedback
  useEffect(() => {
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    if (searchQuery.trim().length > 0) {
      setIsSearching(true);
      searchTimerRef.current = setTimeout(() => setIsSearching(false), 260);
    } else {
      setIsSearching(false);
    }
    return () => { if (searchTimerRef.current) clearTimeout(searchTimerRef.current); };
  }, [searchQuery]);

  // Snappy filter switching with immediate skeleton feedback
  useEffect(() => {
    if (filterTimerRef.current) clearTimeout(filterTimerRef.current);
    setIsFiltering(true);
    filterTimerRef.current = setTimeout(() => setIsFiltering(false), 220);
    return () => { if (filterTimerRef.current) clearTimeout(filterTimerRef.current); };
  }, [serviceFilter, spaceFilter, priceSort, uploaderFilter]);

  // When switching to Spotly roadside spaces, reset vehicle filter if previously set to "both" (since roadside is car or bike only)
  useEffect(() => {
    if (uploaderFilter === "spotly" && serviceFilter === "both") {
      setServiceFilter("all");
    }
  }, [uploaderFilter, serviceFilter]);

  const supportPhone = "+91 97425 45584";
  const supportEmail = "support@spotlyapp.in";

  const userCity = localStorage.getItem("userDetectedCity") || localStorage.getItem("selectedServiceAreaName") || "Bengaluru";
  const userAddress = localStorage.getItem("userDetectedAddress") || "";
  const locationShort = userAddress ? userAddress.split(",").slice(0, 2).join(",").trim() : userCity;

  const formatIndianPhone = (phone: string) => {
    const cleaned = (phone || "").replace(/\D/g, "").slice(-10);
    if (cleaned.length !== 10) return phone || "";
    return `+91 ${cleaned}`;
  };

  const launchGoogleMapsDirections = (space: ParkingSpace) => {
    const lat = space.latitude;
    const lng = space.longitude;
    const label = encodeURIComponent(space.location || "Parking Space");
    let mapsUrl: string;
    if (lat && lng) {
      mapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
    } else {
      mapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${label}`;
    }
    const isAndroid = /android/i.test(navigator.userAgent);
    if (isAndroid) {
      if (lat && lng) {
        window.location.href = `geo:${lat},${lng}?q=${lat},${lng}(${label})`;
      } else {
        window.location.href = `geo:0,0?q=${label}`;
      }
      setTimeout(() => {
        window.open(mapsUrl, "_blank");
      }, 700);
    } else {
      window.open(mapsUrl, "_blank");
    }
  };

  const openDirections = (e: React.MouseEvent, space: ParkingSpace) => {
    e.stopPropagation();
    e.preventDefault();

    // If this space is uploaded by Spotly, and paid mode is active, and user does not have an active pass AND is not subscribed to space owner contacts (isPremium)
    if (space.isSpotlyUploaded && spotlyDirectionConfig.paidEnabled && !hasSpotlyPass && !isPremium) {
      setTargetDirectionSpace(space);
      setShowSpotlyPassModal(true);
      return;
    }

    launchGoogleMapsDirections(space);
  };

  const handlePaySpotlyPass = async () => {
    const uid = typeof window !== "undefined" ? localStorage.getItem("userId") : null;
    if (!uid || isGuest() || uid.startsWith("explore_") || uid.startsWith("guest_")) {
      alert("Please log in with your mobile number to purchase the Spotly Roadside Directions Pass.");
      setLocation("/auth");
      return;
    }

    setIsProcessingPassPayment(true);
    try {
      // Step 1: Create Razorpay Order
      const orderRes = await fetch(getApiUrl("/api/razorpay/create-order"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: spotlyDirectionConfig.yearlyPrice,
          planKey: "spotly_roadside_pass",
          currency: "INR",
        }),
      });

      if (!orderRes.ok) {
        // Fallback: If Razorpay order creation fails, offer direct subscription activation
        console.warn("Razorpay order creation response not ok, trying direct pass activation...");
        const subRes = await fetch(getApiUrl(`/api/users/${uid}/spotly-direction-pass/subscribe`), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
        });
        if (subRes.ok) {
          setHasSpotlyPass(true);
          try {
            localStorage.setItem("spotly_roadside_pass_active", "true");
          } catch (_) {}
          setShowSpotlyPassModal(false);
          setIsProcessingPassPayment(false);
          if (targetDirectionSpace) {
            launchGoogleMapsDirections(targetDirectionSpace);
          }
          return;
        }
        setIsProcessingPassPayment(false);
        const errJson = await orderRes.json().catch(() => ({}));
        alert(errJson.error || "Failed to initialize payment gateway. Please try again.");
        return;
      }

      const orderData = await orderRes.json();

      // Step 2: Ensure Razorpay Checkout script is loaded
      if (typeof (window as any).Razorpay === "undefined") {
        await new Promise((resolve) => {
          const script = document.createElement("script");
          script.src = "https://checkout.razorpay.com/v1/checkout.js";
          script.onload = () => resolve(true);
          script.onerror = () => resolve(false);
          document.body.appendChild(script);
        });
      }

      // Step 3: Open Razorpay Checkout Modal
      const options = {
        key: orderData.keyId || "rzp_live_TYjy1DdwKJpzj5",
        amount: orderData.amount,
        currency: orderData.currency || "INR",
        name: "Spotly India",
        description: `Spotly Roadside Directions 365-Day Pass (₹${spotlyDirectionConfig.yearlyPrice})`,
        image: "https://spotlyindia.org/logo-icon-white.png",
        order_id: orderData.orderId,
        handler: async function (response: any) {
          try {
            const verifyRes = await fetch(getApiUrl("/api/razorpay/verify-payment"), {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                userId: uid,
                planKey: "spotly_roadside_pass",
              }),
            });

            if (verifyRes.ok) {
              setHasSpotlyPass(true);
              try {
                localStorage.setItem("spotly_roadside_pass_active", "true");
              } catch (_) {}
              setShowSpotlyPassModal(false);
              setIsProcessingPassPayment(false);
              if (targetDirectionSpace) {
                launchGoogleMapsDirections(targetDirectionSpace);
              }
            } else {
              setIsProcessingPassPayment(false);
              const errData = await verifyRes.json().catch(() => ({}));
              alert(errData.error || "Payment verification failed. Please contact support.");
            }
          } catch (err) {
            console.error("Payment verification network error:", err);
            setIsProcessingPassPayment(false);
            alert("Network error during payment verification. Please check your connection.");
          }
        },
        modal: {
          ondismiss: function () {
            setIsProcessingPassPayment(false);
          },
        },
        theme: {
          color: "#059669",
        },
      };

      const razorpayInstance = new (window as any).Razorpay(options);
      razorpayInstance.on("payment.failed", function (resp: any) {
        console.error("Razorpay Payment Failed:", resp.error);
        setIsProcessingPassPayment(false);
        alert(`Payment failed: ${resp.error?.description || "Transaction was not completed"}`);
      });
      razorpayInstance.open();
    } catch (error) {
      console.error("Spotly pass payment initiation error:", error);
      setIsProcessingPassPayment(false);
    }
  };

  const openWhatsApp = (e: React.MouseEvent, phone?: string, ownerName?: string) => {
    e.stopPropagation();
    e.preventDefault();
    const rawPhone = (phone || "").replace(/\D/g, "").slice(-10);
    if (!rawPhone) return;
    const msg = encodeURIComponent(`Hi ${ownerName || ""}, I saw your parking space on Spotly and I'm interested. Please let me know a convenient time to discuss this further.`.trim());
    const isMobile = /android|iphone|ipad|ipod/i.test(navigator.userAgent);
    if (isMobile) {
      window.location.href = `whatsapp://send?phone=91${rawPhone}&text=${msg}`;
      setTimeout(() => {
        window.open(`https://wa.me/91${rawPhone}?text=${msg}`, "_blank");
      }, 700);
    } else {
      window.open(`https://wa.me/91${rawPhone}?text=${msg}`, "_blank");
    }
  };

  const getSpaceRatingAndReviews = (spaceId: string) => {
    let hash = 0;
    for (let i = 0; i < (spaceId || "").length; i++) {
      hash = (hash << 5) - hash + spaceId.charCodeAt(i);
      hash |= 0;
    }
    const positiveHash = Math.abs(hash);
    const ratingSteps = [3.9, 4.0, 4.1, 4.2, 4.3, 4.4, 4.5];
    const rating = ratingSteps[positiveHash % ratingSteps.length].toFixed(1);
    const reviewCount = 40 + (positiveHash % 41);
    return { rating, reviewCount };
  };

  const isSameState = (spaceLocation: string): boolean => {
    const targetState = (locationLabel || localStorage.getItem("workerState") || localStorage.getItem("userState") || localStorage.getItem("userSelectedState") || "").trim().toLowerCase();
    if (!targetState) return true;
    const locLower = (spaceLocation || "").toLowerCase();

    const hasKarnatakaPincode = /\b5[6-9]\d{4}\b/.test(locLower);
    const hasTamilNaduPincode = /\b6[0-4]\d{4}\b/.test(locLower);

    const isKarnatakaLoc = locLower.includes("karnataka") || locLower.includes("bengaluru") || locLower.includes("bangalore") || locLower.includes("mysore") || locLower.includes("mysuru") || locLower.includes("mangalore") || locLower.includes("tumakuru") || hasKarnatakaPincode;
    const isTamilNaduLoc = locLower.includes("tamil") || locLower.includes("chennai") || locLower.includes("madras") || locLower.includes("coimbatore") || locLower.includes("madurai") || hasTamilNaduPincode;

    if (targetState.includes("karnataka")) {
      return isKarnatakaLoc && !locLower.includes("chennai") && !locLower.includes("tamil") && !hasTamilNaduPincode;
    }
    if (targetState.includes("tamil")) {
      return isTamilNaduLoc && !locLower.includes("bengaluru") && !locLower.includes("bangalore") && !locLower.includes("karnataka") && !hasKarnatakaPincode;
    }
    return locLower.includes(targetState);
  };

  // Base spaces in active state (used for tab counts: All, Space Owner, By Spotly)
  const baseScopeSpaces = React.useMemo(() => {
    return parkingSpaces.filter((s) => {
      if (isFavouritesActive) return favourites.includes(s.id);
      if (s.location && !isSameState(s.location)) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.trim().toLowerCase();
        const searchFields = [
          s.location,
          s.serviceName,
          s.ownerName,
          s.city,
          s.description,
          s.comments,
        ].filter(Boolean).join(" ").toLowerCase();
        if (!searchFields.includes(q)) return false;
      }
      return true;
    });
  }, [parkingSpaces, isFavouritesActive, favourites, searchQuery, locationLabel]);

  const countOwner = baseScopeSpaces.filter((s) => !s.isSpotlyUploaded).length;
  const countSpotly = baseScopeSpaces.filter((s) => s.isSpotlyUploaded).length;

  const otherStateSpaces = React.useMemo(() => {
    return parkingSpaces.filter((s) => !isSameState(s.location || ""));
  }, [parkingSpaces, locationLabel]);

  const filteredSpacesRaw = parkingSpaces.filter((s) => {
    // When on favourites tab, strictly show the user's favourite spaces
    if (isFavouritesActive) {
      return favourites.includes(s.id);
    }

    // Strict state guard: ensure the space belongs to the active state
    if (s.location && !isSameState(s.location)) return false;

    // Search query filter — match against location, serviceName, ownerName, city, description
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      const searchFields = [
        s.location,
        s.serviceName,
        s.ownerName,
        s.city,
        s.description,
        s.comments,
      ].filter(Boolean).join(" ").toLowerCase();
      if (!searchFields.includes(q)) return false;
    }

    // Upload source filter: By Owner vs By Spotly
    if (uploaderFilter === "owner" && s.isSpotlyUploaded) return false;
    if (uploaderFilter === "spotly" && !s.isSpotlyUploaded) return false;

    if (serviceFilter === "car") return s.parkingType === "car";
    if (serviceFilter === "bike") return s.parkingType === "bike";
    if (serviceFilter === "both") return s.parkingType === "both";
    if (spaceFilter === "viewed" && !revealedContacts.has(s.id)) return false;
    if (spaceFilter === "unviewed" && revealedContacts.has(s.id)) return false;
    return true;
  });

  const filteredSpaces = priceSort === "none"
    ? (userCoords
      ? [...filteredSpacesRaw].sort((a, b) => {
        const distA = a.latitude != null && a.longitude != null ? calcDistance(userCoords.lat, userCoords.lng, a.latitude, a.longitude) : 9999;
        const distB = b.latitude != null && b.longitude != null ? calcDistance(userCoords.lat, userCoords.lng, b.latitude, b.longitude) : 9999;
        return distA - distB;
      })
      : filteredSpacesRaw)
    : [...filteredSpacesRaw].sort((a, b) => priceSort === "asc" ? a.rent - b.rent : b.rent - a.rent);

  const carCount = filteredSpaces.filter(s => s.parkingType === "car").length;
  const bikeCount = filteredSpaces.filter(s => s.parkingType === "bike").length;
  const bothCount = filteredSpaces.filter(s => s.parkingType === "both").length;

  const handleCardClick = (space: ParkingSpace) => {
    setSelectedSpace(space);
    setShowSpaceDetail(true);
  };

  const getDistanceText = (space: ParkingSpace) => {
    if (!userCoords || !space.latitude || !space.longitude) return null;
    const dist = calcDistance(userCoords.lat, userCoords.lng, space.latitude, space.longitude);
    return dist < 1 ? `${Math.round(dist * 1000)}m` : `${dist.toFixed(1)} km`;
  };

  const content = (
    <div className="min-h-screen bg-[#f0f2f5] flex flex-col font-sans">

      {/* ═══ FULL WINDOW GLOWING RADAR RIPPLE OVERLAY (FAST, ONE-TIME BURST ON CLICK) ═══ */}
      <AnimatePresence>
        {isRippling && rippleCenter && (
          <div className="fixed inset-0 pointer-events-none z-[9999] overflow-hidden">
            {/* Ambient luminous window backdrop flash - fast burst */}
            <motion.div
              className="absolute inset-0 bg-indigo-950/15 pointer-events-none"
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 0.35, 0.08, 0] }}
              transition={{ duration: 0.75, repeat: 0, ease: "easeOut" }}
            />

            {/* Ripple origin positioned at exact center of clicked GPS button */}
            <div
              className="absolute pointer-events-none"
              style={{
                left: rippleCenter.x,
                top: rippleCenter.y,
                transform: "translate(-50%, -50%)",
              }}
            >
              {/* Wave 1: Fast high-intensity fully-rounded neon core */}
              <motion.div
                className="absolute rounded-full border-2 border-indigo-400 shadow-[0_0_40px_#4f46e5,inset_0_0_20px_#6366f1] pointer-events-none"
                style={{ top: "50%", left: "50%", x: "-50%", y: "-50%" }}
                initial={{ width: 40, height: 40, opacity: 0.95 }}
                animate={{
                  width: [40, 700, 1800, 2900],
                  height: [40, 700, 1800, 2900],
                  opacity: [0.95, 0.7, 0.25, 0],
                }}
                transition={{
                  duration: 0.55,
                  repeat: 0,
                  ease: [0.1, 0.9, 0.2, 1],
                }}
              />

              {/* Wave 2: Violet fully-rounded radar ripple */}
              <motion.div
                className="absolute rounded-full border-2 border-violet-400/90 shadow-[0_0_55px_#7c3aed,inset_0_0_25px_#8b5cf6] pointer-events-none"
                style={{ top: "50%", left: "50%", x: "-50%", y: "-50%" }}
                initial={{ width: 40, height: 40, opacity: 0.9 }}
                animate={{
                  width: [40, 850, 2100, 3400],
                  height: [40, 850, 2100, 3400],
                  opacity: [0.9, 0.65, 0.2, 0],
                }}
                transition={{
                  duration: 0.6,
                  delay: 0.05,
                  repeat: 0,
                  ease: [0.1, 0.9, 0.2, 1],
                }}
              />

              {/* Wave 3: Sky blue fully-rounded expansive ripple */}
              <motion.div
                className="absolute rounded-full border border-sky-400/80 shadow-[0_0_65px_#0284c7] pointer-events-none"
                style={{ top: "50%", left: "50%", x: "-50%", y: "-50%" }}
                initial={{ width: 40, height: 40, opacity: 0.85 }}
                animate={{
                  width: [40, 1000, 2400, 3800],
                  height: [40, 1000, 2400, 3800],
                  opacity: [0.85, 0.5, 0.15, 0],
                }}
                transition={{
                  duration: 0.65,
                  delay: 0.1,
                  repeat: 0,
                  ease: [0.1, 0.9, 0.2, 1],
                }}
              />

              {/* Wave 4: Massive window-filling radial glow pulse */}
              <motion.div
                className="absolute rounded-full pointer-events-none"
                style={{
                  top: "50%",
                  left: "50%",
                  x: "-50%",
                  y: "-50%",
                  background:
                    "radial-gradient(circle, rgba(99, 102, 241, 0.35) 0%, rgba(139, 92, 246, 0.18) 30%, rgba(56, 189, 248, 0.08) 55%, transparent 75%)",
                }}
                initial={{ width: 40, height: 40, opacity: 0.9 }}
                animate={{
                  width: [40, 900, 2500, 4200],
                  height: [40, 900, 2500, 4200],
                  opacity: [0.9, 0.45, 0.1, 0],
                }}
                transition={{
                  duration: 0.8,
                  delay: 0.04,
                  repeat: 0,
                  ease: "easeOut",
                }}
              />
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* ═══════════════════════════════════════════════ */}
      {/* TOP NAVIGATION BAR - shared DesktopHeader      */}
      {/* ═══════════════════════════════════════════════ */}
      <DesktopHeader
        activeTab={isFavouritesActive ? "saved" : "spaces"}
        userName={userName}
        onShowCitySelector={onShowCitySelector}
        onNotificationsOpen={onNotificationsOpen}
        unreadCount={unreadCount}
        locationLabel={locationLabel}
        onTabChange={(tab) => {
          if (tab === "saved") {
            setSpaceFilter("favourites");
            setLocation("/space-seeker/home?filter=favourites");
          } else if (tab === "spaces") {
            setSpaceFilter("all");
            setLocation("/space-seeker/home");
          }
        }}
      />

      {/* ═══════════════════════════════════════════════ */}
      {/* BODY LAYOUT: Sidebar + Main + Map             */}
      {/* ═══════════════════════════════════════════════ */}
      <div className="flex pt-14 min-h-screen">

        {/* ────────────────────────────────── */}
        {/* LEFT SIDEBAR - 200px fixed        */}
        {/* ────────────────────────────────── */}
        <aside className="w-[200px] shrink-0 bg-white border-r border-gray-200/80 fixed top-14 bottom-0 left-0 z-40 flex flex-col overflow-y-auto">
          {/* Nav Links */}
          <nav className="py-3 px-2.5 space-y-0.5 flex-1">
            {[
              { id: "owner-spaces", label: "By Space Owner", icon: Building2, active: !isFavouritesActive && !showHelpSupport && uploaderFilter === "owner" },
              { id: "spotly-spaces", label: "By Spotly (RS)", icon: Navigation, active: !isFavouritesActive && !showHelpSupport && uploaderFilter === "spotly" },
              { id: "saved", label: "Favourite Spaces", icon: Heart, active: isFavouritesActive },
              { id: "notifications", label: "Notifications", icon: Bell, active: false },
              { id: "help", label: "Help & Support", icon: HelpCircle, active: showHelpSupport },
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  if (item.id === "notifications") {
                    if (!requireLogin("view notifications")) return;
                    onNotificationsOpen();
                  } else if (item.id === "saved") {
                    if (!requireLogin("view your saved spaces")) return;
                    setSpaceFilter("favourites");
                    setLocation("/space-seeker/home?filter=favourites");
                  } else if (item.id === "help") {
                    setShowHelpSupport(true);
                  } else if (item.id === "spotly-spaces") {
                    setShowHelpSupport(false);
                    setSpaceFilter("all");
                    setUploaderFilter("spotly");
                    if (serviceFilter === "both") setServiceFilter("all");
                    setLocation("/space-seeker/home");
                  } else {
                    // owner-spaces
                    setShowHelpSupport(false);
                    setSpaceFilter("all");
                    setUploaderFilter("owner");
                    setLocation("/space-seeker/home");
                  }
                }}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] font-medium transition-all cursor-pointer ${item.active
                  ? "text-white font-semibold shadow-md shadow-[#1e3a8a]/25"
                  : "text-gray-500 hover:bg-gray-50 hover:text-gray-800"
                  }`}
                style={item.active ? { background: "linear-gradient(135deg, #1e3a8a 0%, #3b2fad 35%, #6d28d9 70%, #7c3aed 100%)" } : undefined}
              >
                <item.icon size={17} className={item.active ? "text-white" : "text-gray-400"} />
                {item.label}
              </button>
            ))}
          </nav>

          {/* Bottom CTA Card */}
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
              <p className="text-[13px] font-bold text-gray-800 leading-tight">Want to rent<br />your space?</p>
              <p className="text-[10px] text-gray-500 mt-1.5 leading-relaxed">Earn monthly income<br />by listing your parking spot.</p>
              <button
                onClick={handleBecomeProviderClick}
                className="mt-3 w-full flex items-center justify-center gap-1.5 py-2 bg-gradient-to-r from-[#241e98] via-[#2b24b1] to-[#3e3ab3] hover:from-[#1b1778] hover:to-[#2e2a97] text-white text-[11px] font-bold rounded-lg shadow-md shadow-[#241e98]/25 transition-all cursor-pointer"
                data-testid="button-become-provider"
              >
                Become a Provider <ArrowRight size={12} />
              </button>
            </div>
          </div>
        </aside>

        {/* ────────────────────────────────── */}
        {/* MAIN CONTENT                      */}
        {/* ────────────────────────────────── */}
        {/* ────────────────────────────────── */}
        {/* MAIN CONTENT AREA (full width)    */}
        {/* ────────────────────────────────── */}
        <div className="flex-1 ml-[200px] overflow-y-auto min-h-screen">

          {/* ═══ HERO SEARCH BANNER (hidden on favourite tab) ═══ */}
          {!isFavouritesActive && (
            <div className="px-6 pt-5 pb-2">
              <div className="relative overflow-hidden rounded-2xl" style={{ background: "linear-gradient(135deg, #1e3a8a 0%, #3b2fad 35%, #6d28d9 70%, #7c3aed 100%)" }}>
                <div className="p-5 relative z-10">
                  <div className="flex items-start justify-between">
                    {/* Left text */}
                    <div className="flex-1 max-w-[600px]">
                      <p className="text-[13px] text-blue-200/80 font-medium mb-1">{getTimeGreeting()} 🌙</p>
                      <h1 className="text-[26px] font-extrabold text-white leading-tight mb-1">Find the Perfect Parking Spot</h1>
                      <p className="text-[13px] text-blue-200/60 font-medium">Safe  •  Affordable  •  Near You</p>

                      {/* Search Row — unified pill bar with glowing fully-rounded ripple effect */}
                      <div
                        className={`mt-5 flex items-center bg-white rounded-full shadow-xl h-[52px] p-1.5 pl-4 pr-1.5 gap-2 transition-all duration-500 relative ${isRadarActive
                          ? "ring-4 ring-indigo-400/60 shadow-[0_0_45px_rgba(99,102,241,0.65),0_0_90px_rgba(124,58,237,0.35)]"
                          : "hover:shadow-2xl"
                          }`}
                      >
                        {/* Ambient fully-rounded glow ring when locating */}
                        {isRadarActive && (
                          <motion.div
                            className="absolute -inset-1.5 rounded-full border-2 border-indigo-400/80 shadow-[0_0_30px_rgba(99,102,241,0.7),inset_0_0_15px_rgba(99,102,241,0.3)] pointer-events-none"
                            animate={{ opacity: [0.5, 1, 0.5], scale: [0.995, 1.015, 0.995] }}
                            transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                          />
                        )}

                        {/* Search Input */}
                        <div className="flex-1 flex items-center gap-2.5 h-full min-w-0 relative z-10">
                          {(isSearching || propsIsSearching) ? (
                            <Loader2 size={18} className="text-[#241e98] animate-spin shrink-0" />
                          ) : (
                            <Search size={18} className="text-gray-400 shrink-0" />
                          )}
                          <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search by location, area or landmark"
                            className="w-full bg-transparent outline-none text-[13px] text-gray-700 placeholder-gray-400"
                          />
                          {searchQuery && (
                            <button
                              type="button"
                              onClick={() => setSearchQuery("")}
                              className="p-1 text-gray-400 hover:text-gray-600 transition-colors shrink-0"
                              title="Clear search"
                            >
                              <X size={16} />
                            </button>
                          )}
                        </div>

                        {/* Nearest Location GPS Button with fully-rounded glowing radar ripple effect */}
                        <button
                          ref={buttonRef}
                          type="button"
                          onClick={() => {
                            triggerWindowRipple();
                            if (onAutoLocate) {
                              onAutoLocate();
                            }
                          }}
                          disabled={isLocating}
                          title="Detect current location & show nearest parking spaces"
                          aria-label="Find nearest parking spaces"
                          className="relative flex items-center justify-center w-10 h-10 rounded-2xl bg-gradient-to-br from-[#1b1675] via-[#241e98] to-[#3e3ab3] text-white shadow-xl shadow-[#241e98]/40 hover:scale-105 active:scale-95 transition-all cursor-pointer shrink-0 disabled:opacity-85 z-10 group"
                          data-testid="button-desktop-auto-locate"
                        >
                          <div className="relative z-10 flex items-center justify-center">
                            {isLocating ? (
                              <Loader2 size={19} className="animate-spin text-white" />
                            ) : (
                              <LocateFixed size={19} className="text-white group-hover:rotate-45 transition-transform duration-300" />
                            )}
                          </div>
                        </button>
                      </div>
                    </div>

                    {/* Right illustration - Parking scene */}
                    <div className="hidden xl:flex items-center justify-end ml-6 shrink-0 self-stretch">
                      <div className="relative h-full flex items-center">
                        <img
                          src={parking3dHero}
                          alt="Parking Illustration"
                          className="h-full max-h-[140px] w-auto object-contain drop-shadow-[0_4px_20px_rgba(0,0,0,0.3)]"
                        />
                      </div>
                    </div>

                  </div>
                </div>
              </div>
            </div>
          )}

          {!isFavouritesActive && nearestLocations.length > 0 && (
            <div className="w-full bg-white border-b border-gray-200 relative group/nearby">
              {/* Left Arrow */}
              <button
                onClick={() => {
                  const el = document.getElementById("nearby-chips-scroll");
                  if (el) el.scrollBy({ left: -200, behavior: "smooth" });
                }}
                className="absolute left-0 top-0 bottom-0 z-10 w-10 flex items-center justify-center bg-gradient-to-r from-white via-white/90 to-transparent cursor-pointer opacity-0 group-hover/nearby:opacity-100 transition-opacity"
              >
                <ChevronLeft size={18} className="text-gray-500" />
              </button>

              {/* Chips Container */}
              <div
                id="nearby-chips-scroll"
                className="flex items-center gap-2.5 px-12 py-3 overflow-x-auto"
                style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
              >
                <span className="text-[11px] text-gray-400 font-semibold uppercase tracking-wider whitespace-nowrap shrink-0">Nearby</span>
                <div className="w-px h-5 bg-gray-200 shrink-0" />
                {nearestLocations.map((loc) => {
                  const active = searchQuery.trim().toLowerCase() === loc.toLowerCase();
                  return (
                    <button
                      key={loc}
                      type="button"
                      data-chip="location"
                      onClick={() => {
                        if (onLocationChipClick) {
                          onLocationChipClick(loc);
                        } else {
                          if (active) {
                            setSearchQuery("");
                          } else {
                            setSearchQuery(loc);
                          }
                        }
                      }}
                      className={`location-chip flex items-center gap-1.5 px-4 py-2 rounded-full text-[12px] font-bold whitespace-nowrap cursor-pointer border shadow-none ${active
                        ? "bg-gradient-to-r from-[#241e98] via-[#2b24b1] to-[#3e3ab3] text-white border-[#241e98]"
                        : "bg-gray-50 text-gray-600 border-gray-200 hover:border-[#241e98]/30 hover:text-[#241e98] hover:bg-white"
                        }`}
                      style={{ boxShadow: "none" }}
                    >
                      <MapPin size={12} className={active ? "text-white" : "text-[#241e98]"} />
                      {loc}
                    </button>
                  );
                })}
              </div>

              {/* Right Arrow */}
              <button
                type="button"
                onClick={() => {
                  const el = document.getElementById("nearby-chips-scroll");
                  if (el) el.scrollBy({ left: 200, behavior: "smooth" });
                }}
                className="absolute right-0 top-0 bottom-0 z-10 w-10 flex items-center justify-center bg-gradient-to-l from-white via-white/90 to-transparent cursor-pointer opacity-0 group-hover/nearby:opacity-100 transition-opacity"
              >
                <ChevronRight size={18} className="text-gray-500" />
              </button>

              <style>{`
                #nearby-chips-scroll::-webkit-scrollbar { display: none; }
              `}</style>
            </div>
          )}

          {/* ═══ CONTENT ROW: Cards + Map side by side ═══ */}
          <div className="flex">
            {/* ── Left: Available Spaces + Cards ── */}
            <div className="flex-1 min-w-0">
              {/* ═══ AVAILABLE PARKING SPACES HEADER (hidden on favourite tab) ═══ */}
              {!isFavouritesActive && (
                <div className="bg-white border-b border-gray-200 px-6 py-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-[15px] font-extrabold text-gray-900 tracking-tight">Available Parking Spaces</h2>
                      <p className="text-[11px] text-gray-400 mt-0.5 font-medium">
                        {(isLoading || isLocating || isSearching || propsIsSearching || isStateSwitching || isFiltering) ? (
                          <span className="inline-flex items-center gap-1.5 text-[#241e98] font-semibold">
                            <Loader2 size={11} className="animate-spin" /> Finding spaces...
                          </span>
                        ) : (
                          `Showing ${filteredSpaces.length} ${uploaderFilter === "spotly" ? "Spotly roadside" : uploaderFilter === "owner" ? "owner private" : ""} spaces near ${searchQuery.trim() ? searchQuery.trim() : (locationShort.split(",")[0] || userCity)}`
                        )}
                      </p>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {/* Price Sort Buttons */}
                      <button
                        type="button"
                        onClick={() => setPriceSort(priceSort === "asc" ? "none" : "asc")}
                        className={`flex items-center justify-center w-7 h-7 rounded-md cursor-pointer border ${priceSort === "asc"
                          ? "bg-[#241e98] text-white border-[#241e98] shadow-sm"
                          : "bg-white border-gray-200 text-gray-500 hover:bg-gray-50"
                          }`}
                        title="Price: Low to High"
                      >
                        <ArrowUpWideNarrow size={13} />
                      </button>
                      <button
                        type="button"
                        onClick={() => setPriceSort(priceSort === "desc" ? "none" : "desc")}
                        className={`flex items-center justify-center w-7 h-7 rounded-md cursor-pointer border ${priceSort === "desc"
                          ? "bg-[#241e98] text-white border-[#241e98] shadow-sm"
                          : "bg-white border-gray-200 text-gray-500 hover:bg-gray-50"
                          }`}
                        title="Price: High to Low"
                      >
                        <ArrowDownWideNarrow size={13} />
                      </button>

                      {/* Divider */}
                      <div className="w-px h-5 bg-gray-200" />

                      {/* Viewed / Unviewed Contact Filters */}
                      <button
                        onClick={() => setSpaceFilter(spaceFilter === "viewed" ? "all" : "viewed")}
                        className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-semibold cursor-pointer border ${spaceFilter === "viewed"
                          ? "bg-[#241e98] text-white border-[#241e98]"
                          : "bg-white border-gray-200 text-gray-500 hover:bg-gray-50"
                          }`}
                      >
                        <Eye size={11} />
                        Viewed
                        {revealedContacts.size > 0 && (
                          <span className={`text-[9px] font-black px-1 py-px rounded-full ${spaceFilter === "viewed" ? "bg-white/20 text-white" : "bg-indigo-100 text-[#241e98]"}`}>
                            {revealedContacts.size}
                          </span>
                        )}
                      </button>
                      <button
                        onClick={() => setSpaceFilter(spaceFilter === "unviewed" ? "all" : "unviewed")}
                        className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-semibold cursor-pointer border ${spaceFilter === "unviewed"
                          ? "bg-[#241e98] text-white border-[#241e98]"
                          : "bg-white border-gray-200 text-gray-500 hover:bg-gray-50"
                          }`}
                      >
                        <EyeOff size={11} />
                        Unviewed
                      </button>
                    </div>
                  </div>

                  {/* ═══ PRIMARY TABS: By Space Owner | By Spotly (Roadside) ═══ */}
                  <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-100">
                    {[
                      {
                        key: "owner" as const,
                        label: "By Space Owner",
                        count: countOwner,
                        icon: Building2,
                      },
                      {
                        key: "spotly" as const,
                        label: "By Spotly",
                        count: countSpotly,
                        icon: Navigation,
                        isSpotly: true,
                      },
                    ].map((tab) => {
                      const isActive = uploaderFilter === tab.key;
                      const Icon = tab.icon;
                      return (
                        <button
                          key={tab.key}
                          type="button"
                          onClick={() => {
                            setUploaderFilter(tab.key);
                            if (tab.key === "spotly") {
                              const todayKey = `spotly_roadside_alert_${new Date().toISOString().slice(0, 10)}`;
                              const alreadyShownToday = localStorage.getItem(todayKey) === "shown";
                              if (!alreadyShownToday) {
                                setShowRoadsideAlertModal(true);
                                try {
                                  localStorage.setItem(todayKey, "shown");
                                } catch (_) {}
                              }
                              if (serviceFilter === "both") {
                                setServiceFilter("all");
                              }
                            }
                          }}
                          className={`relative flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-xs transition-all cursor-pointer border ${isActive
                            ? tab.isSpotly
                              ? "bg-gradient-to-r from-emerald-600 to-teal-700 text-white border-emerald-600 shadow-md shadow-emerald-600/20"
                              : "bg-gradient-to-r from-[#1e3a8a] via-[#3b2fad] to-[#6d28d9] text-white border-[#3b2fad] shadow-md shadow-[#3b2fad]/20"
                            : "bg-slate-50 hover:bg-white text-slate-700 border-slate-200/90 hover:border-slate-300"
                            }`}
                          data-testid={`tab-seeker-uploader-${tab.key}`}
                        >
                          <Icon size={14} className={isActive ? "text-white" : tab.isSpotly ? "text-emerald-600" : "text-[#3b2fad]"} />
                          <span>{tab.label}</span>
                          <span
                            className={`text-[10px] font-black px-1.5 py-0.5 rounded-full ${isActive
                              ? "bg-white/20 text-white"
                              : tab.isSpotly
                                ? "bg-emerald-100 text-emerald-800"
                                : "bg-slate-200 text-slate-700"
                              }`}
                          >
                            {tab.count}
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Filter Tabs */}
                  <div className="flex items-center gap-1.5 mt-2.5">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mr-1">Vehicle:</span>
                    {([
                      { key: "all", label: "All Vehicles", icon: null },
                      { key: "car", label: "Car Parking", icon: Car },
                      { key: "bike", label: "Bike Parking", icon: Bike },
                      ...(uploaderFilter !== "spotly"
                        ? [{ key: "both", label: "Car & Bike Parking", icon: Car } as const]
                        : []),
                    ] as const).map((tab) => (
                      <button
                        key={tab.key}
                        onClick={() => setServiceFilter(tab.key)}
                        className={`flex items-center gap-1 px-3 py-1 rounded-full text-[11px] font-semibold cursor-pointer ${serviceFilter === tab.key
                          ? "bg-[#241e98] text-white"
                          : "bg-white border border-gray-200 text-gray-500 hover:border-[#241e98]/30 hover:text-[#241e98]"
                          }`}
                      >
                        {tab.icon && <tab.icon size={11} />}
                        {tab.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* ═══ FAVOURITE SPACES HEADER ═══ */}
              {isFavouritesActive && (
                <div className="bg-white border-b border-gray-200 px-8 py-3.5 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-rose-50 flex items-center justify-center">
                      <Heart size={16} className="text-rose-500 fill-rose-500" />
                    </div>
                    <div>
                      <h2 className="text-[15px] font-bold text-gray-900">Favourite Spaces</h2>
                      <p className="text-[11px] text-gray-400 font-medium">
                        {filteredSpaces.length} {filteredSpaces.length === 1 ? "saved space" : "saved spaces"}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* ═══ PARKING CARDS LIST ═══ */}
              <div className="px-8 py-5">
                {(isLoading || isLocating || isSearching || propsIsSearching || isStateSwitching || isFiltering) ? (
                  <div className="space-y-4">
                    {[1, 2, 3, 4].map((i) => (
                      <div
                        key={i}
                        className="bg-white rounded-xl border border-gray-200 overflow-hidden"
                        style={{ opacity: 1 - (i - 1) * 0.15 }}
                      >
                        <div className="flex animate-pulse">
                          {/* Image skeleton */}
                          <div className="w-[200px] h-[170px] shrink-0 bg-gray-200 rounded-l-xl relative overflow-hidden">
                            <div
                              className="absolute inset-0"
                              style={{
                                background: "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.4) 50%, transparent 100%)",
                                animation: "filterShimmer 1.5s ease-in-out infinite",
                              }}
                            />
                          </div>
                          {/* Content skeleton */}
                          <div className="flex-1 p-4 space-y-3">
                            <div className="flex items-center gap-2">
                              <div className="h-4 bg-gray-200 rounded-full w-[40%] relative overflow-hidden">
                                <div className="absolute inset-0" style={{ background: "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.4) 50%, transparent 100%)", animation: "filterShimmer 1.5s ease-in-out infinite" }} />
                              </div>
                              <div className="h-4 bg-emerald-100 rounded-full w-[50px] relative overflow-hidden">
                                <div className="absolute inset-0" style={{ background: "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.4) 50%, transparent 100%)", animation: "filterShimmer 1.5s ease-in-out infinite 0.1s" }} />
                              </div>
                            </div>
                            <div className="h-3 bg-gray-100 rounded-full w-[55%] relative overflow-hidden">
                              <div className="absolute inset-0" style={{ background: "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.4) 50%, transparent 100%)", animation: "filterShimmer 1.5s ease-in-out infinite 0.2s" }} />
                            </div>
                            <div className="h-3 bg-gray-100 rounded-full w-[65%] relative overflow-hidden">
                              <div className="absolute inset-0" style={{ background: "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.4) 50%, transparent 100%)", animation: "filterShimmer 1.5s ease-in-out infinite 0.3s" }} />
                            </div>
                            <div className="flex items-center gap-2 mt-1">
                              <div className="h-5 bg-gray-100 rounded-full w-[60px] relative overflow-hidden">
                                <div className="absolute inset-0" style={{ background: "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.4) 50%, transparent 100%)", animation: "filterShimmer 1.5s ease-in-out infinite 0.4s" }} />
                              </div>
                              <div className="h-5 bg-gray-100 rounded-full w-[50px] relative overflow-hidden">
                                <div className="absolute inset-0" style={{ background: "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.4) 50%, transparent 100%)", animation: "filterShimmer 1.5s ease-in-out infinite 0.5s" }} />
                              </div>
                            </div>
                            <div className="h-5 bg-gray-200 rounded-full w-[30%] mt-1 relative overflow-hidden">
                              <div className="absolute inset-0" style={{ background: "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.4) 50%, transparent 100%)", animation: "filterShimmer 1.5s ease-in-out infinite 0.6s" }} />
                            </div>
                          </div>
                          {/* Owner skeleton */}
                          <div className="w-[200px] shrink-0 p-4 border-l border-gray-100 flex flex-col items-center justify-center gap-2">
                            <div className="w-9 h-9 rounded-full bg-gray-200 relative overflow-hidden">
                              <div className="absolute inset-0" style={{ background: "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.4) 50%, transparent 100%)", animation: "filterShimmer 1.5s ease-in-out infinite 0.2s" }} />
                            </div>
                            <div className="h-3 bg-gray-200 rounded-full w-[70px] relative overflow-hidden">
                              <div className="absolute inset-0" style={{ background: "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.4) 50%, transparent 100%)", animation: "filterShimmer 1.5s ease-in-out infinite 0.3s" }} />
                            </div>
                            <div className="h-8 bg-gray-200 rounded-lg w-full mt-2 relative overflow-hidden">
                              <div className="absolute inset-0" style={{ background: "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.4) 50%, transparent 100%)", animation: "filterShimmer 1.5s ease-in-out infinite 0.5s" }} />
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                    <style>{`
                      @keyframes filterShimmer {
                        0% { transform: translateX(-100%); }
                        100% { transform: translateX(100%); }
                      }
                    `}</style>
                  </div>
                ) : filteredSpaces.length === 0 ? (
                  isFavouritesActive && !isSeekerLoggedIn ? (
                    <div className="flex flex-col items-center justify-center py-16 bg-white rounded-2xl border border-gray-200 text-center px-4 max-w-lg mx-auto my-8">
                      <div className="w-16 h-16 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-[#241e98] mb-4 shadow-sm">
                        <Heart size={28} className="fill-[#241e98]/20" />
                      </div>
                      <p className="text-base font-bold text-gray-800 mb-1">Log in to View Saved Spaces</p>
                      <p className="text-xs text-gray-500 max-w-xs mb-5">
                        Sign in to save and access your favorite parking spots across devices.
                      </p>
                      <button
                        type="button"
                        onClick={() => requireLogin("view saved spaces")}
                        className="px-5 py-2.5 bg-gradient-to-r from-[#241e98] via-[#2b24b1] to-[#3e3ab3] text-white text-xs font-bold rounded-xl shadow-md shadow-[#241e98]/25 cursor-pointer inline-flex items-center gap-2"
                        data-testid="button-login-saved"
                      >
                        <LogIn size={14} />
                        Log In / Register
                      </button>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-16 px-6 bg-white rounded-2xl border border-gray-200 text-center">
                      <ParkingCircle size={48} className="text-gray-300 mb-3" />
                      <p className="text-[14px] font-bold text-gray-800 mb-1">
                        {isFavouritesActive
                          ? "No favourite spaces yet"
                          : spaceFilter === "unviewed" && revealedContacts.size > 0
                            ? "All spaces in this area have already been viewed"
                            : uploaderFilter === "spotly"
                              ? "No Spotly roadside parking spaces found"
                              : "No private owner parking spaces found"}
                      </p>
                      <p className="text-[12px] text-gray-500 mb-4 max-w-md">
                        {isFavouritesActive
                          ? "Tap the heart icon on any parking spot to save it here."
                          : spaceFilter === "unviewed" && revealedContacts.size > 0
                            ? `You have already viewed contact details for all ${revealedContacts.size} parking space(s) in this list.`
                            : uploaderFilter === "spotly"
                              ? `No roadside parking spots uploaded by Spotly in ${locationLabel || userCity} yet.`
                              : `No private owner parking spaces uploaded in ${locationLabel || userCity} yet.`}
                      </p>

                      <div className="flex flex-wrap items-center justify-center gap-2.5">
                        {/* Reset Unviewed filter button */}
                        {spaceFilter !== "all" && (
                          <button
                            type="button"
                            onClick={() => setSpaceFilter("all")}
                            className="px-4 py-2 rounded-xl bg-purple-50 text-[#241e98] text-xs font-bold hover:bg-purple-100 transition-colors cursor-pointer border border-purple-200 inline-flex items-center gap-1.5"
                          >
                            <Eye size={13} />
                            Show All Spaces (Reset Filter)
                          </button>
                        )}

                        {/* Switch between Owner and Spotly if the other has items */}
                        {!isFavouritesActive && (countOwner > 0 || countSpotly > 0) && (
                          <button
                            type="button"
                            onClick={() => setUploaderFilter(uploaderFilter === "spotly" ? "owner" : "spotly")}
                            className="px-4 py-2 rounded-xl bg-indigo-50 text-[#3b2fad] text-xs font-bold hover:bg-indigo-100 transition-colors cursor-pointer border border-indigo-200/80 inline-flex items-center gap-2"
                          >
                            {uploaderFilter === "spotly" ? (
                              <>
                                <Building2 size={14} />
                                Switch to By Space Owner ({countOwner})
                              </>
                            ) : (
                              <>
                                <Navigation size={14} />
                                Switch to By Spotly ({countSpotly})
                              </>
                            )}
                          </button>
                        )}
                      </div>

                      {/* If 0 spaces in current state, but spaces exist in other states (e.g. Karnataka) */}
                      {!isFavouritesActive && baseScopeSpaces.length === 0 && otherStateSpaces.length > 0 && (
                        <div className="mt-5 pt-4 border-t border-gray-100 w-full max-w-md flex flex-col items-center">
                          <p className="text-[12px] font-semibold text-slate-600 mb-2.5 flex items-center gap-1.5">
                            <MapPin size={14} className="text-[#241e98]" />
                            Found <strong>{otherStateSpaces.length} parking spaces</strong> in <strong>Karnataka (Bengaluru)</strong>
                          </p>
                          <button
                            type="button"
                            onClick={() => {
                              localStorage.setItem("userDetectedCity", "Bengaluru");
                              localStorage.setItem("selectedServiceAreaName", "Bengaluru");
                              localStorage.setItem("userSelectedState", "Karnataka");
                              localStorage.setItem("userState", "Karnataka");
                              localStorage.setItem("workerState", "Karnataka");
                              localStorage.setItem("selectedCity", "bengaluru-id-fallback");
                              localStorage.removeItem("userLatitude");
                              localStorage.removeItem("userLongitude");
                              localStorage.removeItem("userDetectedAddress");
                              window.location.reload();
                            }}
                            className="px-4 py-2 bg-gradient-to-r from-[#241e98] via-[#2b24b1] to-[#3e3ab3] text-white text-xs font-bold rounded-xl shadow-md shadow-[#241e98]/25 hover:opacity-95 transition-all cursor-pointer inline-flex items-center gap-2"
                          >
                            <MapPin size={13} />
                            Switch Location to Bengaluru (Karnataka)
                          </button>
                        </div>
                      )}
                    </div>
                  )
                ) : (
                  <div className="space-y-4">
                    {filteredSpaces.map((space, idx) => {
                      const distText = getDistanceText(space);
                      const isFav = favourites.includes(space.id);
                      const currentPhoto = photoIndex[space.id] || 0;
                      const hasPhotos = space.photos && space.photos.length > 0;
                      const isFeatured = (interestData[space.id] || 0) > 2 || idx === 0;
                      const { rating: spaceRating, reviewCount: spaceReviews } = getSpaceRatingAndReviews(space.id);

                      return (
                        <div
                          key={space.id}
                          className={`bg-white rounded-xl border transition-all cursor-pointer group overflow-hidden ${space.isSpotlyUploaded
                            ? "border-emerald-200/80 hover:border-emerald-500/40 hover:shadow-lg hover:shadow-emerald-950/5"
                            : "border-gray-200 hover:border-[#241e98]/20 hover:shadow-lg"
                            }`}
                          onClick={() => handleCardClick(space)}
                        >
                          <div className="flex">
                            {/* ── Image Section (Infinite Auto-sliding Carousel) ── */}
                            <DesktopCardImageSlider
                              space={space}
                              isSpotlyUploaded={space.isSpotlyUploaded}
                              isPremium={isPremium}
                              hasUnlockedContact={revealedContacts.has(space.id)}
                              onOpenModal={(index) => setImageModal({ space, index })}
                              spotlyPrice={spotlyDirectionConfig.yearlyPrice}
                              isSpotlyPaidEnabled={spotlyDirectionConfig.paidEnabled}
                              hasSpotlyPass={hasSpotlyPass}
                              rating={spaceRating}
                              reviewCount={spaceReviews}
                            />

                            {/* ── Content Section ── */}
                            <div className="flex-1 px-5 py-4 flex flex-col justify-between min-w-0">
                              <div>
                                {/* Title + Badges */}
                                <div className="flex items-start justify-between gap-4">
                                  <div className="flex items-center gap-2 min-w-0 flex-wrap">
                                    <h3 className="text-[15px] font-bold text-gray-900 leading-snug truncate">
                                      {space.parkingType === "both" ? "Car & Bike" : space.serviceName || `${space.parkingType.charAt(0).toUpperCase()}${space.parkingType.slice(1)} Parking`}
                                    </h3>
                                    {space.isSpotlyUploaded ? (
                                      <span className="bg-emerald-50 text-emerald-800 border border-emerald-300 text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider shrink-0 inline-flex items-center gap-1 shadow-xs">
                                        <Navigation size={10} className="fill-emerald-600 text-emerald-600" /> By Spotly (Public Roadside)
                                      </span>
                                    ) : (
                                      <span className="bg-indigo-50 text-[#3b2fad] border border-indigo-200/80 text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 inline-flex items-center gap-1">
                                        <Building2 size={10} /> Space Owner
                                      </span>
                                    )}
                                    {revealedContacts.has(space.id) && !space.isSpotlyUploaded && (
                                      <span className="bg-emerald-600 text-white text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider shrink-0 inline-flex items-center gap-1">
                                        <CheckCircle size={10} className="text-white" /> VIEWED
                                      </span>
                                    )}
                                  </div>
                                </div>

                                {/* Owner Subtitle + Vehicle Size */}
                                <div className="flex items-center gap-1.5 mt-1.5 text-[12px] text-gray-500 font-medium flex-wrap">
                                  {space.isSpotlyUploaded ? (
                                    <span className="flex items-center gap-1 text-emerald-800 font-semibold truncate">
                                      <Sparkles size={12} className="text-emerald-600 shrink-0" /> Uploaded by <strong className="text-emerald-950 font-extrabold">Spotly Team</strong>
                                    </span>
                                  ) : (
                                    <span className="flex items-center gap-1 text-gray-600 truncate">
                                      <User size={12} className="text-[#241e98] shrink-0" /> by <strong className="text-gray-800 font-semibold">{space.ownerName}</strong>
                                    </span>
                                  )}
                                  {space.vehicleSize && !space.isSpotlyUploaded && (
                                    <>
                                      <span className="text-gray-300">|</span>
                                      <span className="bg-purple-50 text-purple-700 border border-purple-100/80 text-[11px] font-bold px-2 py-0.5 rounded-md">
                                        {space.vehicleSize}
                                      </span>
                                    </>
                                  )}
                                </div>

                                {/* Location */}
                                <div className="flex items-center gap-1 mt-1.5 text-gray-500 text-[12px]">
                                  <MapPin size={12} className="shrink-0 text-[#241e98]" />
                                  <span className="truncate">{space.location?.split(",").slice(0, 2).join(",").trim() || "Location"}</span>
                                </div>

                                {/* For Spotly: Show KM distance label below location; For Owner: review is shown on left image */}
                                {space.isSpotlyUploaded && distText && (
                                  <div className="flex items-center gap-1.5 mt-2">
                                    <span className="bg-amber-50 text-amber-700 border border-amber-200/80 font-bold text-[11px] px-2.5 py-0.5 rounded-full inline-flex items-center gap-1 shadow-2xs">
                                      <Navigation size={10} className="text-amber-600 fill-amber-600" />
                                      <span>{distText}</span>
                                    </span>
                                  </div>
                                )}

                                {/* Date/Time Pills */}
                                {(space.dateText || space.timeText) && (
                                  <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                                    {space.dateText && (
                                      <span className="flex items-center gap-1 bg-gray-50 border border-gray-200 text-gray-600 text-[11px] font-bold px-2 py-0.5 rounded-full">
                                        📆 {new Date(space.dateText).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                                      </span>
                                    )}
                                    {space.timeText && (
                                      <span className="flex items-center gap-1 bg-gray-50 border border-gray-200 text-gray-600 text-[11px] font-bold px-2 py-0.5 rounded-full">
                                        ⏰ {space.timeText}{space.endTimeText ? ` → ${space.endTimeText}` : ""}
                                      </span>
                                    )}
                                  </div>
                                )}
                              </div>

                              {/* Price + Distance */}
                              <div className="mt-3 flex items-center justify-between">
                                {!space.isSpotlyUploaded ? (
                                  <>
                                    <div className="flex items-baseline gap-1.5">
                                      <span className="text-[18px] font-black text-gray-900">₹{(space.rent || 0).toLocaleString("en-IN")}</span>
                                      <span className="text-[12px] text-gray-400 font-medium">/{space.rentUnit || "month"}</span>
                                    </div>
                                    {distText && (
                                      <span className="bg-amber-50 text-amber-700 border border-amber-200/70 font-bold text-[11px] px-2.5 py-1 rounded-full flex items-center gap-1">
                                        <Navigation size={10} className="text-amber-600 fill-amber-600" />
                                        {distText}
                                      </span>
                                    )}
                                  </>
                                ) : (
                                  <div />
                                )}
                              </div>
                            </div>

                            {/* ── Owner / Action Section (Right) ── */}
                            <div className="w-[200px] shrink-0 px-3 py-2.5 border-l border-gray-100 flex flex-col items-center justify-between relative">
                              {/* Fav Heart */}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (!requireLogin("save spaces to favourites")) return;
                                  toggleFavourite(e, space.id);
                                }}
                                className="absolute top-2 right-2 cursor-pointer z-10"
                              >
                                <Heart size={16} className={isFav ? "fill-red-500 text-red-500" : "text-gray-300 hover:text-gray-400"} />
                              </button>

                              {space.isSpotlyUploaded ? (
                                <div className="w-full flex flex-col items-center justify-between h-full py-1">
                                  <div className="flex flex-col items-center text-center mt-1">
                                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-600 via-teal-600 to-emerald-700 text-white font-black flex items-center justify-center text-sm shadow-md shadow-emerald-700/25 shrink-0 mb-1">
                                      <Navigation size={17} className="fill-white" />
                                    </div>
                                    <p className="text-[11px] font-extrabold text-emerald-950 leading-tight">By Spotly</p>
                                    <p className="text-[9px] text-emerald-700 font-bold flex items-center gap-0.5 mt-0.5">
                                      Verified Public Spot <CheckCircle size={9} className="fill-emerald-500 text-white" />
                                    </p>
                                  </div>

                                  <div className="w-full mt-2 space-y-1.5">
                                    <button
                                      type="button"
                                      onClick={(e) => openDirections(e, space)}
                                      className={`w-full py-2.5 px-3 ${
                                        spotlyDirectionConfig.paidEnabled && !hasSpotlyPass && !isPremium
                                          ? "bg-gradient-to-r from-amber-600 via-amber-500 to-yellow-600 hover:from-amber-700 hover:to-yellow-700 text-slate-950 shadow-md shadow-amber-600/25 border border-amber-400"
                                          : "bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white shadow-md shadow-emerald-700/25"
                                      } text-[12px] font-bold rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 active:scale-95`}
                                      title={spotlyDirectionConfig.paidEnabled && !hasSpotlyPass && !isPremium ? `Unlock Directions (₹${spotlyDirectionConfig.yearlyPrice}/year)` : "Get Directions"}
                                      data-testid="button-directions-spotly"
                                    >
                                      {spotlyDirectionConfig.paidEnabled && !hasSpotlyPass && !isPremium ? (
                                        <>
                                          <Lock size={13} className="text-slate-950" />
                                          <span>Get Directions (₹{spotlyDirectionConfig.yearlyPrice}/yr)</span>
                                        </>
                                      ) : (
                                        <>
                                          <Navigation size={13} className="fill-white" />
                                          <span>Get Directions</span>
                                        </>
                                      )}
                                    </button>
                                    <p className="text-[9px] text-center font-medium leading-tight">
                                      {spotlyDirectionConfig.paidEnabled && !hasSpotlyPass && !isPremium ? (
                                        <span className="text-amber-700 font-bold">Yearly Subscription Only (₹{spotlyDirectionConfig.yearlyPrice}/yr) • Unlimited for 365 days</span>
                                      ) : isPremium ? (
                                        <span className="text-emerald-600 font-bold">Included Free with Space Owner Subscription • Unlimited GPS</span>
                                      ) : hasSpotlyPass ? (
                                        <span className="text-emerald-600 font-bold">Annual Pass Active • Unlimited GPS</span>
                                      ) : (
                                        <span className="text-gray-400">Free public spot • No booking needed</span>
                                      )}
                                    </p>
                                  </div>
                                </div>
                              ) : (
                                <>
                                  <div className="flex items-center gap-2 mt-1">
                                    {/* Owner Avatar */}
                                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#241e98] to-[#4a45c9] text-white font-bold flex items-center justify-center text-sm shadow-sm shrink-0">
                                      {space.ownerName?.charAt(0).toUpperCase() || "S"}
                                    </div>
                                    <div className="min-w-0">
                                      <p className="text-[11px] font-bold text-gray-800 truncate max-w-[110px]">{space.ownerName || "Space Owner"}</p>
                                      <p className="text-[9px] text-green-600 font-medium flex items-center gap-0.5">
                                        Verified Owner <CheckCircle size={9} className="fill-green-500 text-white" />
                                      </p>
                                    </div>
                                  </div>

                                  {/* Contact Section */}
                                  {revealedContacts.has(space.id) ? (
                                    /* ── Revealed: Show Phone + WhatsApp + Directions ── */
                                    <div className="w-full mt-1.5 space-y-1.5">
                                      <div className="flex items-center justify-center gap-4">
                                        <button
                                          onClick={(e) => openDirections(e, space)}
                                          className="flex flex-col items-center gap-1 cursor-pointer group/map"
                                          title="Open in Maps"
                                        >
                                          <div className="w-8 h-8 rounded-full bg-[#241e98] hover:bg-[#1b1675] text-white flex items-center justify-center transition-all shadow-md shadow-[#241e98]/25 group-hover/map:scale-105">
                                            <MapPin size={14} />
                                          </div>
                                          <span className="text-[9px] font-semibold text-gray-500">Maps</span>
                                        </button>
                                        <button
                                          type="button"
                                          onClick={(e) => openWhatsApp(e, space.ownerPhone, space.ownerName)}
                                          className="flex flex-col items-center gap-1 cursor-pointer no-underline group/wa border-0 bg-transparent"
                                          title="WhatsApp"
                                        >
                                          <div className="w-8 h-8 rounded-full bg-[#25d366] hover:bg-emerald-600 text-white flex items-center justify-center transition-all shadow-md shadow-emerald-500/25 group-hover/wa:scale-105">
                                            <MessageCircle size={14} />
                                          </div>
                                          <span className="text-[9px] font-semibold text-gray-500">WhatsApp</span>
                                        </button>
                                      </div>
                                      <a
                                        href={`tel:+91${(space.ownerPhone || "").replace(/\D/g, "").slice(-10)}`}
                                        onClick={(e) => e.stopPropagation()}
                                        className="w-full flex items-center gap-2 py-1.5 px-3 bg-emerald-50 border border-emerald-200/60 rounded-xl text-emerald-900 hover:bg-emerald-100 transition-colors no-underline"
                                      >
                                        <div className="w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center shrink-0">
                                          <Phone size={12} className="text-white" />
                                        </div>
                                        <span className="text-[13px] font-bold truncate tracking-wide">{formatIndianPhone(space.ownerPhone)}</span>
                                      </a>
                                    </div>
                                  ) : (
                                    /* ── Not Revealed: View Contact Button ── */
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        if (revealingContactId === space.id) return;
                                        if (!requireLogin("view contact details")) return;
                                        handleViewContactForSpace(space.id);
                                      }}
                                      disabled={revealingContactId === space.id}
                                      className="w-full py-2.5 bg-gradient-to-r from-[#241e98] via-[#2b24b1] to-[#3e3ab3] hover:from-[#1b1778] hover:to-[#2e2a97] text-white text-[12px] font-bold rounded-lg shadow-md shadow-[#241e98]/25 transition-all cursor-pointer mt-3 flex items-center justify-center gap-2 disabled:opacity-80"
                                    >
                                      {revealingContactId === space.id ? (
                                        <>
                                          <Loader2 size={14} className="animate-spin" />
                                          Revealing...
                                        </>
                                      ) : (
                                        <>
                                          <Eye size={14} />
                                          View Contact
                                        </>
                                      )}
                                    </button>
                                  )}
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Roadside Parking Seeker Disclaimer Banner at bottom of list */}
                {uploaderFilter === "spotly" && filteredSpaces.length > 0 && !isLoading && (
                  <div className="mt-4 p-4 rounded-xl bg-gradient-to-r from-amber-50 via-yellow-50 to-amber-50 border border-amber-300 text-amber-950 shadow-sm flex items-start gap-3">
                    <span className="text-xl shrink-0 mt-0.5">⚠️</span>
                    <div>
                      <h4 className="text-xs font-black uppercase tracking-wide text-amber-900 mb-1">
                        FREE PUBLIC ROADSIDE PARKING
                      </h4>
                      <p className="text-xs text-amber-950/90 leading-relaxed font-medium">
                        Spotly provides location guidance only. Availability is not guaranteed. Check parking rules and signs before parking. Park at your own risk; Spotly is not responsible for fines or vehicle-related incidents.
                      </p>
                    </div>
                  </div>
                )}

                {/* ═══ SEARCH SKELETON CARDS ═══ */}
                {isSearching && (
                  <div className="space-y-4 mt-4">
                    {[1, 2, 3].map((i) => (
                      <div
                        key={i}
                        className="bg-white rounded-xl border border-gray-200 overflow-hidden"
                        style={{ opacity: 1 - i * 0.2 }}
                      >
                        <div className="flex animate-pulse">
                          {/* Image skeleton */}
                          <div className="w-[200px] h-[170px] shrink-0 bg-gray-200 rounded-l-xl relative overflow-hidden">
                            <div
                              className="absolute inset-0"
                              style={{
                                background: "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.5) 50%, transparent 100%)",
                                animation: "skeletonShimmer 1.8s ease-in-out infinite",
                              }}
                            />
                          </div>
                          {/* Content skeleton */}
                          <div className="flex-1 p-5 space-y-3">
                            <div className="flex items-center justify-between">
                              <div className="h-4 bg-gray-200 rounded-full w-[45%] relative overflow-hidden">
                                <div
                                  className="absolute inset-0"
                                  style={{
                                    background: "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.5) 50%, transparent 100%)",
                                    animation: "skeletonShimmer 1.8s ease-in-out infinite",
                                  }}
                                />
                              </div>
                              <div className="h-5 bg-gray-200 rounded-full w-[60px] relative overflow-hidden">
                                <div
                                  className="absolute inset-0"
                                  style={{
                                    background: "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.5) 50%, transparent 100%)",
                                    animation: "skeletonShimmer 1.8s ease-in-out infinite",
                                  }}
                                />
                              </div>
                            </div>
                            <div className="h-3 bg-gray-100 rounded-full w-[70%] relative overflow-hidden">
                              <div
                                className="absolute inset-0"
                                style={{
                                  background: "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.5) 50%, transparent 100%)",
                                  animation: "skeletonShimmer 1.8s ease-in-out infinite 0.2s",
                                }}
                              />
                            </div>
                            <div className="flex items-center gap-3 mt-2">
                              <div className="h-6 bg-gray-100 rounded-lg w-[70px] relative overflow-hidden">
                                <div
                                  className="absolute inset-0"
                                  style={{
                                    background: "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.5) 50%, transparent 100%)",
                                    animation: "skeletonShimmer 1.8s ease-in-out infinite 0.3s",
                                  }}
                                />
                              </div>
                              <div className="h-6 bg-gray-100 rounded-lg w-[55px] relative overflow-hidden">
                                <div
                                  className="absolute inset-0"
                                  style={{
                                    background: "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.5) 50%, transparent 100%)",
                                    animation: "skeletonShimmer 1.8s ease-in-out infinite 0.4s",
                                  }}
                                />
                              </div>
                              <div className="h-6 bg-gray-100 rounded-lg w-[50px] relative overflow-hidden">
                                <div
                                  className="absolute inset-0"
                                  style={{
                                    background: "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.5) 50%, transparent 100%)",
                                    animation: "skeletonShimmer 1.8s ease-in-out infinite 0.5s",
                                  }}
                                />
                              </div>
                            </div>
                            <div className="h-3 bg-gray-100 rounded-full w-[55%] relative overflow-hidden">
                              <div
                                className="absolute inset-0"
                                style={{
                                  background: "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.5) 50%, transparent 100%)",
                                  animation: "skeletonShimmer 1.8s ease-in-out infinite 0.6s",
                                }}
                              />
                            </div>
                            <div className="h-9 bg-gray-200 rounded-lg w-full mt-2 relative overflow-hidden">
                              <div
                                className="absolute inset-0"
                                style={{
                                  background: "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.5) 50%, transparent 100%)",
                                  animation: "skeletonShimmer 1.8s ease-in-out infinite 0.7s",
                                }}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                    <p className="text-center text-[12px] text-gray-400 font-medium pb-2">
                      Searching for "<span className="text-[#241e98] font-semibold">{searchQuery.trim()}</span>" — {filteredSpaces.length} result{filteredSpaces.length !== 1 ? "s" : ""} found
                    </p>
                    <style>{`
                      @keyframes skeletonShimmer {
                        0% { transform: translateX(-100%); }
                        100% { transform: translateX(100%); }
                      }
                    `}</style>
                  </div>
                )}
              </div>
            </div>

            {/* ── Right: 3rd Column (Feature Cards & Ads Panel) ── */}
            <DesktopFeatureAdsColumn
              onContactSupport={() => setShowHelpSupport(true)}
              className="p-5 border-l border-gray-200/80 bg-slate-50/30 overflow-y-auto max-h-[calc(100vh-56px)] sticky top-14"
              testId="seeker-desktop-3rd-column"
            />
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {content}

      {/* ═══ HELP & SUPPORT POPUP ═══ */}
      {showHelpSupport && (
        <div className="fixed inset-0 z-[9999] bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4" onClick={() => setShowHelpSupport(false)}>
          <div className="bg-white rounded-2xl p-7 text-center shadow-2xl max-w-sm w-full mx-4 relative" onClick={(e) => e.stopPropagation()}>
            {/* Close button */}
            <button
              onClick={() => setShowHelpSupport(false)}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 transition-all cursor-pointer"
            >
              <X size={16} />
            </button>

            <div className="w-16 h-16 rounded-full bg-indigo-50 flex items-center justify-center mx-auto mb-4">
              <Phone size={28} className="text-[#241e98]" />
            </div>
            <h3 className="text-[18px] font-bold text-gray-900 mb-1">Help & Support</h3>
            <p className="text-gray-500 text-[12px] mb-5">We're here to help! Reach out to us anytime.</p>

            <div className="space-y-2.5 text-left">
              <a
                href={`tel:${supportPhone.replace(/\s/g, '')}`}
                className="flex items-center gap-3 p-3.5 bg-green-50 rounded-xl hover:bg-green-100 transition-colors no-underline border border-green-100"
              >
                <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center shrink-0">
                  <Phone className="w-4.5 h-4.5 text-white" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900 text-[13px]">Call Us</p>
                  <p className="text-[12px] text-gray-500">{supportPhone}</p>
                </div>
              </a>
              <a
                href={`mailto:${supportEmail}`}
                className="flex items-center gap-3 p-3.5 bg-indigo-50/70 rounded-xl hover:bg-indigo-100 transition-colors no-underline border border-indigo-100"
              >
                <div className="w-10 h-10 bg-[#241e98] rounded-full flex items-center justify-center shrink-0">
                  <Mail className="w-4.5 h-4.5 text-white" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900 text-[13px]">Email Us</p>
                  <p className="text-[12px] text-gray-500">{supportEmail}</p>
                </div>
              </a>
            </div>

            <button
              onClick={() => setShowHelpSupport(false)}
              className="mt-5 w-full py-2.5 bg-gradient-to-r from-[#241e98] via-[#2b24b1] to-[#3e3ab3] hover:from-[#1b1778] hover:to-[#2e2a97] text-white text-[13px] font-bold rounded-xl shadow-lg shadow-[#241e98]/25 transition-all cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* ═══ IMAGE GALLERY MODAL ═══ */}
      {imageModal && imageModal.space.photos && imageModal.space.photos.length > 0 && (
        <div
          className="fixed inset-0 z-[300] flex items-center justify-center"
          onClick={() => setImageModal(null)}
          onKeyDown={(e) => {
            if (e.key === "Escape") setImageModal(null);
            if (e.key === "ArrowLeft") setImageModal(prev => prev ? { ...prev, index: Math.max(0, prev.index - 1) } : null);
            if (e.key === "ArrowRight") setImageModal(prev => prev ? { ...prev, index: Math.min((prev.space.photos?.length || 1) - 1, prev.index + 1) } : null);
          }}
          tabIndex={0}
          ref={(el) => el?.focus()}
        >
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/80 backdrop-blur-md cursor-pointer"
            onClick={() => setImageModal(null)}
          />

          {/* Close button */}
          <button
            onClick={(e) => { e.stopPropagation(); setImageModal(null); }}
            className="absolute top-5 right-5 z-10 w-10 h-10 rounded-full bg-white/15 hover:bg-white/25 flex items-center justify-center text-white transition-all cursor-pointer backdrop-blur-sm border border-white/10"
          >
            <X size={20} />
          </button>

          {/* Photo counter badge */}
          <div
            className="absolute top-5 left-5 z-10 bg-white/15 backdrop-blur-sm text-white text-[13px] font-bold px-4 py-2 rounded-full border border-white/10"
            onClick={(e) => e.stopPropagation()}
          >
            {imageModal.index + 1} / {imageModal.space.photos.length}
          </div>

          {/* Space name label */}
          <div
            className="absolute top-5 left-1/2 -translate-x-1/2 z-10 bg-white/10 backdrop-blur-sm text-white text-[13px] font-semibold px-5 py-2 rounded-full border border-white/10 max-w-[400px] truncate"
            onClick={(e) => e.stopPropagation()}
          >
            {imageModal.space.serviceName || "Parking Space"} — {imageModal.space.location?.split(",").slice(0, 2).join(",").trim()}
          </div>

          {/* Image container */}
          <div
            className="relative z-[1] flex items-center justify-center w-full h-full px-20 py-24 cursor-pointer"
            onClick={() => setImageModal(null)}
          >
            <img
              src={imageModal.space.photos[imageModal.index]}
              alt={`${imageModal.space.serviceName} - Photo ${imageModal.index + 1}`}
              className="max-w-full max-h-full object-contain rounded-2xl shadow-2xl shadow-black/50 cursor-default"
              style={{ animation: "modalImageFadeIn 0.25s ease-out" }}
              onClick={(e) => e.stopPropagation()}
            />
          </div>

          {/* Left arrow */}
          {imageModal.index > 0 && (
            <button
              onClick={(e) => { e.stopPropagation(); setImageModal(prev => prev ? { ...prev, index: prev.index - 1 } : null); }}
              className="absolute left-6 top-1/2 -translate-y-1/2 z-10 w-12 h-12 rounded-full bg-white/15 hover:bg-white/30 flex items-center justify-center text-white transition-all cursor-pointer backdrop-blur-sm border border-white/10 hover:scale-110"
            >
              <ChevronLeft size={24} />
            </button>
          )}

          {/* Right arrow */}
          {imageModal.index < imageModal.space.photos.length - 1 && (
            <button
              onClick={(e) => { e.stopPropagation(); setImageModal(prev => prev ? { ...prev, index: prev.index + 1 } : null); }}
              className="absolute right-6 top-1/2 -translate-y-1/2 z-10 w-12 h-12 rounded-full bg-white/15 hover:bg-white/30 flex items-center justify-center text-white transition-all cursor-pointer backdrop-blur-sm border border-white/10 hover:scale-110"
            >
              <ChevronRight size={24} />
            </button>
          )}

          {/* Dot indicators */}
          {imageModal.space.photos.length > 1 && (
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 flex items-center gap-2 bg-black/40 backdrop-blur-sm rounded-full px-4 py-2.5 border border-white/10">
              {imageModal.space.photos.map((_, i) => (
                <button
                  key={i}
                  onClick={(e) => { e.stopPropagation(); setImageModal(prev => prev ? { ...prev, index: i } : null); }}
                  className={`rounded-full transition-all cursor-pointer ${i === imageModal.index
                    ? "w-7 h-2.5 bg-white"
                    : "w-2.5 h-2.5 bg-white/40 hover:bg-white/60"
                    }`}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Image modal animation */}
      <style>{`
        @keyframes modalImageFadeIn {
          from { opacity: 0; transform: scale(0.92); }
          to { opacity: 1; transform: scale(1); }
        }
      `}</style>
      {/* ═══ PROVIDER LOGOUT CONFIRMATION MODAL (STYLED IDENTICALLY TO LOGIN POPUP) ═══ */}
      <AnimatePresence>
        {showProviderLogoutConfirm && (
          <motion.div
            className="fixed inset-0 z-[10000] flex items-center justify-center px-6"
            style={{ backgroundColor: "rgba(0,0,0,0.55)", backdropFilter: "blur(4px)" }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowProviderLogoutConfirm(false)}
            data-testid="dialog-switch-provider"
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
                onClick={() => setShowProviderLogoutConfirm(false)}
                className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 backdrop-blur-md flex items-center justify-center text-white z-10 cursor-pointer border border-white/20"
                data-testid="button-close-provider-logout"
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
                    Switch to Provider
                  </h3>
                  <p className="text-white/90 text-xs font-medium leading-relaxed">
                    Rent your space &amp; earn monthly income
                  </p>
                </div>
              </div>

              {/* White Body with Info & Action Buttons */}
              <div className="px-6 pt-5 pb-6 bg-white">
                <p className="text-xs text-slate-600 text-center font-medium leading-relaxed mb-5">
                  You are currently signed in as a <span className="font-bold text-slate-800">Space Seeker</span>. Please log out to access the Space Provider portal.
                </p>
                <button
                  onClick={handleProviderLogoutConfirm}
                  className="w-full h-13 rounded-2xl bg-gradient-to-r from-[#241e98] via-[#2b24b1] to-[#3e3ab3] hover:from-[#1b1778] hover:to-[#2e2a97] text-white font-black text-sm uppercase tracking-wider shadow-xl shadow-[#241e98]/30 active:scale-[0.98] transition-all cursor-pointer flex items-center justify-center gap-2"
                  data-testid="button-confirm-provider-logout"
                >
                  <span>Logout &amp; Login</span>
                  <ArrowRight size={16} />
                </button>
                <button
                  onClick={() => setShowProviderLogoutConfirm(false)}
                  className="w-full h-11 mt-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs active:scale-[0.98] transition-all cursor-pointer"
                  data-testid="button-cancel-provider-logout"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ═══ PUBLIC ROADSIDE PARKING INFORMATION ALERT MODAL (YELLOW COLOR) ═══ */}
      <AnimatePresence>
        {showRoadsideAlertModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ duration: 0.2 }}
              className="w-full max-w-md rounded-2xl bg-gradient-to-b from-amber-50 via-yellow-50 to-amber-100 border-2 border-amber-400 p-6 shadow-2xl relative text-amber-950"
            >
              <button
                type="button"
                onClick={() => {
                  try {
                    localStorage.setItem(`spotly_roadside_alert_${new Date().toISOString().slice(0, 10)}`, "shown");
                  } catch (_) {}
                  setShowRoadsideAlertModal(false);
                }}
                className="absolute top-4 right-4 p-1.5 text-amber-800 hover:text-amber-950 hover:bg-amber-200/60 rounded-full transition-colors cursor-pointer"
                title="Close"
              >
                <X size={18} />
              </button>

              <div className="flex items-start gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-amber-400/30 border border-amber-400 flex items-center justify-center shrink-0 text-amber-700 shadow-sm mt-0.5">
                  <AlertTriangle size={26} className="stroke-[2.5]" />
                </div>
                <div className="flex-1 min-w-0 pr-6">
                  <span className="text-[10px] font-black tracking-wider uppercase bg-amber-300/80 text-amber-950 px-2 py-0.5 rounded-md inline-block mb-1 border border-amber-400/60">
                    Important Notice
                  </span>
                  <h3 className="text-[17px] font-extrabold text-amber-950 leading-snug">
                    Public roadside parking information
                  </h3>
                </div>
              </div>

              <div className="mt-4 p-3.5 rounded-xl bg-white/70 border border-amber-300/70 text-xs text-amber-950 leading-relaxed font-medium">
                This location is not a reserved parking space. Availability is not guaranteed and parking is subject to local traffic rules and restrictions. Please check the signs before parking.
              </div>

              <div className="mt-5 flex gap-2.5">
                <button
                  type="button"
                  onClick={() => {
                    try {
                      localStorage.setItem(`spotly_roadside_alert_${new Date().toISOString().slice(0, 10)}`, "shown");
                    } catch (_) {}
                    setShowRoadsideAlertModal(false);
                  }}
                  className="w-full py-3 px-4 bg-gradient-to-r from-amber-400 via-amber-300 to-yellow-400 hover:from-amber-500 hover:to-yellow-500 text-amber-950 font-black rounded-xl shadow-lg shadow-amber-400/30 border-2 border-amber-400/80 active:scale-[0.98] transition-all cursor-pointer text-sm flex items-center justify-center gap-2"
                >
                  I Understand &amp; Proceed
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ═══ SPOTLY ROADSIDE DIRECTIONS PASS SUBSCRIPTION MODAL (COMPACT) ═══ */}
      <AnimatePresence>
        {showSpotlyPassModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ duration: 0.18 }}
              className="w-full max-w-[360px] rounded-2xl bg-white border border-emerald-200 overflow-hidden shadow-2xl relative"
            >
              <button
                type="button"
                onClick={() => {
                  setShowSpotlyPassModal(false);
                  setIsProcessingPassPayment(false);
                }}
                className="absolute top-3 right-3 w-7 h-7 rounded-full bg-white/20 hover:bg-white/30 backdrop-blur-md flex items-center justify-center text-white z-20 cursor-pointer border border-white/20 transition-colors"
                title="Close"
              >
                <X size={14} />
              </button>

              {/* Compact Header */}
              <div className="bg-gradient-to-r from-emerald-700 via-teal-700 to-emerald-800 px-4 py-3.5 text-white relative">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-white/15 border border-white/25 flex items-center justify-center shrink-0 shadow-sm">
                    <Navigation size={17} className="text-white fill-white" />
                  </div>
                  <div className="min-w-0 pr-5">
                    <h3 className="text-sm font-bold text-white truncate">
                      Roadside Directions Pass
                    </h3>
                    <p className="text-[11px] text-emerald-100/90 truncate">
                      365 days unlimited GPS navigation
                    </p>
                  </div>
                </div>
              </div>

              {/* Compact Body */}
              <div className="p-4 bg-white space-y-3">
                {/* Price Row */}
                <div className="p-2.5 px-3.5 rounded-xl bg-emerald-50/80 border border-emerald-200/80 flex items-center justify-between">
                  <div>
                    <span className="text-[11px] font-bold text-emerald-900 uppercase tracking-wide">Annual Pass</span>
                    <p className="text-[10px] text-gray-500">One-time payment</p>
                  </div>
                  <div className="text-right">
                    <span className="text-xl font-black text-emerald-900">₹{spotlyDirectionConfig.yearlyPrice}</span>
                    <span className="text-[11px] font-bold text-gray-500"> / year</span>
                  </div>
                </div>

                {/* Short Features */}
                <div className="space-y-1.5 text-[11px] text-gray-600 pl-0.5">
                  <div className="flex items-center gap-2">
                    <CheckCircle size={13} className="text-emerald-600 shrink-0" />
                    <span>Instant Google Maps navigation to exact spot</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle size={13} className="text-emerald-600 shrink-0" />
                    <span>Yearly subscription only • 365 days unlimited roadside parking</span>
                  </div>
                </div>

                {/* Tip about space owner subscription */}
                <div className="p-2.5 rounded-xl bg-purple-50/80 border border-purple-200/70 text-[10.5px] text-purple-900 leading-snug">
                  <span className="font-bold text-purple-950">💡 Bonus: </span>
                  Subscribing to <strong>Space Owner Contacts</strong> unlocks all By Spotly roadside parking for <strong>FREE</strong>!
                </div>

                {targetDirectionSpace && (
                  <div className="px-2.5 py-1.5 rounded-lg bg-gray-50 border border-gray-200/80 text-[11px] text-gray-600 truncate">
                    <span className="font-bold text-gray-800">Spot: </span>
                    {targetDirectionSpace.serviceName} • {targetDirectionSpace.location?.split(",")[0]}
                  </div>
                )}

                <div className="pt-1 flex flex-col gap-1.5">
                  <Button
                    type="button"
                    onClick={handlePaySpotlyPass}
                    disabled={isProcessingPassPayment}
                    className="w-full bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white font-extrabold py-2.5 rounded-xl shadow-md shadow-emerald-700/20 cursor-pointer text-xs"
                  >
                    {isProcessingPassPayment ? (
                      <span className="inline-flex items-center gap-2">
                        <Loader2 size={14} className="animate-spin" />
                        Connecting Gateway...
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5">
                        <Lock size={13} />
                        Pay ₹{spotlyDirectionConfig.yearlyPrice} &amp; Unlock
                      </span>
                    )}
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => {
                      setShowSpotlyPassModal(false);
                      setIsProcessingPassPayment(false);
                    }}
                    className="text-gray-400 hover:text-gray-600 text-[11px] h-7 cursor-pointer"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}

