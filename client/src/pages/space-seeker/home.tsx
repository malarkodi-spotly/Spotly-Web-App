import { useState, useEffect, useMemo, useRef } from "react";
import { useLocation, useSearch } from "wouter";
import MobileLayout from "@/components/layout/mobile-layout";
import SpaceSeekerDesktopHome from "@/components/space-seeker-desktop-home";
import SpotlyPreloader from "@/components/spotly-preloader";
import {
  MapPin,
  Bell,
  Loader2,
  Phone,
  Mail,
  Car,
  Bike,
  IndianRupee,
  Calendar,
  Clock,
  Eye,
  EyeOff,
  MessageCircle,
  Crown,
  Check,
  X,
  Shield,
  Zap,
  Star,
  Search,
  Navigation,
  XCircle,
  ImageIcon,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ThumbsUp,
  ParkingCircle,
  LocateFixed,
  User,
  ArrowDownWideNarrow,
  ArrowUpWideNarrow,
  Sparkles,
  Heart,
  Gift,
  Building2,
  CheckCircle,
  Lock,
  AlertTriangle,
} from "lucide-react";
import { vibrate } from "@/lib/vibrate";
import { isGuest } from "@/lib/guest";
import { triggerLocationPermissionError } from "@/lib/location-error";
import { useAuthGuard } from "@/contexts/auth-guard";
import { capitalizeName, getTimeGreeting } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { getApiUrl } from "@/lib/api-config";
import { Capacitor } from "@capacitor/core";
import { useScroll } from "@/contexts/scroll-context";
import { LocationSync } from "@/components/location-sync";
import StateSelectorModal from "@/components/state-selector-modal";
import { useRegisterModalBack } from "@/contexts/mobile-back-context";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { NotificationSheet } from "@/components/notifications/notification-sheet";

// Detect if running inside the native Android/iOS WebView.
// Android WebView UA always has "Version/4.0" BEFORE "Chrome/", while
// stock Chrome for Android NEVER has "Version/4.0". This is the reliable signal.
const isNativeApp = (): boolean => {
  const ua = navigator.userAgent || "";
  if (/SpotlyApp/i.test(ua)) return true;          // custom UA set by app
  if (/wv\b/.test(ua)) return true;                 // explicit WebView flag
  if (/Android/i.test(ua) && /Version\/\d/.test(ua) && /Chrome\//.test(ua)) return true; // Version/4.0 before Chrome = WebView
  if (/Android/i.test(ua) && !/Chrome\//.test(ua) && !/Firefox\//.test(ua)) return true;  // no browser at all
  return false;
};

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
  isPriceHidden?: boolean;
}

const MOCK_EXPLORE_SPACES_KA: ParkingSpace[] = [];
const MOCK_EXPLORE_SPACES_TN: ParkingSpace[] = [];

const getSingleWordLocation = (address: string, city: string): string => {
  if (!address) {
    return (city || "Location not set").split(" ")[0];
  }
  const parts = address.split(",").map(p => p.trim()).filter(Boolean);
  const cityLower = city.toLowerCase();

  for (const part of parts) {
    if (/\d/.test(part)) continue;

    const partLower = part.toLowerCase();
    if (
      partLower === "india" ||
      partLower === "karnataka" ||
      partLower === "maharashtra" ||
      partLower === "tamil nadu" ||
      partLower === "west bengal" ||
      partLower === "delhi" ||
      partLower === "bengaluru" ||
      partLower === "bangalore" ||
      partLower === "mumbai" ||
      partLower === "bombay" ||
      partLower === "chennai" ||
      partLower === "madras" ||
      partLower === "kolkata" ||
      partLower === "calcutta" ||
      partLower === cityLower ||
      partLower.includes("bengaluru") ||
      partLower.includes("bangalore") ||
      partLower.includes("mumbai") ||
      partLower.includes("chennai") ||
      partLower.includes("delhi") ||
      partLower.includes("kolkata")
    ) {
      continue;
    }

    const firstWord = part.split(" ")[0].replace(/[^a-zA-Z]/g, "");
    if (firstWord) return firstWord;
  }

  const fallback = city || "Location not set";
  return fallback.split(" ")[0];
};

const renderVehicleIconBadge = (parkingType: string) => {
  const t = (parkingType || "").toLowerCase();
  const isBike = t === "bike";
  const isBoth = t === "both" || (t.includes("car") && t.includes("bike"));

  if (isBike) {
    return (
      <div
        className="relative w-full h-full rounded-2xl landing-gradient border border-white/20 shadow-md flex flex-col items-center justify-center p-2 overflow-hidden"
        style={{ background: "linear-gradient(135deg, #1e3a8a 0%, #3b2fad 35%, #6d28d9 70%, #7c3aed 100%)" }}
      >
        <div className="absolute -top-4 -left-4 w-12 h-12 bg-white/15 rounded-full blur-md pointer-events-none" />
        <Bike className="w-8 h-8 text-white drop-shadow-md" />
        <span className="text-[9px] font-black uppercase tracking-wider text-indigo-100 mt-1 drop-shadow-xs">Bike Spot</span>
      </div>
    );
  }

  if (isBoth) {
    return (
      <div
        className="relative w-full h-full rounded-2xl landing-gradient border border-white/20 shadow-md flex flex-col items-center justify-center p-1.5 overflow-hidden"
        style={{ background: "linear-gradient(135deg, #1e3a8a 0%, #3b2fad 35%, #6d28d9 70%, #7c3aed 100%)" }}
      >
        <div className="absolute -top-4 -left-4 w-12 h-12 bg-white/15 rounded-full blur-md pointer-events-none" />
        <div className="flex items-center gap-1">
          <Car className="w-6 h-6 text-white drop-shadow-md" />
          <Bike className="w-6 h-6 text-white drop-shadow-md" />
        </div>
        <span className="text-[8px] font-black uppercase tracking-wider text-indigo-100 mt-1 drop-shadow-xs">Car &amp; Bike</span>
      </div>
    );
  }

  return (
    <div
      className="relative w-full h-full rounded-2xl landing-gradient border border-white/20 shadow-md flex flex-col items-center justify-center p-2 overflow-hidden"
      style={{ background: "linear-gradient(135deg, #1e3a8a 0%, #3b2fad 35%, #6d28d9 70%, #7c3aed 100%)" }}
    >
      <div className="absolute -top-4 -left-4 w-12 h-12 bg-white/15 rounded-full blur-md pointer-events-none" />
      <Car className="w-8 h-8 text-white drop-shadow-md" />
      <span className="text-[9px] font-black uppercase tracking-wider text-indigo-100 mt-1 drop-shadow-xs">Car Spot</span>
    </div>
  );
};

const mobileCardSlideVariants = {
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

interface MobileCardImageSliderProps {
  photos: string[];
  serviceName: string;
  parkingType: string;
  isSpotlyUploaded?: boolean;
  isPremium?: boolean;
  isRevealed?: boolean;
  onOpenPhotos?: (e: React.MouseEvent, index: number) => void;
}

function MobileCardImageSlider({
  photos = [],
  serviceName,
  parkingType,
  isSpotlyUploaded = false,
  isPremium = false,
  isRevealed = false,
  onOpenPhotos,
}: MobileCardImageSliderProps) {
  const validPhotos = Array.isArray(photos) ? photos.filter(Boolean) : [];
  const hasPhotos = validPhotos.length > 0;
  const [[page, direction], setPage] = useState([0, 1]);
  const [isHovered, setIsHovered] = useState(false);
  const touchStartXRef = useRef<number | null>(null);

  const currentIndex = hasPhotos
    ? ((page % validPhotos.length) + validPhotos.length) % validPhotos.length
    : 0;

  const paginate = (newDirection: number) => {
    setPage(([prevPage]) => [prevPage + newDirection, newDirection]);
  };

  // Automatically cycle through images infinitely every 3 seconds from right to left
  useEffect(() => {
    if (!hasPhotos || validPhotos.length <= 1 || isHovered) return;
    const timer = setInterval(() => {
      paginate(1);
    }, 3000);
    return () => clearInterval(timer);
  }, [hasPhotos, validPhotos.length, isHovered]);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (!hasPhotos || validPhotos.length <= 1) return;
    touchStartXRef.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartXRef.current === null || !hasPhotos || validPhotos.length <= 1) return;
    const diff = e.changedTouches[0].clientX - touchStartXRef.current;
    if (diff < -25) {
      paginate(1);
    } else if (diff > 25) {
      paginate(-1);
    }
    touchStartXRef.current = null;
  };

  if (!hasPhotos) {
    return (
      <div className="w-full h-full relative">
        {renderVehicleIconBadge(parkingType)}
        {isSpotlyUploaded ? (
          <span className="bg-emerald-600 text-white text-[9px] font-black px-2 py-0.5 rounded-br-lg rounded-tl-lg uppercase tracking-wider absolute top-0 left-0 z-20 shadow-xs pointer-events-none">
            FREE
          </span>
        ) : (
          <span className="bg-[#7c3aed] text-white text-[9px] font-black px-2 py-0.5 rounded-br-lg rounded-tl-lg uppercase tracking-wider absolute top-0 left-0 z-20 flex items-center gap-0.5 shadow-sm pointer-events-none">
            <Zap size={9} className="fill-white" /> FEATURED
          </span>
        )}
      </div>
    );
  }

  const isLockedForNonPremium = !isSpotlyUploaded && !isPremium && !isRevealed;

  return (
    <div
      className="w-full h-full relative overflow-hidden select-none cursor-pointer"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onClick={(e) => {
        if (onOpenPhotos) {
          onOpenPhotos(e, currentIndex);
        }
      }}
    >
      {/* Smooth Right-to-Left Sliding Images */}
      <AnimatePresence initial={false} custom={direction}>
        <motion.img
          key={page}
          src={validPhotos[currentIndex]}
          custom={direction}
          variants={mobileCardSlideVariants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{
            x: { type: "tween", ease: "easeInOut", duration: 0.45 },
            opacity: { duration: 0.2 },
          }}
          alt={serviceName || "Parking space"}
          className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 pointer-events-none"
        />
      </AnimatePresence>

      {/* Top-Left Pricing Tag: FREE for Spotly vs FEATURED for Owner */}
      {isSpotlyUploaded ? (
        <span className="bg-emerald-600 text-white text-[9px] font-black px-2 py-0.5 rounded-br-lg rounded-tl-lg uppercase tracking-wider absolute top-0 left-0 z-20 shadow-xs pointer-events-none">
          FREE
        </span>
      ) : (
        <span className="bg-[#7c3aed] text-white text-[9px] font-black px-2 py-0.5 rounded-br-lg rounded-tl-lg uppercase tracking-wider absolute top-0 left-0 z-20 flex items-center gap-0.5 shadow-sm pointer-events-none">
          <Zap size={9} className="fill-white" /> FEATURED
        </span>
      )}

      {/* Non-premium lock overlay for owner space (if locked) */}
      {isLockedForNonPremium && (
        <div className="absolute inset-0 bg-black/35 backdrop-blur-[0.5px] flex items-center justify-center z-15 pointer-events-none">
          <Crown size={18} className="text-amber-300 drop-shadow-md" />
        </div>
      )}

      {/* Top-Right mini pagination dots when > 1 photo */}
      {validPhotos.length > 1 && (
        <div className="absolute top-1.5 right-1.5 z-20 flex items-center gap-0.5 bg-black/45 backdrop-blur-xs px-1.5 py-0.5 rounded-full pointer-events-none border border-white/10">
          {validPhotos.map((_, i) => (
            <span
              key={i}
              className={`rounded-full transition-all duration-300 ${
                i === currentIndex ? "w-2.5 h-1 bg-white shadow-xs" : "w-1 h-1 bg-white/50"
              }`}
            />
          ))}
        </div>
      )}

      {/* Bottom-Right photo count pill */}
      <span className="absolute bottom-1.5 right-1.5 bg-black/60 backdrop-blur-xs text-white text-[9px] font-extrabold rounded-full px-1.5 py-0.5 z-20 pointer-events-none shadow-md">
        {validPhotos.length > 1 ? `${currentIndex + 1}/${validPhotos.length} 📷` : `${validPhotos.length} 📷`}
      </span>
    </div>
  );
}

