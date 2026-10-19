import { useLocation } from "wouter";
import heroCardImg from "@assets/hero-card-2.png";
import MobileLayout from "@/components/layout/mobile-layout";
import { Bell, Phone, MapPin, Check, CheckCircle2, Calendar, User, Loader2, ChevronDown, Map, Navigation, X, Car, Bike, Rocket, Mail, Plus, ParkingCircle, ParkingSquare, Trash2, Pencil, Clock, ThumbsUp, IndianRupee, Wallet, TrendingUp, BadgeDollarSign, CircleDollarSign, Banknote, Sparkles, ArrowRight, Star } from "lucide-react";
import { getApiUrl } from "@/lib/api-config";
import { triggerLocationPermissionError } from "@/lib/location-error";
import { isGuest } from "@/lib/guest";
import { vibrate } from "@/lib/vibrate";
import React, { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { NotificationSheet } from "@/components/notifications/notification-sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import { useScroll } from "@/contexts/scroll-context";
import { useAuthGuard } from "@/contexts/auth-guard";
import { capitalizeName, getTimeGreeting } from "@/lib/utils";
import { DELETE_SPACE_REASONS } from "@/pages/space-provider/home";

interface City {
  id: string;
  name: string;
  state: string;
  isActive: boolean;
  displayOrder: number;
}

interface Service {
  id: string;
  name: string;
  icon: string;
  description: string;
  isActive: boolean;
  displayOrder: number;
}

const formatServiceName = (name: string): string => {
  return name.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
};

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


export default function CustomerHome() {
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const { requireLogin } = useAuthGuard();
  const [showCustomerCare, setShowCustomerCare] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [selectedDeleteReason, setSelectedDeleteReason] = useState<string | null>(null);
  const [otherDeleteReason, setOtherDeleteReason] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteSuccess, setDeleteSuccess] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [userName, setUserName] = useState(localStorage.getItem("userName") || (localStorage.getItem("isGuest") === "true" ? "Guest User" : ""));
  const [highlightedSpaceId, setHighlightedSpaceId] = useState<string | null>(null);
  const [selectedCity, setSelectedCity] = useState<string>("");
  const [showLocationPopup, setShowLocationPopup] = useState(false);
  const [isLocatingGPS, setIsLocatingGPS] = useState(false);
  const [pendingCity, setPendingCity] = useState<string>("");
  const [cityNotServed, setCityNotServed] = useState(false);
  const [detectedCityName, setDetectedCityName] = useState("");
  const [showCitySelector, setShowCitySelector] = useState(false);
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
  const unreadCount = notifications.filter(n => !n.isRead).length;
  const [supportPhone, setSupportPhone] = useState("+91 98765 43210");
  const [supportEmail, setSupportEmail] = useState("info@spotlyindia.org");
  const [adVideoUrl, setAdVideoUrl] = useState("");
  const [adVideoEnabled, setAdVideoEnabled] = useState(true);

  // Function to fetch notifications
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

  // Get icon based on notification type
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'booking_accepted': return '✅';
      case 'booking_cancelled': return '❌';
      case 'worker_assigned': return '👷';
      case 'new_job': return '📋';
      case 'broadcast': return '📢';
      default: return '🔔';
    }
  };

  // Format timestamp in human-readable format
  const formatTimestamp = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffHours < 24) return `${diffHours} hr ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
  };

  // State for clearing notifications
  const [isClearingNotifications, setIsClearingNotifications] = useState(false);

  // Clear all notifications
  const handleClearNotifications = async () => {
    const userId = localStorage.getItem("userId");
    if (!userId) return;

    setIsClearingNotifications(true);
    try {
      const response = await fetch(getApiUrl(`/api/notifications/${userId}/clear`), {
        method: 'DELETE'
      });
      if (response.ok) {
        setNotifications([]);
      }
    } catch (error) {
      console.error("Failed to clear notifications:", error);
    } finally {
      setIsClearingNotifications(false);
    }
  };

  // Fetch cities from active pincodes
  const { data: pincodesData } = useQuery({
    queryKey: ["pincodes"],
    queryFn: async () => {
      const res = await fetch(getApiUrl("/api/pincodes"));
      if (!res.ok) throw new Error("Failed to fetch pincodes");
      return res.json();
    },
  });

  // Get unique cities from active pincodes only
  const cities: City[] = useMemo(() => {
    const pincodes = pincodesData?.pincodes || [];
    const activePincodes = pincodes.filter((p: any) => p.isActive);
    const uniqueCities: Record<string, City> = {};

    activePincodes.forEach((p: any) => {
      if (p.cityId && p.cityName && !uniqueCities[p.cityId]) {
        uniqueCities[p.cityId] = {
          id: p.cityId,
          name: p.cityName,
          state: "",
          isActive: true,
          displayOrder: p.displayOrder || 0
        };
      }
    });

    return Object.values(uniqueCities);
  }, [pincodesData?.pincodes]);

  // Fetch services from API
  const { data: servicesData } = useQuery({
    queryKey: ["services"],
    queryFn: async () => {
      const res = await fetch(getApiUrl("/api/services"));
      if (!res.ok) throw new Error("Failed to fetch services");
      return res.json();
    },
  });

  const services: Service[] = servicesData?.services || [];

  const userId = localStorage.getItem("userId");
  const PAGE_SIZE = 20;
  const [myBookings, setMyBookings] = useState<any[]>([]);
  const [totalBookings, setTotalBookings] = useState(0);
  const [bookingsPage, setBookingsPage] = useState(0);
  const [isLoadingBookings, setIsLoadingBookings] = useState(true);
  const [isLoadingMoreBookings, setIsLoadingMoreBookings] = useState(false);

  const fetchMyBookings = async (reset = false) => {
    if (!userId) { setIsLoadingBookings(false); return; }
    try {
      const offset = reset ? 0 : bookingsPage * PAGE_SIZE;
      const res = await fetch(getApiUrl(`/api/bookings/customer/${userId}?limit=${PAGE_SIZE}&offset=${offset}&includePhotos=true`));
      if (!res.ok) throw new Error("Failed to fetch bookings");
      const data = await res.json();
      if (reset) {
        setMyBookings(data.bookings || []);
        setBookingsPage(1);
      } else {
        setMyBookings(prev => [...prev, ...(data.bookings || [])]);
        setBookingsPage(prev => prev + 1);
      }
      setTotalBookings(data.total ?? (data.bookings?.length || 0));
    } catch (error) {
      console.error("Failed to fetch bookings:", error);
    }
    setIsLoadingBookings(false);
    setIsLoadingMoreBookings(false);
  };

  const loadMoreBookings = async () => {
    if (isLoadingMoreBookings || myBookings.length >= totalBookings) return;
    setIsLoadingMoreBookings(true);
    const offset = bookingsPage * PAGE_SIZE;
    try {
      const res = await fetch(getApiUrl(`/api/bookings/customer/${userId}?limit=${PAGE_SIZE}&offset=${offset}&includePhotos=true`));
      if (!res.ok) throw new Error("Failed");
      const data = await res.json();
      if ((data.bookings || []).length > 0) {
        setMyBookings(prev => [...prev, ...(data.bookings || [])]);
        setBookingsPage(prev => prev + 1);
      }
    } catch { }
    setIsLoadingMoreBookings(false);
  };

  useEffect(() => {
    fetchMyBookings(true);
  }, [userId]);

  // Handle highlight scrolling and card pulsing glow for 5 seconds
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const highlightId = params.get("highlight");
    if (highlightId && myBookings.length > 0) {
      const spaceExists = myBookings.some(s => s.id === highlightId);
      if (spaceExists) {
        setHighlightedSpaceId(highlightId);

        // Scroll to card
        setTimeout(() => {
          const element = document.getElementById(`card-space-${highlightId}`);
          if (element) {
            element.scrollIntoView({ behavior: "smooth", block: "center" });
          }
        }, 300);

        // Remove highlight after 5 seconds
        const timer = setTimeout(() => {
          setHighlightedSpaceId(null);
          const newUrl = window.location.pathname;
          window.history.replaceState({}, document.title, newUrl);
        }, 5000);

        return () => clearTimeout(timer);
      }
    }
  }, [myBookings]);
  const [interestCounts, setInterestCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    const fetchInterestCounts = async () => {
      if (myBookings.length === 0) return;
      try {
        const ids = myBookings.map((b: any) => b.id).join(",");
        const res = await fetch(getApiUrl(`/api/interests/counts?ids=${ids}`));
        if (res.ok) {
          const data = await res.json();
          setInterestCounts(data.counts || {});
        }
      } catch { }
    };
    fetchInterestCounts();
  }, [myBookings.length]);

  const handleDeleteSpace = async (bookingId: string) => {
    setIsDeleting(true);
    try {
      const response = await fetch(getApiUrl(`/api/bookings/${bookingId}`), {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: selectedDeleteReason, otherReason: otherDeleteReason }),
      });
      if (response.ok) {
        setMyBookings(prev => prev.filter((b: any) => b.id !== bookingId));
        setTotalBookings(prev => prev - 1);
        setIsDeleting(false);
        setDeleteSuccess(true);
        setTimeout(() => {
          setDeleteSuccess(false);
          setDeleteConfirm(null);
          setSelectedDeleteReason(null);
          setOtherDeleteReason("");
        }, 1800);
        return;
      }
    } catch (error) {
      console.error("Failed to delete space:", error);
    }
    setIsDeleting(false);
    setDeleteConfirm(null);
    setSelectedDeleteReason(null);
    setOtherDeleteReason("");
  };

  const getParkingIcon = (serviceName: string) => {
    const name = serviceName.toLowerCase();
    if (name.includes("car") && name.includes("bike")) return "both";
    if (name.includes("bike")) return "bike";
    return "car";
  };

  useEffect(() => {
    // Role protection - redirect workers to their home
    const userRole = localStorage.getItem("userRole");
    if (userRole === "worker") {
      setLocation("/worker/home");
      return;
    }

    // Fetch user profile and premium status from API
    const fetchUserProfile = async () => {
      const userId = localStorage.getItem("userId");
      if (userId) {
        try {
          const response = await fetch(getApiUrl(`/api/users/${userId}`));
          if (response.ok) {
            const data = await response.json();
            if (data.name) {
              setUserName(data.name);
            }
          }
        } catch (error) {
          console.error("Failed to fetch user profile:", error);
          // Fallback to localStorage
          const name = localStorage.getItem("userName");
          if (name) setUserName(name);
        }
      }
    };

    fetchUserProfile();

    // Fetch coming soon mode setting
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

    // Fetch support phone and email from settings
    const fetchSupportSettings = async () => {
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
      } catch (error) {
        console.error("Failed to fetch support settings:", error);
      }
    };
    fetchSupportSettings();
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

    // Initial fetch of notifications
    fetchNotifications();

    // Sync city to database
    const syncCityToDatabase = async () => {
      const sessionToken = localStorage.getItem("sessionToken");
      const savedCityName = localStorage.getItem("selectedServiceAreaName") || localStorage.getItem("userDetectedCity");
      if (sessionToken && savedCityName) {
        try {
          await fetch(getApiUrl("/api/users/me"), {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${sessionToken}`
            },
            body: JSON.stringify({ city: savedCityName }),
          });
        } catch (e) {
          console.error("Failed to sync user city:", e);
        }
      }
    };
    syncCityToDatabase();
  }, [setLocation]);

  // Refetch notifications when the sheet opens
  useEffect(() => {
    if (notificationsOpen) {
      fetchNotifications();
    }
  }, [notificationsOpen]);

  // Auto-detect city from GPS location or use saved location from signup
  useEffect(() => {
    if (cities.length === 0) return;

    // Check if city already saved
    const savedCity = localStorage.getItem("selectedCity");
    if (savedCity && cities.find(c => c.id === savedCity)) {
      setSelectedCity(savedCity);
      return;
    }

    // Check for auto-detected city from location setup
    const detectedCityName = localStorage.getItem("userDetectedCity");
    if (detectedCityName) {
      const matchedCity = cities.find(c =>
        c.name.toLowerCase() === detectedCityName.toLowerCase() ||
        detectedCityName.toLowerCase().includes(c.name.toLowerCase()) ||
        c.name.toLowerCase().includes(detectedCityName.toLowerCase())
      );
      if (matchedCity) {
        setSelectedCity(matchedCity.id);
        localStorage.setItem("selectedCity", matchedCity.id);
        return;
      }
    }

    // No city selected - user can select from the location popup
    // Don't auto-default to any city
  }, [cities]);

  const [locationNotAvailable, setLocationNotAvailable] = useState(false);
  const [detectedLocationName, setDetectedLocationName] = useState("");

  const handleLocateMe = () => {
    setIsLocatingGPS(true);
    setLocationNotAvailable(false);
    setDetectedLocationName("");

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude, accuracy } = position.coords;
          console.log(`Location accuracy: ${accuracy}m, Lat: ${latitude}, Lng: ${longitude}`);

          try {
            const response = await fetch(
              `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&addressdetails=1&accept-language=en`
            );
            const data = await response.json();
            const cityName = data.address?.city || data.address?.town || data.address?.village || data.address?.county || data.address?.state_district || "";
            const stateName = data.address?.state || "";
            const displayLocation = cityName || "Unknown location";

            setDetectedLocationName(displayLocation);

            // Normalize city names for matching
            const normalizeCity = (name: string) => {
              const normalized = name.toLowerCase().trim();
              if (normalized.includes("bengaluru") || normalized.includes("bangalore")) return "bangalore";
              if (normalized.includes("mumbai") || normalized.includes("bombay")) return "mumbai";
              if (normalized.includes("chennai") || normalized.includes("madras")) return "chennai";
              if (normalized.includes("kolkata") || normalized.includes("calcutta")) return "kolkata";
              if (normalized.includes("delhi") || normalized.includes("new delhi")) return "delhi";
              return normalized;
            };

            const normalizedDetected = cityName ? normalizeCity(cityName) : "";
            const matchedCity = cities.find(c => {
              const normalizedAdmin = normalizeCity(c.name);
              return normalizedAdmin === normalizedDetected ||
                normalizedDetected.includes(normalizedAdmin) ||
                normalizedAdmin.includes(normalizedDetected);
            });

            if (matchedCity) {
              setPendingCity(matchedCity.id);
              setLocationNotAvailable(false);
              localStorage.setItem("userLatitude", latitude.toString());
              localStorage.setItem("userLongitude", longitude.toString());
              localStorage.setItem("userDetectedAddress", data.display_name || "");
              localStorage.setItem("userDetectedCity", cityName);
              localStorage.setItem("userState", stateName);
              localStorage.setItem("selectedServiceAreaName", matchedCity.name);
            } else {
              // City not in service area
              setPendingCity("");
              setLocationNotAvailable(true);
            }
          } catch (error) {
            console.error("Error getting location:", error);
            setLocationNotAvailable(true);
            setDetectedLocationName("Unable to detect location");
          } finally {
            setIsLocatingGPS(false);
          }
        },
        (error) => {
          console.error("Geolocation error:", error);
          setIsLocatingGPS(false);
          setLocationNotAvailable(true);
          setDetectedLocationName("Location access denied");
          triggerLocationPermissionError("Location access was denied or unavailable. Please allow location permissions to find nearby spots.");
        },
        {
          enableHighAccuracy: true,
          timeout: 30000,
          maximumAge: 0
        }
      );
    } else {
      setIsLocatingGPS(false);
      setLocationNotAvailable(true);
      setDetectedLocationName("Location not supported");
    }
  };

  useEffect(() => {
    const handleLocationUpdated = () => {
      handleLocateMe();
    };

    window.addEventListener("spotly-location-updated", handleLocationUpdated);
    return () => {
      window.removeEventListener("spotly-location-updated", handleLocationUpdated);
    };
  }, []);

  const handleLocationOk = () => {
    if (pendingCity) {
      handleCityChange(pendingCity);
      // Clear the "city not served" message when user manually selects a city
      setCityNotServed(false);
    }
    setShowLocationPopup(false);
  };

  const handleLocationClear = () => {
    setPendingCity("");
    setSelectedCity("");
    localStorage.removeItem("selectedCity");
    localStorage.removeItem("userLatitude");
    localStorage.removeItem("userLongitude");
    localStorage.removeItem("userDetectedAddress");
    localStorage.removeItem("userDetectedCity");
    localStorage.removeItem("userState");
    localStorage.removeItem("selectedServiceAreaName");
    setShowLocationPopup(false);
  };

  const handleCityChange = (cityId: string) => {
    setSelectedCity(cityId);
    localStorage.setItem("selectedCity", cityId);
    const cityName = cities.find(c => c.id === cityId)?.name || "";
    localStorage.setItem("userDetectedCity", cityName);
    localStorage.setItem("selectedServiceAreaName", cityName);
    localStorage.removeItem("userDetectedAddress");
    localStorage.removeItem("userLatitude");
    localStorage.removeItem("userLongitude");
    setCityNotServed(false);
  };

  const selectedCityName = cities.find(c => c.id === selectedCity)?.name || "Select City";

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

  // Full-screen Coming Soon page without header/footer
  if (comingSoonMode === true) {
    return (
      <div className="min-h-screen bg-white flex flex-col relative overflow-hidden">
        {/* Top curved royal blue section */}
        <div
          className="pt-16 pb-32 px-6 relative"
          style={{ background: "linear-gradient(135deg, #1e3a8a 0%, #3b2fad 35%, #6d28d9 70%, #7c3aed 100%)" }}
        >
          <div className="absolute bottom-0 left-0 right-0 h-16 bg-white rounded-t-[3rem]"></div>

          {/* Decorative circles */}
          <div className="absolute top-10 right-10 w-20 h-20 border-2 border-white/20 rounded-full"></div>
          <div className="absolute top-24 right-6 w-8 h-8 bg-white/10 rounded-full"></div>
          <div className="absolute top-8 left-8 w-4 h-4 bg-yellow-400 rounded-full animate-pulse"></div>

          {/* Header */}
          <div className="text-center relative z-10">
            <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full mb-6">
              <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
              <span className="text-white/90 text-xs font-medium">Coming Soon</span>
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">Spotly</h1>
            <p className="text-blue-200 text-sm">Car & Bike Parking</p>
          </div>
        </div>

        {/* Main content */}
        <div className="flex-1 px-6 -mt-8 relative z-10">
          {/* Rocket card */}
          <div className="bg-white rounded-3xl shadow-xl shadow-blue-200/50 p-8 mb-6 border border-blue-100">
            <div className="flex items-center justify-center mb-6">
              <div className="relative">
                <div className="w-24 h-24 bg-gradient-to-br from-blue-100 to-blue-50 rounded-full flex items-center justify-center">
                  <Rocket className="w-12 h-12 text-primary" />
                </div>
                <div className="absolute -top-1 -right-1 w-6 h-6 bg-yellow-400 rounded-full flex items-center justify-center">
                  <Sparkles className="w-3 h-3 text-yellow-800" />
                </div>
              </div>
            </div>
            <h2 className="text-xl font-bold text-gray-900 text-center mb-3">
              We're Launching Soon!
            </h2>
            <p className="text-gray-500 text-center text-sm leading-relaxed">
              Find and list car & bike parking spaces in your city. Safe, convenient, and affordable parking solutions coming soon.
            </p>
          </div>

          {/* Services preview */}
          <div className="mb-6">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4 text-center">What's Coming</p>
            <div className="flex justify-center gap-3">
              <div className="flex flex-col items-center">
                <div className="w-14 h-14 bg-green-100 rounded-2xl flex items-center justify-center mb-2">
                  <Car className="w-7 h-7 text-green-600" />
                </div>
                <span className="text-xs text-gray-600">Car Parking</span>
              </div>
              <div className="flex flex-col items-center">
                <div className="w-14 h-14 bg-blue-100 rounded-2xl flex items-center justify-center mb-2">
                  <Bike className="w-7 h-7 text-blue-600" />
                </div>
                <span className="text-xs text-gray-600">Bike Parking</span>
              </div>
              <div className="flex flex-col items-center">
                <div className="w-14 h-14 bg-blue-100 rounded-2xl flex items-center justify-center mb-2">
                  <ParkingCircle className="w-7 h-7 text-blue-600" />
                </div>
                <span className="text-xs text-gray-600">Car & Bike</span>
              </div>
            </div>
          </div>

          {/* Bottom message */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-5 text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                <Bell className="w-4 h-4 text-white" />
              </div>
            </div>
            <p className="text-gray-700 font-medium text-sm">Stay Tuned!</p>
            <p className="text-gray-500 text-xs mt-1">We'll notify you when we launch</p>
          </div>
        </div>

        {/* Bottom decoration */}
        <div className="h-6 bg-gradient-to-t from-blue-50 to-transparent"></div>
      </div>
    );
  }

  const exactAddress = localStorage.getItem("userDetectedAddress");
  const userCity = localStorage.getItem("userDetectedCity") || localStorage.getItem("selectedServiceAreaName") || "";
  const userState = localStorage.getItem("userState") || "";
  const locationLabel = getSingleWordLocation(exactAddress || "", userCity);

  return (
    <MobileLayout showNav userType="customer">
      <div className="pb-8 bg-gray-100 min-h-full">
        {/* Sticky Header - appears on scroll */}
        <div
          className={`fixed top-0 left-0 right-0 z-50 px-6 pt-[calc(0.75rem+env(safe-area-inset-top,0px))] pb-3 shadow-lg transition-all duration-300 ${isScrolled ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0'
            }`}
          style={{ background: "linear-gradient(135deg, #1e3a8a 0%, #3b2fad 35%, #6d28d9 70%, #7c3aed 100%)" }}
        >
          <div className="flex items-center justify-between max-w-md mx-auto">
            <div className="flex flex-col items-start">
              <div className="flex items-center gap-1.5">
                <MapPin size={13} className="text-blue-200/80" />
                <span className="text-blue-200/90 text-sm font-medium tracking-wide">{locationLabel}</span>
              </div>
              {isGuest() && (
                <span
                  className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 bg-yellow-400/90 text-[#0b193d] text-[10px] font-bold rounded-full uppercase tracking-wider"
                  data-testid="badge-guest-customer-sticky"
                >
                  <User size={10} /> Login as Guest
                </span>
              )}
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowCustomerCare(true)}
                className="w-11 h-11 rounded-2xl bg-white/15 backdrop-blur-md border border-white/20 flex items-center justify-center text-white hover:bg-white/25 transition-all shadow-lg shadow-blue-950/20"
                data-testid="button-customer-care-home-sticky"
              >
                <Phone size={18} className="drop-shadow-sm" />
              </button>
              <button
                onClick={() => setNotificationsOpen(true)}
                className="w-11 h-11 rounded-2xl bg-white/15 backdrop-blur-md border border-white/20 flex items-center justify-center text-white hover:bg-white/25 transition-all shadow-lg shadow-blue-950/20 relative"
                data-testid="button-notifications-home-sticky"
              >
                <Bell size={18} className="drop-shadow-sm" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-gradient-to-r from-red-500 to-pink-500 rounded-full ring-2 ring-white flex items-center justify-center text-[10px] font-bold">{unreadCount > 9 ? '9+' : unreadCount}</span>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Gradient Header */}
        <div
          className="px-6 pt-[calc(1.5rem+env(safe-area-inset-top,0px))] pb-12 relative overflow-hidden"
          style={{ background: "linear-gradient(135deg, #1e3a8a 0%, #3b2fad 35%, #6d28d9 70%, #7c3aed 100%)" }}
        >
          {/* Decorative elements */}
          <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-blue-400/30 to-indigo-500/20 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-tr from-indigo-500/25 to-blue-500/15 rounded-full blur-2xl -translate-x-1/2 translate-y-1/2"></div>
          <div className="absolute top-12 left-1/3 w-20 h-20 bg-blue-400/20 rounded-full blur-2xl"></div>
          <div className="absolute top-6 right-1/4 w-12 h-12 bg-yellow-400/15 rounded-full blur-xl"></div>
          <div className="absolute bottom-8 right-8 w-16 h-16 bg-cyan-400/15 rounded-full blur-xl"></div>
          {/* Subtle pattern overlay */}
          <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 20% 80%, white 1px, transparent 1px), radial-gradient(circle at 80% 20%, white 1px, transparent 1px)', backgroundSize: '60px 60px' }}></div>

          {/* Header content */}
          <div className="relative z-10 flex items-start justify-between mb-6">
            <div>
              {!isGuest() && (
                <div>
                  <p className="text-[11px] font-semibold text-blue-200/80 uppercase tracking-wider mb-0.5" data-testid="text-time-greeting-customer">{getTimeGreeting()}</p>
                  <h2 className="text-2xl font-bold text-white drop-shadow-sm capitalize" data-testid="text-user-name-customer">Welcome back, {capitalizeName(userName || localStorage.getItem("userName") || "User")}</h2>
                </div>
              )}
              <div className="flex items-center gap-1.5 mt-1" data-testid="text-location-label-customer">
                <MapPin size={13} className="text-blue-200/80" />
                <p className="text-blue-200/90 text-sm font-medium tracking-wide">{locationLabel}</p>
              </div>
              {isGuest() && (
                <span
                  className="inline-flex items-center gap-1 mt-1.5 px-2 py-0.5 bg-yellow-400/90 text-[#0b193d] text-[10px] font-bold rounded-full uppercase tracking-wider"
                  data-testid="badge-guest-customer"
                >
                  <User size={10} /> Login as Guest
                </span>
              )}
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowCustomerCare(true)}
                className="w-11 h-11 rounded-2xl bg-white/15 backdrop-blur-md border border-white/20 flex items-center justify-center text-white hover:bg-white/25 transition-all shadow-lg shadow-blue-950/20"
                data-testid="button-customer-care-home"
              >
                <Phone size={18} className="drop-shadow-sm" />
              </button>
              <button
                onClick={() => setNotificationsOpen(true)}
                className="w-11 h-11 rounded-2xl bg-white/15 backdrop-blur-md border border-white/20 flex items-center justify-center text-white hover:bg-white/25 transition-all shadow-lg shadow-blue-950/20 relative"
                data-testid="button-notifications-home"
              >
                <Bell size={18} className="drop-shadow-sm" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-gradient-to-r from-red-500 to-pink-500 rounded-full ring-2 ring-white flex items-center justify-center text-[10px] font-bold">{unreadCount > 9 ? '9+' : unreadCount}</span>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Main content area with overlap */}
        <div className="px-6 -mt-4 relative z-10 md:max-w-6xl md:mx-auto">
          {/* Quick Stats */}
          <div className="bg-white rounded-2xl shadow-lg shadow-blue-100/50 py-2.5 px-3 mb-4 border border-blue-50 md:py-4 md:px-8 md:mb-6">
            <div className="flex items-center justify-around md:gap-4">
              <div className="text-center flex-1">
                <div className="w-8 h-8 md:w-10 md:h-10 bg-green-100 rounded-xl flex items-center justify-center mx-auto mb-1 transition-transform hover:scale-105">
                  <Rocket className="w-4 h-4 md:w-5 md:h-5 text-green-600" />
                </div>
                <p className="text-[11px] md:text-xs font-semibold text-gray-700">Instant</p>
                <p className="text-[9px] md:text-[10px] text-gray-400">Connect</p>
              </div>
              <div className="w-px h-6 md:h-8 bg-gray-200"></div>
              <div className="text-center flex-1">
                <div className="w-8 h-8 md:w-10 md:h-10 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-1 transition-transform hover:scale-105">
                  <MapPin className="w-4 h-4 md:w-5 md:h-5 text-blue-600" />
                </div>
                <p className="text-[11px] md:text-xs font-semibold text-gray-700">Nearby</p>
                <p className="text-[9px] md:text-[10px] text-gray-400">Seekers</p>
              </div>
              <div className="w-px h-6 md:h-8 bg-gray-200"></div>
              <div className="text-center flex-1">
                <div className="w-8 h-8 md:w-10 md:h-10 bg-orange-100 rounded-xl flex items-center justify-center mx-auto mb-1 transition-transform hover:scale-105">
                  <ParkingCircle className="w-4 h-4 md:w-5 md:h-5 text-orange-600" />
                </div>
                <p className="text-[11px] md:text-xs font-semibold text-gray-700">24/7</p>
                <p className="text-[9px] md:text-[10px] text-gray-400">Parking</p>
              </div>
            </div>
          </div>

          {/* Hidden city selector for form functionality */}
          <div className="hidden">
            <Select value={selectedCity} onValueChange={handleCityChange}>
              <SelectTrigger data-testid="select-city">
                <SelectValue placeholder="Select your city" />
              </SelectTrigger>
              <SelectContent>
                {cities.map((city) => (
                  <SelectItem key={city.id} value={city.id} data-testid={`city-option-${city.id}`}>
                    {city.name}, {city.state}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* City Not Served Message */}
        {cityNotServed && (
          <div className="px-6 mb-8 md:max-w-6xl md:mx-auto">
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 text-center md:p-8">
              <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <MapPin className="w-8 h-8 text-amber-600" />
              </div>
              <h3 className="text-lg font-bold text-amber-800 mb-2">
                Service Not Available
              </h3>
              <p className="text-amber-700 mb-4">
                We don't provide services in <span className="font-semibold">{detectedCityName || "your location"}</span> yet. We are expanding soon!
              </p>
              <p className="text-sm text-amber-600 mb-4">
                Currently available in: {cities.slice(0, 5).map(c => c.name).join(", ")}{cities.length > 5 ? ` +${cities.length - 5} more` : ""}
              </p>
              <button
                onClick={() => setShowCitySelector(true)}
                className="bg-primary text-white font-semibold px-6 py-3 rounded-xl hover:bg-primary/90 transition-colors"
                data-testid="button-select-city-unsupported"
              >
                Select a Nearby City
              </button>
            </div>
          </div>
        )}

        {/* My Space Lists */}
        {!cityNotServed && <div className="px-6 mb-8 md:max-w-6xl md:mx-auto">
          {myBookings.length > 3 && (
            <button
              type="button"
              onClick={() => setLocation("/customer/bookings")}
              className="w-full mb-4 py-3 px-4 bg-white hover:bg-blue-50/50 border-2 border-dashed border-blue-400 active:scale-[0.99] transition-all rounded-full md:rounded-2xl flex items-center justify-center gap-2 cursor-pointer shadow-xs md:py-4 md:hover:shadow-md"
              data-testid="button-add-new-space-top"
            >
              <span className="text-[#241e98] font-bold text-sm sm:text-base flex items-center gap-1.5">
                <span className="text-lg leading-none font-extrabold">+</span> Add New Space
              </span>
            </button>
          )}

          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#241e98] to-[#3e3ab3] flex items-center justify-center shadow-sm">
                <ParkingCircle size={16} className="text-white" />
              </div>
              <h3 className="text-base md:text-lg font-bold text-neutral-900">My Space Lists</h3>
            </div>
            <div className="flex items-center gap-2">
              {myBookings.length > 0 && (
                <span className="bg-gradient-to-r from-[#241e98] to-[#3e3ab3] text-white text-xs font-bold px-3 py-1 rounded-full shadow-sm">{myBookings.length}</span>
              )}
            </div>
          </div>
          <div className="relative h-[3px] rounded-full bg-blue-100 mb-5 overflow-hidden">
            <motion.div
              className="absolute inset-y-0 left-0 bg-gradient-to-r from-[#241e98] via-[#3b82f6] to-[#241e98] rounded-full"
              style={{ width: "40%" }}
              animate={{ x: ["-100%", "350%"] }}
              transition={{ duration: 2.5, repeat: 2, ease: "easeInOut" }}
            />
          </div>

          {myBookings.length === 0 ? (
            <>
              {/* No Spaces Posted Yet Card - Desktop Optimized 2-Column Hero */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="relative overflow-hidden bg-white rounded-3xl border border-slate-100 p-6 text-center md:text-left shadow-xl shadow-[#241e98]/5 mb-6 w-full md:p-10"
              >
                <div className="relative flex flex-col md:grid md:grid-cols-12 md:gap-8 md:items-center">

                  {/* Left Column (Desktop 7 cols): Badge, Title, Subtitle, Features */}
                  <div className="flex flex-col items-center md:items-start md:col-span-7">
                    {/* Badge */}
                    <div className="inline-flex items-center gap-1.5 bg-[#ECEBFF] text-[#241e98] text-[10px] md:text-xs font-black uppercase px-3.5 py-1.5 rounded-full border border-[#3e3ab3]/20 tracking-wider mb-3">
                      <Sparkles size={12} />
                      <span>GET STARTED</span>
                    </div>

                    {/* Title & Subtitle */}
                    <h4 className="text-xl md:text-2xl lg:text-3xl font-black text-slate-900 mb-2 leading-tight" data-testid="text-no-spaces">
                      No Spaces Posted Yet
                    </h4>
                    <p className="text-slate-500 text-xs md:text-sm lg:text-base leading-relaxed max-w-[280px] md:max-w-none mb-6">
                      Dear Space Owner, rent your empty parking space and earn steady monthly rental income.
                    </p>

                    {/* Features Row */}
                    <div className="flex items-center justify-around md:justify-start gap-4 md:gap-8 w-full pt-4 border-t border-slate-100">
                      <div className="flex flex-col md:flex-row items-center md:gap-2 text-center md:text-left">
                        <div className="w-8 h-8 md:w-9 md:h-9 rounded-xl bg-[#ECEBFF] flex items-center justify-center text-[#241e98] shrink-0">
                          <Clock size={16} />
                        </div>
                        <span className="text-[10px] md:text-xs font-bold text-slate-700">Quick Setup</span>
                      </div>
                      <div className="flex flex-col md:flex-row items-center md:gap-2 text-center md:text-left">
                        <div className="w-8 h-8 md:w-9 md:h-9 rounded-xl bg-[#ECEBFF] flex items-center justify-center text-[#241e98] shrink-0">
                          <IndianRupee size={16} />
                        </div>
                        <span className="text-[10px] md:text-xs font-bold text-slate-700">Earn Rent</span>
                      </div>
                      <div className="flex flex-col md:flex-row items-center md:gap-2 text-center md:text-left">
                        <div className="w-8 h-8 md:w-9 md:h-9 rounded-xl bg-[#ECEBFF] flex items-center justify-center text-[#241e98] shrink-0">
                          <TrendingUp size={16} />
                        </div>
                        <span className="text-[10px] md:text-xs font-bold text-slate-700">High Demand</span>
                      </div>
                    </div>
                  </div>

                  {/* Right Column (Desktop 5 cols): Hero Image & Add New Space CTA */}
                  <div className="mt-6 md:mt-0 md:col-span-5 flex flex-col items-center justify-center">
                    {/* Hero Card Image */}
                    <div className="relative flex items-center justify-center w-full mb-3">
                      <motion.img
                        src={heroCardImg}
                        alt="Find parking near you with Spotly"
                        className="w-full max-w-[280px] md:max-w-[340px] h-auto object-contain drop-shadow-lg"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.5, ease: "easeOut" }}
                      />
                    </div>

                    {/* Add New Space Button */}
                    <motion.button
                      onClick={() => { if (!requireLogin("post a parking space")) return; setLocation("/customer/bookings"); }}
                      className="w-full max-w-[260px] md:max-w-none flex items-center justify-center gap-2.5 py-3.5 md:py-4 px-6 bg-transparent border-2 border-dashed border-[#241e98] text-[#241e98] hover:bg-[#241e98] hover:text-white font-extrabold text-sm md:text-base rounded-full md:rounded-2xl active:scale-95 transition-all md:shadow-md cursor-pointer group"
                      whileTap={{ scale: 0.97 }}
                      data-testid="button-add-space"
                    >
                      <span className="w-5 h-5 md:w-6 md:h-6 rounded-full bg-[#241e98]/10 group-hover:bg-white/20 text-[#241e98] group-hover:text-white flex items-center justify-center text-xs md:text-sm font-black">+</span>
                      <span>Add New Space</span>
                      <ArrowRight size={18} className="text-[#241e98] group-hover:text-white transition-transform group-hover:translate-x-1" />
                    </motion.button>
                  </div>


                </div>
              </motion.div>

              {/* Turn Your Empty Space Into Monthly Income Banner Card - Desktop Optimized */}
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="w-full"
              >
                <div
                  className="relative overflow-hidden rounded-3xl p-6 md:p-10 text-white shadow-2xl shadow-[#1e3a8a]/25"
                  style={{ background: "linear-gradient(135deg, #1e3a8a 0%, #3b2fad 35%, #6d28d9 70%, #7c3aed 100%)" }}
                >
                  {/* Decorative background shapes */}
                  <div className="absolute top-0 right-0 w-64 h-64 bg-[#3e3ab3]/40 rounded-full blur-3xl -translate-y-12 translate-x-12" />
                  <div className="absolute bottom-0 left-0 w-48 h-48 bg-amber-400/20 rounded-full blur-3xl translate-y-10 -translate-x-8" />

                  <div className="relative z-10 flex flex-col md:grid md:grid-cols-12 md:gap-8 md:items-center">

                    {/* Left Column (Desktop 8 cols): Text, Features & CTA */}
                    <div className="md:col-span-8">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/25">
                          <IndianRupee size={16} className="text-amber-300" />
                        </div>
                        <div className="flex items-center gap-1.5 text-amber-300">
                          <Sparkles size={14} />
                          <span className="text-[11px] md:text-xs font-extrabold uppercase tracking-wider">START EARNING TODAY</span>
                        </div>
                      </div>

                      <h3 className="text-xl md:text-2xl lg:text-3xl font-black text-white leading-tight mb-2 md:max-w-none">
                        Turn Your Empty Space Into <span className="text-[#FFC107]">Monthly Income!</span>
                      </h3>
                      <p className="text-xs md:text-sm lg:text-base text-white/85 leading-relaxed mb-6 md:max-w-xl">
                        Snap a photo of your unused parking spot, post it in seconds, and let seekers find you. It's that simple!
                      </p>

                      <div className="grid grid-cols-3 gap-2.5 md:gap-4 mb-6">
                        {[
                          { icon: Wallet, label: "Earn Rent", sub: "Monthly Direct Payout" },
                          { icon: TrendingUp, label: "High Demand", sub: "Growing Community" },
                          { icon: Star, label: "Easy Setup", sub: "2 Minute Listing" },
                        ].map((item) => (
                          <div
                            key={item.label}
                            className="bg-white/15 backdrop-blur-md rounded-2xl p-2.5 md:p-4 text-center md:text-left border border-white/15 shadow-sm"
                          >
                            <item.icon size={18} className="text-amber-300 mx-auto md:mx-0 mb-1.5" />
                            <p className="text-[11px] md:text-xs font-black text-white leading-tight">{item.label}</p>
                            <p className="text-[9px] md:text-[10px] text-white/75 mt-0.5">{item.sub}</p>
                          </div>
                        ))}
                      </div>

                      <motion.button
                        className="w-full md:w-auto flex md:inline-flex items-center justify-center gap-2.5 bg-gradient-to-r from-[#FFB800] to-[#FFA000] hover:from-[#FFA000] hover:to-[#FF8F00] text-slate-950 font-black rounded-full md:rounded-2xl py-3.5 md:py-4 px-8 shadow-xl shadow-amber-500/30 active:scale-95 transition-all text-xs md:text-sm cursor-pointer"
                        style={{ display: "flex", alignItems: "center", justifyContent: "center" }}
                        whileTap={{ scale: 0.97 }}
                        onClick={() => { if (!requireLogin("post a parking space")) return; setLocation("/customer/bookings"); }}
                      >
                        <Plus size={18} className="stroke-[3] shrink-0" />
                        <span className="font-black whitespace-nowrap">Post Your First Space</span>
                        <ArrowRight size={16} className="stroke-[3] shrink-0" />
                      </motion.button>
                    </div>

                    {/* Right Column (Desktop 4 cols): 3D Wallet Illustration */}
                    <div className="hidden md:flex md:col-span-4 items-center justify-center">
                      <div className="w-48 h-48 lg:w-60 lg:h-60 relative pointer-events-none drop-shadow-2xl hover:scale-105 transition-transform">
                        <svg viewBox="0 0 100 100" fill="none" className="w-full h-full">
                          {/* Gold Coins Stack */}
                          <ellipse cx="22" cy="72" rx="14" ry="6" fill="#D97706" />
                          <ellipse cx="22" cy="70" rx="14" ry="6" fill="#F59E0B" />
                          <ellipse cx="22" cy="65" rx="14" ry="6" fill="#FBBF24" />
                          <ellipse cx="22" cy="60" rx="14" ry="6" fill="#FDE047" />
                          <text x="22" y="63" textAnchor="middle" fill="#78350F" fontSize="7" fontWeight="bold">₹</text>

                          {/* Wallet Body */}
                          <rect x="35" y="30" width="55" height="42" rx="8" fill="#3e3ab3" transform="rotate(-6 60 50)" />
                          <rect x="35" y="30" width="55" height="42" rx="8" fill="#241e98" transform="rotate(-6 60 50)" fillOpacity="0.4" />

                          {/* Wallet Strap & Clasp */}
                          <path d="M72 42 H85 V54 H72 Z" fill="#181363" transform="rotate(-6 60 50)" />
                          <circle cx="78" cy="48" r="3" fill="#F59E0B" transform="rotate(-6 60 50)" />

                          {/* Cash Bills sticking out */}
                          <rect x="42" y="20" width="38" height="22" rx="3" fill="#22C55E" transform="rotate(-18 50 30)" />
                          <rect x="44" y="22" width="34" height="18" rx="2" fill="#4ADE80" transform="rotate(-18 50 30)" />
                          <circle cx="61" cy="31" r="4" fill="#166534" transform="rotate(-18 50 30)" opacity="0.5" />
                        </svg>
                      </div>
                    </div>

                  </div>

                  <div className="relative z-10 mt-6 pt-3 border-t border-white/15 text-center md:text-left">
                    <div className="flex items-center justify-center md:justify-start gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
                      <span className="text-xs text-white/90 font-semibold">People are actively searching for parking near you</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            </>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 py-1 px-1">
              {myBookings.map((booking: any) => {
                const iconType = getParkingIcon(booking.serviceName);
                const rentMatch = booking.comments?.match(/Rent: ₹(\d+)/);
                const rentAmount = rentMatch ? rentMatch[1] : null;
                const descMatch = booking.comments?.match(/\| (.+)/);
                const descText = descMatch ? descMatch[1] : null;
                const postedDate = new Date(booking.bookedAt);
                const locationShort = booking.location?.split(",").slice(0, 2).join(",").trim() || booking.location;

                return (
                  <div
                    key={booking.id}
                    id={`card-space-${booking.id}`}
                    className={`bg-white rounded-3xl border border-blue-100/80 overflow-hidden shadow-lg shadow-blue-950/5 transition-all duration-300 hover:shadow-xl hover:border-blue-200/90 font-sans ${highlightedSpaceId === booking.id ? "highlighted-space-card ring-2 ring-[#0d3da8]" : ""
                      }`}
                    data-testid={`space-card-${booking.id}`}
                  >
                    <div className="p-4 bg-gradient-to-r from-blue-50/70 via-indigo-50/20 to-white border-b border-neutral-100 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#0d3da8] to-[#1a56db] text-white flex items-center justify-center shadow-md shadow-blue-600/25 shrink-0">
                          {iconType === "car" ? (
                            <Car size={22} />
                          ) : iconType === "bike" ? (
                            <Bike size={22} />
                          ) : (
                            <div className="flex items-center gap-0.5">
                              <Car size={16} />
                              <Bike size={14} />
                            </div>
                          )}
                        </div>
                        <div className="min-w-0">
                          <h4 className="font-extrabold text-neutral-900 text-sm sm:text-base leading-tight truncate">
                            {booking.serviceName}
                          </h4>
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200/60 mt-0.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            Active Listing
                          </span>
                        </div>
                      </div>

                      {(interestCounts[booking.id] || 0) > 0 && (
                        <div
                          className="bg-gradient-to-r from-amber-500 to-orange-500 text-white text-[10px] font-extrabold px-2.5 py-1 rounded-full flex items-center gap-1 shadow-sm shrink-0"
                          data-testid={`badge-interest-${booking.id}`}
                        >
                          <ThumbsUp size={10} className="fill-white" />
                          <span>{interestCounts[booking.id]} interested</span>
                        </div>
                      )}
                    </div>

                    <div className="p-4 space-y-2.5">
                      <div className="flex items-center gap-2 text-neutral-700 text-xs font-semibold">
                        <MapPin size={14} className="text-[#0d3da8] shrink-0" />
                        <span className="truncate">{locationShort}</span>
                      </div>

                      <div className="flex items-center gap-2 text-neutral-400 text-[11px] font-medium">
                        <Clock size={13} className="shrink-0" />
                        <span>
                          {postedDate.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })} at {postedDate.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                        </span>
                      </div>

                      {descText && (
                        <p className="text-xs text-neutral-500 bg-neutral-50 p-2.5 rounded-xl border border-neutral-100 line-clamp-2">
                          {descText}
                        </p>
                      )}

                      {rentAmount && (
                        <div className="pt-1 flex items-center justify-between">
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-gradient-to-r from-emerald-50 to-teal-50 text-emerald-700 border border-emerald-200/80 text-xs font-black rounded-xl shadow-2xs">
                            ₹{Number(rentAmount).toLocaleString("en-IN")} / month
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Action Bar */}
                    <div className="p-3 bg-neutral-50/80 border-t border-neutral-100 flex items-center gap-2.5">
                      <button
                        onClick={() => setLocation(`/customer/bookings?edit=${booking.id}`)}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-gradient-to-r from-[#0d3da8] to-[#1a56db] text-white text-xs font-bold rounded-2xl shadow-md shadow-blue-600/20 hover:shadow-lg active:scale-[0.98] transition-all"
                        data-testid={`button-edit-space-${booking.id}`}
                      >
                        <Pencil size={13} />
                        Edit Space
                      </button>
                      <button
                        onClick={() => {
                          setSelectedDeleteReason(null);
                          setOtherDeleteReason("");
                          setDeleteConfirm(booking.id);
                        }}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-rose-50 text-rose-600 hover:bg-rose-100/80 border border-rose-200/80 text-xs font-bold rounded-2xl active:scale-[0.98] transition-all"
                        data-testid={`button-delete-space-${booking.id}`}
                      >
                        <Trash2 size={13} />
                        Delete Space
                      </button>
                    </div>
                  </div>
                );
              })}
              {myBookings.length < totalBookings && (
                <div className="flex flex-col items-center gap-2 py-5">
                  <p className="text-xs text-neutral-400">
                    Showing {myBookings.length} of {totalBookings} spaces
                  </p>
                  <button
                    onClick={() => { vibrate(); loadMoreBookings(); }}
                    disabled={isLoadingMoreBookings}
                    className="flex items-center gap-2.5 px-7 py-3 bg-gradient-to-r from-[#0d3da8] to-[#1d4ed8] text-white text-sm font-bold rounded-full shadow-xl shadow-[#0d3da8]/25 active:scale-95 transition-all disabled:opacity-60"
                    data-testid="button-load-more-bookings"
                  >
                    {isLoadingMoreBookings ? (
                      <>
                        <Loader2 size={16} className="animate-spin" />
                        Loading more spaces...
                      </>
                    ) : (
                      <>
                        <ParkingSquare size={16} />
                        Load More Spaces
                        <ChevronDown size={14} />
                      </>
                    )}
                  </button>
                </div>
              )}
              <button
                onClick={() => setLocation("/customer/bookings")}
                className="w-full flex items-center justify-center gap-2 py-3.5 md:py-4 border-2 border-dashed border-blue-300 text-[#0d3da8] font-semibold rounded-2xl hover:bg-blue-50 active:scale-95 transition-all md:shadow-xs md:hover:shadow-md cursor-pointer"
                data-testid="button-add-more-space"
              >
                <Plus size={18} />
                Add New Space
              </button>

              <div className="mt-4 w-full">
                <div className="relative overflow-hidden bg-gradient-to-br from-green-50 via-emerald-50 to-amber-50 rounded-2xl border border-green-200/60 p-4" style={{ boxShadow: "0 4px 16px rgba(16, 185, 129, 0.12)" }}>
                  <div className="absolute top-1 right-1 opacity-10">
                    <Banknote size={50} className="text-green-700 rotate-12" />
                  </div>
                  <div className="flex items-start gap-3 relative z-10">
                    <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-md">
                      <IndianRupee size={20} className="text-white" />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs font-bold text-green-800 mb-0.5 leading-tight">
                        More Spaces = More Earnings!
                      </p>
                      <p className="text-[11px] text-green-700/80 leading-relaxed">
                        Have another empty spot? Post it now and double your monthly rental income. Seekers are waiting!
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2.5 mt-2.5 pt-2.5 border-t border-green-200/50 relative z-10">
                    <div className="flex items-center gap-1 text-[11px] text-green-700 font-medium">
                      <Wallet size={12} className="text-green-600" />
                      <span>Earn Monthly</span>
                    </div>
                    <div className="w-1 h-1 rounded-full bg-green-400" />
                    <div className="flex items-center gap-1 text-[11px] text-green-700 font-medium">
                      <TrendingUp size={12} className="text-green-600" />
                      <span>High Demand</span>
                    </div>
                    <div className="w-1 h-1 rounded-full bg-green-400" />
                    <div className="flex items-center gap-1 text-[11px] text-green-700 font-medium">
                      <BadgeDollarSign size={12} className="text-green-600" />
                      <span>Quick Setup</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>}

        {/* Marketing Banners / Watermark Section */}
        <div className="w-full mt-10">
          {/* Tagline Watermark Section */}
          <div className="relative bg-neutral-50/60 border-t border-neutral-200 p-8 overflow-hidden min-h-[260px] flex flex-col justify-between w-full">
            {/* Outline drawing watermark */}
            <svg className="absolute inset-0 w-full h-full opacity-[0.06] pointer-events-none select-none" viewBox="0 0 400 300" xmlns="http://www.w3.org/2000/svg">
              <path d="M 0 50 L 400 50 M 0 150 L 400 150 M 0 250 L 400 250" stroke="#888" strokeWidth="0.5" strokeDasharray="4 4" fill="none" />
              <path d="M 100 0 L 100 300 M 250 0 L 250 300" stroke="#888" strokeWidth="0.5" strokeDasharray="4 4" fill="none" />

              {/* Big Car Outline */}
              <g transform="translate(240, 20) scale(0.85)" stroke="#444" strokeWidth="1.5" fill="none" strokeLinecap="round">
                <path d="M 10 30 Q 20 15 35 15 L 75 15 Q 90 15 100 30 L 115 35 Q 120 40 120 45 L 120 60 L 5 60 L 5 45 Q 5 40 10 30 Z" />
                <circle cx="30" cy="60" r="12" />
                <circle cx="90" cy="60" r="12" />
              </g>

              {/* Big Motorcycle Outline */}
              <g transform="translate(15, 100) scale(0.85)" stroke="#444" strokeWidth="1.5" fill="none" strokeLinecap="round">
                <circle cx="30" cy="80" r="20" />
                <circle cx="110" cy="80" r="20" />
                <path d="M 30 80 L 60 80 L 80 50 L 110 80 M 60 80 L 70 50 L 45 45 L 30 80" />
                <path d="M 45 45 L 75 45" strokeWidth="2" />
                <circle cx="65" cy="15" r="10" />
                <path d="M 65 25 L 60 50 L 75 80" />
                <path d="M 60 35 L 85 45" />
              </g>

              {/* Location Pin */}
              <g transform="translate(30, 15) scale(0.7)" stroke="#444" strokeWidth="1.5" fill="none">
                <path d="M12 2 C8.13 2 5 5.13 5 9 c0 5.25 7 13 7 13 s7 -7.75 7 -13 c0 -3.87 -3.13 -7 -7 -7 z" />
                <circle cx="12" cy="9" r="3" />
              </g>

              {/* Landmark Dome */}
              <g transform="translate(170, 95) scale(0.5)" stroke="#444" strokeWidth="1.2" fill="none" strokeLinecap="round">
                <path d="M 20 80 L 120 80 L 120 40 L 20 40 Z" />
                <path d="M 50 40 Q 70 10 90 40 Z" />
                <path d="M 69 10 L 71 10 L 70 2" />
                <path d="M 10 80 L 15 80 L 15 20 L 10 20" />
                <path d="M 125 80 L 130 80 L 130 20 L 125 20" />
              </g>

              {/* Auto Rickshaw */}
              <g transform="translate(280, 110) scale(0.6)" stroke="#444" strokeWidth="1.5" fill="none" strokeLinecap="round">
                <path d="M 5 60 L 20 20 L 70 20 L 85 45 L 85 70 L 5 70 Z" />
                <circle cx="25" cy="70" r="12" />
                <circle cx="65" cy="70" r="12" />
                <path d="M 45 20 L 45 70 M 5 45 L 85 45" />
              </g>

              {/* Parking Circle Sign "P" */}
              <g transform="translate(30, 210) scale(0.85)" stroke="#444" strokeWidth="1.5" fill="none">
                <circle cx="20" cy="20" r="18" />
                <path d="M 16 28 L 16 12 L 23 12 C 26.5 12, 28 14, 28 17 C 28 20, 26.5 22, 23 22 L 16 22 M 16 12 L 23 12" strokeWidth="2" strokeLinecap="round" />
              </g>

              {/* Bicycle Outline */}
              <g transform="translate(140, 205) scale(0.85)" stroke="#444" strokeWidth="1.5" fill="none" strokeLinecap="round">
                <circle cx="20" cy="40" r="15" />
                <circle cx="80" cy="40" r="15" />
                <path d="M 20 40 L 45 40 L 65 15 M 45 40 L 55 15 M 55 15 L 80 40 M 35 15 L 58 15 M 65 15 L 75 10" />
              </g>

              {/* Parking Square Sign "P" */}
              <g transform="translate(290, 205) scale(0.85)" stroke="#444" strokeWidth="1.5" fill="none">
                <rect x="2" y="2" width="36" height="36" rx="6" />
                <path d="M 14 26 L 14 10 L 22 10 C 25.5 10, 27 12, 27 15 C 27 18, 25.5 20, 22 20 L 14 20" strokeWidth="2" strokeLinecap="round" />
              </g>
            </svg>

            {/* Foreground Brand Info */}
            <div className="relative z-10 space-y-2">
              <h1 className="text-[42px] font-sans tracking-tight leading-[1] font-medium italic text-neutral-400">
                #goSpotly
              </h1>
              <p className="text-xs font-semibold text-neutral-400/80 leading-relaxed max-w-[280px]">
                India's Quickest Way to Find Car & Bike Parking Spaces
              </p>
            </div>

            <div className="relative z-10 space-y-1 mt-3 border-t border-neutral-200/50 pt-2.5">
              <div className="text-[10px] font-medium text-neutral-400">
                Made for India
              </div>
              <div className="text-[10px] font-medium text-neutral-400">
                Crafted in Bengaluru by Heeraa Tech.
              </div>
            </div>
          </div>
        </div>

        {/* Notifications Sheet */}
        <Sheet open={notificationsOpen} onOpenChange={setNotificationsOpen}>
          <SheetContent side="right" overlayClassName="bg-slate-900/50 backdrop-blur-xs" className="w-[70vw] p-0 bg-white shadow-2xl border-none">
            <SheetHeader
              className="border-b px-4 pb-4 sticky top-0 bg-white flex flex-row items-center justify-between"
              style={{ paddingTop: 'calc(1rem + env(safe-area-inset-top, 0px))' }}
            >
              <SheetTitle className="text-lg font-bold">Notifications</SheetTitle>
              {notifications.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleClearNotifications}
                  disabled={isClearingNotifications}
                  className="text-red-500 hover:text-red-600 hover:bg-red-50 text-xs"
                  data-testid="button-clear-notifications-home"
                >
                  {isClearingNotifications ? "Clearing..." : "Clear All"}
                </Button>
              )}
            </SheetHeader>

            <div className="overflow-y-auto h-[calc(100vh-100px)]">
              {notifications.length === 0 ? (
                <div className="p-8 text-center text-neutral-500">
                  <Bell className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p className="text-sm">No notifications yet</p>
                </div>
              ) : (
                <div className="divide-y">
                  {notifications.map((notification) => (
                    <div
                      key={notification.id}
                      onClick={async () => {
                        try {
                          await fetch(getApiUrl(`/api/notifications/${notification.id}/read`), { method: "PATCH" });
                        } catch (err) {
                          console.error("Failed to mark notification as read:", err);
                        }
                        setNotificationsOpen(false);
                        if (notification.bookingId) {
                          window.location.href = `/customer/home?highlight=${notification.bookingId}`;
                        }
                      }}
                      className={`p-4 cursor-pointer transition-colors hover:bg-neutral-50 ${!notification.isRead ? "bg-primary/5" : ""}`}
                      data-testid={`notification-home-${notification.id}`}
                    >
                      <div className="flex gap-3 items-start">
                        <div className="text-xl mt-1">{getNotificationIcon(notification.type)}</div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-sm text-neutral-900">
                              {notification.title}
                            </h3>
                            {!notification.isRead && (
                              <span className="w-2 h-2 bg-primary rounded-full"></span>
                            )}
                          </div>
                          <p className="text-xs text-neutral-600 mt-1 line-clamp-2">
                            {notification.message}
                          </p>
                          <p className="text-xs text-neutral-400 mt-2">
                            {formatTimestamp(notification.createdAt)}
                          </p>
                        </div>
                        {!notification.isRead && (
                          <Check className="w-4 h-4 text-primary flex-shrink-0 mt-1" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </SheetContent>
        </Sheet>

      </div>

      <AnimatePresence>
        {showCustomerCare && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center px-6" onClick={() => setShowCustomerCare(false)}>
            <motion.div initial={{ scale: 0.85, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.85, opacity: 0 }} className="bg-white rounded-3xl p-6 text-center shadow-2xl max-w-sm w-full" onClick={(e) => e.stopPropagation()}>
              <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-4">
                <Phone size={32} className="text-primary" />
              </div>
              <h3 className="text-lg font-bold text-neutral-900 mb-1">Help & Support</h3>
              <p className="text-neutral-500 text-xs mb-5">We're here to help!</p>
              <div className="space-y-2 text-left">
                <a href={`tel:${supportPhone.replace(/\s/g, '')}`} className="flex items-center gap-3 p-3 bg-green-50 rounded-xl hover:bg-green-100 transition-colors no-underline" data-testid="link-call-support-home">
                  <div className="w-9 h-9 bg-green-500 rounded-full flex items-center justify-center"><Phone className="w-4 h-4 text-white" /></div>
                  <div className="text-left"><p className="font-semibold text-neutral-900 text-sm">Call Us</p><p className="text-xs text-neutral-600">{supportPhone}</p></div>
                </a>
                <a href={`mailto:${supportEmail}`} className="flex items-center gap-3 p-3 bg-blue-50 rounded-xl hover:bg-blue-100 transition-colors no-underline" data-testid="link-email-support-home">
                  <div className="w-9 h-9 bg-blue-500 rounded-full flex items-center justify-center"><Mail className="w-4 h-4 text-white" /></div>
                  <div className="text-left"><p className="font-semibold text-neutral-900 text-sm">Email Us</p><p className="text-xs text-neutral-600">{supportEmail}</p></div>
                </a>
              </div>
              <button onClick={() => setShowCustomerCare(false)} className="mt-5 w-full py-3 bg-gradient-to-r from-[#0d3da8] to-[#1d4ed8] text-white font-bold rounded-2xl hover:from-[#092c7d] hover:to-[#1e40af] shadow-xl shadow-[#0d3da8]/25 transition-colors" data-testid="button-close-care-home">Close</button>
            </motion.div>
          </motion.div>
        )}

        {showCitySelector && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center px-6" onClick={() => setShowCitySelector(false)}>
            <motion.div initial={{ scale: 0.85, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.85, opacity: 0 }} className="bg-white rounded-3xl p-6 shadow-2xl max-w-md w-full max-h-[80vh] overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
              <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-4">
                <MapPin size={32} className="text-primary" />
              </div>
              <h3 className="text-lg font-bold text-neutral-900 text-center mb-1">Select Your City</h3>
              <p className="text-neutral-500 text-xs text-center mb-4">Choose a city where you'd like to find seekers</p>
              <div className="flex-1 overflow-y-auto space-y-2">
                {cities.map((city) => (
                  <button key={city.id} onClick={() => { handleCityChange(city.id); setShowCitySelector(false); }} className="w-full flex items-center gap-3 p-3 rounded-xl border border-neutral-200 hover:border-primary hover:bg-primary/5 transition-all" data-testid={`city-select-${city.id}`}>
                    <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                      <MapPin className="w-5 h-5 text-primary" />
                    </div>
                    <div className="text-left">
                      <p className="font-medium text-neutral-900">{city.name}</p>
                      <p className="text-xs text-neutral-500">{city.state}</p>
                    </div>
                  </button>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}

        {deleteConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center px-6"
            onClick={() => {
              if (!isDeleting) {
                setDeleteSuccess(false);
                setDeleteConfirm(null);
              }
            }}
          >
            <motion.div
              initial={{ scale: 0.85, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.85, opacity: 0 }}
              className="bg-white rounded-3xl p-5 sm:p-6 text-center shadow-2xl max-w-sm w-full border border-slate-100 max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {deleteSuccess ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="py-3"
                >
                  <div className="w-16 h-16 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-4 shadow-sm">
                    <CheckCircle2 size={32} />
                  </div>
                  <h3 className="text-xl font-black text-slate-900 mb-1.5" data-testid="text-delete-success">
                    Space Deleted!
                  </h3>
                  <p className="text-slate-500 text-xs leading-relaxed mb-2">
                    Your space listing has been permanently removed.
                  </p>
                </motion.div>
              ) : (
                <div>
                  <div className="w-14 h-14 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-3 shadow-xs border border-rose-200/50">
                    <Trash2 size={26} />
                  </div>
                  <h3 className="text-lg sm:text-xl font-black text-slate-900 mb-1">Delete This Space?</h3>
                  <p className="text-slate-500 text-xs leading-relaxed mb-3.5">
                    Please select a confirmation option below before deleting. This action cannot be undone and your listing will be removed immediately.
                  </p>

                  {/* Confirmation Reason Options */}
                  <div className="space-y-2 mb-3.5 text-left">
                    {DELETE_SPACE_REASONS.map((reason) => {
                      const isSelected = selectedDeleteReason === reason.id;
                      return (
                        <button
                          key={reason.id}
                          type="button"
                          onClick={() => setSelectedDeleteReason(reason.id)}
                          className={`w-full flex items-center gap-2.5 p-2.5 rounded-xl border text-xs transition-all text-left ${isSelected
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
                        setDeleteSuccess(false);
                        setDeleteConfirm(null);
                        setSelectedDeleteReason(null);
                        setOtherDeleteReason("");
                      }}
                      disabled={isDeleting}
                      className="flex-1 py-3 px-4 bg-slate-100 text-slate-700 font-extrabold text-xs rounded-2xl hover:bg-slate-200 transition-all active:scale-95 disabled:opacity-50 border border-slate-200/60"
                      data-testid="button-keep-space"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteSpace(deleteConfirm)}
                      disabled={isDeleting || !selectedDeleteReason}
                      className="flex-1 py-3 px-4 bg-rose-600 text-white font-extrabold text-xs rounded-2xl hover:bg-rose-700 shadow-lg shadow-rose-600/30 transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none flex items-center justify-center gap-2"
                      data-testid="button-confirm-delete"
                    >
                      {isDeleting ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                      {selectedDeleteReason ? "Yes, Delete" : "Select Option"}
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </MobileLayout>
  );
}
