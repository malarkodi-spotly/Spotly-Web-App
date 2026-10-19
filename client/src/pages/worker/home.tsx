import { useState, useEffect, useMemo, useRef } from "react";
import { useLocation } from "wouter";
import MobileLayout from "@/components/layout/mobile-layout";
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
  Gift,
} from "lucide-react";
import { vibrate } from "@/lib/vibrate";
import { isGuest } from "@/lib/guest";
import { useAuthGuard } from "@/contexts/auth-guard";
import { capitalizeName, getTimeGreeting } from "@/lib/utils";
import { triggerLocationPermissionError } from "@/lib/location-error";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { getApiUrl } from "@/lib/api-config";
import { Capacitor } from "@capacitor/core";
import { useScroll } from "@/contexts/scroll-context";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { NotificationSheet } from "@/components/notifications/notification-sheet";
import { useRegisterModalBack } from "@/contexts/mobile-back-context";

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
        <span className="text-[9px] font-black uppercase tracking-wider text-blue-100 mt-1 drop-shadow-xs">Bike Spot</span>
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
        <span className="text-[8px] font-black uppercase tracking-wider text-blue-100 mt-1 drop-shadow-xs">Car &amp; Bike</span>
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
      <span className="text-[9px] font-black uppercase tracking-wider text-blue-100 mt-1 drop-shadow-xs">Car Spot</span>
    </div>
  );
};