export default function WorkerHome() {
  const [location, setLocation] = useLocation();
  const searchString = useSearch();
  const [userName, setUserName] = useState(localStorage.getItem("userName") || (localStorage.getItem("isGuest") === "true" ? "Guest User" : ""));
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [parkingSpaces, setParkingSpaces] = useState<ParkingSpace[]>([]);
  const [totalSpaces, setTotalSpaces] = useState(0);
  const [currentPage, setCurrentPage] = useState(0);
  const PAGE_SIZE = 20;
  const [selectedSpace, setSelectedSpace] = useState<ParkingSpace | null>(null);
  const [showSpaceDetail, setShowSpaceDetail] = useState(false);
  const [showSubscriptionPopup, setShowSubscriptionPopup] = useState(false);
  const [choosePlan, setChoosePlan] = useState<string | null>(null);
  const [showPaymentProcessing, setShowPaymentProcessing] = useState(false);
  const [showPaymentSuccess, setShowPaymentSuccess] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<{ name: string; price: number; views: number; key: string } | null>(null);
  const [isPremium, setIsPremium] = useState(false);
  const [highlightedSpaceId, setHighlightedSpaceId] = useState<string | null>(null);
  const [hasProcessedHighlight, setHasProcessedHighlight] = useState<string | null>(null);
  const [premiumPlan, setPremiumPlan] = useState<string | null>(null);
  const [premiumViewsRemaining, setPremiumViewsRemaining] = useState(0);
  const [premiumExpiresAt, setPremiumExpiresAt] = useState<string | null>(null);
  const [showPremiumDetails, setShowPremiumDetails] = useState(false);
  const [revealedContacts, setRevealedContacts] = useState<Set<string>>(new Set());
  const [revealingContactId, setRevealingContactId] = useState<string | null>(null);
  const [freeAccessMode, setFreeAccessMode] = useState(false);
  const [isActivatingFreeAccess, setIsActivatingFreeAccess] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [spaceFilter, setSpaceFilter] = useState<"all" | "favourites" | "viewed" | "unviewed">("all");
  const [durationFilter, setDurationFilter] = useState<"all" | "Hourly" | "Days" | "Monthly">("all");
  const [uploaderFilter, setUploaderFilter] = useState<"owner" | "spotly">("owner");
  const [serviceFilter, setServiceFilter] = useState<"all" | "car" | "bike">("all");
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
  const [favourites, setFavourites] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem("seekerFavourites");
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  const toggleFavourite = (e: React.MouseEvent, spaceId: string) => {
    e.stopPropagation();
    vibrate();
    setFavourites((prev) => {
      const next = prev.includes(spaceId)
        ? prev.filter((id) => id !== spaceId)
        : [...prev, spaceId];
      localStorage.setItem("seekerFavourites", JSON.stringify(next));
      return next;
    });
  };
  const [priceSort, setPriceSort] = useState<"none" | "asc" | "desc">("none");
  const [isSearching, setIsSearching] = useState(false);
  const [isFiltering, setIsFiltering] = useState(false);
  const filterTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const skipNextDebounceRef = useRef(false);
  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  const [placeholderText, setPlaceholderText] = useState("");
  const [isTyping, setIsTyping] = useState(true);
  const placeholderExamples = [
    "MG Road",
    "City Center",
    "Koramangala",
    "Indiranagar",
    "HSR Layout",
    "Airport Road",
    "Whitefield",
    "Railway Station",
    "BTM Layout",
  ];
  const [userLocation, setUserLocation] = useState("");
  const [allLocationChips, setAllLocationChips] = useState<string[]>([]);
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [showCitySelector, setShowCitySelector] = useState(false);

  useEffect(() => {
    const handleUrlChange = () => {
      const params = new URLSearchParams(window.location.search);
      if (params.get("filter") === "favourites" || params.get("tab") === "saved" || window.location.hash === "#favourites" || window.location.hash === "#saved") {
        setSpaceFilter("favourites");
      } else {
        setSpaceFilter("all");
      }
    };

    handleUrlChange();
    window.addEventListener("popstate", handleUrlChange);
    window.addEventListener("locationchange", handleUrlChange);
    return () => {
      window.removeEventListener("popstate", handleUrlChange);
      window.removeEventListener("locationchange", handleUrlChange);
    };
  }, [location, searchString]);

  // Safety timer to clear initial full-page preloader
  useEffect(() => {
    const timer = setTimeout(() => setIsInitialLoading(false), 2500);
    return () => clearTimeout(timer);
  }, []);

  // Snappy filter switching with immediate skeleton feedback
  useEffect(() => {
    if (filterTimerRef.current) clearTimeout(filterTimerRef.current);
    setIsFiltering(true);
    filterTimerRef.current = setTimeout(() => setIsFiltering(false), 220);
    return () => { if (filterTimerRef.current) clearTimeout(filterTimerRef.current); };
  }, [spaceFilter, priceSort]);


  // Fetch cities from active pincodes
  const { data: pincodesData } = useQuery({
    queryKey: ["pincodes"],
    queryFn: async () => {
      const res = await fetch(getApiUrl("/api/pincodes"));
      if (!res.ok) throw new Error("Failed to fetch pincodes");
      return res.json();
    },
  });

  // Get active states/cities from pincodes API (admin controlled)
  const cities = useMemo(() => {
    const pincodes = pincodesData?.pincodes || [];
    const activePincodes = pincodes.filter((p: any) => p.isActive !== false);
    const uniqueCities: Record<string, { id: string; name: string; state: string }> = {};

    activePincodes.forEach((p: any) => {
      const stateName = (p.prefix || p.cityName || "").trim();
      if (!stateName) return;

      const isBlr = stateName.toLowerCase().includes("karnataka") ||
        (p.cityName && (p.cityName.toLowerCase().includes("bengaluru") || p.cityName.toLowerCase().includes("bangalore")));
      const isTn = stateName.toLowerCase().includes("tamil nadu") ||
        (p.cityName && p.cityName.toLowerCase().includes("chennai"));

      const resolvedState = isBlr ? "Karnataka" : isTn ? "Tamil Nadu" : stateName;
      const resolvedCityName = isBlr ? "Bengaluru" : isTn ? "Chennai" : (p.cityName || stateName);
      const id = p.id || (isBlr ? "bengaluru-id-fallback" : isTn ? "chennai-id-fallback" : resolvedState.toLowerCase());

      if (!uniqueCities[resolvedState.toLowerCase()]) {
        uniqueCities[resolvedState.toLowerCase()] = {
          id,
          name: resolvedCityName,
          state: resolvedState,
        };
      }
    });

    return Object.values(uniqueCities);
  }, [pincodesData]);

  const displayCities = useMemo(() => {
    if (cities.length > 0) return cities;
    if (!pincodesData) {
      return [{ id: "bengaluru-id-fallback", name: "Bengaluru", state: "Karnataka" }];
    }
    return [];
  }, [cities, pincodesData]);

  const userCity = localStorage.getItem("userDetectedCity") || localStorage.getItem("selectedServiceAreaName") || "";
  const userState = localStorage.getItem("userSelectedState") || localStorage.getItem("userState") || localStorage.getItem("workerState") || "";

  const activeState = useMemo(() => {
    const currentState = userState || "";
    if (cities.length > 0) {
      const match = cities.find(
        (c) => c.state.toLowerCase() === currentState.toLowerCase() || c.name.toLowerCase() === userCity.toLowerCase()
      );
      if (match) return match.state;
      return cities[0].state;
    }
    if (currentState.toLowerCase().includes("tamil nadu") || userCity.toLowerCase().includes("chennai")) {
      return "Tamil Nadu";
    }
    return "Karnataka";
  }, [cities, userState, userCity]);

  const [isStateSwitching, setIsStateSwitching] = useState(false);

  const handleCityChange = async (cityId: string) => {
    setIsStateSwitching(true);
    const cityObj = cities.find((c) => c.id === cityId) ||
      cities.find((c) => c.name.toLowerCase() === cityId.toLowerCase() || c.state.toLowerCase() === cityId.toLowerCase()) ||
      displayCities.find((c) => c.id === cityId);

    if (!cityObj) {
      setIsStateSwitching(false);
      return;
    }

    const cityName = cityObj.name;
    const stateName = cityObj.state;

    localStorage.setItem("selectedCity", cityObj.id);
    localStorage.setItem("userDetectedCity", cityName);
    localStorage.setItem("selectedServiceAreaName", cityName);
    if (stateName) {
      localStorage.setItem("userState", stateName);
      localStorage.setItem("workerState", stateName);
      localStorage.setItem("userSelectedState", stateName);
    }
    localStorage.removeItem("userDetectedAddress");

    // Dynamic GPS coords matching check
    const gpsCity = localStorage.getItem("gpsDetectedCity") || "";
    const isBlr = cityName.toLowerCase().includes("bengaluru") || cityName.toLowerCase().includes("bangalore");
    const isGpsBlr = gpsCity.toLowerCase().includes("bengaluru") || gpsCity.toLowerCase().includes("bangalore");
    const isGpsChn = gpsCity.toLowerCase().includes("chennai");
    const matchesGps = gpsCity && ((isBlr && isGpsBlr) || (!isBlr && isGpsChn));

    if (matchesGps) {
      const gpsLat = localStorage.getItem("gpsLatitude");
      const gpsLng = localStorage.getItem("gpsLongitude");
      if (gpsLat && gpsLng) {
        localStorage.setItem("userLatitude", gpsLat);
        localStorage.setItem("userLongitude", gpsLng);
        setUserCoords({ lat: Number(gpsLat), lng: Number(gpsLng) });
      } else {
        setUserCoords(null);
      }
    } else {
      localStorage.removeItem("userLatitude");
      localStorage.removeItem("userLongitude");
      setUserCoords(null);
    }

    setSearchQuery("");
    setUserLocation(cityName);
    setAllLocationChips([]);
    setHighlightedSpaceId(null);
    try {
      await fetchParkingSpaces("");
    } finally {
      setTimeout(() => {
        setIsStateSwitching(false);
      }, 150);
    }
  };

  // Auto-sync selected state with active states configured by admin
  useEffect(() => {
    if (cities.length === 0) return;
    const currentWorkerState = localStorage.getItem("workerState") || localStorage.getItem("userState") || "";
    if (!currentWorkerState) {
      const defaultState = cities[0];
      if (defaultState) {
        handleCityChange(defaultState.id);
      }
      return;
    }
    const isCurrentActive = cities.some(
      (c) => c.state.toLowerCase() === currentWorkerState.toLowerCase()
    );
    if (!isCurrentActive) {
      // The previously selected state was disabled in admin! Auto switch to first available active state
      const fallbackState = cities[0];
      if (fallbackState) {
        handleCityChange(fallbackState.id);
      }
    }
  }, [cities]);

  const handleLocationSyncUpdated = (city: string, state: string, lat: number, lng: number) => {
    setUserCoords({ lat, lng });
    setUserLocation(city);
    fetchParkingSpaces();
  };

  const [showPhotoViewer, setShowPhotoViewer] = useState(false);
  const [viewingPhotos, setViewingPhotos] = useState<string[]>([]);
  const [activePhotoIndex, setActivePhotoIndex] = useState(0);
  const [interestCounts, setInterestCounts] = useState<Record<string, number>>({});
  const [userInterests, setUserInterests] = useState<Set<string>>(new Set());
  const [interestLoading, setInterestLoading] = useState<string | null>(null);
  const [showSupportPopup, setShowSupportPopup] = useState(false);
  const [supportPhone, setSupportPhone] = useState("+91 97425 45584");
  const [supportEmail, setSupportEmail] = useState("info@spotlyindia.org");
  const [adVideoUrl, setAdVideoUrl] = useState("");
  const [adVideoEnabled, setAdVideoEnabled] = useState(true);
  const [comingSoonMode, setComingSoonMode] = useState<boolean>(false);
  const [notifications, setNotifications] = useState<
    Array<{
      id: string;
      type: string;
      title: string;
      message: string;
      createdAt: string;
      isRead: boolean;
      bookingId?: string | null;
    }>
  >([]);
  const [isClearingNotifications, setIsClearingNotifications] = useState(false);
  const unreadCount = notifications.filter((n) => !n.isRead).length;

  // Register all modals/sheets with Android Back Button handler
  useRegisterModalBack(showSpaceDetail, () => setShowSpaceDetail(false), "ss-space-detail");
  useRegisterModalBack(showSubscriptionPopup, () => setShowSubscriptionPopup(false), "ss-subscription-popup");
  useRegisterModalBack(showPremiumDetails, () => setShowPremiumDetails(false), "ss-premium-details");
  useRegisterModalBack(showCitySelector, () => setShowCitySelector(false), "ss-city-selector");
  useRegisterModalBack(showPhotoViewer, () => setShowPhotoViewer(false), "ss-photo-viewer");
  useRegisterModalBack(showSupportPopup, () => setShowSupportPopup(false), "ss-support-popup");
  useRegisterModalBack(showPaymentSuccess, () => setShowPaymentSuccess(false), "ss-payment-success");
  useRegisterModalBack(showSpotlyPassModal, () => { setShowSpotlyPassModal(false); setIsProcessingPassPayment(false); }, "ss-spotly-pass");
  useRegisterModalBack(showRoadsideAlertModal, () => setShowRoadsideAlertModal(false), "ss-roadside-alert");

  // Load Spotly Roadside Direction Config & User Pass status
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
        .catch(() => {});
    }
  }, []);

  const calcDistance = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  };

  const isSameState = (spaceLocation: string): boolean => {
    const userState = (localStorage.getItem("workerState") || localStorage.getItem("userState") || localStorage.getItem("userSelectedState") || "").trim().toLowerCase();
    if (!userState) return true;
    const locLower = (spaceLocation || "").toLowerCase();

    // Pincode checks: 56xxxx-59xxxx for Karnataka, 60xxxx-64xxxx for Tamil Nadu
    const hasKarnatakaPincode = /\b5[6-9]\d{4}\b/.test(locLower);
    const hasTamilNaduPincode = /\b6[0-4]\d{4}\b/.test(locLower);

    const isKarnatakaLoc = locLower.includes("karnataka") || locLower.includes("bengaluru") || locLower.includes("bangalore") || locLower.includes("mysore") || locLower.includes("mysuru") || locLower.includes("mangalore") || locLower.includes("tumakuru") || hasKarnatakaPincode;
    const isTamilNaduLoc = locLower.includes("tamil") || locLower.includes("chennai") || locLower.includes("madras") || locLower.includes("coimbatore") || locLower.includes("madurai") || hasTamilNaduPincode;

    if (userState.includes("karnataka")) {
      return isKarnatakaLoc && !locLower.includes("chennai") && !locLower.includes("tamil") && !hasTamilNaduPincode;
    }
    if (userState.includes("tamil")) {
      return isTamilNaduLoc && !locLower.includes("bengaluru") && !locLower.includes("bangalore") && !locLower.includes("karnataka") && !hasKarnatakaPincode;
    }
    return locLower.includes(userState);
  };

  const [locationReady, setLocationReady] = useState(false);

  useEffect(() => {
    const savedLat = localStorage.getItem("userLatitude");
    const savedLng = localStorage.getItem("userLongitude");
    if (savedLat && savedLng) {
      const lat = parseFloat(savedLat);
      const lng = parseFloat(savedLng);
      if (!isNaN(lat) && !isNaN(lng)) {
        setUserCoords({ lat, lng });
        setLocationReady(true);
      }
    }
    // Hard fallback so the spaces list always loads even if the
    // geolocation prompt is dismissed or never resolves (common in iframes).
    const fallbackTimer = setTimeout(() => setLocationReady(true), 4000);

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          clearTimeout(fallbackTimer);
          const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
          setUserCoords(coords);
          localStorage.setItem("userLatitude", coords.lat.toString());
          localStorage.setItem("userLongitude", coords.lng.toString());
          setLocationReady(true);
          const uid = localStorage.getItem("userId");
          if (uid) {
            fetch(getApiUrl(`/api/workers/${uid}/location`), {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ latitude: coords.lat, longitude: coords.lng }),
            }).catch(() => { });
          }
        },
        (err) => {
          clearTimeout(fallbackTimer);
          setLocationReady(true);
          if (err?.code === err?.PERMISSION_DENIED) {
            triggerLocationPermissionError("Location access was denied or unavailable. Please allow location permissions to find nearby spots.");
          }
        },
        { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 }
      );
    } else {
      clearTimeout(fallbackTimer);
      setLocationReady(true);
    }

    return () => clearTimeout(fallbackTimer);
  }, []);

  const fetchNotifications = async () => {
    const userId = localStorage.getItem("userId");
    if (userId) {
      try {
        const response = await fetch(getApiUrl(`/api/notifications/${userId}`));
        if (response.ok) {
          const data = await response.json();
          setNotifications(data.notifications || []);
        }
      } catch (error) {
        console.error("Failed to fetch notifications:", error);
      }
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "booking_accepted": return "✅";
      case "booking_cancelled": return "❌";
      case "worker_assigned": return "👷";
      case "new_job": return "📋";
      case "broadcast": return "📢";
      default: return "🔔";
    }
  };

  const formatTimestamp = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffHours < 24) return `${diffHours} hr ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? "s" : ""} ago`;
    return date.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
  };

  const handleClearNotifications = async () => {
    const userId = localStorage.getItem("userId");
    if (!userId) return;
    setIsClearingNotifications(true);
    try {
      const response = await fetch(getApiUrl(`/api/notifications/${userId}/clear`), { method: "DELETE" });
      if (response.ok) setNotifications([]);
    } catch (error) {
      console.error("Failed to clear notifications:", error);
    } finally {
      setIsClearingNotifications(false);
    }
  };

  useEffect(() => {
    const userRole = localStorage.getItem("userRole");
    const userId = localStorage.getItem("userId");
    const isRealUser = userId && !userId.startsWith("explore_") && !userId.startsWith("guest_");

    if (userRole === "customer" && isRealUser) {
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
      localStorage.setItem("userRole", "worker");
      setLocation("/auth?role=space-seeker");
      return;
    }
  }, [setLocation]);

  useEffect(() => { fetchNotifications(); }, []);

  useEffect(() => {
    if (searchQuery || isSearchFocused) return;
    const currentWord = placeholderExamples[placeholderIndex];
    let charIndex = 0;
    let deleting = false;
    let timeout: ReturnType<typeof setTimeout>;

    const animate = () => {
      if (!deleting) {
        charIndex++;
        setPlaceholderText(currentWord.slice(0, charIndex));
        if (charIndex === currentWord.length) {
          deleting = true;
          timeout = setTimeout(animate, 1500);
          return;
        }
        timeout = setTimeout(animate, 80);
      } else {
        charIndex--;
        setPlaceholderText(currentWord.slice(0, charIndex));
        if (charIndex === 0) {
          setPlaceholderIndex((prev) => (prev + 1) % placeholderExamples.length);
          return;
        }
        timeout = setTimeout(animate, 40);
      }
    };

    timeout = setTimeout(animate, 300);
    return () => clearTimeout(timeout);
  }, [placeholderIndex, searchQuery, isSearchFocused]);

  useEffect(() => {
    const fetchComingSoonMode = async () => {
      try {
        const response = await fetch(getApiUrl("/api/settings/coming_soon_mode"));
        if (response.ok) {
          const data = await response.json();
          setComingSoonMode(data.setting?.value === "true");
        } else {
          setComingSoonMode(false);
        }
      } catch (error) {
        setComingSoonMode(false);
      }
    };
    fetchComingSoonMode();

    const fetchSupportInfo = async () => {
      try {
        const [phoneRes, emailRes] = await Promise.all([
          fetch(getApiUrl("/api/settings/support_phone")),
          fetch(getApiUrl("/api/settings/support_email"))
        ]);
        if (phoneRes.ok) {
          const data = await phoneRes.json();
          if (data.setting?.value) setSupportPhone(data.setting.value);
        }
        if (emailRes.ok) {
          const data = await emailRes.json();
          if (data.setting?.value) setSupportEmail(data.setting.value);
        }
      } catch (error) { }
    };
    fetchSupportInfo();

    const fetchAdVideo = async () => {
      try {
        const [urlRes, enabledRes] = await Promise.all([
          fetch(getApiUrl("/api/settings/ad_video_url")),
          fetch(getApiUrl("/api/settings/ad_video_enabled"))
        ]);
        if (urlRes.ok) {
          const data = await urlRes.json();
          if (data.setting?.value) setAdVideoUrl(data.setting.value);
        }
        if (enabledRes.ok) {
          const data = await enabledRes.json();
          if (data.setting?.value !== undefined) setAdVideoEnabled(data.setting.value === "true");
        }
      } catch (error) { }
    };
    fetchAdVideo();
  }, []);

  useEffect(() => { if (notificationsOpen) fetchNotifications(); }, [notificationsOpen]);

  useEffect(() => {
    const userId = localStorage.getItem("userId");
    const storedName = localStorage.getItem("userName");
    if (storedName) setUserName(storedName);
    if (userId) {
      const fetchUserData = async () => {
        try {
          const [userRes, viewedRes] = await Promise.all([
            fetch(getApiUrl(`/api/users/${userId}`)),
            fetch(getApiUrl(`/api/users/${userId}/viewed-contacts`)),
          ]);
          if (userRes.ok) {
            const data = await userRes.json();
            if (data.role && data.role !== "worker") {
              // User in DB is a customer/provider, not a worker/seeker!
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
              localStorage.setItem("userRole", "worker");
              setLocation("/auth?role=space-seeker");
              return;
            }
            if (data.name) setUserName(data.name);
            const isExpired = data.premiumExpiresAt && new Date(data.premiumExpiresAt) < new Date();
            const hasViews = data.premiumPlan === "premium" || (data.premiumViewsRemaining ?? 0) > 0;
            const activePremium = !!data.isPremium && !isExpired && hasViews;
            setIsPremium(activePremium);
            setPremiumPlan(activePremium ? (data.premiumPlan || null) : null);
            setPremiumViewsRemaining(activePremium ? (data.premiumViewsRemaining ?? 0) : 0);
            setPremiumExpiresAt(activePremium ? (data.premiumExpiresAt || null) : null);
          } else if (userRes.status === 404) {
            // User was deleted by admin — clear stale auth and redirect to login
            localStorage.removeItem("userId");
            localStorage.removeItem("sessionToken");
            localStorage.removeItem("disclaimerAccepted");
            localStorage.removeItem("userName");
            localStorage.removeItem("userMobile");
            setLocation("/auth?role=space-seeker");
            return;
          }
          if (viewedRes.ok) {
            const viewedData = await viewedRes.json();
            if (viewedData.viewedBookingIds?.length > 0) {
              setRevealedContacts(new Set(viewedData.viewedBookingIds));
            }
          }
        } catch (error) {
          console.error("Failed to fetch user data:", error);
        }
      };
      fetchUserData();
    }
  }, []);

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

  const getParkingType = (serviceName: string): "car" | "bike" | "both" => {
    const name = serviceName.toLowerCase();
    if (name.includes("car") && name.includes("bike")) return "both";
    if (name.includes("bike")) return "bike";
    return "car";
  };

  const formatIndianPhone = (phone: string) => {
    const cleaned = (phone || "").replace(/\D/g, "").slice(-10);
    if (cleaned.length !== 10) return phone || "";
    return `+91 ${cleaned}`;
  };

  const maskPhone = (phone: string) => {
    if (!phone || phone.length < 4) return "XXXXXXXXXX";
    const cleaned = phone.replace(/\D/g, "");
    if (cleaned.length >= 10) {
      return cleaned.slice(0, 2) + "XXXXXX" + cleaned.slice(-2);
    }
    return phone.slice(0, 2) + "XXXXXXXX";
  };

  const parseBooking = (b: any): ParkingSpace => {
    const rentMatch = b.comments?.match(/Rent: ₹(\d+)\/?(\w+)?/);
    let cleanComments = b.comments?.replace(/\[PHOTOS\][\s\S]*?\[\/PHOTOS\]/, "") || "";
    const sizeMatch = cleanComments.match(/\|\s*Vehicle Size:\s*([^|]+)/i) || cleanComments.match(/\|\s*Size:\s*([^|]+)/i);
    let parsedVehicleSize: string | undefined = undefined;
    if (sizeMatch) {
      parsedVehicleSize = sizeMatch[1].trim();
      cleanComments = cleanComments.replace(/\|\s*Vehicle Size:\s*([^|]+)/i, "").replace(/\|\s*Size:\s*([^|]+)/i, "");
    }
    const durationMatch = cleanComments.match(/\|\s*Duration:\s*([^|\[]+)/i);
    const parsedDuration = durationMatch ? durationMatch[1].trim() : undefined;
    if (durationMatch) cleanComments = cleanComments.replace(/\|\s*Duration:\s*([^|\[]+)/i, "");
    const dateMatch = cleanComments.match(/\|\s*Date:\s*([^|\[]+)/i);
    const parsedDate = dateMatch ? dateMatch[1].trim() : undefined;
    if (dateMatch) cleanComments = cleanComments.replace(/\|\s*Date:\s*([^|\[]+)/i, "");
    const endTimeMatch = cleanComments.match(/\|\s*End Time:\s*([^|\[]+)/i);
    const parsedEndTime = endTimeMatch ? endTimeMatch[1].trim() : undefined;
    if (endTimeMatch) cleanComments = cleanComments.replace(/\|\s*End Time:\s*([^|\[]+)/i, "");
    const timeMatch = cleanComments.match(/\|\s*Time:\s*([^|\[]+)/i);
    const parsedTime = timeMatch ? timeMatch[1].trim() : undefined;
    if (timeMatch) cleanComments = cleanComments.replace(/\|\s*Time:\s*([^|\[]+)/i, "");
    const contactMatch = cleanComments.match(/\|\s*(?:Contact|Mobile|Phone):\s*([0-9]{10})/i) || b.comments?.match(/(?:Contact|Mobile|Phone):\s*([0-9]{10})/i);
    const parsedContactPhone = contactMatch ? contactMatch[1].trim() : undefined;
    if (contactMatch) cleanComments = cleanComments.replace(/\|\s*(?:Contact|Mobile|Phone):\s*([0-9]{10})/i, "");

    const isPriceHidden = Boolean(
      cleanComments.includes("Rent: Hidden") ||
      cleanComments.includes("Price: Hidden") ||
      b.comments?.includes("Rent: Hidden") ||
      b.comments?.includes("Price: Hidden") ||
      (!rentMatch && !isSpotly)
    );

    const descMatch = cleanComments.match(/\|\s*([\s\S]+)$/);
    const photosMatch = b.comments?.match(/\[PHOTOS\]([\s\S]*?)\[\/PHOTOS\]/);
    let parsedPhotos: string[] = [];
    if (photosMatch) {
      try { parsedPhotos = JSON.parse(photosMatch[1]); } catch { }
    }
    const isSpotly = Boolean(
      b.comments?.includes("Public Roadside") ||
      b.comments?.includes("Category: Public Roadside Parking") ||
      b.comments?.includes("By Spotly") ||
      cleanComments.includes("Public Roadside") ||
      cleanComments.includes("By Spotly") ||
      parsedDuration?.toLowerCase().includes("public roadside") ||
      parsedDuration?.toLowerCase().includes("roadside")
    );
    return {
      id: b.id,
      customerId: b.customerId,
      serviceName: b.serviceName,
      location: b.location || "Location not set",
      comments: b.comments,
      date: b.date,
      time: b.time,
      bookedAt: b.bookedAt,
      rent: rentMatch ? parseInt(rentMatch[1]) : 0,
      rentUnit: rentMatch?.[2] || "month",
      duration: parsedDuration,
      dateText: parsedDate,
      timeText: parsedTime,
      endTimeText: parsedEndTime,
      description: descMatch ? descMatch[1].trim() : "Parking space available for rent",
      parkingType: getParkingType(b.serviceName),
      vehicleSize: parsedVehicleSize,
      ownerPhone: parsedContactPhone || b.ownerPhone || "",
      ownerName: b.ownerName || "Space Owner",
      latitude: b.latitude != null ? b.latitude : null,
      longitude: b.longitude != null ? b.longitude : null,
      photos: parsedPhotos,
      isSpotlyUploaded: isSpotly,
      isPriceHidden,
    };
  };

  const buildPendingUrl = (offset: number, searchVal?: string) => {
    const params = new URLSearchParams();
    const lat = localStorage.getItem("userLatitude");
    const lng = localStorage.getItem("userLongitude");
    const stateName = localStorage.getItem("userSelectedState") || localStorage.getItem("workerState") || localStorage.getItem("userState") || "";
    const isBlr = stateName.toLowerCase().includes("karnataka");
    const isTn = stateName.toLowerCase().includes("tamil");
    const gpsCity = (localStorage.getItem("gpsDetectedCity") || "").toLowerCase();
    const coordsMatchState = !stateName ||
      (isBlr && (gpsCity.includes("bengaluru") || gpsCity.includes("bangalore"))) ||
      (isTn && gpsCity.includes("chennai"));

    if (lat && lng && coordsMatchState) {
      params.set("lat", lat);
      params.set("lng", lng);
    } else {
      const cityId = localStorage.getItem("selectedCity") || "";
      if (cityId) params.set("city", cityId);
    }
    if (stateName) params.set("state", stateName);

    const query = searchVal !== undefined ? searchVal : searchQuery;
    if (query && query.trim()) {
      params.set("search", query.trim());
    }

    params.set("limit", String(PAGE_SIZE));
    params.set("offset", String(offset));
    return getApiUrl(`/api/bookings/pending?${params.toString()}`);
  };

  const fetchParkingSpaces = async (overrideSearch?: string) => {
    try {
      const response = await fetch(buildPendingUrl(0, overrideSearch));
      const data = await response.json();
      let spaces: ParkingSpace[] = (data.bookings || []).map(parseBooking);

      // Sort actual spaces by GPS distance from user's current location
      const lat = localStorage.getItem("userLatitude") || (userCoords ? String(userCoords.lat) : null);
      const lng = localStorage.getItem("userLongitude") || (userCoords ? String(userCoords.lng) : null);
      if (lat && lng) {
        const uLat = parseFloat(lat);
        const uLng = parseFloat(lng);
        if (!isNaN(uLat) && !isNaN(uLng)) {
          spaces = spaces.sort((a, b) => {
            const distA = a.latitude != null && a.longitude != null ? calcDistance(uLat, uLng, a.latitude, a.longitude) : 9999;
            const distB = b.latitude != null && b.longitude != null ? calcDistance(uLat, uLng, b.latitude, b.longitude) : 9999;
            return distA - distB;
          });
        }
      }

      setParkingSpaces(spaces);
      setTotalSpaces(data.total ?? spaces.length);
      setCurrentPage(1);
      if (spaces.length > 0) fetchInterestData(spaces.map(s => s.id));
    } catch (error) {
      console.error("Failed to fetch parking spaces:", error);
      setParkingSpaces([]);
      setTotalSpaces(0);
    } finally {
      setIsLoading(false);
      setIsSearching(false);
      setIsInitialLoading(false);
    }
  };

  const loadMoreSpaces = async () => {
    if (isLoadingMore || parkingSpaces.length >= totalSpaces) return;
    setIsLoadingMore(true);
    try {
      const offset = currentPage * PAGE_SIZE;
      const response = await fetch(buildPendingUrl(offset));
      const data = await response.json();
      const newSpaces: ParkingSpace[] = (data.bookings || []).map(parseBooking);
      if (newSpaces.length > 0) {
        setParkingSpaces(prev => [...prev, ...newSpaces]);
        setCurrentPage(prev => prev + 1);
        fetchInterestData(newSpaces.map(s => s.id));
      }
    } catch (error) {
      console.error("Failed to load more spaces:", error);
    }
    setIsLoadingMore(false);
  };

  const handleLocationChipClick = async (loc: string) => {
    vibrate();
    const isActive = searchQuery.trim().toLowerCase() === loc.toLowerCase();
    const newSearch = isActive ? "" : loc;
    skipNextDebounceRef.current = true;
    setSearchQuery(newSearch);
    setUserLocation(newSearch);
    setIsSearching(true);
    try {
      await fetchParkingSpaces(newSearch);
    } finally {
      setIsSearching(false);
    }
  };

  // Debounced search query & initial load
  useEffect(() => {
    if (!locationReady) return;
    if (skipNextDebounceRef.current) {
      skipNextDebounceRef.current = false;
      return;
    }
    setIsSearching(true);
    const timer = setTimeout(async () => {
      await fetchParkingSpaces();
      setIsSearching(false);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery, locationReady, userCoords]);

  // Handle highlight scrolling and card pulsing glow for 5 seconds
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const highlightId = params.get("highlight");
    if (highlightId && highlightId !== hasProcessedHighlight) {
      setHasProcessedHighlight(highlightId);

      const handleHighlight = async () => {
        let space = parkingSpaces.find(s => s.id === highlightId);
        if (!space) {
          try {
            const res = await fetch(getApiUrl(`/api/bookings/${highlightId}`));
            if (res.ok) {
              const data = await res.json();
              if (data) {
                const parsed = parseBooking(data);
                setParkingSpaces(prev => {
                  if (prev.some(s => s.id === highlightId)) return prev;
                  return [parsed, ...prev];
                });
              }
            }
          } catch (error) {
            console.error("Failed to fetch highlighted space:", error);
          }
        }

        setHighlightedSpaceId(highlightId);

        // Scroll to card
        setTimeout(() => {
          const element = document.getElementById(`card-space-${highlightId}`);
          if (element) {
            element.scrollIntoView({ behavior: "smooth", block: "center" });
          }
        }, 500);

        // Remove highlight after 1.5 seconds
        const timer = setTimeout(() => {
          setHighlightedSpaceId(null);
          const newUrl = window.location.pathname;
          window.history.replaceState({}, document.title, newUrl);
        }, 1500);

        return () => clearTimeout(timer);
      };

      handleHighlight();
    }
  }, [parkingSpaces, window.location.search, hasProcessedHighlight]);

  const handleAutoLocate = async () => {
    setIsLocating(true);
    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, { enableHighAccuracy: true, timeout: 10000 });
      });
      const { latitude, longitude } = position.coords;
      setUserCoords({ lat: latitude, lng: longitude });
      localStorage.setItem("userLatitude", latitude.toString());
      localStorage.setItem("userLongitude", longitude.toString());
      const uid = localStorage.getItem("userId");
      if (uid) {
        fetch(getApiUrl(`/api/workers/${uid}/location`), {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ latitude, longitude }),
        }).catch(() => { });
      }
      // Clear the search query to show nearest results based on coordinate proximity
      setSearchQuery("");
      const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=16`);
      if (res.ok) {
        const data = await res.json();
        const area = data.address?.city_district || data.address?.subdistrict || data.address?.locality || data.address?.town || data.address?.city || data.address?.suburb || data.address?.neighbourhood || "";
        setUserLocation(area);
      }
      await fetchParkingSpaces();
    } catch (error) {
      console.error("Location detection failed:", error);
      alert("Could not detect your location. Please search manually.");
    }
    setIsLocating(false);
  };

  const extractLocationsFromSpaces = (spaces: ParkingSpace[]): string[] => {
    const STATE_AND_COUNTRY_WORDS = new Set([
      "india", "bharat",
      "karnataka", "tamil nadu", "tamilnadu", "kerala", "andhra pradesh",
      "telangana", "maharashtra", "goa", "gujarat", "rajasthan", "punjab",
      "haryana", "delhi", "uttar pradesh", "madhya pradesh", "bihar",
      "west bengal", "odisha", "assam", "jharkhand", "chhattisgarh",
      "uttarakhand", "himachal pradesh", "jammu and kashmir", "ladakh",
      "manipur", "meghalaya", "mizoram", "nagaland", "sikkim", "tripura",
      "arunachal pradesh", "puducherry", "chandigarh",
    ]);

    const CITY_NAMES = new Set([
      "bengaluru", "bangalore", "chennai", "madras", "hyderabad", "mumbai",
      "bombay", "delhi", "new delhi", "kolkata", "calcutta", "pune", "mysore",
      "mysuru", "mangalore", "mangaluru", "coimbatore", "madurai", "trichy",
      "salem", "noida", "gurgaon", "gurugram", "faridabad", "ghaziabad",
      "ahmedabad", "surat", "jaipur", "lucknow", "kanpur", "nagpur", "indore",
      "thane", "bhopal", "visakhapatnam", "patna", "vadodara", "ludhiana",
      "agra", "nashik", "ranchi", "hubli", "dharwad", "belgaum"
    ]);

    // Roads, highways, expressways, bypasses, streets, transit paths
    const ROAD_OR_TRANSIT = /\b(road|rd|highway|hwy|expressway|freeway|flyover|underpass|bypass|bye-pass|street|st|lane|gali|path|marg|salai|circle|toll)\b/i;

    // Door, flat, plot, survey, building, premise or institutional terms
    const PREMISE_WORDS = /\b(plot|door|flat|house|no\.?|#|survey|sy\b|khata|shop|building|apartment|apartments|apt|apts|villa|villas|residency|heights|towers?|complex|plaza|bazaar|mall|school|college|vidyalaya|academy|hospital|clinic|temple|church|mosque|mandir|masjid|petrol|bunk|station|terminal|depot|bus stop|airport)\b/i;

    // Numbered phases/sectors/blocks/stages/zones to strip (e.g. "HSR Layout Sector 1" -> "HSR Layout", "Zone 8 Anna Nagar" -> "Anna Nagar")
    const NUMBERED_PARTS = /\b(zone|ward|division|circle|phase|stage|sector|block)\s*\d+\b/gi;
    const ORDINAL_PARTS = /\b\d+(st|nd|rd|th)?\s+(zone|ward|division|circle|phase|stage|sector|block)\b/gi;

    const titleCase = (s: string) =>
      s.split(/\s+/).map((w) => {
        if (w.length === 0) return w;
        if (w.length <= 4 && /^[A-Za-z]+$/.test(w) && w === w.toUpperCase()) return w;
        return w.charAt(0).toUpperCase() + w.slice(1).toLowerCase();
      }).join(" ");

    const cleanCandidate = (raw: string): string | null => {
      let t = raw.trim();
      // Remove landmark prefixes like "Near ", "Opposite ", "Opp ", "Behind ", "Beside ", "At "
      t = t.replace(/^(near|opposite|opp\.?|behind|beside|next to|adjacent to|adj\.?|at)\s+/i, "").trim();
      // Strip pincodes
      t = t.replace(/\b\d{6}\b/g, "").trim();
      // Strip landmark suffixes like "Junction", "Gate", "Signal"
      t = t.replace(/\s+(junction|gate|signals?|signal|crossroads?|stop)$/i, "").trim();
      // Strip numbered sectors/phases/stages/blocks/zones so "Indiranagar 1st Stage" -> "Indiranagar", "Zone 8 Anna Nagar" -> "Anna Nagar"
      t = t.replace(NUMBERED_PARTS, "").replace(ORDINAL_PARTS, "").trim();
      // Strip leftover zone, ward prefix words
      t = t.replace(/^(zone|ward|division|circle)\s+/i, "").trim();
      // Clean duplicate spaces and edge punctuation
      t = t.replace(/[\s\-,/]+$/g, "").replace(/^[\s\-,/]+/g, "").replace(/\s{2,}/g, " ").trim();

      // STRICT RULES FOR CLEAN LOCALITY ONLY:
      // 1. Absolutely NO digits or address numbers allowed (e.g. "71/61", "12", "No 4")
      if (/\d/.test(t)) return null;

      // 2. Absolutely NO slashes, hashes, or address symbols
      if (/[/#@_+*&;:=]/.test(t)) return null;

      // 3. Length checks
      if (t.length < 3 || t.length > 32) return null;

      const lower = t.toLowerCase();

      // 4. Must NOT be or contain a state, country, or city name (e.g. "Bengaluru Urban", "Bangalore North")
      for (const c of CITY_NAMES) {
        if (lower === c) return null;
      }
      for (const st of STATE_AND_COUNTRY_WORDS) {
        if (lower.includes(st)) return null;
      }

      // Must NOT be district or administrative subdivision
      if (/\b(urban|rural|district|dist\b|taluk|taluka|tehsil|mandal|region|division|city)\b/i.test(lower)) return null;

      // 5. Must NOT be a road, highway, street, or transit path (e.g. "NPS School Road", "Pune Bangalore Highway")
      if (ROAD_OR_TRANSIT.test(lower)) return null;

      // 6. Must NOT be an institutional or premise building
      if (PREMISE_WORDS.test(lower)) return null;

      // 7. Must contain only letters and spaces (or hyphens)
      if (!/^[a-zA-Z\s\-]+$/.test(t)) return null;

      return titleCase(t);
    };

    const extractLocality = (location: string): string | null => {
      if (!location) return null;
      const parts = location.split(",").map((p) => p.trim()).filter(Boolean);
      if (parts.length === 0) return null;

      // Scan from right to left (excluding city/state) because Indian addresses put the locality
      // right before the City/State, while door numbers, plot numbers, and roads are at the beginning
      for (let i = parts.length - 1; i >= 0; i--) {
        const cleaned = cleanCandidate(parts[i]);
        if (cleaned) {
          return cleaned;
        }
      }

      return null;
    };

    const seen = new Map<string, { name: string; dist: number }>();
    const candidates = spaces
      .filter((s) => s.location && s.location.trim() && isSameState(s.location))
      .map((s) => {
        const dist = userCoords && s.latitude && s.longitude
          ? calcDistance(userCoords.lat, userCoords.lng, s.latitude, s.longitude)
          : 99999;
        const name = extractLocality(s.location);
        return name ? { name, dist } : null;
      })
      .filter((c): c is { name: string; dist: number } => c !== null)
      .sort((a, b) => a.dist - b.dist);

    for (const c of candidates) {
      const key = c.name.toLowerCase();
      if (!seen.has(key)) {
        seen.set(key, c);
      }
      if (seen.size >= 10) break;
    }
    return Array.from(seen.values()).map((v) => v.name);
  };

  // Automatically reset location chips and search query whenever active state changes
  useEffect(() => {
    setAllLocationChips([]);
    setSearchQuery("");
    setHighlightedSpaceId(null);
  }, [activeState]);

  useEffect(() => {
    // Only refresh allLocationChips when there is no searchQuery (i.e. full space list)
    // so clicking a chip doesn't reduce or clear the chips!
    if (!searchQuery && parkingSpaces.length > 0) {
      const extracted = extractLocationsFromSpaces(parkingSpaces);
      if (extracted.length > 0) {
        setAllLocationChips(extracted);
      }
    } else if (!searchQuery && parkingSpaces.length === 0) {
      setAllLocationChips([]);
    }
  }, [parkingSpaces, searchQuery, userCoords]);

  const nearestLocations = useMemo(() => {
    // Always keep all location options visible in the chips bar even when one chip is selected/active
    if (allLocationChips.length > 0) return allLocationChips;
    if (!searchQuery && parkingSpaces.length > 0) {
      return extractLocationsFromSpaces(parkingSpaces);
    }
    return [];
  }, [allLocationChips, parkingSpaces, searchQuery, userCoords]);

  const baseScopeSpaces = useMemo(() => {
    return parkingSpaces.filter((s) => {
      if (spaceFilter === "favourites") return favourites.includes(s.id);
      if (s.location && !isSameState(s.location)) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.trim().toLowerCase();
        const haystack = [
          s.location,
          s.serviceName,
          s.ownerName,
          s.city,
          s.description,
          s.comments,
        ].filter(Boolean).join(" ").toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });
  }, [parkingSpaces, spaceFilter, favourites, searchQuery, activeState]);

  const countOwner = baseScopeSpaces.filter((s) => !s.isSpotlyUploaded).length;
  const countSpotly = baseScopeSpaces.filter((s) => s.isSpotlyUploaded).length;

  const filteredSpacesRaw = parkingSpaces.filter((space) => {
    // If it is the highlighted space, always include it so the user can see it!
    if (highlightedSpaceId && space.id === highlightedSpaceId) return true;

    // Strict client-side state guard: ensure the space belongs to the currently active state
    if (space.location && !isSameState(space.location)) return false;

    // Upload source filter: By Space Owner vs By Spotly
    if (uploaderFilter === "owner" && space.isSpotlyUploaded) return false;
    if (uploaderFilter === "spotly" && !space.isSpotlyUploaded) return false;

    // Service vehicle filter for Spotly
    if (uploaderFilter === "spotly" && serviceFilter !== "all") {
      if (serviceFilter === "car" && space.parkingType !== "car") return false;
      if (serviceFilter === "bike" && space.parkingType !== "bike") return false;
    }

    if (spaceFilter === "viewed" && !revealedContacts.has(space.id)) return false;
    if (spaceFilter === "unviewed" && revealedContacts.has(space.id)) return false;
    if (spaceFilter === "favourites" && !favourites.includes(space.id)) return false;
    if (durationFilter !== "all" && space.duration !== durationFilter) return false;

    if (!searchQuery.trim()) return true;

    const query = searchQuery.toLowerCase().trim();
    const haystack = [
      space.location || "",
      space.serviceName || "",
      space.ownerName || "",
      space.description || "",
    ].join(" ").toLowerCase();

    const tokens = query.split(/[\s,.-]+/).filter((t) => t.length >= 1);
    if (tokens.length === 0) return true;

    const haystackWords = haystack.split(/[\s,.-]+/).filter(Boolean);

    // Every token in search query must match the beginning of at least one word in the space's haystack
    return tokens.every((tok) =>
      haystackWords.some((word) => word.startsWith(tok))
    );
  }).sort((a, b) => {
    // Sort highlighted space to the top
    if (highlightedSpaceId) {
      if (a.id === highlightedSpaceId) return -1;
      if (b.id === highlightedSpaceId) return 1;
    }
    if (userCoords) {
      const distA = a.latitude && a.longitude ? calcDistance(userCoords.lat, userCoords.lng, a.latitude, a.longitude) : 99999;
      const distB = b.latitude && b.longitude ? calcDistance(userCoords.lat, userCoords.lng, b.latitude, b.longitude) : 99999;
      if (distA !== distB) return distA - distB;
    }
    const aInterested = userInterests.has(a.id) ? 1 : 0;
    const bInterested = userInterests.has(b.id) ? 1 : 0;
    return bInterested - aInterested;
  });

  const filteredSpacesTemp = priceSort === "none"
    ? filteredSpacesRaw
    : [...filteredSpacesRaw].sort((a, b) => priceSort === "asc" ? a.rent - b.rent : b.rent - a.rent);

  const filteredSpaces = highlightedSpaceId
    ? [...filteredSpacesTemp].sort((a, b) => {
      if (a.id === highlightedSpaceId) return -1;
      if (b.id === highlightedSpaceId) return 1;
      return 0;
    })
    : filteredSpacesTemp;

  const handleViewPhotos = (e: React.MouseEvent, photos: string[], initialIndex: number = 0) => {
    e.stopPropagation();
    setViewingPhotos(photos);
    setActivePhotoIndex(initialIndex >= 0 && initialIndex < photos.length ? initialIndex : 0);
    setShowPhotoViewer(true);
  };

  const handleSpaceClick = (space: ParkingSpace) => {
    setSelectedSpace(space);
    setShowSpaceDetail(true);
  };

  const handleViewContactForSpace = async (spaceId: string) => {
    if (localStorage.getItem("exploreMode") === "true") {
      if (!isPremium) {
        setShowSubscriptionPopup(true);
        return;
      }
      setRevealingContactId(spaceId);
      await new Promise(resolve => setTimeout(resolve, 600));
      setRevealedContacts(prev => new Set(prev).add(spaceId));
      setRevealingContactId(null);
      return;
    }

    if (!isPremium) {
      setShowSubscriptionPopup(true);
      return;
    }

    if (revealedContacts.has(spaceId)) return;

    const userId = localStorage.getItem("userId");
    if (!userId) return;

    if (premiumPlan !== "premium" && premiumViewsRemaining <= 0) {
      setShowSubscriptionPopup(true);
      return;
    }

    setRevealingContactId(spaceId);

    try {
      const res = await fetch(getApiUrl(`/api/users/${userId}/premium/use-view`), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      // Small delay of 600ms to show spinner feedback cleanly
      await new Promise(resolve => setTimeout(resolve, 600));

      if (res.ok) {
        const data = await res.json();
        setPremiumViewsRemaining(data.viewsRemaining ?? premiumViewsRemaining - 1);
        setRevealedContacts(prev => new Set(prev).add(spaceId));
        fetch(getApiUrl(`/api/users/${userId}/viewed-contacts`), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ bookingId: spaceId }),
        }).catch(() => { });
      } else {
        const errData = await res.json();
        if (errData.expired || errData.error?.includes("No views")) {
          setIsPremium(false);
          setPremiumPlan(null);
          setShowSubscriptionPopup(true);
        }
      }
    } catch (error) {
      console.error("Failed to use premium view:", error);
    } finally {
      setRevealingContactId(null);
    }
  };

  const handleViewContact = async () => {
    if (!selectedSpace) return;
    handleViewContactForSpace(selectedSpace.id);
  };

  // Fetch free access mode from admin settings
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(getApiUrl("/api/settings/free_access_mode"));
        if (res.ok) {
          const data = await res.json();
          setFreeAccessMode(data.setting?.value === "true");
        }
      } catch { }
    })();
  }, []);

  const handleActivateFreeAccess = async () => {
    const userId = localStorage.getItem("userId");
    if (!userId || userId.startsWith("explore_")) {
      alert("Please log in with your mobile number to activate free access.");
      setLocation("/auth");
      return;
    }
    setIsActivatingFreeAccess(true);
    try {
      const res = await fetch(getApiUrl(`/api/users/${userId}/premium/free-access`), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      if (res.ok) {
        const data = await res.json();
        setIsPremium(true);
        setPremiumPlan("free");
        setPremiumViewsRemaining(9999);
        setPremiumExpiresAt(data.user?.premiumExpiresAt || new Date(Date.now() + 365 * 24 * 3600 * 1000).toISOString());
        setShowSubscriptionPopup(false);
        setShowConfetti(true);
        setTimeout(() => setShowConfetti(false), 2500);
      } else {
        const errData = await res.json().catch(() => ({}));
        alert(errData.error || "Failed to activate free access. Please try again.");
      }
    } catch (error) {
      console.error("Free access activation error:", error);
      alert("Network error. Please check your connection.");
    } finally {
      setIsActivatingFreeAccess(false);
    }
  };

  const getDistanceText = (space: ParkingSpace): string | null => {
    if (!userCoords || !space.latitude || !space.longitude) return null;
    const dist = calcDistance(userCoords.lat, userCoords.lng, space.latitude, space.longitude);
    if (dist < 1) return `${Math.round(dist * 1000)}m away`;
    return `${dist.toFixed(1)} km away`;
  };

  const [plans, setPlans] = useState([
    { name: "Basic", price: 199, views: 10, validity: 7, key: "basic" },
    { name: "Standard", price: 299, views: 20, validity: 15, key: "standard" },
    { name: "Premium", price: 399, views: -1, validity: 30, key: "premium" },
  ]);

  useEffect(() => {
    fetch(getApiUrl("/api/settings/premium-plans"))
      .then(res => res.json())
      .then(data => {
        if (data.plans) {
          setPlans(data.plans.filter((p: any) => p.enabled));
        }
      })
      .catch(() => { });
  }, []);

  const handleSelectPlan = async (plan: typeof plans[0]) => {
    setSelectedPlan(plan);
    setShowSubscriptionPopup(false);
    setShowPaymentProcessing(true);

    const userIdVal = localStorage.getItem("userId");
    const isRealUser = Boolean(userIdVal && !userIdVal.startsWith("explore_"));

    if (!isRealUser) {
      setShowPaymentProcessing(false);
      setShowSubscriptionPopup(false);
      alert("Please log in with your mobile number to purchase a subscription plan.");
      setLocation("/auth");
      return;
    }

    try {
      // Step 1: Create Order on Razorpay
      const orderRes = await fetch(getApiUrl("/api/razorpay/create-order"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: plan.price,
          planKey: plan.key,
          currency: "INR"
        }),
      });

      if (!orderRes.ok) {
        const errJson = await orderRes.json().catch(() => ({}));
        setShowPaymentProcessing(false);
        alert(errJson.error || "Failed to initialize payment. Please try again.");
        return;
      }

      const orderData = await orderRes.json();
      setShowPaymentProcessing(false);

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
        description: `Spotly India - ${plan.name} Subscription Plan`,
        image: "https://spotlyindia.org/logo-icon-white.png",
        order_id: orderData.orderId,
        handler: async function (response: any) {
          setShowPaymentProcessing(true);
          try {
            // Step 4: Verify Payment Signature on Backend
            const verifyRes = await fetch(getApiUrl("/api/razorpay/verify-payment"), {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                userId: userIdVal,
                planKey: plan.key,
                views: plan.views
              }),
            });

            if (verifyRes.ok) {
              setIsPremium(true);
              setPremiumPlan(plan.key);
              setPremiumViewsRemaining(plan.views === -1 ? 9999 : plan.views);
              setPremiumExpiresAt(new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString());
              setShowPaymentProcessing(false);
              setChoosePlan(null);
              setShowPaymentSuccess(true);
              setTimeout(() => setShowPaymentSuccess(false), 2500);
            } else {
              const errData = await verifyRes.json().catch(() => ({}));
              setShowPaymentProcessing(false);
              alert(errData.error || "Payment verification failed. Please contact support.");
            }
          } catch (err) {
            console.error("Payment verification network error:", err);
            setShowPaymentProcessing(false);
            alert("Verification failed due to a network error.");
          }
        },
        prefill: {
          contact: localStorage.getItem("rememberedMobile") || "",
        },
        notes: {
          plan: plan.key,
          userId: userIdVal
        },
        theme: {
          color: "#241e98"
        },
        modal: {
          ondismiss: function () {
            setShowPaymentProcessing(false);
          },
          confirm_close: true,
          animation: true
        },
        webview_intent: true,
        upi: {
          flow: "intent"
        },
        retry: {
          enabled: true,
          max_count: 4
        },
        _: {
          integration: "custom",
          integration_version: "1.0.0",
          integration_parent_version: "1.0.0"
        },
        config: {
          display: {
            blocks: {
              upi: {
                name: "Pay using UPI (Google Pay, PhonePe, Paytm, BHIM, QR)",
                instruments: [
                  {
                    method: "upi",
                    flows: ["intent", "qr", "collect"],
                  },
                ],
              },
              other: {
                name: "Cards, Netbanking & Wallets",
                instruments: [
                  {
                    method: "card",
                  },
                  {
                    method: "netbanking",
                  },
                  {
                    method: "wallet",
                  },
                ],
              },
            },
            sequence: ["block.upi", "block.other"],
            preferences: {
              show_default_blocks: true,
            },
          },
        }
      };

      const razorpayInstance = new (window as any).Razorpay(options);
      razorpayInstance.on("payment.failed", function (resp: any) {
        console.error("Razorpay Payment Failed:", resp.error);
        setShowPaymentProcessing(false);
        alert(resp.error?.description || "Payment failed or was cancelled.");
      });
      try {
        razorpayInstance.open();
      } catch (openErr: any) {
        console.error("Failed to open Razorpay checkout modal:", openErr);
        setShowPaymentProcessing(false);
        alert("Could not open Razorpay gateway popup. Please allow popups or refresh the page.");
      }

    } catch (error: any) {
      console.error("Razorpay payment init error:", error);
      setShowPaymentProcessing(false);
      alert(error?.message || "Unable to open payment gateway. Please check your internet connection.");
    }
  };

  // ─── Google Play Billing (Mobile APK only) ────────────────────────────────
  // Product IDs must match products created in Google Play Console
  const PLAY_PRODUCT_IDS: Record<string, string> = {
    basic: "spotly_basic",
    standard: "spotly_standard",
    premium: "spotly_premium",
  };

  const handleNativeAppPurchase = async (plan: typeof plans[0]) => {
    const userIdVal = localStorage.getItem("userId");
    const isRealUser = Boolean(userIdVal && !userIdVal.startsWith("explore_"));

    if (!isRealUser) {
      setShowSubscriptionPopup(false);
      alert("Please log in with your mobile number to purchase a subscription plan.");
      setLocation("/auth");
      return;
    }

    // Check Android JS bridge injected by Capacitor / native WebView
    const billing = (window as any).SpotlyBilling;
    if (!billing) {
      // Bridge not found — APK build required for Google Play Billing
      alert("Google Play billing is only available inside the Spotly Android app.\nPlease use the Spotly APK to subscribe.");
      return;
    }

    setSelectedPlan(plan);
    setShowSubscriptionPopup(false);
    setShowPaymentProcessing(true);

    const productId = PLAY_PRODUCT_IDS[plan.key] || `spotly_${plan.key}`;

    try {
      // Android calls window.SpotlyBillingResult(result) after purchase
      await new Promise<void>((resolve, reject) => {
        (window as any).SpotlyBillingResult = async (result: {
          success: boolean;
          purchaseToken?: string;
          productId?: string;
          error?: string;
        }) => {
          (window as any).SpotlyBillingResult = null;

          if (!result.success || !result.purchaseToken) {
            reject(new Error(result.error || "Purchase cancelled or failed."));
            return;
          }

          try {
            const verifyRes = await fetch(getApiUrl("/api/google-play/verify-purchase"), {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                purchaseToken: result.purchaseToken,
                productId: result.productId || productId,
                userId: userIdVal,
                planKey: plan.key,
                views: plan.views,
              }),
            });

            if (verifyRes.ok) {
              const data = await verifyRes.json();
              setIsPremium(true);
              setPremiumPlan(plan.key);
              setPremiumViewsRemaining(plan.views === -1 ? 9999 : plan.views);
              setPremiumExpiresAt(
                data.expiresAt || new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString()
              );
              setShowPaymentProcessing(false);
              setChoosePlan(null);
              setShowPaymentSuccess(true);
              setTimeout(() => setShowPaymentSuccess(false), 2500);
              resolve();
            } else {
              const errData = await verifyRes.json().catch(() => ({}));
              reject(new Error(errData.error || "Google Play payment verification failed."));
            }
          } catch (netErr: any) {
            reject(new Error(netErr?.message || "Network error verifying Google Play purchase."));
          }
        };

        // Use subscribe() for subscription-type products; fall back to purchase() for one-time
        if (typeof billing.subscribe === "function") {
          billing.subscribe(productId);
        } else {
          billing.purchase(productId);
        }
      });

    } catch (err: any) {
      console.error("Google Play purchase error:", err);
      setShowPaymentProcessing(false);
      alert(err?.message || "Payment failed or was cancelled. Please try again.");
    }
  };
  // ─────────────────────────────────────────────────────────────────────────────

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

    const isNative = Capacitor.isNativePlatform();
    const isAndroid = isNative || /android/i.test(navigator.userAgent);
    const isIOS = !isNative && /iphone|ipad|ipod/i.test(navigator.userAgent);

    if (isAndroid) {
      if (lat && lng) {
        window.location.href = `geo:${lat},${lng}?q=${lat},${lng}(${label})`;
      } else {
        window.location.href = `geo:0,0?q=${label}`;
      }
      if (!isNative) {
        setTimeout(() => {
          window.open(mapsUrl, "_blank");
        }, 700);
      }
    } else if (isIOS) {
      if (lat && lng) {
        window.location.href = `maps://maps.apple.com/?daddr=${lat},${lng}&q=${label}`;
      } else {
        window.location.href = `maps://maps.apple.com/?daddr=${label}`;
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
    vibrate();

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

  const openWhatsApp = (e: React.MouseEvent, phone?: string) => {
    e.stopPropagation();
    e.preventDefault();
    vibrate();
    const rawPhone = (phone || "").replace(/\D/g, "").slice(-10);
    if (!rawPhone) return;

    const encodedMsg = encodeURIComponent(
      "Hi, I saw your parking space on Spotly and I'm interested. Please let me know a convenient time to discuss."
    );
    const isNative = Capacitor.isNativePlatform();
    const isMobile = isNative || /android|iphone|ipad|ipod/i.test(navigator.userAgent);

    if (isMobile) {
      window.location.href = `whatsapp://send?phone=91${rawPhone}&text=${encodedMsg}`;
      if (!isNative) {
        setTimeout(() => {
          window.open(`https://wa.me/91${rawPhone}?text=${encodedMsg}`, "_blank");
        }, 700);
      }
    } else {
      window.open(`https://wa.me/91${rawPhone}?text=${encodedMsg}`, "_blank");
    }
  };



  const { requireLogin } = useAuthGuard();

  const handleInterest = async (e: React.MouseEvent, spaceId: string) => {
    e.stopPropagation();
    if (!requireLogin("show interest in this space")) return;
    const userId = localStorage.getItem("userId");
    if (!userId) return;
    setInterestLoading(spaceId);
    try {
      if (userInterests.has(spaceId)) {
        const res = await fetch(getApiUrl(`/api/interests/${spaceId}`), {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId }),
        });
        if (res.ok) {
          const data = await res.json();
          setUserInterests(prev => { const next = new Set(prev); next.delete(spaceId); return next; });
          setInterestCounts(prev => ({ ...prev, [spaceId]: data.count }));
        }
      } else {
        const res = await fetch(getApiUrl(`/api/interests/${spaceId}`), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId }),
        });
        if (res.ok) {
          const data = await res.json();
          setUserInterests(prev => new Set([...prev, spaceId]));
          setInterestCounts(prev => ({ ...prev, [spaceId]: data.count }));
        }
      }
    } catch (error) {
      console.error("Interest toggle failed:", error);
    }
    setInterestLoading(null);
  };


  const fetchInterestData = async (spaceIds: string[]) => {
    const userId = localStorage.getItem("userId");
    try {
      if (spaceIds.length > 0) {
        const countsRes = await fetch(getApiUrl(`/api/interests/counts?ids=${spaceIds.join(",")}`));
        if (countsRes.ok) {
          const data = await countsRes.json();
          setInterestCounts(prev => ({ ...prev, ...(data.counts || {}) }));
        }
      }
      if (userId) {
        const userRes = await fetch(getApiUrl(`/api/interests/user/${userId}`));
        if (userRes.ok) {
          const data = await userRes.json();
          setUserInterests(new Set(data.bookingIds || []));
        }
      }
    } catch (error) {
      console.error("Failed to fetch interest data:", error);
    }
  };

  const formatDisplayDate = (dateStr: string) => {
    if (!dateStr) return "";
    try {
      const date = new Date(dateStr + "T00:00:00");
      return date.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
    } catch { return dateStr; }
  };

  const timeAgo = (bookedAt: string) => {
    if (!bookedAt) return "";
    try {
      const posted = new Date(bookedAt);
      if (isNaN(posted.getTime())) return "";
      const now = new Date();
      const diffMs = now.getTime() - posted.getTime();
      if (diffMs < 0) return "just now";
      const diffSecs = Math.floor(diffMs / 1000);
      if (diffSecs < 60) return "just now";
      const diffMins = Math.floor(diffSecs / 60);
      if (diffMins < 60) return `${diffMins}m ago`;
      const diffHrs = Math.floor(diffMins / 60);
      if (diffHrs < 24) return `${diffHrs}h ago`;
      const diffDays = Math.floor(diffHrs / 24);
      if (diffDays < 30) return `${diffDays}d ago`;
      const diffMonths = Math.floor(diffDays / 30);
      return `${diffMonths}mo ago`;
    } catch { return ""; }
  };

  const exactAddress = localStorage.getItem("userDetectedAddress");

  const locationLabel = activeState;
  const exploreMode = localStorage.getItem("exploreMode") === "true";

  const { scrollY } = useScroll();
  const [containerScrolled, setContainerScrolled] = useState(false);

  useEffect(() => {
    const handleScrollCheck = () => {
      const scrollEl = document.getElementById("mobile-scroll-container");
      const currentScroll = (scrollEl ? scrollEl.scrollTop : 0) || window.scrollY || 0;
      const scrolled = currentScroll > 80;
      setContainerScrolled((prev) => (prev !== scrolled ? scrolled : prev));
    };

    const scrollEl = document.getElementById("mobile-scroll-container");
    if (scrollEl) {
      scrollEl.addEventListener("scroll", handleScrollCheck, { passive: true });
    }
    window.addEventListener("scroll", handleScrollCheck, { passive: true });

    handleScrollCheck();

    return () => {
      if (scrollEl) {
        scrollEl.removeEventListener("scroll", handleScrollCheck);
      }
      window.removeEventListener("scroll", handleScrollCheck);
    };
  }, []);

  const isScrolled = scrollY > 80 || containerScrolled;

  if (comingSoonMode === true) {
    return (
      <div className="min-h-screen bg-white flex flex-col relative overflow-hidden">
        <div className="bg-gradient-to-br from-[#0d3da8] via-[#1a56db] to-[#2563eb] pt-16 pb-32 px-6 relative">
          <div className="absolute bottom-0 left-0 right-0 h-16 bg-white rounded-t-[3rem]"></div>
          <div className="absolute top-10 left-10 w-20 h-20 border-2 border-white/20 rounded-full"></div>
          <div className="absolute top-24 left-6 w-8 h-8 bg-white/10 rounded-full"></div>
          <div className="absolute top-8 right-8 w-4 h-4 bg-green-400 rounded-full animate-pulse"></div>
          <div className="text-center relative z-10">
            <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full mb-6">
              <span className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></span>
              <span className="text-white/90 text-xs font-medium">Space Seeker</span>
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">Spotly</h1>
            <p className="text-blue-200 text-sm">Find Parking Near You</p>
          </div>
        </div>
        <div className="flex-1 px-6 -mt-8 relative z-10">
          <div className="bg-white rounded-3xl shadow-xl shadow-blue-200/50 p-8 mb-6 border border-blue-100">
            <div className="flex items-center justify-center mb-6">
              <div className="w-24 h-24 bg-gradient-to-br from-blue-100 to-blue-50 rounded-full flex items-center justify-center">
                <Car className="w-12 h-12 text-primary" />
              </div>
            </div>
            <h2 className="text-xl font-bold text-gray-900 text-center mb-3">Parking Spaces Coming!</h2>
            <p className="text-gray-500 text-center text-sm leading-relaxed">
              Find available parking spaces near you. Safe, affordable, and convenient.
            </p>
          </div>
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-5 text-center mb-4">
            <p className="text-gray-700 font-medium text-sm">Launching Soon!</p>
            <p className="text-gray-500 text-xs mt-1">We'll notify you when spaces are available</p>
          </div>
        </div>
      </div>
    );
  }

  if (isInitialLoading) {
    return <SpotlyPreloader fullScreen />;
  }

  return (
    <>
      {/* ===== DESKTOP VIEW (md+) ===== */}
      <div className="hidden md:block">
        <SpaceSeekerDesktopHome
          parkingSpaces={parkingSpaces}
          totalSpaces={totalSpaces}
          isLoading={isLoading}
          isSearching={isSearching}
          isStateSwitching={isStateSwitching}
          onLocationChipClick={handleLocationChipClick}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          favourites={favourites}
          toggleFavourite={toggleFavourite}
          selectedSpace={selectedSpace}
          setSelectedSpace={setSelectedSpace}
          setShowSpaceDetail={setShowSpaceDetail}
          userName={userName}
          userCoords={userCoords}
          onNotificationsOpen={() => setNotificationsOpen(true)}
          unreadCount={unreadCount}
          locationLabel={locationLabel}
          spaceFilter={spaceFilter}
          setSpaceFilter={setSpaceFilter}
          onShowCitySelector={() => setShowCitySelector(true)}
          revealedContacts={revealedContacts}
          interestData={interestCounts}
          isPremium={isPremium}
          revealingContactId={revealingContactId}
          handleViewContactForSpace={handleViewContactForSpace}
          onShowSubscriptionPopup={() => setShowSubscriptionPopup(true)}
          nearestLocations={nearestLocations}
          onAutoLocate={handleAutoLocate}
          isLocating={isLocating}
        />
        {/* Desktop: State Selector Modal */}
        <StateSelectorModal
          isOpen={showCitySelector}
          onClose={() => setShowCitySelector(false)}
          displayCities={displayCities}
          activeState={activeState}
          onSelectCity={(cityId) => handleCityChange(cityId)}
          subtitle="Choose a state where you'd like to find parking spaces"
        />
      </div>

      {/* ===== MOBILE VIEW (<md) ===== */}
      <div className="block md:hidden">
        <MobileLayout showNav userType="worker">
          <div className="pb-8 bg-neutral-50 min-h-full">
            {/* Sticky Header - appears on scroll */}
            <div
              className={`fixed top-0 left-0 right-0 z-50 px-6 pt-[calc(0.75rem+env(safe-area-inset-top,0px))] pb-3 shadow-lg transition-all duration-300 ${isScrolled ? 'translate-y-0 opacity-100 pointer-events-auto' : '-translate-y-full opacity-0 pointer-events-none'
                }`}
              style={{ background: "linear-gradient(135deg, #1e3a8a 0%, #3b2fad 35%, #6d28d9 70%, #7c3aed 100%)" }}
            >
              <div className="flex items-center justify-between max-w-md mx-auto">
                <div className="flex flex-col items-start">
                  <button
                    onClick={() => setShowCitySelector(true)}
                    className="flex items-center gap-1.5 text-blue-200/90 hover:text-white transition-all bg-white/10 px-2 py-0.5 rounded-lg border border-white/5 active:scale-95 text-left"
                    data-testid="button-location-label-worker-sticky"
                  >
                    <MapPin size={13} className="text-blue-200/80" />
                    <span className="text-sm font-medium">{locationLabel}</span>
                    <ChevronDown size={12} className="opacity-80" />
                  </button>
                  {exploreMode ? (
                    <span
                      className="inline-flex items-center gap-1 mt-1.5 px-2 py-0.5 bg-yellow-400/90 text-[#2e0044] text-[10px] font-bold rounded-full uppercase tracking-wider"
                      data-testid="badge-explore-worker-sticky"
                    >
                      <Sparkles size={10} /> Explore Mode
                    </span>
                  ) : isGuest() ? (
                    <span
                      onClick={() => requireLogin("log in")}
                      className="inline-flex items-center gap-1 mt-1.5 px-2 py-0.5 bg-yellow-400/90 text-[#2e0044] text-[10px] font-bold rounded-full uppercase tracking-wider cursor-pointer active:scale-95 transition-transform"
                      data-testid="badge-guest-worker-sticky"
                    >
                      <User size={10} /> Login as Guest
                    </span>
                  ) : null}
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setShowSupportPopup(true)}
                    className="w-11 h-11 rounded-2xl bg-white/15 backdrop-blur-md border border-white/20 flex items-center justify-center text-white hover:bg-white/25 transition-all shadow-lg shadow-blue-900/10"
                    data-testid="button-support-worker-sticky"
                  >
                    <Phone size={18} className="drop-shadow-sm" />
                  </button>
                  <button
                    onClick={() => setNotificationsOpen(true)}
                    className="w-11 h-11 rounded-2xl bg-white/15 backdrop-blur-md border border-white/20 flex items-center justify-center text-white hover:bg-white/25 transition-all shadow-lg shadow-blue-900/10 relative"
                    data-testid="button-notifications-worker-sticky"
                  >
                    <Bell size={18} className="drop-shadow-sm" />
                    {unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 w-5 h-5 bg-gradient-to-r from-red-500 to-pink-500 rounded-full ring-2 ring-white flex items-center justify-center text-[10px] font-bold">{unreadCount > 9 ? '9+' : unreadCount}</span>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Premium Gradient Header with Parking Cars Graphic */}
            <div
              className={`px-6 pt-[calc(1.5rem+env(safe-area-inset-top,0px))] ${spaceFilter === "favourites" ? "pb-6" : "pb-14"} relative overflow-hidden`}
              style={{ background: "linear-gradient(135deg, #1e3a8a 0%, #3b2fad 35%, #6d28d9 70%, #7c3aed 100%)" }}
            >
              {/* Glow Backgrounds */}
              <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-br from-[#7c3aed]/30 to-purple-600/30 rounded-full blur-3xl"></div>
              <div className="absolute bottom-0 left-0 w-40 h-40 bg-purple-500/15 rounded-full blur-2xl"></div>

              {/* Reused Parking Artwork Graphic */}
              <div className="absolute right-0 bottom-0 top-0 w-[85%] pointer-events-none overflow-hidden flex items-end justify-end z-0">
                <img
                  src="/header_parking_cars_transparent.png"
                  alt="Spotly Parking Cars Scene"
                  className="h-[79px] mb-[20px] sm:h-[135px] max-w-none object-contain object-right-bottom filter drop-shadow-sm translate-y-1"
                />
              </div>

              <div className="relative z-10 flex items-start justify-between">
                <div>
                  <p className="text-indigo-200/90 text-xs font-extrabold tracking-wide flex items-center gap-1" data-testid="text-time-greeting-seeker">
                    <span>{getTimeGreeting()}</span>
                    <span>🌙</span>
                  </p>
                  <h3 className="text-xl font-black font-heading text-white tracking-tight mt-0.5 capitalize" data-testid="text-user-name-seeker">
                    {capitalizeName(userName || localStorage.getItem("userName") || "User")}
                  </h3>
                  <button
                    onClick={() => setShowCitySelector(true)}
                    className="flex items-center gap-1.5 mt-2 bg-white/15 hover:bg-white/25 border border-white/20 text-white px-3 py-1.5 rounded-full text-xs font-extrabold backdrop-blur-md shadow-lg shadow-black/20 transition-all active:scale-95 cursor-pointer"
                    data-testid="button-location-label-worker"
                  >
                    <MapPin size={13} className="text-indigo-200" />
                    <span>{locationLabel}</span>
                    <ChevronDown size={13} className="text-indigo-200 opacity-80" />
                  </button>
                </div>
                <div className="flex items-center gap-2.5 z-10">
                  <button
                    onClick={() => setShowSupportPopup(true)}
                    className="w-10 h-10 rounded-2xl bg-white/15 backdrop-blur-md border border-white/20 flex items-center justify-center text-white hover:bg-white/25 transition-all shadow-md active:scale-95"
                    data-testid="button-support-worker"
                  >
                    <Phone size={18} className="drop-shadow-sm" />
                  </button>
                  <button
                    onClick={() => setNotificationsOpen(true)}
                    className="w-10 h-10 rounded-2xl bg-white/15 backdrop-blur-md border border-white/20 flex items-center justify-center text-white hover:bg-white/25 transition-all shadow-md active:scale-95 relative"
                    data-testid="button-notifications-worker"
                  >
                    <Bell size={18} className="drop-shadow-sm" />
                    {unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 w-5 h-5 bg-gradient-to-r from-red-500 to-pink-500 rounded-full ring-2 ring-white flex items-center justify-center text-[10px] font-extrabold">{unreadCount > 9 ? '9+' : unreadCount}</span>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Floating Search Box (hidden on favourite tab) */}
            {spaceFilter !== "favourites" && (
              <div className="px-5 -mt-7 relative z-40 mb-4">
                <div className="bg-white rounded-[24px] shadow-xl shadow-[#241e98]/10 border border-slate-100 flex items-center overflow-hidden p-1">
                  <div className="pl-3.5 pr-2">
                    {isSearching ? (
                      <Loader2 size={19} className="text-[#241e98] animate-spin" />
                    ) : (
                      <Search size={19} className="text-slate-400" />
                    )}
                  </div>
                  <div className="flex-1 relative">
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => {
                        setSearchQuery(e.target.value);
                      }}
                      onFocus={() => setIsSearchFocused(true)}
                      onBlur={() => setIsSearchFocused(false)}
                      placeholder="Search location, area or landmark"
                      className="w-full py-3.5 px-1 text-sm text-slate-800 outline-none bg-transparent font-medium"
                      data-testid="input-search-spaces"
                    />
                  </div>
                  {searchQuery && (
                    <button
                      onClick={() => {
                        setSearchQuery("");
                        setUserLocation("");
                      }}
                      className="p-2 text-slate-400 hover:text-slate-600 transition-colors"
                      data-testid="button-clear-search"
                    >
                      <XCircle size={18} />
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      vibrate();
                      handleAutoLocate();
                    }}
                    disabled={isLocating}
                    className="p-1 transition-transform active:scale-95 relative flex items-center justify-center"
                    data-testid="button-auto-locate"
                  >
                    <div
                      className="w-10 h-10 rounded-2xl text-white flex items-center justify-center relative z-10 shadow-md shadow-[#3b2fad]/30 hover:scale-105 transition-transform duration-200"
                      style={{ background: "linear-gradient(135deg, #1e3a8a 0%, #3b2fad 35%, #6d28d9 70%, #7c3aed 100%)" }}
                    >
                      {isLocating ? (
                        <Loader2 size={18} className="animate-spin text-white" />
                      ) : (
                        <LocateFixed size={18} className="text-white" />
                      )}
                    </div>
                  </button>
                </div>
                {userLocation && (
                  <p className="text-xs font-semibold text-[#241e98] mt-2 ml-1 flex items-center gap-1">
                    <MapPin size={11} />
                    Showing results near: {userLocation}
                  </p>
                )}

                {nearestLocations.length > 0 && (
                  <div className="mt-3 overflow-x-auto scrollbar-hide" data-testid="chips-nearest-locations">
                    <div className="flex items-center gap-2 w-max pb-1">
                      {nearestLocations.map((loc) => {
                        const active = searchQuery.trim().toLowerCase() === loc.toLowerCase();
                        return (
                          <button
                            key={loc}
                            type="button"
                            data-chip="location"
                            onClick={() => {
                              handleLocationChipClick(loc);
                            }}
                            className={`location-chip flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-extrabold whitespace-nowrap border shadow-none ${active
                              ? "bg-gradient-to-r from-[#241e98] via-[#2b24b1] to-[#3e3ab3] text-white border-[#241e98]"
                              : "bg-white text-slate-700 border-slate-200/90 hover:bg-slate-50"
                              }`}
                            style={{ boxShadow: "none" }}
                            data-testid={`chip-location-${loc.replace(/\s+/g, "-").toLowerCase()}`}
                          >
                            <MapPin size={11} className={active ? "text-white" : "text-[#241e98]"} />
                            {loc}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Available Parking Spaces Banner (hidden on favourite tab) */}
            {spaceFilter !== "favourites" && (
              <div className="px-5 mb-4 relative z-10">
                <div
                  className="rounded-[24px] p-4 text-white shadow-xl shadow-[#1e3a8a]/20 flex items-center justify-between gap-3 relative overflow-hidden"
                  style={{ background: "linear-gradient(135deg, #1e3a8a 0%, #3b2fad 35%, #6d28d9 70%, #7c3aed 100%)" }}
                >
                  <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-xl pointer-events-none"></div>
                  <div className="flex items-center gap-3 relative z-10 min-w-0">
                    <div className="w-11 h-11 rounded-2xl bg-white/15 backdrop-blur-md border border-white/20 flex items-center justify-center shrink-0">
                      <ParkingCircle size={24} className="text-white" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-black text-sm sm:text-base leading-snug truncate">Available Parking Spaces</h3>
                      <p className="text-indigo-200 text-[11px] font-medium truncate mt-0.5">Find the best spot near you</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2.5 shrink-0 relative z-10">
                    <span className="text-2xl font-black text-white">{filteredSpaces.length}</span>
                    <div className="h-6 w-px bg-white/20"></div>
                    <button
                      onClick={() => { if (!requireLogin("subscribe to Premium")) return; isPremium ? setShowPremiumDetails(true) : setShowSubscriptionPopup(true); }}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-extrabold bg-amber-400 hover:bg-amber-300 text-slate-900 transition-all active:scale-95 shadow-sm"
                      data-testid="button-premium-banner"
                    >
                      <Crown size={14} className="fill-slate-900" />
                      <span>{isPremium ? (premiumPlan === "premium" ? "Unlimited" : `${premiumViewsRemaining} left`) : "Unlimited"}</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Main Content Area */}
            <div className="px-5 relative z-10">
              {/* Favourite Spaces Header */}
              {spaceFilter === "favourites" && (
                <div className="pt-4 pb-2 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Heart size={18} className="text-rose-500 fill-rose-500" />
                    <h2 className="text-base font-extrabold text-slate-900">Favourite Spaces</h2>
                    <span className="text-xs text-slate-400 font-semibold">({filteredSpaces.length})</span>
                  </div>
                </div>
              )}
              {/* ═══ PRIMARY TABS: By Space Owner | By Spotly (Roadside) - 50% 50% Sliding Animation ═══ */}
              {spaceFilter !== "favourites" && (
                <div className="w-full bg-slate-100/90 p-1.5 rounded-2xl flex items-center border border-slate-300 shadow-xs relative mb-3.5">
                  {/* Space Owner Tab (50%) */}
                  <button
                    type="button"
                    onClick={() => {
                      if (uploaderFilter === "owner") return;
                      vibrate();
                      setUploaderFilter("owner");
                    }}
                    className={`relative flex-1 w-1/2 flex items-center justify-center py-2.5 px-3 rounded-xl text-xs font-extrabold transition-colors z-10 cursor-pointer ${
                      uploaderFilter === "owner" ? "text-white" : "text-slate-600 hover:text-slate-900"
                    }`}
                    data-testid="tab-mobile-uploader-owner"
                  >
                    {uploaderFilter === "owner" && (
                      <motion.div
                        layoutId="activeUploaderMobileTab"
                        className="absolute inset-0 rounded-xl shadow-md shadow-[#1e3a8a]/30 z-0"
                        style={{ background: "linear-gradient(135deg, #1e3a8a 0%, #3b2fad 35%, #6d28d9 70%, #7c3aed 100%)" }}
                        transition={{ type: "spring", stiffness: 500, damping: 35 }}
                      />
                    )}
                    <span className="relative z-10 flex items-center gap-1.5 truncate">
                      <Building2 size={14} className={uploaderFilter === "owner" ? "text-white shrink-0" : "text-[#3b2fad] shrink-0"} />
                      <span className="truncate">By Space Owner</span>
                      <span
                        className={`text-[10px] font-black px-1.5 py-0.5 rounded-full shrink-0 transition-colors ${
                          uploaderFilter === "owner" ? "bg-white/20 text-white" : "bg-slate-200/90 text-slate-700"
                        }`}
                      >
                        {countOwner}
                      </span>
                    </span>
                  </button>

                  {/* By Spotly Tab (50%) */}
                  <button
                    type="button"
                    onClick={() => {
                      if (uploaderFilter === "spotly") return;
                      vibrate();
                      setUploaderFilter("spotly");
                      const todayKey = `spotly_roadside_alert_${new Date().toISOString().slice(0, 10)}`;
                      const alreadyShownToday = localStorage.getItem(todayKey) === "shown";
                      if (!alreadyShownToday) {
                        setShowRoadsideAlertModal(true);
                        try {
                          localStorage.setItem(todayKey, "shown");
                        } catch (_) {}
                      }
                    }}
                    className={`relative flex-1 w-1/2 flex items-center justify-center py-2.5 px-3 rounded-xl text-xs font-extrabold transition-colors z-10 cursor-pointer ${
                      uploaderFilter === "spotly" ? "text-white" : "text-slate-600 hover:text-slate-900"
                    }`}
                    data-testid="tab-mobile-uploader-spotly"
                  >
                    {uploaderFilter === "spotly" && (
                      <motion.div
                        layoutId="activeUploaderMobileTab"
                        className="absolute inset-0 rounded-xl shadow-md shadow-emerald-700/30 z-0"
                        style={{ background: "linear-gradient(135deg, #059669 0%, #0d9488 45%, #047857 100%)" }}
                        transition={{ type: "spring", stiffness: 500, damping: 35 }}
                      />
                    )}
                    <span className="relative z-10 flex items-center gap-1.5 truncate">
                      <Navigation size={14} className={uploaderFilter === "spotly" ? "text-white fill-white shrink-0" : "text-emerald-600 shrink-0"} />
                      <span className="truncate">By Spotly</span>
                      <span
                        className={`text-[10px] font-black px-1.5 py-0.5 rounded-full shrink-0 transition-colors ${
                          uploaderFilter === "spotly" ? "bg-white/20 text-white" : "bg-emerald-100 text-emerald-800"
                        }`}
                      >
                        {countSpotly}
                      </span>
                    </span>
                  </button>
                </div>
              )}

              {/* Filter Tabs Bar (hidden when on Favourites screen) */}
              {spaceFilter !== "favourites" && (
                <div className="flex items-center justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide pb-0.5 min-w-0 flex-1">
                    <button
                      onClick={() => {
                        vibrate();
                        setSpaceFilter("all");
                        setSearchQuery("");
                        setUserLocation("");
                      }}
                      className={`px-4 py-2 rounded-full text-xs font-extrabold shrink-0 ${spaceFilter === "all"
                        ? "bg-[#241e98] text-white"
                        : "bg-white text-slate-600 hover:bg-slate-50 border border-slate-200/80"
                        }`}
                      data-testid="filter-all"
                    >
                      All
                    </button>

                    {isPremium && (
                      <>
                        <button
                          onClick={() => { vibrate(); setSpaceFilter("viewed"); }}
                          className={`px-4 py-2 rounded-full text-xs font-extrabold shrink-0 flex items-center gap-1.5 ${spaceFilter === "viewed"
                            ? "bg-[#241e98] text-white"
                            : "bg-white text-slate-600 hover:bg-slate-50 border border-slate-200/80"
                            }`}
                          data-testid="filter-viewed"
                        >
                          <Eye size={13} />
                          <span>Viewed</span>
                          {revealedContacts.size > 0 && (
                            <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-full ${spaceFilter === "viewed" ? "bg-white/20 text-white" : "bg-indigo-100 text-[#241e98]"
                              }`}>
                              {revealedContacts.size}
                            </span>
                          )}
                        </button>
                        <button
                          onClick={() => { vibrate(); setSpaceFilter("unviewed"); }}
                          className={`px-4 py-2 rounded-full text-xs font-extrabold shrink-0 flex items-center gap-1.5 ${spaceFilter === "unviewed"
                            ? "bg-[#241e98] text-white"
                            : "bg-white text-slate-600 hover:bg-slate-50 border border-slate-200/80"
                            }`}
                          data-testid="filter-unviewed"
                        >
                          <EyeOff size={13} />
                          <span>Unviewed</span>
                        </button>
                      </>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0 pl-1">
                    <button
                      onClick={() => { vibrate(); setPriceSort(priceSort === "asc" ? "none" : "asc"); }}
                      className={`w-9 h-9 rounded-2xl flex items-center justify-center border ${priceSort === "asc"
                        ? "bg-[#241e98] text-white border-[#241e98]"
                        : "bg-white text-slate-600 border-slate-200/80 hover:bg-slate-50"
                        }`}
                      title="Price: Low to High"
                      data-testid="filter-price-asc"
                    >
                      <ArrowUpWideNarrow size={16} />
                    </button>
                    <button
                      onClick={() => { vibrate(); setPriceSort(priceSort === "desc" ? "none" : "desc"); }}
                      className={`w-9 h-9 rounded-2xl flex items-center justify-center border ${priceSort === "desc"
                        ? "bg-[#241e98] text-white border-[#241e98]"
                        : "bg-white text-slate-600 border-slate-200/80 hover:bg-slate-50"
                        }`}
                      title="Price: High to Low"
                      data-testid="filter-price-desc"
                    >
                      <ArrowDownWideNarrow size={16} />
                    </button>
                  </div>
                </div>
              )}

              {/* Vehicle Filter Row for Spotly */}
              {spaceFilter !== "favourites" && uploaderFilter === "spotly" && (
                <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide pb-2 pt-0.5 mb-1">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider shrink-0">Vehicle:</span>
                  {[
                    { key: "all" as const, label: "All Vehicles" },
                    { key: "car" as const, label: "Car Parking", icon: Car },
                    { key: "bike" as const, label: "Bike Parking", icon: Bike },
                  ].map((f) => {
                    const active = serviceFilter === f.key;
                    const Icon = f.icon;
                    return (
                      <button
                        key={f.key}
                        type="button"
                        onClick={() => { vibrate(); setServiceFilter(f.key); }}
                        className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold shrink-0 border transition-all ${
                          active
                            ? "bg-[#241e98] text-white border-[#241e98]"
                            : "bg-white text-slate-600 border-slate-200/90 hover:bg-slate-50"
                        }`}
                      >
                        {Icon && <Icon size={12} />}
                        <span>{f.label}</span>
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Duration Filter Row for Owner */}
              {spaceFilter !== "favourites" && uploaderFilter === "owner" && (
                <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide px-1 pb-2 pt-0.5">
                  {(["all", "Hourly", "Days", "Monthly"] as const).map((opt) => {
                    const icon = opt === "all" ? "🏷️" : opt === "Hourly" ? "⏱️" : opt === "Days" ? "📅" : "🗓️";
                    const label = opt === "all" ? "All Types" : opt;
                    const isActive = durationFilter === opt;
                    return (
                      <button
                        key={opt}
                        onClick={() => { vibrate(); setDurationFilter(opt); }}
                        className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-extrabold shrink-0 border ${isActive
                            ? "bg-[#241e98] text-white border-[#241e98]"
                            : "bg-white text-slate-600 border-slate-200/80 hover:bg-slate-50"
                          }`}
                        data-testid={`filter-duration-${opt}`}
                      >
                        <span>{icon}</span>
                        <span>{label}</span>
                      </button>
                    );
                  })}
                </div>
              )}

              {isLocating ? (
                <div className="flex flex-col items-center justify-center py-20">
                  {isLocating ? (
                    <>
                      <div className="relative w-32 h-32 flex items-center justify-center mb-6">
                        <motion.div
                          className="absolute inset-0 rounded-full border-2 border-[#1b1675]/50"
                          animate={{ scale: [1, 2.2], opacity: [0.75, 0] }}
                          transition={{ duration: 0.75, repeat: Infinity, ease: "easeOut" }}
                        />
                        <motion.div
                          className="absolute inset-0 rounded-full border-2 border-[#241e98]/40"
                          animate={{ scale: [1, 2.5], opacity: [0.65, 0] }}
                          transition={{ duration: 0.75, repeat: Infinity, ease: "easeOut", delay: 0.15 }}
                        />
                        <motion.div
                          className="absolute inset-0 rounded-full border-2 border-[#3e3ab3]/30"
                          animate={{ scale: [1, 2.8], opacity: [0.55, 0] }}
                          transition={{ duration: 0.75, repeat: Infinity, ease: "easeOut", delay: 0.3 }}
                        />
                        <motion.div
                          className="w-16 h-16 rounded-full bg-gradient-to-br from-[#1b1675] via-[#241e98] to-[#3e3ab3] flex items-center justify-center shadow-xl shadow-[#241e98]/30"
                          animate={{ scale: [1, 1.12, 1] }}
                          transition={{ duration: 0.75, repeat: Infinity, ease: "easeInOut" }}
                        >
                          <LocateFixed className="w-7 h-7 text-white" />
                        </motion.div>
                      </div>
                      <p className="text-sm font-semibold text-neutral-700">Fetching nearest providers...</p>
                      <p className="text-xs text-neutral-400 mt-1">Detecting your location</p>
                    </>
                  ) : null}
                </div>
              ) : (isLoading || isSearching || isStateSwitching || isFiltering) ? (
                <div className="space-y-4 px-1" data-testid="loader-parking-spaces-skeleton">
                  {[0, 1, 2, 3].map((i) => (
                    <div key={i} className="bg-white/95 backdrop-blur-md rounded-3xl p-4 shadow-sm border border-blue-100/80 animate-pulse relative overflow-hidden">
                      <div className="flex items-center justify-between border-b border-blue-100/60 pb-2.5 mb-3">
                        <div className="flex items-center gap-2">
                          <div className="h-4 w-20 bg-blue-100/70 rounded-full" />
                          <div className="h-4 w-24 bg-neutral-200 rounded-md" />
                        </div>
                        <div className="h-4 w-16 bg-neutral-200 rounded-md" />
                      </div>
                      <div className="flex items-start gap-3.5 mb-3">
                        <div className="w-[84px] h-[84px] rounded-2xl bg-neutral-200/90 flex-shrink-0" />
                        <div className="flex-1 space-y-2 py-0.5">
                          <div className="h-5 w-3/4 bg-neutral-200/90 rounded-md" />
                          <div className="h-4 w-1/2 bg-blue-100/60 rounded-md" />
                          <div className="h-3.5 w-2/3 bg-neutral-200/80 rounded-md" />
                        </div>
                      </div>
                      <div className="h-3.5 w-full bg-neutral-200/70 rounded-md mt-3" />
                      <div className="h-3.5 w-3/4 bg-neutral-200/60 rounded-md mt-2" />
                      <div className="h-11 w-full bg-gradient-to-r from-blue-100/80 to-blue-50/80 rounded-2xl mt-4" />
                    </div>
                  ))}
                </div>
              ) : filteredSpaces.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 px-6">
                  {spaceFilter === "favourites" ? (
                    <>
                      <div className="w-20 h-20 bg-rose-50 text-rose-500 rounded-3xl flex items-center justify-center mb-4 shadow-inner ring-8 ring-rose-50/50">
                        <Heart size={36} className="fill-rose-500" />
                      </div>
                      <h4 className="text-lg font-black text-slate-900 mb-1" data-testid="text-no-favourites">No Favourites Added Yet</h4>
                      <p className="text-slate-500 text-xs text-center max-w-[260px] leading-relaxed mb-6 font-medium">
                        You haven't marked any parking space as favourite yet. Tap the heart icon on any space card to save it here for quick access!
                      </p>
                      <button
                        onClick={() => { setSpaceFilter("all"); setSearchQuery(""); }}
                        className="px-6 py-3 bg-gradient-to-r from-[#241e98] via-[#2b24b1] to-[#3e3ab3] hover:from-[#1b1778] hover:to-[#2e2a97] text-white font-extrabold text-xs rounded-2xl shadow-xl shadow-[#241e98]/30 transition-all cursor-pointer active:scale-95"
                        data-testid="button-browse-all-spaces"
                      >
                        Browse All Spaces
                      </button>
                    </>
                  ) : searchQuery ? (
                    <>
                      <h4 className="text-lg font-bold text-neutral-800 mb-2" data-testid="text-no-results">No Results Found</h4>
                      <p className="text-neutral-500 text-sm text-center mb-6 max-w-[250px]">
                        No parking spaces match "{searchQuery}". Try a different search.
                      </p>
                      <button
                        onClick={() => { setSearchQuery(""); setUserLocation(""); }}
                        className="group flex items-center gap-3 px-6 py-3.5 border-2 border-[#241e98] text-[#241e98] font-semibold rounded-2xl hover:bg-indigo-50 active:scale-95 transition-all duration-300"
                        data-testid="button-clear-search-results"
                      >
                        <Search size={20} />
                        Clear Search
                      </button>
                    </>
                  ) : uploaderFilter === "spotly" ? (
                    <>
                      <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center mb-3">
                        <Navigation size={28} className="fill-emerald-600 text-emerald-600" />
                      </div>
                      <h4 className="text-base font-bold text-slate-800 mb-1" data-testid="text-no-spotly-spaces">No Roadside Spaces in this Area</h4>
                      <p className="text-slate-500 text-xs text-center max-w-[260px] leading-relaxed mb-4">
                        No roadside parking spots uploaded by Spotly in this location yet. Check back soon!
                      </p>
                      <button
                        onClick={() => { setUploaderFilter("owner"); }}
                        className="px-5 py-2.5 bg-gradient-to-r from-[#1e3a8a] via-[#3b2fad] to-[#6d28d9] text-white font-extrabold text-xs rounded-xl shadow-md cursor-pointer active:scale-95"
                      >
                        Switch to By Space Owner ({countOwner})
                      </button>
                    </>
                  ) : (
                    <>
                      <h4 className="text-lg font-bold text-neutral-800 mb-2" data-testid="text-no-spaces">No Parking Spaces Yet</h4>
                      <p className="text-neutral-500 text-sm text-center max-w-[250px]">
                        No spaces are available right now. Check back soon for new parking listings!
                      </p>
                    </>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 py-1">
                  {filteredSpaces.map((space) => {
                    const { rating: spaceRating, reviewCount: spaceReviews } = getSpaceRatingAndReviews(space.id);
                    const distanceText = getDistanceText(space);
                    const isRevealed = revealedContacts.has(space.id);
                    const rawPhone = (space.ownerPhone || "").replace(/\D/g, "").slice(-10);
                    const seekerName = localStorage.getItem("userName") || "";
                    const whatsappMsg = seekerName
                      ? `Hi, I’m ${seekerName}. I saw your parking space on Spotly and I’m interested. Please let me know how to connect. Thanks!`
                      : `Hi, I saw your parking space on Spotly and I’m interested. Please let me know how to connect. Thanks!`;
                    const vehicleTag = space.vehicleSize || (space.parkingType === "both" ? "Car & Bike" : space.parkingType === "bike" ? "Bike" : "Sedan");

                    if (space.isSpotlyUploaded) {
                      return (
                        <div
                          key={space.id}
                          id={`card-space-${space.id}`}
                          onClick={() => handleSpaceClick(space)}
                          className="w-full rounded-[24px] p-3.5 transition-all duration-300 relative cursor-pointer group bg-white border border-emerald-200 shadow-md shadow-emerald-950/5 hover:shadow-xl hover:border-emerald-300"
                          data-testid={`card-spotly-${space.id}`}
                        >
                          {/* Top Section: Photo + Info */}
                          <div className="flex gap-3 items-stretch">
                            {/* Photo Thumbnail */}
                            <div className="relative w-[110px] h-[110px] rounded-[18px] overflow-hidden shrink-0 shadow-xs bg-emerald-50 border border-emerald-100">
                              <MobileCardImageSlider
                                photos={space.photos}
                                serviceName={space.serviceName}
                                parkingType={space.parkingType}
                                isSpotlyUploaded={true}
                                onOpenPhotos={(e, index) => {
                                  e.stopPropagation();
                                  vibrate();
                                  handleViewPhotos(e, space.photos, index);
                                }}
                              />
                            </div>

                            {/* Center Info */}
                            <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
                              <div>
                                <div className="flex items-start justify-between gap-1">
                                  <h4 className="font-black text-slate-900 text-base leading-tight truncate">
                                    {space.parkingType === "both" ? "Car & Bike" : space.serviceName || `${space.parkingType.charAt(0).toUpperCase()}${space.parkingType.slice(1)} Parking`}
                                  </h4>
                                  <button
                                    type="button"
                                    onClick={(e) => toggleFavourite(e, space.id)}
                                    className="w-7 h-7 rounded-full bg-slate-50 hover:bg-rose-50 border border-slate-100 flex items-center justify-center transition-all active:scale-90 shrink-0 cursor-pointer"
                                    title={favourites.includes(space.id) ? "Remove from Favourites" : "Add to Favourites"}
                                  >
                                    <Heart
                                      size={14}
                                      className={favourites.includes(space.id) ? "text-rose-500 fill-rose-500" : "text-slate-400 hover:text-rose-500"}
                                    />
                                  </button>
                                </div>

                                <div className="mt-1">
                                  <span className="bg-emerald-50 text-emerald-800 border border-emerald-300 text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider inline-flex items-center gap-1">
                                    <Navigation size={9} className="fill-emerald-600 text-emerald-600" /> BY SPOTLY (PUBLIC ROADSIDE)
                                  </span>
                                </div>

                                <div className="flex items-center gap-1 mt-1 text-[11px] text-emerald-800 font-semibold truncate">
                                  <Sparkles size={11} className="text-emerald-600 shrink-0" />
                                  <span>Uploaded by <strong className="text-emerald-950 font-extrabold">Spotly Team</strong></span>
                                </div>

                                <div className="flex items-center gap-1 mt-1 text-[11px] text-slate-500">
                                  <MapPin size={11} className="text-[#241e98] shrink-0" />
                                  <span className="truncate">{space.location?.split(",").slice(0, 2).join(",").trim() || "Location"}</span>
                                </div>
                              </div>

                              {/* KM distance label (no rating) */}
                              {distanceText && (
                                <div className="mt-1.5">
                                  <span className="bg-amber-50 text-amber-700 border border-amber-200/80 font-bold text-[10px] px-2 py-0.5 rounded-full inline-flex items-center gap-1">
                                    <Navigation size={9} className="text-amber-600 fill-amber-600" />
                                    <span>{distanceText}</span>
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Action Row */}
                          <div className="mt-3 pt-2.5 border-t border-emerald-100 flex items-center justify-between gap-3">
                            <div className="flex items-center gap-2 min-w-0">
                              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-600 via-teal-600 to-emerald-700 text-white font-black flex items-center justify-center text-xs shadow-sm shrink-0">
                                <Navigation size={14} className="fill-white" />
                              </div>
                              <div className="min-w-0">
                                <p className="text-[11px] font-extrabold text-emerald-950 leading-tight">By Spotly</p>
                                <p className="text-[9px] text-emerald-700 font-bold flex items-center gap-0.5">
                                  Verified Public Spot <CheckCircle size={8} className="fill-emerald-500 text-white" />
                                </p>
                              </div>
                            </div>

                            <div className="shrink-0 flex flex-col items-end">
                              <button
                                type="button"
                                onClick={(e) => openDirections(e, space)}
                                className={`py-2 px-3.5 ${
                                  spotlyDirectionConfig.paidEnabled && !hasSpotlyPass && !isPremium
                                    ? "bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-500 text-amber-950 shadow-md shadow-amber-500/20 border border-amber-400/80"
                                    : "bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white shadow-md shadow-emerald-700/20"
                                } text-xs font-black rounded-xl transition-all cursor-pointer flex items-center gap-1.5 active:scale-95`}
                                data-testid="button-directions-spotly-mobile"
                              >
                                {spotlyDirectionConfig.paidEnabled && !hasSpotlyPass && !isPremium ? (
                                  <>
                                    <Lock size={12} className="text-amber-950" />
                                    <span>Get Directions (₹{spotlyDirectionConfig.yearlyPrice}/yr)</span>
                                  </>
                                ) : (
                                  <>
                                    <Navigation size={12} className="fill-white" />
                                    <span>Get Directions</span>
                                  </>
                                )}
                              </button>
                              <span className="text-[9px] text-slate-400 mt-1 font-medium">
                                {spotlyDirectionConfig.paidEnabled && !hasSpotlyPass && !isPremium
                                  ? "Yearly Subscription Only • Unlimited GPS for 365 days"
                                  : isPremium
                                    ? "Included Free with Subscription • Unlimited GPS"
                                    : hasSpotlyPass
                                      ? "Annual Pass Active • Unlimited GPS"
                                      : "Free public spot • No booking needed"}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    }

                    return (
                      <div
                        key={space.id}
                        id={`card-space-${space.id}`}
                        onClick={() => handleSpaceClick(space)}
                        className="w-full rounded-[26px] p-4 transition-all duration-300 relative cursor-pointer group bg-white border border-slate-100/90 shadow-xl shadow-[#241e98]/5 hover:shadow-2xl hover:border-indigo-100"
                        data-testid={`card-space-${space.id}`}
                      >
                        {highlightedSpaceId === space.id && (
                          <svg className="absolute inset-0 w-full h-full pointer-events-none z-50 rounded-[26px]" viewBox="0 0 100 100" preserveAspectRatio="none">
                            <rect
                              x="0.5"
                              y="0.5"
                              width="99"
                              height="99"
                              rx="4.5"
                              ry="4.5"
                              fill="none"
                              stroke="#241e98"
                              strokeWidth="1.5px"
                              vectorEffect="non-scaling-stroke"
                              pathLength="100"
                              className="animate-clockwise-border"
                            />
                          </svg>
                        )}

                        {/* Top Main Info Section */}
                        <div className="flex gap-3.5 items-stretch">
                          {/* Image Thumbnail */}
                          <div
                            className="relative w-[105px] h-[105px] sm:w-[120px] sm:h-[120px] rounded-[22px] overflow-hidden shrink-0 shadow-sm bg-slate-100"
                            data-testid={`button-avatar-${space.id}`}
                          >
                            <MobileCardImageSlider
                              photos={space.photos}
                              serviceName={space.serviceName}
                              parkingType={space.parkingType}
                              isSpotlyUploaded={false}
                              isPremium={isPremium}
                              isRevealed={isRevealed}
                              onOpenPhotos={(e, index) => {
                                e.stopPropagation();
                                vibrate();
                                if (space.photos.length === 0) return;
                                if (!requireLogin("view photos")) return;
                                if (!isPremium && !revealedContacts.has(space.id)) {
                                  setShowSubscriptionPopup(true);
                                  return;
                                }
                                handleViewPhotos(e, space.photos, index);
                              }}
                            />
                          </div>

                          {/* Right Details Panel */}
                          <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
                            {/* Title & Favourite */}
                            <div>
                              <div className="flex items-start justify-between gap-1">
                                <div className="flex items-center gap-1.5 min-w-0 flex-wrap">
                                  <h4 className="font-black text-slate-900 text-lg leading-snug truncate">
                                    {space.parkingType === "both" ? "Car & Bike" : space.serviceName || `${space.parkingType.charAt(0).toUpperCase()}${space.parkingType.slice(1)} Parking`}
                                  </h4>
                                  {isRevealed && (
                                    <span className="bg-emerald-600 text-white text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider shrink-0 flex items-center gap-1 shadow-2xs" data-testid={`badge-viewed-contact-${space.id}`}>
                                      <Check size={10} className="stroke-[3]" /> VIEWED
                                    </span>
                                  )}
                                </div>
                                <button
                                  type="button"
                                  onClick={(e) => toggleFavourite(e, space.id)}
                                  className="w-8 h-8 rounded-full bg-slate-50 hover:bg-rose-50 border border-slate-100 flex items-center justify-center transition-all active:scale-90 shrink-0"
                                  data-testid={`button-favourite-${space.id}`}
                                  title={favourites.includes(space.id) ? "Remove from Favourites" : "Add to Favourites"}
                                >
                                  <Heart
                                    size={16}
                                    className={favourites.includes(space.id) ? "text-rose-500 fill-rose-500" : "text-slate-400 hover:text-rose-500"}
                                  />
                                </button>
                              </div>

                              {/* Subtitle / Owner & Vehicle Pill */}
                              <div className="flex items-center gap-1.5 mt-0.5 text-xs text-slate-500 font-medium truncate flex-wrap">
                                <span className="flex items-center gap-1 text-slate-600 truncate">
                                  <User size={12} className="text-[#241e98] shrink-0" /> by <strong className="text-slate-800 font-semibold">{space.ownerName}</strong>
                                </span>
                                {space.vehicleSize && (
                                  <>
                                    <span className="text-slate-300">|</span>
                                    <span className="bg-purple-50 text-purple-700 border border-purple-100/80 text-[11px] font-bold px-2 py-0.5 rounded-md">
                                      {space.vehicleSize}
                                    </span>
                                  </>
                                )}
                              </div>
                            </div>

                            {/* Rating Row */}
                            <div className="flex items-center gap-1 mt-1 text-xs">
                              <Star size={13} className="text-amber-500 fill-amber-500 shrink-0" />
                              <span className="font-black text-slate-800">{spaceRating}</span>
                              <span className="text-slate-400 font-normal text-[11px]">({spaceReviews} Reviews)</span>
                            </div>

                            {/* Price & Distance */}
                            <div className="flex items-center justify-between mt-1 pt-1 border-t border-dashed border-slate-100 gap-2 flex-nowrap">
                              {!space.isPriceHidden && space.rent && space.rent > 0 ? (
                                <div className="flex items-baseline gap-0.5 whitespace-nowrap shrink-0">
                                  <span className="font-black text-xl text-[#241e98] tracking-tight">₹{space.rent}</span>
                                  <span className="text-xs text-slate-400 font-normal">/{space.rentUnit || "month"}</span>
                                </div>
                              ) : (
                                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 font-bold text-xs border border-slate-200/90 whitespace-nowrap shrink-0 shadow-2xs">
                                  <EyeOff size={12} className="text-slate-500 shrink-0" />
                                  <span>Price Hidden</span>
                                </div>
                              )}
                              {distanceText && (
                                <span className="bg-amber-50 text-amber-700 border border-amber-200/70 font-extrabold text-[11px] px-2.5 py-1 rounded-full inline-flex items-center gap-1 shadow-2xs whitespace-nowrap shrink-0">
                                  <Navigation size={10} className="text-amber-600 fill-amber-600 animate-pulse shrink-0" />
                                  <span>{distanceText}</span>
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Date/Time row — shown above address when applicable */}
                        {(space.dateText || space.timeText) && (
                          <div className="flex items-center gap-1.5 mt-2 mb-1 flex-wrap">
                            {space.dateText && (
                              <span className="flex items-center gap-1 bg-slate-50 border border-slate-200 text-slate-600 text-[11px] font-bold px-2 py-1 rounded-full">
                                📆 {new Date(space.dateText).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                              </span>
                            )}
                            {space.timeText && (
                              <span className="flex items-center gap-1 bg-slate-50 border border-slate-200 text-slate-600 text-[11px] font-bold px-2 py-1 rounded-full">
                                ⏰ {space.timeText}{space.endTimeText ? ` → ${space.endTimeText}` : ""}
                              </span>
                            )}
                          </div>
                        )}

                        {/* Location Address Line */}
                        <div className="mt-2.5 mb-2.5">
                          {isPremium || revealedContacts.has(space.id) ? (
                            <div className="w-full flex items-center gap-2 px-4 py-2 bg-emerald-50/70 border border-emerald-200/60 rounded-full text-emerald-900 font-extrabold text-xs shadow-2xs" data-testid={`text-address-${space.id}`}>
                              <MapPin size={15} className="text-emerald-700 shrink-0" />
                              <span className="truncate">{space.location}</span>
                            </div>
                          ) : (
                            <button
                              onClick={(e) => { e.stopPropagation(); vibrate(); if (!requireLogin("subscribe to Premium")) return; setShowSubscriptionPopup(true); }}
                              className="w-full flex items-center gap-2 px-4 py-2 bg-slate-50 border border-slate-200/80 rounded-full text-slate-700 font-bold text-xs hover:bg-slate-100 transition-colors"
                              data-testid={`button-location-premium-${space.id}`}
                            >
                              <MapPin size={14} className="text-slate-500 shrink-0" />
                              <span className="truncate">{space.location.split(",")[0]}, Near... (Unlock full location with Premium)</span>
                              <Crown size={13} className="text-amber-500 ml-auto shrink-0" />
                            </button>
                          )}
                        </div>

                        {/* Bottom Action Bar */}
                        <div>
                          {isRevealed ? (
                            <div className="flex items-center justify-between bg-slate-50 border border-slate-200/80 p-1.5 px-3 rounded-full animate-contact-reveal">
                              <a
                                href={`tel:+91${rawPhone}`}
                                onClick={(e) => e.stopPropagation()}
                                className="flex items-center gap-2.5 pl-0.5 group/call no-underline hover:no-underline"
                                data-testid={`link-phone-call-${space.id}`}
                              >
                                <div className="w-9 h-9 rounded-full bg-[#00a86b] group-hover/call:bg-[#008f5b] flex items-center justify-center text-white shadow-sm transition-transform active:scale-95">
                                  <Phone size={16} />
                                </div>
                                <span className="font-black text-sm text-slate-900 tracking-wide no-underline hover:no-underline" data-testid={`text-phone-${space.id}`}>
                                  {formatIndianPhone(space.ownerPhone)}
                                </span>
                              </a>

                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={(e) => openDirections(e, space)}
                                  className="w-9 h-9 rounded-full bg-[#241e98] hover:bg-[#1b1675] flex items-center justify-center transition-transform active:scale-95 text-white shadow-md shadow-[#241e98]/20 cursor-pointer"
                                  data-testid={`button-directions-${space.id}`}
                                  title="Open in Maps"
                                >
                                  <MapPin size={16} />
                                </button>
                                <button
                                  type="button"
                                  onClick={(e) => openWhatsApp(e, space.ownerPhone)}
                                  className="w-9 h-9 rounded-full bg-[#25d366] hover:bg-emerald-600 flex items-center justify-center transition-transform active:scale-95 text-white shadow-md shadow-emerald-500/20 cursor-pointer"
                                  data-testid={`button-whatsapp-${space.id}`}
                                  title="Open WhatsApp"
                                >
                                  <MessageCircle size={16} />
                                </button>
                              </div>
                            </div>
                          ) : (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                vibrate();
                                if (revealingContactId === space.id) return;
                                if (!requireLogin("view contact details")) return;
                                handleViewContactForSpace(space.id);
                              }}
                              disabled={revealingContactId === space.id}
                              className="w-full flex items-center justify-center gap-2.5 py-3.5 px-4 rounded-full text-sm font-extrabold bg-gradient-to-r from-[#241e98] via-[#2b24b1] to-[#3e3ab3] hover:from-[#1b1778] hover:to-[#2e2a97] text-white transition-all shadow-xl shadow-[#241e98]/30 active:scale-[0.98] disabled:opacity-85"
                              data-testid={`button-view-contacts-${space.id}`}
                            >
                              {revealingContactId === space.id ? (
                                <>
                                  <Loader2 size={18} className="animate-spin text-white" />
                                  <span>Revealing Contact...</span>
                                </>
                              ) : (
                                <>
                                  <Eye size={18} className="text-white" />
                                  <span>View Contact Info</span>
                                </>
                              )}
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}

                  {parkingSpaces.length > 0 && parkingSpaces.length < totalSpaces && (
                    <div className="flex flex-col items-center gap-2 py-5">
                      <p className="text-xs text-neutral-400">
                        Showing {parkingSpaces.length} of {totalSpaces} spaces
                      </p>
                      <button
                        onClick={() => { vibrate(); loadMoreSpaces(); }}
                        disabled={isLoadingMore}
                        className="flex items-center gap-2.5 px-7 py-3 bg-gradient-to-r from-[#1b1675] via-[#241e98] to-[#3e3ab3] text-white text-sm font-bold rounded-full shadow-xl shadow-[#241e98]/25 active:scale-95 transition-all disabled:opacity-60"
                        data-testid="button-load-more"
                      >
                        {isLoadingMore ? (
                          <>
                            <Loader2 size={16} className="animate-spin" />
                            Loading more spaces...
                          </>
                        ) : (
                          <>
                            <ParkingCircle size={16} />
                            Load More Spaces
                            <ChevronDown size={14} />
                          </>
                        )}
                      </button>
                    </div>
                  )}
                  {/* Roadside Parking Seeker Disclaimer Banner at bottom of list */}
                  {uploaderFilter === "spotly" && filteredSpaces.length > 0 && !isLoading && (
                    <div className="mt-4 p-4 rounded-2xl bg-gradient-to-r from-amber-50 via-yellow-50 to-amber-50 border border-amber-300 text-amber-950 shadow-sm flex items-start gap-3 col-span-full">
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
                </div>
              )}
            </div>
          </div>
        </MobileLayout>
      </div>

      {/* ===== SHARED MODALS & OVERLAYS (visible on both mobile & desktop) ===== */}
      <AnimatePresence>
        {/* Subscription Plans Popup */}
        {showSubscriptionPopup && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] bg-black/50 flex items-center justify-center px-6"
            onClick={() => { setShowSubscriptionPopup(false); setChoosePlan(null); }}
          >
            <motion.div
              initial={{ scale: 0.85, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.85, opacity: 0 }}
              className="bg-white rounded-3xl p-6 text-center shadow-2xl max-w-sm w-full"
              onClick={(e) => e.stopPropagation()}
            >
              {freeAccessMode ? (
                /* ── Free Access Mode UI ── */
                <>
                  <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-3">
                    <Gift size={32} className="text-emerald-600" />
                  </div>
                  <h3 className="text-[19px] font-bold text-neutral-900 mb-1">🎉 Free Access Available!</h3>
                  <p className="text-neutral-500 text-[13px] mb-4">Great news! The admin has enabled free access. View all owner contacts without any subscription.</p>

                  <div className="p-4 bg-emerald-50 border-2 border-emerald-200 rounded-2xl mb-4 text-left">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider">Free Plan Details</span>
                    </div>
                    <div className="space-y-1.5 text-xs text-emerald-900">
                      <div className="flex justify-between"><span className="text-emerald-700">Plan Type</span><span className="font-bold">Free Access</span></div>
                      <div className="flex justify-between"><span className="text-emerald-700">Price</span><span className="font-bold text-emerald-600">₹0 (Free)</span></div>
                      <div className="flex justify-between"><span className="text-emerald-700">Contact Views</span><span className="font-bold">Unlimited</span></div>
                      <div className="flex justify-between"><span className="text-emerald-700">Validity</span><span className="font-bold">365 days</span></div>
                    </div>
                  </div>

                  <div>
                    <button
                      onClick={() => { vibrate(); handleActivateFreeAccess(); }}
                      disabled={isActivatingFreeAccess}
                      className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white text-[15px] font-bold rounded-2xl shadow-lg shadow-emerald-200 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                      data-testid="button-activate-free-access"
                    >
                      {isActivatingFreeAccess ? (
                        <Loader2 size={16} className="animate-spin" />
                      ) : (
                        <Gift size={16} />
                      )}
                      {isActivatingFreeAccess ? "Activating..." : "Get Instant Access"}
                    </button>
                  </div>
                </>
              ) : isNativeApp() ? (
                /* ── Mobile App (WebView): Google Play Billing plan picker ── */
                <>
                  {/* Lock icon header */}
                  <div className="w-16 h-16 rounded-full bg-indigo-100 flex items-center justify-center mx-auto mb-3">
                    <span className="text-3xl">🔒</span>
                  </div>
                  <h3 className="text-[19px] font-bold text-neutral-900 mb-1">Subscribe to View Contacts</h3>
                  <p className="text-neutral-500 text-[13px] mb-4">Choose a plan</p>

                  {/* Plan cards — no price shown, Google injects price in billing popup */}
                  <div className="space-y-2.5 text-left">
                    {plans.map((plan) => {
                      // Dynamic values from admin settings
                      const contactLabel =
                        plan.views === -1
                          ? "Unlimited contacts"
                          : `${plan.views} contact${plan.views !== 1 ? "s" : ""}`;
                      const dayLabel = `${plan.validity} day${plan.validity !== 1 ? "s" : ""}`;
                      return (
                        <button
                          key={plan.key}
                          onClick={() => { vibrate(); setChoosePlan(plan.key); }}
                          className={`w-full flex items-center justify-between rounded-2xl px-4 py-3.5 transition-all active:scale-[0.98] relative border-2 ${choosePlan === plan.key
                              ? plan.key === "premium"
                                ? "border-yellow-400 bg-yellow-50"
                                : plan.key === "standard"
                                  ? "border-primary bg-blue-50"
                                  : "border-blue-400 bg-blue-50/40"
                              : plan.key === "premium"
                                ? "border-yellow-200 bg-yellow-50/30 hover:border-yellow-400"
                                : plan.key === "standard"
                                  ? "border-indigo-200 bg-blue-50/20 hover:border-primary"
                                  : "border-neutral-200 bg-white hover:border-blue-300"
                            }`}
                          data-testid={`plan-native-${plan.key}`}
                        >
                          {plan.key === "standard" && !choosePlan && (
                            <div className="absolute -top-2.5 right-3 bg-primary text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm">
                              Popular
                            </div>
                          )}
                          {choosePlan === plan.key && (
                            <div className="absolute -top-2.5 right-3 bg-green-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 shadow-sm">
                              <Check size={10} /> Selected
                            </div>
                          )}
                          <div className="flex items-center gap-3">
                            {plan.key === "basic" ? (
                              <Shield className="w-5 h-5 text-blue-500 shrink-0" />
                            ) : plan.key === "standard" ? (
                              <Zap className="w-5 h-5 text-primary shrink-0" />
                            ) : (
                              <Crown className="w-5 h-5 text-yellow-500 shrink-0" />
                            )}
                            <div className="text-left">
                              <span className="text-[16px] font-bold block text-neutral-900 leading-tight">{plan.name}</span>
                              <span className="text-[13px] font-normal text-neutral-500 block mt-0.5">
                                {contactLabel} • {dayLabel}
                              </span>
                            </div>
                          </div>
                          {/* No price shown — Google Play Billing popup injects the price */}
                          {choosePlan === plan.key && (
                            <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center shrink-0">
                              <Check size={12} className="text-white" />
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>

                  {/* Continue button — triggers Play Billing popup */}
                  <button
                    onClick={() => {
                      vibrate();
                      const plan = plans.find(p => p.key === choosePlan);
                      if (plan) handleNativeAppPurchase(plan);
                    }}
                    disabled={!choosePlan}
                    className="w-full mt-5 py-3.5 bg-primary hover:bg-primary/90 text-white text-[15px] font-bold rounded-2xl shadow-lg shadow-primary/30 transition-colors disabled:opacity-40 flex items-center justify-center gap-2"
                    data-testid="button-subscribe-submit-app"
                  >
                    Continue
                  </button>

                  {/* Maybe Later — subtle text link below */}
                  <button
                    onClick={() => { setShowSubscriptionPopup(false); setChoosePlan(null); }}
                    className="w-full mt-3 py-2 text-neutral-400 text-[14px] font-medium hover:text-neutral-600 transition-colors"
                    data-testid="button-close-subscription-app"
                  >
                    Maybe Later
                  </button>
                </>

              ) : (
                /* ── Browser: full subscription plan picker ── */
                <>
                  <div className="w-16 h-16 rounded-full bg-yellow-100 flex items-center justify-center mx-auto mb-4">
                    <Crown size={32} className="text-yellow-500" />
                  </div>
                  <h3 className="text-[19px] font-bold text-neutral-900 mb-1">Subscribe to View</h3>
                  <p className="text-neutral-500 text-[13px] mb-5">Choose a plan to view owner contact details</p>

                  <div className="space-y-2.5 text-left">
                    {plans.map((plan) => (
                      <button
                        key={plan.key}
                        onClick={() => { vibrate(); setChoosePlan(plan.key); }}
                        className={`w-full flex items-center justify-between rounded-xl px-4 py-3 transition-all active:scale-[0.98] relative ${plan.key === "standard"
                            ? "border border-primary/40 bg-blue-50/40 hover:border-primary"
                            : plan.key === "premium"
                              ? "border border-yellow-300 bg-yellow-50/50 hover:border-yellow-400"
                              : "border border-neutral-200 bg-white hover:border-primary/50"
                          }`}
                        data-testid={`plan-${plan.key}`}
                      >
                        {plan.key === "standard" && !choosePlan && (
                          <div className="absolute -top-2 right-3 bg-primary text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                            Popular
                          </div>
                        )}
                        {choosePlan === plan.key && (
                          <div className="absolute -top-2 right-3 bg-green-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                            <Check size={10} /> Selected
                          </div>
                        )}
                        <div className="flex items-center gap-2.5">
                          {plan.key === "basic" ? (
                            <Shield className="w-5 h-5 text-blue-500" />
                          ) : plan.key === "standard" ? (
                            <Zap className="w-5 h-5 text-primary" />
                          ) : (
                            <Crown className="w-5 h-5 text-yellow-500" />
                          )}
                          <div className="text-left">
                            <span className="text-[16px] font-bold block text-neutral-900 leading-tight">{plan.name}</span>
                            <span className="text-[13.5px] font-normal text-neutral-400 block mt-0.5">
                              {plan.views === -1 ? "Unlimited views" : `${plan.views} views`} • {plan.validity} days validity
                            </span>
                          </div>
                        </div>
                        <span className="text-base font-extrabold text-primary">₹{plan.price}</span>
                      </button>
                    ))}
                  </div>

                  <div className="flex gap-3 mt-5">
                    <button
                      onClick={() => { setShowSubscriptionPopup(false); setChoosePlan(null); }}
                      className="flex-1 py-3 bg-neutral-100 text-neutral-700 text-[15px] font-bold rounded-2xl hover:bg-neutral-200 transition-colors"
                      data-testid="button-close-subscription"
                    >
                      Maybe Later
                    </button>
                    <button
                      onClick={() => {
                        vibrate();
                        const plan = plans.find(p => p.key === choosePlan);
                        if (plan) handleSelectPlan(plan);
                      }}
                      disabled={!choosePlan}
                      className="flex-1 py-3 bg-primary hover:bg-primary/90 text-white text-[15px] font-bold rounded-2xl shadow-lg shadow-primary/30 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                      data-testid="button-subscribe-submit"
                    >
                      <Crown size={16} />
                      Subscribe
                    </button>
                  </div>
                </>
              )}
            </motion.div>
          </motion.div>
        )}

        {/* Payment Processing Popup */}
        {showPaymentProcessing && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] bg-black/50 flex items-center justify-center px-6"
          >
            <motion.div
              initial={{ scale: 0.85, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.85, opacity: 0 }}
              className="bg-white rounded-3xl p-6 text-center shadow-2xl max-w-sm w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-4 animate-pulse">
                <Loader2 className="w-8 h-8 text-primary animate-spin" />
              </div>
              <h3 className="text-lg font-bold text-neutral-900 mb-2">Processing Payment</h3>
              <p className="text-neutral-500 text-xs">
                Please wait while we process your ₹{selectedPlan?.price} payment for {selectedPlan?.name} plan...
              </p>
            </motion.div>
          </motion.div>
        )}

        {/* Payment Success Popup */}
        {showPaymentSuccess && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] bg-black/50 flex items-center justify-center px-6"
            onClick={() => setShowPaymentSuccess(false)}
          >
            <motion.div
              initial={{ scale: 0.85, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.85, opacity: 0 }}
              className="bg-white rounded-3xl p-6 text-center shadow-2xl max-w-sm w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                <Check className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-lg font-bold text-neutral-900 mb-1">Payment Successful!</h3>
              <p className="text-neutral-500 text-xs mb-4">
                You are now a <span className="font-bold text-primary capitalize">{selectedPlan?.name}</span> member!
              </p>

              <div className="w-full bg-blue-50 rounded-xl p-3 space-y-2 text-left">
                <div className="flex justify-between text-xs">
                  <span className="text-neutral-500">Plan</span>
                  <span className="font-semibold capitalize">{selectedPlan?.name}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-neutral-500">Amount Paid</span>
                  <span className="font-semibold">₹{selectedPlan?.price}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-neutral-500">Views</span>
                  <span className="font-semibold">{selectedPlan?.views === -1 ? "Unlimited" : selectedPlan?.views}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-neutral-500">Valid For</span>
                  <span className="font-semibold">30 days</span>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* Simple Clean Success Notification for Free Access */}
        <AnimatePresence>
          {showConfetti && (
            <motion.div
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              className="fixed top-8 inset-x-0 z-[100] flex items-center justify-center pointer-events-none px-4"
            >
              <div className="bg-slate-900/95 backdrop-blur-md text-white px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-3 border border-emerald-500/40">
                <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center shrink-0 shadow-md">
                  <Check size={18} className="text-white stroke-[3]" />
                </div>
                <div>
                  <p className="text-sm font-bold text-white leading-tight">Free Access Activated!</p>
                  <p className="text-[11px] text-emerald-400 font-medium leading-tight mt-0.5">All contacts unlocked</p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Premium Details Popup */}
        {showPremiumDetails && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] bg-black/50 flex items-center justify-center px-6"
            onClick={() => setShowPremiumDetails(false)}
          >
            <motion.div
              initial={{ scale: 0.85, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.85, opacity: 0 }}
              className="bg-white rounded-3xl p-6 text-center shadow-2xl max-w-sm w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="w-16 h-16 rounded-full bg-yellow-100 flex items-center justify-center mx-auto mb-4">
                <Crown size={32} className="text-yellow-500" />
              </div>
              <h3 className="text-lg font-bold text-neutral-900 mb-4">Your Premium Plan</h3>

              <div className="bg-gradient-to-br from-blue-50 to-yellow-50 rounded-xl p-4 space-y-3 text-left">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-neutral-500">Plan</span>
                  <span className="text-sm font-bold capitalize flex items-center gap-1">
                    {premiumPlan === "basic" && <Shield className="w-4 h-4 text-blue-500" />}
                    {premiumPlan === "standard" && <Zap className="w-4 h-4 text-primary" />}
                    {premiumPlan === "premium" && <Crown className="w-4 h-4 text-yellow-500" />}
                    {premiumPlan}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-neutral-500">Views Remaining</span>
                  <span className="text-sm font-bold">
                    {(() => {
                      const currentPlanObj = plans.find(p => p.key === premiumPlan);
                      const totalViews = currentPlanObj ? currentPlanObj.views : (premiumPlan === "basic" ? 10 : 20);
                      return totalViews === -1 ? "Unlimited" : `${premiumViewsRemaining}/${totalViews}`;
                    })()}
                  </span>
                </div>
                {premiumExpiresAt && (
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-neutral-500">Expires</span>
                    <span className="text-sm font-bold">
                      {new Date(premiumExpiresAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                    </span>
                  </div>
                )}

                <div className="pt-2 border-t border-indigo-100 flex items-center gap-2 text-[11px] text-emerald-800 font-semibold bg-emerald-50/70 p-2 rounded-lg">
                  <CheckCircle size={14} className="text-emerald-600 shrink-0" />
                  <span>Unlimited FREE access to all By Spotly roadside parking &amp; GPS</span>
                </div>
              </div>

              <div className="flex gap-3 mt-5">
                <button
                  onClick={() => setShowPremiumDetails(false)}
                  className="flex-1 py-3 bg-neutral-100 text-neutral-700 font-bold rounded-2xl hover:bg-neutral-200 transition-colors"
                  data-testid="button-close-premium-details"
                >
                  Close
                </button>
                {premiumPlan !== "premium" && premiumViewsRemaining <= 3 && (
                  <button
                    onClick={() => { setShowPremiumDetails(false); setShowSubscriptionPopup(true); }}
                    className="flex-1 py-3 bg-primary hover:bg-primary/90 text-white font-bold rounded-2xl shadow-lg shadow-primary/30 transition-colors flex items-center justify-center gap-2"
                    data-testid="button-upgrade-plan"
                  >
                    <Zap size={16} />
                    Upgrade
                  </button>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* Photo Viewer Popup */}
        {showPhotoViewer && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] bg-black/90 flex items-center justify-center px-4"
            onClick={() => setShowPhotoViewer(false)}
          >
            <motion.div
              initial={{ scale: 0.85, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.85, opacity: 0 }}
              className="bg-black/95 rounded-3xl overflow-hidden shadow-2xl max-w-md w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="relative">
                <button
                  onClick={() => setShowPhotoViewer(false)}
                  className="absolute top-3 right-3 z-20 w-9 h-9 bg-black/50 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-black/70 transition-colors"
                  data-testid="button-close-photos"
                >
                  <X size={18} />
                </button>

                <div className="relative w-full aspect-square bg-black flex items-center justify-center">
                  {viewingPhotos.length > 0 && (
                    <img
                      src={viewingPhotos[activePhotoIndex]}
                      alt={`Photo ${activePhotoIndex + 1}`}
                      className="w-full h-full object-contain"
                    />
                  )}

                  {viewingPhotos.length > 1 && (
                    <>
                      <button
                        onClick={() => setActivePhotoIndex((prev) => (prev - 1 + viewingPhotos.length) % viewingPhotos.length)}
                        className="absolute left-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-black/50 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-black/70 transition-colors"
                        data-testid="button-photo-prev"
                      >
                        <ChevronLeft size={20} />
                      </button>
                      <button
                        onClick={() => setActivePhotoIndex((prev) => (prev + 1) % viewingPhotos.length)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-black/50 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-black/70 transition-colors"
                        data-testid="button-photo-next"
                      >
                        <ChevronRight size={20} />
                      </button>
                    </>
                  )}
                </div>

                <div className="bg-black/80 px-4 py-3 flex items-center justify-center gap-2">
                  {viewingPhotos.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setActivePhotoIndex(index)}
                      className={`w-2.5 h-2.5 rounded-full transition-all ${index === activePhotoIndex ? "bg-white scale-110" : "bg-white/30"}`}
                      data-testid={`button-photo-dot-${index}`}
                    />
                  ))}
                  <span className="text-white/60 text-xs ml-2">{activePhotoIndex + 1}/{viewingPhotos.length}</span>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* Help & Support Popup */}
        {showSupportPopup && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] bg-black/50 flex items-center justify-center px-6"
            onClick={() => setShowSupportPopup(false)}
          >
            <motion.div
              initial={{ scale: 0.85, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.85, opacity: 0 }}
              className="bg-white rounded-3xl p-6 text-center shadow-2xl max-w-sm w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="w-16 h-16 rounded-full bg-indigo-50 flex items-center justify-center mx-auto mb-4 text-[#241e98]">
                <Phone size={32} />
              </div>
              <h3 className="text-lg font-bold text-neutral-900 mb-1">Help & Support</h3>
              <p className="text-neutral-500 text-xs mb-5">We're here to help!</p>

              <div className="space-y-2 text-left">
                <a
                  href={`tel:${supportPhone.replace(/\s/g, '')}`}
                  className="flex items-center gap-3 p-3 bg-emerald-50 rounded-2xl hover:bg-emerald-100/70 border border-emerald-100 transition-colors no-underline"
                  data-testid="link-call-support-worker"
                >
                  <div className="w-9 h-9 bg-emerald-500 rounded-full flex items-center justify-center">
                    <Phone className="w-4 h-4 text-white" />
                  </div>
                  <div className="text-left">
                    <p className="font-semibold text-neutral-900 text-sm">Call Us</p>
                    <p className="text-xs text-neutral-600">{supportPhone}</p>
                  </div>
                </a>
                <a
                  href={`mailto:${supportEmail}`}
                  className="flex items-center gap-3 p-3 bg-indigo-50/70 rounded-2xl hover:bg-indigo-100/70 border border-indigo-100 transition-colors no-underline"
                  data-testid="link-email-support-worker"
                >
                  <div className="w-9 h-9 bg-gradient-to-br from-[#1b1675] via-[#241e98] to-[#3e3ab3] rounded-full flex items-center justify-center">
                    <Mail className="w-4 h-4 text-white" />
                  </div>
                  <div className="text-left">
                    <p className="font-semibold text-neutral-900 text-sm">Email Us</p>
                    <p className="text-xs text-neutral-600">{supportEmail}</p>
                  </div>
                </a>
              </div>

              <button
                onClick={() => setShowSupportPopup(false)}
                className="mt-5 w-full py-3.5 bg-gradient-to-r from-[#1b1675] via-[#241e98] to-[#3e3ab3] hover:from-[#15115c] hover:to-[#1b1675] text-white font-extrabold text-sm rounded-2xl shadow-xl shadow-[#241e98]/30 active:scale-95 transition-all cursor-pointer"
                data-testid="button-close-support-worker"
              >
                Close
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Notifications Sheet */}
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
          if (notification.bookingId) {
            const newUrl = `/space-seeker/home?highlight=${notification.bookingId}`;
            if (window.location.pathname === "/space-seeker/home") {
              window.history.pushState({}, document.title, newUrl);
              setHasProcessedHighlight(null);
            } else {
              window.location.href = newUrl;
            }
          }
        }}
      />
      <LocationSync onLocationUpdated={handleLocationSyncUpdated} />

      <StateSelectorModal
        isOpen={showCitySelector}
        onClose={() => setShowCitySelector(false)}
        displayCities={displayCities}
        activeState={activeState}
        onSelectCity={(cityId) => handleCityChange(cityId)}
        subtitle="Choose a state where you'd like to find parking spaces"
      />

      {/* State Switch Preloader Overlay (Transparent with NO BLUR and single circular loader) */}
      <AnimatePresence>
        {isStateSwitching && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/20 select-none pointer-events-auto"
          >
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full border-[3.5px] border-white/30 border-t-[#241e98] border-r-[#3e3ab3] animate-spin drop-shadow-lg" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* ═══ PUBLIC ROADSIDE PARKING ALERT MODAL (ONCE PER DAY) ═══ */}
      <AnimatePresence>
        {showRoadsideAlertModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ duration: 0.18 }}
              className="w-full max-w-[340px] rounded-3xl bg-gradient-to-b from-amber-50 via-yellow-50 to-amber-100/80 border-2 border-amber-400 p-5 shadow-2xl relative overflow-hidden"
            >
              <div className="flex items-center gap-2.5 mb-2.5">
                <div className="w-9 h-9 rounded-2xl bg-amber-400 text-amber-950 flex items-center justify-center shadow-md shadow-amber-400/40 shrink-0">
                  <AlertTriangle size={18} className="stroke-[2.5]" />
                </div>
                <div>
                  <span className="text-[10px] font-black tracking-wider uppercase px-2 py-0.5 rounded-full bg-amber-200/80 text-amber-950 border border-amber-300">
                    Important Notice
                  </span>
                  <h3 className="text-sm font-black text-amber-950 mt-0.5 leading-tight">
                    Public Roadside Parking
                  </h3>
                </div>
              </div>

              <div className="space-y-2 text-xs text-amber-950/90 font-medium leading-relaxed bg-white/70 rounded-2xl p-3 border border-amber-200/60">
                <p>
                  You are browsing <strong>Spotly verified roadside parking spots</strong>. These are public street parking locations identified by Spotly for convenience.
                </p>
                <div className="space-y-1 text-[11px] text-amber-900">
                  <div className="flex items-start gap-1.5">
                    <span>•</span>
                    <span>Availability is first-come, first-served.</span>
                  </div>
                  <div className="flex items-start gap-1.5">
                    <span>•</span>
                    <span>Check municipal parking boards &amp; rules on-site.</span>
                  </div>
                  <div className="flex items-start gap-1.5">
                    <span>•</span>
                    <span>Spotly is not liable for fines or vehicle security.</span>
                  </div>
                </div>
              </div>

              <div className="mt-4 flex">
                <button
                  type="button"
                  onClick={() => {
                    try {
                      localStorage.setItem(`spotly_roadside_alert_${new Date().toISOString().slice(0, 10)}`, "shown");
                    } catch (_) {}
                    setShowRoadsideAlertModal(false);
                  }}
                  className="w-full py-2.5 px-4 bg-gradient-to-r from-amber-400 via-amber-300 to-yellow-400 hover:from-amber-500 hover:to-yellow-500 text-amber-950 font-black rounded-xl shadow-lg shadow-amber-400/30 border-2 border-amber-400/80 active:scale-[0.98] transition-all cursor-pointer text-xs flex items-center justify-center gap-2"
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
              className="w-full max-w-[340px] rounded-2xl bg-white border border-emerald-200 overflow-hidden shadow-2xl relative"
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

const BengaluruIcon = ({ active }: { active: boolean }) => (
  <svg className={`w-12 h-12 ${active ? "text-emerald-500" : "text-gray-400"}`} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M 20 80 L 80 80 M 30 80 L 30 50 L 70 50 L 70 80 M 35 50 L 35 35 L 65 35 L 65 50" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M 42 35 Q 50 15 58 35 Z" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M 50 15 L 50 5" stroke="currentColor" strokeWidth="2.5" />
    <circle cx="50" cy="5" r="1.5" fill="currentColor" />
    <path d="M 15 80 L 15 65 L 25 65 L 25 80" stroke="currentColor" strokeWidth="2" />
    <path d="M 75 80 L 75 65 L 85 65 L 85 80" stroke="currentColor" strokeWidth="2" />
    <path d="M 40 80 L 40 60 M 50 80 L 50 60 M 60 80 L 60 60" stroke="currentColor" strokeWidth="1.5" />
  </svg>
);

const ChennaiIcon = ({ active }: { active: boolean }) => (
  <svg className={`w-12 h-12 ${active ? "text-emerald-500" : "text-gray-400"}`} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M 25 80 L 75 80 M 30 80 L 33 65 L 67 65 L 70 80 M 35 65 L 38 52 L 62 52 L 65 65 M 40 52 L 43 40 L 57 40 L 60 52 M 45 40 L 47 30 L 53 30 L 55 40" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M 47 30 L 50 25 L 53 30 Z" fill="currentColor" />
    <path d="M 33 80 L 33 72 L 40 72 L 40 80" stroke="currentColor" strokeWidth="1.5" />
    <path d="M 67 80 L 67 72 L 60 72 L 60 80" stroke="currentColor" strokeWidth="1.5" />
    <path d="M 46 80 L 46 70 C 46 67, 54 67, 54 70 L 54 80" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  </svg>
);