export default function WorkerHome() {
  const [, setLocation] = useLocation();
  const [userName, setUserName] = useState(localStorage.getItem("userName") || (localStorage.getItem("isGuest") === "true" ? "Guest User" : ""));
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
  const [spaceFilter, setSpaceFilter] = useState<"all" | "viewed" | "unviewed">("all");
  const [priceSort, setPriceSort] = useState<"none" | "asc" | "desc">("none");
  const [isSearching, setIsSearching] = useState(false);
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
  const [isLocationFiltering, setIsLocationFiltering] = useState(false);
  const filterTimerRef = useRef<NodeJS.Timeout | null>(null);

  const triggerLocationFiltering = (duration = 400) => {
    if (filterTimerRef.current) clearTimeout(filterTimerRef.current);
    setIsLocationFiltering(true);
    filterTimerRef.current = setTimeout(() => {
      setIsLocationFiltering(false);
    }, duration);
  };

  useEffect(() => {
    return () => {
      if (filterTimerRef.current) clearTimeout(filterTimerRef.current);
    };
  }, []);
  const [showPhotoViewer, setShowPhotoViewer] = useState(false);
  const [viewingPhotos, setViewingPhotos] = useState<string[]>([]);
  const [activePhotoIndex, setActivePhotoIndex] = useState(0);
  const [interestCounts, setInterestCounts] = useState<Record<string, number>>({});
  const [userInterests, setUserInterests] = useState<Set<string>>(new Set());
  const [interestLoading, setInterestLoading] = useState<string | null>(null);
  const [showSupportPopup, setShowSupportPopup] = useState(false);
  const [supportPhone, setSupportPhone] = useState("+91 63747 70456");
  const [supportEmail, setSupportEmail] = useState("info@spotlyindia.org");
  const [adVideoUrl, setAdVideoUrl] = useState("");
  const [adVideoEnabled, setAdVideoEnabled] = useState(true);
  const [comingSoonMode, setComingSoonMode] = useState<boolean>(false);

  // Register all modals/sheets with Android Back Button handler
  useRegisterModalBack(showSpaceDetail, () => setShowSpaceDetail(false), "worker-space-detail");
  useRegisterModalBack(showSubscriptionPopup, () => setShowSubscriptionPopup(false), "worker-subscription-popup");
  useRegisterModalBack(showPremiumDetails, () => setShowPremiumDetails(false), "worker-premium-details");
  useRegisterModalBack(showPhotoViewer, () => setShowPhotoViewer(false), "worker-photo-viewer");
  useRegisterModalBack(showSupportPopup, () => setShowSupportPopup(false), "worker-support-popup");
  useRegisterModalBack(showPaymentSuccess, () => setShowPaymentSuccess(false), "worker-payment-success");

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

  const calcDistance = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  };

  const isSameState = (spaceLocation: string): boolean => {
    const userState = (localStorage.getItem("workerState") || localStorage.getItem("userState") || "").trim().toLowerCase();
    if (!userState) return true;
    return spaceLocation.toLowerCase().includes(userState);
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
        () => {
          clearTimeout(fallbackTimer);
          setLocationReady(true);
        },
        { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 }
      );
    } else {
      clearTimeout(fallbackTimer);
      setLocationReady(true);
    }

    return () => clearTimeout(fallbackTimer);
  }, []);

  useEffect(() => {
    const handleLocationUpdated = () => {
      handleAutoLocate();
    };

    window.addEventListener("spotly-location-updated", handleLocationUpdated);
    return () => {
      window.removeEventListener("spotly-location-updated", handleLocationUpdated);
    };
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
    if (userRole === "customer") {
      setLocation("/customer/home");
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
            if (data.name) setUserName(data.name);
            const isExpired = data.premiumExpiresAt && new Date(data.premiumExpiresAt) < new Date();
            const hasViews = data.premiumPlan === "premium" || (data.premiumViewsRemaining ?? 0) > 0;
            const activePremium = !!data.isPremium && !isExpired && hasViews;
            setIsPremium(activePremium);
            setPremiumPlan(activePremium ? (data.premiumPlan || null) : null);
            setPremiumViewsRemaining(activePremium ? (data.premiumViewsRemaining ?? 0) : 0);
            setPremiumExpiresAt(activePremium ? (data.premiumExpiresAt || null) : null);
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
    const rentMatch = b.comments?.match(/Rent: ₹(\d+)/);
    let cleanComments = b.comments?.replace(/\[PHOTOS\][\s\S]*?\[\/PHOTOS\]/, "") || "";
    const sizeMatch = cleanComments.match(/\|\s*Vehicle Size:\s*([^|]+)/i) || cleanComments.match(/\|\s*Size:\s*([^|]+)/i);
    let parsedVehicleSize: string | undefined = undefined;
    if (sizeMatch) {
      parsedVehicleSize = sizeMatch[1].trim();
      cleanComments = cleanComments.replace(/\|\s*Vehicle Size:\s*([^|]+)/i, "").replace(/\|\s*Size:\s*([^|]+)/i, "");
    }
    const descMatch = cleanComments.match(/\|\s*([\s\S]+)$/);
    const photosMatch = b.comments?.match(/\[PHOTOS\]([\s\S]*?)\[\/PHOTOS\]/);
    let parsedPhotos: string[] = [];
    if (photosMatch) {
      try { parsedPhotos = JSON.parse(photosMatch[1]); } catch { }
    }
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
      description: descMatch ? descMatch[1].trim() : "Parking space available for rent",
      parkingType: getParkingType(b.serviceName),
      vehicleSize: parsedVehicleSize,
      ownerPhone: b.ownerPhone || "",
      ownerName: b.ownerName || "Space Owner",
      latitude: b.latitude != null ? b.latitude : null,
      longitude: b.longitude != null ? b.longitude : null,
      photos: parsedPhotos,
    };
  };

  const buildPendingUrl = (offset: number, searchVal?: string) => {
    const params = new URLSearchParams();
    const lat = localStorage.getItem("userLatitude");
    const lng = localStorage.getItem("userLongitude");
    const stateName = localStorage.getItem("workerState") || localStorage.getItem("userState") || "";
    if (lat && lng) {
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

  const fetchParkingSpaces = async () => {
    const isExplore = localStorage.getItem("exploreMode") === "true" || localStorage.getItem("userId")?.startsWith("explore_");
    if (isExplore) {
      setParkingSpaces([]);
      setTotalSpaces(0);
      setIsLoading(false);
      return;
    }
    try {
      const response = await fetch(buildPendingUrl(0));
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
    }
    setIsLoading(false);
  };

  const loadMoreSpaces = async () => {
    if (localStorage.getItem("exploreMode") === "true") {
      setIsLoadingMore(false);
      return;
    }
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

  // Debounced search query & initial load
  useEffect(() => {
    if (!locationReady) return;
    setIsSearching(true);
    const timer = setTimeout(async () => {
      await fetchParkingSpaces();
      setIsSearching(false);
    }, 400);
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
    } catch (error) {
      console.error("Location detection failed:", error);
      triggerLocationPermissionError("Location access permission is required to detect your location and fetch nearest contacts and parking spots. Please allow location access.");
    }
    setIsLocating(false);
  };

  const extractLocationsFromSpaces = (spaces: ParkingSpace[]): string[] => {
    const NON_AREA_WORDS = new Set([
      "india", "bharat",
      "karnataka", "tamil nadu", "tamilnadu", "kerala", "andhra pradesh",
      "telangana", "maharashtra", "goa", "gujarat", "rajasthan", "punjab",
      "haryana", "delhi", "uttar pradesh", "madhya pradesh", "bihar",
      "west bengal", "odisha", "assam", "jharkhand", "chhattisgarh",
      "uttarakhand", "himachal pradesh", "jammu and kashmir", "ladakh",
      "manipur", "meghalaya", "mizoram", "nagaland", "sikkim", "tripura",
      "arunachal pradesh", "puducherry", "chandigarh",
    ]);
    const BUILDING_PREFIXES = /^(flat|plot|door|house|no\.?|#|shop|building|apartment|apt|villa|block|sector|street|st\.?|road|rd\.?|lane|cross|main|stage|phase|ward|gali)\b/i;
    const ORDINAL_SUBLOCALITY = /^\d+(st|nd|rd|th)\s+(block|main|cross|stage|phase|street|ward|floor|sector)\b/i;
    const NUMBERED_SUBLOCALITY = /^(block|sector|phase|stage|ward)\s+\d+\b/i;
    const SUBLOCALITY_KEYWORDS = /\b(nagar|nagara|colony|enclave|extension|extn|basti|mohalla|compound|wadi|puram|pally|slum|gali|marg|street|st|lane|cross|block|phase|stage|sector|ward|floor|apartment|flat|building|complex|society)\b/i;

    const titleCase = (s: string) =>
      s.split(/\s+/).map((w) => {
        if (w.length === 0) return w;
        if (w.length <= 4 && /^[A-Za-z]+$/.test(w) && w === w.toUpperCase()) return w;
        return w.charAt(0).toUpperCase() + w.slice(1).toLowerCase();
      }).join(" ");
    const cleanToken = (raw: string) => {
      let t = raw.trim();
      t = t.replace(/\b\d{6}\b/g, "").trim();
      t = t.replace(/[\s\-]+\d+\s*$/g, "").trim();
      t = t.replace(/\s{2,}/g, " ").trim();
      return t;
    };
    const isUsable = (raw: string): boolean => {
      const t = cleanToken(raw);
      if (t.length < 3) return false;
      if (/^\d+$/.test(t)) return false;
      if (/^\d{6}$/.test(t)) return false;
      if (NON_AREA_WORDS.has(t.toLowerCase())) return false;
      if (BUILDING_PREFIXES.test(t)) return false;
      if (ORDINAL_SUBLOCALITY.test(t)) return false;
      if (NUMBERED_SUBLOCALITY.test(t)) return false;
      return true;
    };
    const extractMajorArea = (location: string): string | null => {
      const parts = location.split(",").map((p) => p.trim()).filter(Boolean);
      if (parts.length === 0) return null;
      const usable = parts.filter(isUsable).map(cleanToken);
      if (usable.length === 0) return null;

      // Prefer non-sublocality parts (true localities like Bangalore East, Whitefield, Indiranagar)
      const localities = usable.filter((p) => !SUBLOCALITY_KEYWORDS.test(p));
      if (localities.length > 0) {
        // Pick the most specific locality (usually first non-sublocality)
        return titleCase(localities[0]);
      }

      // Fallback if all parts are sublocalities
      const chosen = usable.length > 1 ? usable[1] : usable[0];
      return titleCase(chosen);
    };

    const seen = new Map<string, { name: string; dist: number }>();
    const candidates = spaces
      .filter((s) => s.location && s.location.trim())
      .map((s) => {
        const dist = userCoords && s.latitude && s.longitude
          ? calcDistance(userCoords.lat, userCoords.lng, s.latitude, s.longitude)
          : 99999;
        const name = extractMajorArea(s.location);
        return name ? { name, dist } : null;
      })
      .filter((c): c is { name: string; dist: number } => c !== null)
      .sort((a, b) => a.dist - b.dist);
    for (const c of candidates) {
      const key = c.name.toLowerCase();
      if (!seen.has(key)) seen.set(key, c);
      if (seen.size >= 8) break;
    }
    return Array.from(seen.values()).map((v) => v.name);
  };

  useEffect(() => {
    if (!searchQuery && parkingSpaces.length > 0) {
      const extracted = extractLocationsFromSpaces(parkingSpaces);
      if (extracted.length > 0) {
        setAllLocationChips(extracted);
      }
    }
  }, [parkingSpaces, searchQuery]);

  const nearestLocations = useMemo(() => {
    if (allLocationChips.length > 0) return allLocationChips;
    return extractLocationsFromSpaces(parkingSpaces);
  }, [allLocationChips, parkingSpaces, userCoords]);

  const filteredSpacesRaw = parkingSpaces.filter((space) => {
    // If it is the highlighted space, always include it so the user can see it!
    if (highlightedSpaceId && space.id === highlightedSpaceId) return true;

    if (spaceFilter === "viewed" && !revealedContacts.has(space.id)) return false;
    if (spaceFilter === "unviewed" && revealedContacts.has(space.id)) return false;
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

  const handleViewPhotos = (e: React.MouseEvent, photos: string[]) => {
    e.stopPropagation();
    setViewingPhotos(photos);
    setActivePhotoIndex(0);
    setShowPhotoViewer(true);
  };

  const handleSpaceClick = (space: ParkingSpace) => {
    setSelectedSpace(space);
    setShowSpaceDetail(true);
  };

  const handleViewContactForSpace = async (spaceId: string) => {
    const userId = localStorage.getItem("userId");
    if (localStorage.getItem("exploreMode") === "true" || !userId) {
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

  const getDistanceText = (space: ParkingSpace): string | null => {
    if (!userCoords || !space.latitude || !space.longitude) return null;
    const dist = calcDistance(userCoords.lat, userCoords.lng, space.latitude, space.longitude);
    if (dist < 1) return `${Math.round(dist * 1000)}m away`;
    return `${dist.toFixed(1)} km away`;
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

  const [plans, setPlans] = useState([
    { name: "Basic", price: 199, views: 10, key: "basic" },
    { name: "Standard", price: 299, views: 20, key: "standard" },
    { name: "Premium", price: 399, views: -1, key: "premium" },
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
    basic:    "spotly_basic",
    standard: "spotly_standard",
    premium:  "spotly_premium",
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

    // Check Android JS bridge injected by Capacitor plugin
    // NOTE: SpotlyBilling bridge will be wired in a future APK release.
    // Until then, show a friendly message — UI is ready, billing coming soon.
    const billing = (window as any).SpotlyBilling;
    if (!billing || typeof billing.purchase !== "function") {
      alert("Google Play in-app purchase is coming soon! \n\nFor now, please subscribe at spotlyindia.org on your browser and your access will unlock automatically.");
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

        billing.purchase(productId);
      });

    } catch (err: any) {
      console.error("Google Play purchase error:", err);
      setShowPaymentProcessing(false);
      alert(err?.message || "Payment failed or was cancelled. Please try again.");
    }
  };
  // ─────────────────────────────────────────────────────────────────────────────

  const openDirections = (e: React.MouseEvent, space: ParkingSpace) => {
    e.stopPropagation();
    e.preventDefault();
    vibrate();
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
  const userCity = localStorage.getItem("userDetectedCity") || localStorage.getItem("selectedServiceAreaName") || "";
  const userState = localStorage.getItem("userState") || localStorage.getItem("workerState") || "";
  const locationLabel = userState || (userCity.toLowerCase().includes("chennai") ? "Tamil Nadu" : "Karnataka");

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
        <div className="bg-gradient-to-br from-[#1b1675] via-[#241e98] to-[#3e3ab3] pt-16 pb-32 px-6 relative">
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

  return (
    <MobileLayout showNav userType="worker">
      <div className="pb-8 bg-neutral-50 min-h-full">
        {/* Sticky Header - appears on scroll */}
        <div
          className={`fixed top-0 left-0 right-0 z-50 bg-[#0d3da8] px-6 pt-[calc(0.75rem+env(safe-area-inset-top,0px))] pb-3 shadow-lg transition-all duration-300 ${isScrolled ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0'
            }`}
        >
          <div className="flex items-center justify-between max-w-md mx-auto">
            <div className="flex flex-col items-start">
              <div className="flex items-center gap-1.5">
                <MapPin size={13} className="text-blue-200/80" />
                <span className="text-blue-200/90 text-sm font-medium">{locationLabel}</span>
              </div>
              {isGuest() && (
                <span
                  className="inline-flex items-center gap-1 mt-1.5 px-2 py-0.5 bg-yellow-400/90 text-[#2e0044] text-[10px] font-bold rounded-full uppercase tracking-wider"
                  data-testid="badge-guest-worker-sticky"
                >
                  <User size={10} /> Login as Guest
                </span>
              )}
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

        {/* Solid Header */}
        <div className="bg-[#0d3da8] px-6 pt-[calc(1.5rem+env(safe-area-inset-top,0px))] pb-12 relative overflow-hidden">
          <div className="absolute top-4 right-4 w-24 h-24 bg-white/10 rounded-full blur-2xl"></div>
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-blue-400/20 rounded-full blur-xl -translate-x-1/2 translate-y-1/2"></div>
          <div className="relative z-10 flex items-start justify-between mb-6">
            <div>
              {!isGuest() && (
                <div>
                  <p className="text-[11px] font-semibold text-blue-200/80 uppercase tracking-wider mb-0.5" data-testid="text-time-greeting-worker">{getTimeGreeting()}</p>
                  <h2 className="text-xl font-bold text-white capitalize" data-testid="text-user-name-worker">Welcome back, {capitalizeName(userName || localStorage.getItem("userName") || "User")}</h2>
                </div>
              )}
              <div className="flex items-center gap-1.5 mt-1" data-testid="text-location-label-worker">
                <MapPin size={13} className="text-blue-200/80" />
                <p className="text-blue-200 text-sm font-medium">{locationLabel}</p>
              </div>
              {isGuest() && (
                <span
                  className="inline-flex items-center gap-1 mt-1.5 px-2 py-0.5 bg-yellow-400/90 text-[#2e0044] text-[10px] font-bold rounded-full uppercase tracking-wider"
                  data-testid="badge-guest-worker"
                >
                  <User size={10} /> Login as Guest
                </span>
              )}
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowSupportPopup(true)}
                className="w-11 h-11 rounded-2xl bg-white/15 backdrop-blur-md border border-white/20 flex items-center justify-center text-white hover:bg-white/25 transition-all shadow-lg shadow-blue-900/10"
                data-testid="button-support-worker"
              >
                <Phone size={18} className="drop-shadow-sm" />
              </button>
              <button
                onClick={() => setNotificationsOpen(true)}
                className="w-11 h-11 rounded-2xl bg-white/15 backdrop-blur-md border border-white/20 flex items-center justify-center text-white hover:bg-white/25 transition-all shadow-lg shadow-blue-900/10 relative"
                data-testid="button-notifications-worker"
              >
                <Bell size={18} className="drop-shadow-sm" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-gradient-to-r from-red-500 to-pink-500 rounded-full ring-2 ring-white flex items-center justify-center text-[10px] font-bold">{unreadCount > 9 ? '9+' : unreadCount}</span>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Search Box */}
        <div className="px-4 -mt-4 relative z-40 mb-4">
          <div className="bg-white rounded-2xl shadow-md shadow-neutral-200/60 border border-neutral-100 flex items-center overflow-hidden">
            <div className="pl-4 pr-2">
              {isSearching ? (
                <Loader2 size={18} className="text-primary animate-spin" />
              ) : (
                <Search size={18} className="text-neutral-400" />
              )}
            </div>
            <div className="flex-1 relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  triggerLocationFiltering(300);
                }}
                onFocus={() => setIsSearchFocused(true)}
                onBlur={() => setIsSearchFocused(false)}
                placeholder={isSearchFocused ? "instant search here.." : ""}
                className="w-full py-3.5 px-2 text-sm text-neutral-800 outline-none bg-transparent relative z-10"
                data-testid="input-search-spaces"
              />
              {!searchQuery && !isSearchFocused && (
                <div className="absolute inset-0 flex items-center px-2 pointer-events-none">
                  <span className="text-neutral-400 text-sm">Search e.g. "</span>
                  <span className="text-[#1d4ed8] text-sm font-medium">{placeholderText}</span>
                  <span className="text-[#1d4ed8] text-sm font-medium animate-pulse">|</span>
                  <span className="text-neutral-400 text-sm">"</span>
                </div>
              )}
            </div>
            {searchQuery && (
              <button
                onClick={() => {
                  triggerLocationFiltering(350);
                  setSearchQuery("");
                  setUserLocation("");
                }}
                className="p-2 text-neutral-400 hover:text-neutral-600 transition-colors"
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
              className="flex items-center gap-1.5 px-3 py-3.5 hover:bg-primary/20 text-primary transition-colors border-l border-neutral-100 relative justify-center"
              data-testid="button-auto-locate"
            >
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#1b1675] via-[#241e98] to-[#3e3ab3] text-white flex items-center justify-center relative z-10 shadow-md shadow-[#241e98]/30 hover:scale-105 transition-transform duration-200">
                {isLocating ? (
                  <Loader2 size={18} className="animate-spin text-white" />
                ) : (
                  <LocateFixed size={18} className="text-white" />
                )}
              </div>
            </button>
          </div>
          {userLocation && (
            <p className="text-xs text-primary mt-2 ml-1 flex items-center gap-1">
              <MapPin size={10} />
              Showing results near: {userLocation}
            </p>
          )}

          {nearestLocations.length > 0 && (
            <div className="mt-3 -mx-4 px-4 overflow-x-auto scrollbar-hide" data-testid="chips-nearest-locations">
              <div className="flex items-center gap-2 w-max pb-1">
                {nearestLocations.map((loc) => {
                  const active = searchQuery.trim().toLowerCase() === loc.toLowerCase();
                  return (
                    <button
                      key={loc}
                      onClick={() => {
                        vibrate();
                        triggerLocationFiltering(400);
                        const isActive = searchQuery.trim().toLowerCase() === loc.toLowerCase();
                        if (isActive) {
                          setSearchQuery("");
                          setUserLocation("");
                        } else {
                          setSearchQuery(loc);
                          setUserLocation(loc);
                        }
                      }}
                      className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-[12px] font-semibold whitespace-nowrap transition-all active:scale-95 border ${active ? "bg-primary text-white border-primary shadow-md shadow-primary/25" : "bg-white text-primary border-primary/30 hover:bg-primary/5"}`}
                      data-testid={`chip-location-${loc.replace(/\s+/g, "-").toLowerCase()}`}
                    >
                      <MapPin size={11} />
                      {loc}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

        </div>

        {/* Parking Spaces List */}
        <div className="px-4 relative z-10">
          <div className="flex justify-between items-center mb-2">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#0d3da8] to-[#1d4ed8] flex items-center justify-center shadow-sm">
                <ParkingCircle size={16} className="text-white" />
              </div>
              <h3 className="text-base font-bold text-neutral-900">Available Parking Spaces</h3>
            </div>
            <div className="flex items-center gap-2">
              <span className="bg-gradient-to-r from-[#0d3da8] to-[#1d4ed8] text-white text-xs font-bold px-3 py-1 rounded-full shadow-sm">{filteredSpaces.length}</span>
              <button
                onClick={() => { if (!requireLogin("subscribe to Premium")) return; isPremium ? setShowPremiumDetails(true) : setShowSubscriptionPopup(true); }}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold transition-all active:scale-95 ${isPremium
                  ? "bg-gradient-to-r from-yellow-400 to-yellow-500 text-white shadow-sm"
                  : "bg-gradient-to-r from-blue-100 to-blue-50 text-primary border border-blue-200"
                  }`}
                data-testid="button-premium"
              >
                <Crown size={12} />
                {isPremium ? (premiumPlan === "premium" ? "Unlimited" : (() => {
                  const currentPlan = plans.find(p => p.key === premiumPlan);
                  const totalViews = currentPlan ? currentPlan.views : (premiumPlan === "basic" ? 10 : 20);
                  return `${premiumViewsRemaining}/${totalViews}`;
                })()) : "Premium"}
              </button>
            </div>
          </div>
          <div className="relative h-[3px] rounded-full bg-blue-100 mb-3 overflow-hidden">
            <motion.div
              className="absolute inset-y-0 left-0 bg-gradient-to-r from-[#0d3da8] via-[#3b82f6] to-[#0d3da8] rounded-full"
              style={{ width: "40%" }}
              animate={{ x: ["-100%", "350%"] }}
              transition={{ duration: 2.5, repeat: 2, ease: "easeInOut" }}
            />
          </div>

          <div className="flex items-center gap-2 mb-4 flex-wrap">
            {isPremium && <>
              <button
                onClick={() => { vibrate(); setSpaceFilter("all"); }}
                className={`px-4 py-1.5 rounded-full text-xs font-bold ${spaceFilter === "all"
                  ? "bg-gradient-to-r from-[#0d3da8] to-[#1d4ed8] text-white"
                  : "bg-neutral-100 text-neutral-500 hover:bg-neutral-200"
                  }`}
                data-testid="filter-all"
              >
                All
              </button>
              <button
                onClick={() => { vibrate(); setSpaceFilter("viewed"); }}
                className={`px-4 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 ${spaceFilter === "viewed"
                  ? "bg-gradient-to-r from-[#0d3da8] to-[#1d4ed8] text-white"
                  : "bg-neutral-100 text-neutral-500 hover:bg-neutral-200"
                  }`}
                data-testid="filter-viewed"
              >
                <Eye size={12} />
                Viewed
                {revealedContacts.size > 0 && (
                  <span className={`ml-0.5 text-[10px] font-bold px-1.5 py-0.5 rounded-full ${spaceFilter === "viewed" ? "bg-white/20" : "bg-primary/10 text-primary"
                    }`}>{revealedContacts.size}</span>
                )}
              </button>
              <button
                onClick={() => { vibrate(); setSpaceFilter("unviewed"); }}
                className={`px-4 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 ${spaceFilter === "unviewed"
                  ? "bg-gradient-to-r from-[#0d3da8] to-[#1d4ed8] text-white"
                  : "bg-neutral-100 text-neutral-500 hover:bg-neutral-200"
                  }`}
                data-testid="filter-unviewed"
              >
                <EyeOff size={12} />
                Unviewed
              </button>
            </>}
            <div className="ml-auto flex items-center gap-1.5">
              <button
                onClick={() => { vibrate(); setPriceSort(priceSort === "asc" ? "none" : "asc"); }}
                className={`w-9 h-9 rounded-full flex items-center justify-center ${priceSort === "asc"
                  ? "bg-gradient-to-r from-[#0d3da8] to-[#1d4ed8] text-white"
                  : "bg-neutral-100 text-neutral-500 hover:bg-neutral-200"
                  }`}
                title="Price: Low to High"
                data-testid="filter-price-asc"
              >
                <ArrowUpWideNarrow size={16} />
              </button>
              <button
                onClick={() => { vibrate(); setPriceSort(priceSort === "desc" ? "none" : "desc"); }}
                className={`w-9 h-9 rounded-full flex items-center justify-center ${priceSort === "desc"
                  ? "bg-gradient-to-r from-[#0d3da8] to-[#1d4ed8] text-white"
                  : "bg-neutral-100 text-neutral-500 hover:bg-neutral-200"
                  }`}
                title="Price: High to Low"
                data-testid="filter-price-desc"
              >
                <ArrowDownWideNarrow size={16} />
              </button>
            </div>
          </div>

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
          ) : (isLoading || isLocationFiltering) ? (
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
              <div className="relative mb-6">
                {searchQuery ? (
                  <div className="w-28 h-28 bg-gradient-to-br from-orange-50 to-orange-100 rounded-3xl flex items-center justify-center shadow-lg shadow-orange-100/50 border border-orange-200/40">
                    <Search className="w-14 h-14 text-orange-400" />
                  </div>
                ) : (
                  <div className="w-28 h-28 bg-gradient-to-br from-blue-50 via-white to-blue-100 rounded-3xl flex flex-col items-center justify-center shadow-lg shadow-blue-200/50 border border-blue-200/40 gap-1">
                    <div className="flex items-center gap-1">
                      <Car className="w-10 h-10 text-primary/70" />
                      <Bike className="w-8 h-8 text-primary/50" />
                    </div>
                    <ParkingCircle className="w-6 h-6 text-primary/40" />
                  </div>
                )}
              </div>
              {searchQuery ? (
                <>
                  <h4 className="text-lg font-bold text-neutral-800 mb-2" data-testid="text-no-results">No Results Found</h4>
                  <p className="text-neutral-500 text-sm text-center mb-6 max-w-[250px]">
                    No parking spaces match "{searchQuery}". Try a different search.
                  </p>
                  <button
                    onClick={() => { setSearchQuery(""); setUserLocation(""); }}
                    className="group flex items-center gap-3 px-6 py-3.5 border-2 border-[#0d3da8] text-[#0d3da8] font-semibold rounded-2xl hover:bg-blue-50 active:scale-95 transition-all duration-300"
                    data-testid="button-clear-search-results"
                  >
                    <Search size={20} />
                    Clear Search
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
                const distanceText = getDistanceText(space);
                const isRevealed = revealedContacts.has(space.id);
                const seekerName = localStorage.getItem("userName") || "";
                const whatsappMsg = seekerName
                  ? `Hi, I’m ${seekerName}. I saw your parking space on Spotly and I’m interested. Please let me know how to connect. Thanks!`
                  : `Hi, I saw your parking space on Spotly and I’m interested. Please let me know how to connect. Thanks!`;
                return (
                  <div
                    key={space.id}
                    id={`card-space-${space.id}`}
                    className="w-full rounded-2xl overflow-hidden transition-all duration-200 relative bg-white border border-slate-100/90"
                    style={!isRevealed ? { boxShadow: "0 4px 20px rgba(0, 0, 0, 0.08), 0 1px 6px rgba(13, 61, 168, 0.06)" } : undefined}
                    data-testid={`card-space-${space.id}`}
                  >
                    {highlightedSpaceId === space.id && (
                      <svg className="absolute inset-0 w-full h-full pointer-events-none z-50 rounded-2xl" viewBox="0 0 100 100" preserveAspectRatio="none">
                        <rect
                          x="0.5"
                          y="0.5"
                          width="99"
                          height="99"
                          rx="4.5"
                          ry="4.5"
                          fill="none"
                          stroke="#1d4ed8"
                          strokeWidth="1px"
                          vectorEffect="non-scaling-stroke"
                          pathLength="100"
                          className="animate-clockwise-border"
                        />
                      </svg>
                    )}
                    <div className="p-4 relative overflow-hidden">
                      {/* Top Row: Featured and Booked Date */}
                      <div className="flex items-center justify-between mb-4">
                        <span className="text-[11px] font-extrabold tracking-wider text-[#0d3da8] bg-[#0d3da8]/10 px-2.5 py-1 rounded-full flex items-center gap-1 uppercase flex-shrink-0">
                          <Zap size={11} className="fill-[#0d3da8] text-[#0d3da8]" /> FEATURED
                        </span>

                        <div className="flex items-center gap-1.5 flex-shrink-0 ml-auto">
                          <div className="flex items-center gap-1 px-2 py-1 bg-neutral-50 border border-neutral-200/80 rounded-lg text-[10px] font-semibold text-neutral-600">
                            <Calendar size={11} className="text-neutral-400" />
                            {formatDisplayDate(space.date)}
                          </div>

                          <button
                            onClick={(e) => { vibrate(); handleInterest(e, space.id); }}
                            disabled={interestLoading === space.id}
                            className={`px-2 py-1 rounded-lg flex items-center gap-1 text-[10px] font-semibold border transition-all duration-200 active:scale-95 ${userInterests.has(space.id)
                              ? "bg-[#0d3da8] text-white border-[#0d3da8]"
                              : "bg-white text-[#0d3da8] border-[#0d3da8]/20 hover:bg-[#0d3da8]/5"
                              }`}
                            data-testid={`button-interested-${space.id}`}
                          >
                            <ThumbsUp size={10} className={userInterests.has(space.id) ? "fill-white" : ""} />
                            {userInterests.has(space.id) ? "Interested" : "I'm Interested"}
                          </button>

                          {timeAgo(space.bookedAt) && (
                            <span className="text-[11px] font-semibold text-neutral-500 bg-neutral-100 px-2.5 py-1 rounded-full ml-0.5">
                              {timeAgo(space.bookedAt)}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Mid Section: 2 columns */}
                      <div className="flex gap-4 mb-4">
                        {/* Left: Image Container */}
                        <div className="relative w-[80px] h-[80px] flex-shrink-0">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              vibrate();
                              if (space.photos.length === 0) return;
                              if (!requireLogin("view photos")) return;
                              if (!isPremium && !revealedContacts.has(space.id)) { setShowSubscriptionPopup(true); return; }
                              handleViewPhotos(e, space.photos);
                            }}
                            className="w-full h-full rounded-2xl flex items-center justify-center overflow-hidden shadow-md active:scale-95 transition-transform relative animate-fade-in"
                            data-testid={`button-avatar-${space.id}`}
                          >
                            {space.photos.length > 0 && (isPremium || revealedContacts.has(space.id)) ? (
                              <img src={space.photos[0]} alt={space.serviceName} className="w-full h-full object-cover" />
                            ) : (
                              renderVehicleIconBadge(space.parkingType)
                            )}

                            {space.photos.length > 0 && !isPremium && !revealedContacts.has(space.id) && (
                              <div className="absolute inset-0 bg-black/35 flex items-center justify-center z-15">
                                <Crown size={16} className="text-yellow-300 drop-shadow" />
                              </div>
                            )}
                          </button>

                          {/* Photos count tag - placed OUTSIDE the overflow-hidden button */}
                          {space.photos.length > 0 && (
                            <span className="absolute -top-1.5 -right-1.5 bg-orange-500 text-white text-[10px] font-extrabold rounded-full min-w-[18px] h-[18px] px-1 flex items-center justify-center shadow-lg ring-1 ring-white z-30">
                              {space.photos.length}
                            </span>
                          )}
                        </div>

                        {/* Right: Info */}
                        <div className="flex-1 min-w-0 flex flex-col justify-between py-1.5">
                          <div>
                            <div className="flex items-center gap-1.5 min-w-0">
                              <h4 className="font-bold text-neutral-900 text-[17px] leading-tight truncate">{space.serviceName}</h4>
                              {isRevealed && (
                                <span className="bg-emerald-600 text-white text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider shrink-0 flex items-center gap-1 shadow-2xs">
                                  <Check size={10} className="stroke-[3]" /> VIEWED CONTACT
                                </span>
                              )}
                            </div>
                            <p className="text-[12px] text-neutral-500 font-medium flex items-center gap-1 mt-0.5 flex-wrap">
                              <User size={11} className="text-[#0d3da8]" /> by <span className="font-semibold text-neutral-700">{space.ownerName}</span>
                              {space.vehicleSize && (
                                <>
                                  <span className="text-neutral-300 font-light mx-0.5">|</span>
                                  <span className="text-neutral-600 font-medium">{space.vehicleSize}</span>
                                </>
                              )}
                            </p>
                          </div>

                          <div className="flex items-center flex-wrap gap-1 mt-1">
                            <span className="font-bold text-[19px] text-[#0d3da8] tracking-tight">₹{space.rent}</span>
                            <span className="text-[11px] text-neutral-400 font-normal">/mo</span>

                            {distanceText && (
                              <>
                                <span className="text-[11px] text-neutral-300 font-normal mx-1">•</span>
                                <span className="text-[11px] text-orange-600 font-semibold flex items-center gap-0.5">
                                  <Navigation size={10} className="text-orange-500" />
                                  {distanceText}
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Location Badge (Full Width) */}
                      {isPremium || revealedContacts.has(space.id) ? (
                        <div className="mb-1.5">
                          <div className="w-full flex items-center gap-2 px-3.5 py-2 bg-emerald-50/70 border border-emerald-200/60 rounded-full text-emerald-900 font-semibold text-[12px]">
                            <MapPin size={14} className="text-emerald-700 flex-shrink-0" />
                            <span className="truncate" data-testid={`text-address-${space.id}`}>
                              {space.location} {distanceText && `• ${distanceText}`}
                            </span>
                          </div>
                        </div>
                      ) : (
                        <button
                          onClick={(e) => { e.stopPropagation(); vibrate(); if (!requireLogin("subscribe to Premium")) return; setShowSubscriptionPopup(true); }}
                          className="mb-1.5 w-full flex items-center gap-2 px-3.5 py-2 bg-amber-50/50 border border-amber-200/50 rounded-full text-amber-700 font-semibold text-[12px]"
                          data-testid={`button-location-premium-${space.id}`}
                        >
                          <MapPin size={14} className="text-amber-500 flex-shrink-0" />
                          <span className="truncate">
                            Unlock location with Premium {distanceText && `• ${distanceText}`}
                          </span>
                          <Crown size={12} className="text-amber-500 ml-auto flex-shrink-0" />
                        </button>
                      )}

                      <div className="overflow-hidden">
                        {isRevealed ? (
                          <div className="mt-1.5 flex items-center justify-between bg-slate-50 border border-slate-200/80 px-2 py-1 rounded-full animate-contact-reveal">
                            <a
                              href={`tel:+91${(space.ownerPhone || "").replace(/\D/g, "").slice(-10)}`}
                              onClick={(e) => e.stopPropagation()}
                              className="flex items-center gap-2 pl-0.5 group/call no-underline hover:no-underline"
                              data-testid={`link-phone-call-${space.id}`}
                            >
                              <div className="w-8 h-8 rounded-full bg-[#00a86b] group-hover/call:bg-[#008f5b] flex items-center justify-center text-white shadow-sm transition-transform active:scale-95">
                                <Phone size={15} />
                              </div>
                              <span className="font-extrabold text-[13.5px] text-slate-900 tracking-wide no-underline hover:no-underline" data-testid={`text-phone-${space.id}`}>
                                {formatIndianPhone(space.ownerPhone)}
                              </span>
                            </a>

                            <div className="flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={(e) => openDirections(e, space)}
                                className="w-8 h-8 rounded-full bg-blue-600 hover:bg-blue-700 flex items-center justify-center transition-transform active:scale-95 text-white shadow-sm cursor-pointer"
                                data-testid={`button-directions-${space.id}`}
                                title="Open in Maps"
                              >
                                <MapPin size={15} />
                              </button>
                              <button
                                type="button"
                                onClick={(e) => openWhatsApp(e, space.ownerPhone)}
                                className="w-8 h-8 rounded-full bg-[#25d366] hover:bg-green-600 flex items-center justify-center transition-transform active:scale-95 text-white shadow-sm cursor-pointer"
                                data-testid={`button-whatsapp-${space.id}`}
                                title="Open WhatsApp"
                              >
                                <MessageCircle size={15} />
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="mb-1">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                vibrate();
                                if (revealingContactId === space.id) return;
                                if (!requireLogin("view contact details")) return;
                                handleViewContactForSpace(space.id);
                              }}
                              disabled={revealingContactId === space.id}
                              className="w-full flex items-center justify-center gap-2 h-11 rounded-xl text-[13px] font-semibold bg-gradient-to-r from-[#0d3da8] to-[#1d4ed8] text-white hover:from-[#092c7d] hover:to-[#1e40af] transition-all shadow-lg shadow-[#0d3da8]/30 hover:shadow-xl hover:shadow-[#0d3da8]/40 active:scale-[0.98] button-shadow disabled:opacity-85"
                              data-testid={`button-view-contacts-${space.id}`}
                            >
                              {revealingContactId === space.id ? (
                                <>
                                  <Loader2 size={14} className="animate-spin text-white" />
                                  <span>Revealing Contact...</span>
                                </>
                              ) : isPremium ? (
                                <><Eye size={14} /> View Contact</>
                              ) : (
                                <><Crown size={14} className="text-yellow-300" /> Subscribe to View Contact</>
                              )}
                            </button>
                          </div>
                        )}
                      </div>

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
                    className="flex items-center gap-2.5 px-7 py-3 bg-gradient-to-r from-[#0d3da8] to-[#1d4ed8] text-white text-sm font-bold rounded-full shadow-xl shadow-[#0d3da8]/25 active:scale-95 transition-all disabled:opacity-60"
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
            </div>
          )}
        </div>


        <AnimatePresence>
          {/* Subscription Plans Popup */}
          {showSubscriptionPopup && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center px-6"
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
                    {/* Google Play badge header */}
                    <div className="w-16 h-16 rounded-full bg-yellow-100 flex items-center justify-center mx-auto mb-3">
                      <Crown size={32} className="text-yellow-500" />
                    </div>
                    <h3 className="text-[19px] font-bold text-neutral-900 mb-1">Subscribe to View</h3>
                    <p className="text-neutral-500 text-[13px] mb-2">Choose a plan to view owner contact details</p>

                    {/* Google Play badge */}
                    <div className="flex items-center justify-center gap-1.5 mb-4">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                        <path d="M3.18 23.5c.34.19.72.28 1.1.26l12.01-11.26L12.47 8.7 3.18 23.5z" fill="#EA4335"/>
                        <path d="M21.54 10.27L18.3 8.39l-3.98 3.73 3.98 3.73 3.27-1.89a1.86 1.86 0 000-3.69z" fill="#FBBC05"/>
                        <path d="M4.28.24A1.85 1.85 0 003.18.5L12.47 15.3l3.82-3.58L4.28.24z" fill="#4285F4"/>
                        <path d="M3.18.5a1.86 1.86 0 00-.93 1.61v19.78c0 .67.35 1.28.93 1.61l.1.06 11.08-11.08v-.26L3.28.44l-.1.06z" fill="#34A853"/>
                      </svg>
                      <span className="text-[11px] font-semibold text-neutral-500">Secured by Google Play</span>
                    </div>

                    {/* Plan cards */}
                    <div className="space-y-2.5 text-left">
                      {plans.map((plan) => (
                        <button
                          key={plan.key}
                          onClick={() => { vibrate(); setChoosePlan(plan.key); }}
                          className={`w-full flex items-center justify-between rounded-xl px-4 py-3 transition-all active:scale-[0.98] relative ${
                            plan.key === "standard"
                              ? "border border-primary/40 bg-blue-50/40 hover:border-primary"
                              : plan.key === "premium"
                                ? "border border-yellow-300 bg-yellow-50/50 hover:border-yellow-400"
                                : "border border-neutral-200 bg-white hover:border-primary/50"
                          }`}
                          data-testid={`plan-native-${plan.key}`}
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
                                {plan.views === -1 ? "Unlimited views" : `${plan.views} views`} • {(plan as any).validity || (plan.key === "basic" ? 7 : plan.key === "standard" ? 15 : 30)} days validity
                              </span>
                            </div>
                          </div>
                          <span className="text-base font-extrabold text-primary">₹{plan.price}</span>
                        </button>
                      ))}
                    </div>

                    {/* Action buttons */}
                    <div className="flex gap-3 mt-5">
                      <button
                        onClick={() => { setShowSubscriptionPopup(false); setChoosePlan(null); }}
                        className="flex-1 py-3 bg-neutral-100 text-neutral-700 text-[15px] font-bold rounded-2xl hover:bg-neutral-200 transition-colors"
                        data-testid="button-close-subscription-app"
                      >
                        Maybe Later
                      </button>
                      <button
                        onClick={() => {
                          vibrate();
                          const plan = plans.find(p => p.key === choosePlan);
                          if (plan) handleNativeAppPurchase(plan);
                        }}
                        disabled={!choosePlan}
                        className="flex-1 py-3 bg-primary hover:bg-primary/90 text-white text-[15px] font-bold rounded-2xl shadow-lg shadow-primary/30 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                        data-testid="button-subscribe-submit-app"
                      >
                        <Crown size={16} />
                        Buy Now
                      </button>
                    </div>
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
                                {plan.views === -1 ? "Unlimited views" : `${plan.views} views`} • {(plan as any).validity || (plan.key === "basic" ? 7 : plan.key === "standard" ? 15 : 30)} days validity
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
              className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center px-6"
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
              className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center px-6"
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
              className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center px-6"
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
              className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center px-4"
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
              className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center px-6"
              onClick={() => setShowSupportPopup(false)}
            >
              <motion.div
                initial={{ scale: 0.85, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.85, opacity: 0 }}
                className="bg-white rounded-3xl p-6 text-center shadow-2xl max-w-sm w-full"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-4">
                  <Phone size={32} className="text-primary" />
                </div>
                <h3 className="text-lg font-bold text-neutral-900 mb-1">Help & Support</h3>
                <p className="text-neutral-500 text-xs mb-5">We're here to help!</p>

                <div className="space-y-2 text-left">
                  <a
                    href={`tel:${supportPhone.replace(/\s/g, '')}`}
                    className="flex items-center gap-3 p-3 bg-green-50 rounded-xl hover:bg-green-100 transition-colors no-underline"
                    data-testid="link-call-support-worker"
                  >
                    <div className="w-9 h-9 bg-green-500 rounded-full flex items-center justify-center">
                      <Phone className="w-4 h-4 text-white" />
                    </div>
                    <div className="text-left">
                      <p className="font-semibold text-neutral-900 text-sm">Call Us</p>
                      <p className="text-xs text-neutral-600">{supportPhone}</p>
                    </div>
                  </a>
                  <a
                    href={`mailto:${supportEmail}`}
                    className="flex items-center gap-3 p-3 bg-blue-50 rounded-xl hover:bg-blue-100 transition-colors no-underline"
                    data-testid="link-email-support-worker"
                  >
                    <div className="w-9 h-9 bg-blue-500 rounded-full flex items-center justify-center">
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
                  className="mt-5 w-full py-3 bg-gradient-to-r from-[#0d3da8] to-[#1d4ed8] text-white font-bold rounded-2xl hover:from-[#092c7d] hover:to-[#1e40af] shadow-xl shadow-[#0d3da8]/25 transition-colors"
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
              const newUrl = `/worker/home?highlight=${notification.bookingId}`;
              if (window.location.pathname === "/worker/home") {
                window.history.pushState({}, document.title, newUrl);
                setHasProcessedHighlight(null);
              } else {
                window.location.href = newUrl;
              }
            }
          }}
        />
      </div>
    </MobileLayout>
  );
}
