import { useState, useEffect, useMemo, useRef } from "react";
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import {
  Search,
  MapPin,
  Navigation,
  Loader2,
  AlertCircle,
  CheckCircle,
  CheckCircle2,
  X,
  ShieldAlert,
  ArrowRight,
  Compass,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Capacitor } from "@capacitor/core";
import { vibrate } from "@/lib/vibrate";
import { getApiUrl } from "@/lib/api-config";
import { triggerLocationPermissionError } from "@/lib/location-error";
import spotlyLogo from "@assets/Logos/Spotly-4.png";

// Configure default Leaflet marker icon
const customIcon = new L.Icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

interface ServiceArea {
  id: string;
  displayName: string;
  stateName: string;
}

interface SwiggyLocationPickerProps {
  availableServiceAreas?: ServiceArea[];
  onConfirmLocation: (city: string, state: string, lat?: number, lng?: number, address?: string) => void;
  onExploreMode?: () => void;
}

// Map controller to update center when selected position changes and ensure clear tile rendering
function MapController({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    if (!center || !Array.isArray(center) || center.length !== 2 || isNaN(center[0]) || isNaN(center[1])) return;
    const timer = setTimeout(() => {
      try {
        map.invalidateSize();
        map.flyTo(center, 16, { duration: 1.0 });
      } catch (err) {
        console.warn("Leaflet map flyTo error:", err);
      }
    }, 100);
    return () => clearTimeout(timer);
  }, [center, map]);
  return null;
}

// Map event handler for click and drag end
function MapEventsHandler({ onPositionChange }: { onPositionChange: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      if (e?.latlng && !isNaN(e.latlng.lat) && !isNaN(e.latlng.lng)) {
        onPositionChange(e.latlng.lat, e.latlng.lng);
      }
    },
  });
  return null;
}

export default function SwiggyLocationPicker({
  availableServiceAreas = [],
  onConfirmLocation,
  onExploreMode,
}: SwiggyLocationPickerProps) {
  // Default position from localStorage if previously saved, else fallback
  const [selectedPos, setSelectedPos] = useState<[number, number]>(() => {
    const savedLat = localStorage.getItem("userLatitude");
    const savedLng = localStorage.getItem("userLongitude");
    if (savedLat && savedLng) {
      const lat = parseFloat(savedLat);
      const lng = parseFloat(savedLng);
      if (!isNaN(lat) && !isNaN(lng)) return [lat, lng];
    }
    return [12.9716, 77.5946];
  });

  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isGeocoding, setIsGeocoding] = useState(true);
  const [isLocatingGPS, setIsLocatingGPS] = useState(true);
  const [isInitialLocating, setIsInitialLocating] = useState(true);

  // Safety timer to clear initial location preloader after 6 seconds max
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsInitialLocating(false);
    }, 6000);
    return () => clearTimeout(timer);
  }, []);

  const [address, setAddress] = useState(() => localStorage.getItem("userDetectedAddress") || "Locating address...");
  const [city, setCity] = useState(() => localStorage.getItem("userDetectedCity") || "Bengaluru");
  const [state, setState] = useState(() => localStorage.getItem("userState") || "Karnataka");
  const [isServiceable, setIsServiceable] = useState(true);

  // List of active service states string
  const activeStatesList = useMemo(() => {
    const list = (availableServiceAreas || [])
      .map((a) => a.stateName || a.displayName)
      .filter(Boolean)
      .filter((v, i, arr) => arr.indexOf(v) === i);
    return list.length > 0 ? list.join(", ") : "Karnataka, Tamil Nadu";
  }, [availableServiceAreas]);

  // Reverse geocoding for coordinates
  const reverseGeocode = async (lat: number, lng: number) => {
    const safeLat = typeof lat === "number" && !isNaN(lat) ? lat : 12.9716;
    const safeLng = typeof lng === "number" && !isNaN(lng) ? lng : 77.5946;
    setIsGeocoding(true);
    setSelectedPos([safeLat, safeLng]);
    try {
      // 1. Primary backend API call for reverse geocoding
      const res = await fetch(getApiUrl(`/api/location/reverse-geocode?lat=${lat}&lng=${lng}`));
      if (res.ok) {
        const data = await res.json();
        if (data.address && data.city) {
          setAddress(data.address);
          setCity(data.city);
          setState(data.state || "Karnataka");
          localStorage.setItem("userDetectedAddress", data.address);
          localStorage.setItem("userDetectedCity", data.city);
          localStorage.setItem("userState", data.state || "Karnataka");
          return;
        }
      }

      // 2. Direct Nominatim fallback if server proxy returns unexpected payload
      const nomRes = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1`
      );
      if (nomRes.ok) {
        const data = await nomRes.json();
        const addr = data.address || {};
        const stateName = addr.state || addr.region || addr["ISO3166-2-lvl4"] || "Karnataka";
        const cityName =
          addr.city || addr.town || addr.state_district || addr.county || addr.suburb || addr.village || "Bengaluru";
        const cleanCityName = cityName.replace(/Urban|Rural|District|East|West|North|South/gi, "").trim() || "Bengaluru";
        const sublocality = addr.building || addr.house_number || addr.road || addr.residential || addr.amenity || addr.shop || addr.office || addr.industrial || addr.commercial || "";
        const locality = addr.suburb || addr.neighbourhood || addr.subdistrict || addr.quarter || addr.city_district || addr.area || "";
        const parts = [sublocality, locality, cleanCityName, stateName, addr.postcode || ""]
          .map((p) => (p || "").trim())
          .filter(Boolean)
          .filter((v, i, a) => a.indexOf(v) === i);

        const fullAddr = parts.length > 0 ? parts.join(", ") : (data.display_name || `${cleanCityName}, ${stateName}`);

        setAddress(fullAddr);
        setCity(cleanCityName);
        setState(stateName);
        localStorage.setItem("userDetectedAddress", fullAddr);
        localStorage.setItem("userDetectedCity", cleanCityName);
        localStorage.setItem("userState", stateName);
      } else {
        setAddress("Bengaluru, Karnataka, India");
        setCity("Bengaluru");
        setState("Karnataka");
      }
    } catch (e) {
      console.error("Reverse geocoding error:", e);
      setAddress("Bengaluru, Karnataka, India");
      setCity("Bengaluru");
      setState("Karnataka");
    } finally {
      setIsGeocoding(false);
    }
  };

  // Automatically trigger GPS location detection on initial map screen/popup load
  useEffect(() => {
    detectGPSLocation(true);
  }, []);

  // Dynamically re-evaluate serviceability whenever state, city, address, or availableServiceAreas update
  useEffect(() => {
    // Keep serviceable while detecting or geocoding to prevent premature error banner
    if (!address || address.startsWith("Locating")) {
      setIsServiceable(true);
      return;
    }

    // If availableServiceAreas list is empty or loading, default to true to avoid premature block
    if (!availableServiceAreas || availableServiceAreas.length === 0) {
      setIsServiceable(true);
      return;
    }

    const normState = (state || "").trim().toLowerCase();
    const normCity = (city || "").trim().toLowerCase();
    const fullText = (address || "").trim().toLowerCase();

    // Check if selected location matches any active service state or area configured by Admin
    const isMatched = availableServiceAreas.some((area) => {
      const areaState = (area.stateName || "").trim().toLowerCase();
      const areaDisplay = (area.displayName || "").trim().toLowerCase();

      // Check state name match
      if (areaState) {
        if (normState === areaState || normState.includes(areaState) || areaState.includes(normState)) {
          return true;
        }
        if (fullText.includes(areaState)) {
          return true;
        }
      }

      // Check city or display name match
      if (areaDisplay) {
        if (normCity === areaDisplay || normCity.includes(areaDisplay) || areaDisplay.includes(normCity)) {
          return true;
        }
        if (fullText.includes(areaDisplay)) {
          return true;
        }
      }

      return false;
    });

    setIsServiceable(isMatched);
  }, [state, city, address, availableServiceAreas]);

  // Fallback to IP-based location if GPS is denied or unavailable
  const fallbackIpLocation = async () => {
    // 1. Primary call to backend location detection API
    try {
      const res = await fetch(getApiUrl("/api/location/detect"));
      if (res.ok) {
        const data = await res.json();
        if (data.lat && data.lng) {
          const lat = parseFloat(data.lat);
          const lng = parseFloat(data.lng);
          if (!isNaN(lat) && !isNaN(lng)) {
            setSelectedPos([lat, lng]);
            localStorage.setItem("userLatitude", lat.toString());
            localStorage.setItem("userLongitude", lng.toString());
            setAddress(data.address || "Bengaluru, Karnataka, India");
            setCity(data.city || "Bengaluru");
            setState(data.state || "Karnataka");
            return;
          }
        }
      }
    } catch (e) {
      console.warn("Backend location detection API fallback failed:", e);
    }

    // 2. Client-side fallback APIs
    try {
      const res = await fetch("https://freeipapi.com/api/json");
      if (res.ok) {
        const data = await res.json();
        if (data.latitude && data.longitude) {
          const lat = parseFloat(data.latitude);
          const lng = parseFloat(data.longitude);
          if (!isNaN(lat) && !isNaN(lng)) {
            setSelectedPos([lat, lng]);
            localStorage.setItem("userLatitude", lat.toString());
            localStorage.setItem("userLongitude", lng.toString());
            await reverseGeocode(lat, lng);
            return;
          }
        }
      }
    } catch (e) {
      console.warn("Primary IP Geolocation fallback failed:", e);
    }

    try {
      const res = await fetch("https://ipapi.co/json/");
      if (res.ok) {
        const data = await res.json();
        if (data.latitude && data.longitude) {
          const lat = parseFloat(data.latitude);
          const lng = parseFloat(data.longitude);
          if (!isNaN(lat) && !isNaN(lng)) {
            setSelectedPos([lat, lng]);
            localStorage.setItem("userLatitude", lat.toString());
            localStorage.setItem("userLongitude", lng.toString());
            await reverseGeocode(lat, lng);
            return;
          }
        }
      }
    } catch (e) {
      console.warn("Secondary IP Geolocation fallback failed:", e);
    }

    // Fallback to initial coordinates (Bengaluru) if IP location fails as well
    await reverseGeocode(selectedPos[0], selectedPos[1]);
  };

  // Unified GPS location detection (used on initial map load & when clicking locate button)
  const detectGPSLocation = async (isSilent = false) => {
    if (!isSilent) vibrate();
    setIsLocatingGPS(true);

    const handleSuccess = async (lat: number, lng: number) => {
      setSelectedPos([lat, lng]);
      localStorage.setItem("userLatitude", lat.toString());
      localStorage.setItem("userLongitude", lng.toString());
      await reverseGeocode(lat, lng);
      setIsLocatingGPS(false);
      setIsInitialLocating(false);
    };

    if (Capacitor.isNativePlatform()) {
      try {
        const { Geolocation } = await import("@capacitor/geolocation");
        const pos = await Geolocation.getCurrentPosition({ enableHighAccuracy: true, timeout: 10000 });
        if (pos?.coords) {
          await handleSuccess(pos.coords.latitude, pos.coords.longitude);
          return;
        }
      } catch (e) {
        console.error("Native geolocation error:", e);
      }
    }
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          await handleSuccess(pos.coords.latitude, pos.coords.longitude);
        },
        async (err) => {
          console.warn("Browser geolocation denied/failed, trying IP fallback...", err);
          setIsLocatingGPS(false);
          if (!isSilent || err.code === err.PERMISSION_DENIED) {
            triggerLocationPermissionError("Location access was denied or unavailable. Please allow location permissions to find nearby spots.");
          }
          await fallbackIpLocation();
          setIsInitialLocating(false);
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    } else {
      setIsLocatingGPS(false);
      triggerLocationPermissionError("Geolocation is not supported by your browser");
      await fallbackIpLocation();
      setIsInitialLocating(false);
    }
  };

  const searchInputRef = useRef<HTMLInputElement>(null);

  // Search input debounced geocoding lookup
  useEffect(() => {
    if (!searchQuery.trim() || searchQuery.length < 2) {
      setSearchResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await fetch(getApiUrl(`/api/location/search?q=${encodeURIComponent(searchQuery.trim())}`));
        if (res.ok) {
          const data = await res.json();
          if (data.results && data.results.length > 0) {
            setSearchResults(data.results);
            return;
          }
        }
        // Direct Nominatim fallback if server proxy returns empty
        const nomRes = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery.trim())}&countrycodes=in&addressdetails=1&limit=6`
        );
        if (nomRes.ok) {
          const data = await nomRes.json();
          const mapped = (data || []).map((item: any) => {
            const addr = item.address || {};
            const stateName = addr.state || addr.region || "Karnataka";
            const cityName = addr.city || addr.town || addr.state_district || addr.county || addr.suburb || "Bengaluru";
            const cleanCityName = cityName.replace(/Urban|Rural|District|East|West|North|South/gi, "").trim() || "Bengaluru";
            const parts = (item.display_name || "").split(",").map((s: string) => s.trim()).filter(Boolean);
            return {
              lat: parseFloat(item.lat),
              lon: parseFloat(item.lon),
              display_name: item.display_name,
              title: parts[0] || item.name || cleanCityName,
              subtitle: parts.slice(1).join(", "),
              city: cleanCityName,
              state: stateName,
              address: item.display_name,
            };
          });
          setSearchResults(mapped);
        }
      } catch (e) {
        console.error("Geocoding search failed:", e);
      } finally {
        setIsSearching(false);
      }
    }, 250);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleSelectSearchResult = (result: any) => {
    vibrate();
    const lat = parseFloat(result.lat);
    const lon = parseFloat(result.lon);
    if (isNaN(lat) || isNaN(lon)) return;

    // Instant UI update for high performance
    setSelectedPos([lat, lon]);
    setSearchQuery(result.title || result.display_name);
    setSearchResults([]);

    const fullAddr = result.address || result.display_name || "";
    const cityName = result.city || "Selected Location";
    const stateName = result.state || "Karnataka";

    setAddress(fullAddr);
    setCity(cityName);
    setState(stateName);

    localStorage.setItem("userLatitude", lat.toString());
    localStorage.setItem("userLongitude", lon.toString());
    localStorage.setItem("userDetectedAddress", fullAddr);
    localStorage.setItem("userDetectedCity", cityName);
    localStorage.setItem("userState", stateName);

    // Dismiss keyboard
    if (searchInputRef.current) {
      searchInputRef.current.blur();
    }

    // Refine exact location details in background
    reverseGeocode(lat, lon);
  };

  const handleSearchSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (searchInputRef.current) {
      searchInputRef.current.blur();
    }

    if (searchResults.length > 0) {
      handleSelectSearchResult(searchResults[0]);
      return;
    }

    if (!searchQuery.trim()) return;

    setIsSearching(true);
    try {
      const res = await fetch(getApiUrl(`/api/location/search?q=${encodeURIComponent(searchQuery.trim())}`));
      if (res.ok) {
        const data = await res.json();
        if (data.results && data.results.length > 0) {
          handleSelectSearchResult(data.results[0]);
          return;
        }
      }
    } catch (err) {
      console.error("Search submit error:", err);
    } finally {
      setIsSearching(false);
    }
  };

  const handleConfirm = () => {
    vibrate();
    if (!isServiceable) {
      alert(`Please select a serviceable location. Spotly is currently available in: ${activeStatesList}`);
      return;
    }
    onConfirmLocation(city, state, selectedPos[0], selectedPos[1], address);
  };

  return (
    <div className="relative w-full h-full flex flex-col md:flex-row overflow-hidden bg-slate-950 text-slate-900 select-none">

      {/* ========================================================================= */}
      {/* LOCATION PRELOADER OVERLAY (TRANSPARENT NO BLUR WITH SINGLE CIRCULAR LOADER)*/}
      {/* ========================================================================= */}
      <AnimatePresence>
        {(isLocatingGPS || isInitialLocating) && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="fixed inset-0 z-[3000] flex items-center justify-center bg-black/20 select-none pointer-events-none"
          >
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full border-[3.5px] border-white/30 border-t-[#241e98] border-r-[#3e3ab3] animate-spin drop-shadow-lg" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* ========================================================================= */}
      {/* LEFT COLUMN: INTERACTIVE LEAFLET MAP & SEARCH PORTAL (55% ON DESKTOP)     */}
      {/* ========================================================================= */}
      <div className="relative w-full md:w-[55%] h-full flex flex-col overflow-hidden bg-slate-100 border-r border-slate-800/80 z-10">

        {/* SEARCH HEADER (Floating on Top of Map) */}
        <div className="absolute top-0 left-0 right-0 z-[1000] flex flex-col gap-2 p-4 pt-[calc(1rem+env(safe-area-inset-top,0px))] md:p-6 md:max-w-xl md:left-4 md:right-auto md:w-full">
          <form onSubmit={handleSearchSubmit} className="relative flex items-center bg-white/95 backdrop-blur-xl border border-neutral-200/90 focus-within:border-[#241e98] focus-within:ring-2 focus-within:ring-[#241e98]/20 rounded-2xl shadow-xl px-4 h-12 md:h-13 transition-all">
            <button type="submit" className="shrink-0 mr-3 text-[#241e98] hover:scale-110 active:scale-95 transition-transform cursor-pointer">
              <Search size={18} />
            </button>
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Search area, landmark, street..."
              className="flex-1 bg-transparent text-xs sm:text-sm font-bold text-neutral-900 outline-none placeholder:text-neutral-400"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {isSearching && <Loader2 className="animate-spin text-[#241e98] shrink-0 ml-2" size={16} />}
            {searchQuery && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery("");
                  setSearchResults([]);
                }}
                className="p-1 rounded-full text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 shrink-0 ml-2 cursor-pointer"
              >
                <X size={16} />
              </button>
            )}
          </form>

          {/* SEARCH SUGGESTIONS DROPDOWN */}
          <AnimatePresence>
            {searchResults.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                className="bg-white/95 backdrop-blur-xl border border-neutral-200/80 rounded-2xl shadow-2xl overflow-hidden max-h-64 overflow-y-auto divide-y divide-neutral-100"
              >
                {searchResults.map((item, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSelectSearchResult(item)}
                    className="w-full px-4 py-3 text-left flex items-start gap-3 hover:bg-[#241e98]/5 active:bg-[#241e98]/10 transition-colors cursor-pointer group"
                  >
                    <div className="p-2 rounded-xl bg-[#241e98]/10 group-hover:bg-[#241e98] text-[#241e98] group-hover:text-white transition-colors shrink-0 mt-0.5">
                      <MapPin size={16} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-black text-neutral-900 group-hover:text-[#241e98] transition-colors truncate">
                        {item.title || item.display_name.split(",")[0]}
                      </p>
                      <p className="text-[11px] font-medium text-neutral-500 line-clamp-1 mt-0.5">
                        {item.subtitle || item.display_name}
                      </p>
                    </div>
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* MAP CONTAINER */}
        <div className="relative flex-1 w-full h-full z-0">

          <MapContainer
            center={selectedPos}
            zoom={15}
            zoomControl={false}
            className="w-full h-full"
          >
            <TileLayer
              attribution='&copy; <a href="https://www.google.com/maps">Google Maps</a>'
              url="https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}"
              maxZoom={20}
            />
            <MapController center={selectedPos} />
            <MapEventsHandler onPositionChange={(lat, lng) => reverseGeocode(lat, lng)} />
            <Marker
              position={selectedPos}
              icon={customIcon}
              draggable
              eventHandlers={{
                dragend: (e) => {
                  const marker = e.target;
                  const position = marker.getLatLng();
                  reverseGeocode(position.lat, position.lng);
                },
              }}
            />
          </MapContainer>

          {/* FLOATING GPS "USE CURRENT LOCATION" BUTTON */}
          <button
            onClick={() => detectGPSLocation(false)}
            disabled={isLocatingGPS}
            className="absolute bottom-6 right-4 md:bottom-8 md:right-6 z-[1000] px-4 py-2.5 bg-gradient-to-r from-[#241e98] via-[#2b24b1] to-[#3e3ab3] hover:from-[#1b1778] hover:to-[#2e2a97] text-white font-black text-xs sm:text-sm rounded-full shadow-2xl shadow-[#241e98]/30 border border-[#241e98] flex items-center gap-2 active:scale-95 transition-all cursor-pointer"
            title="Use Current Location"
          >
            {isLocatingGPS ? (
              <Loader2 className="animate-spin text-white" size={16} />
            ) : (
              <Navigation className="fill-white text-white" size={16} />
            )}
            <span>Use Current Location</span>
          </button>

          {/* DESKTOP-ONLY FLOATING BOTTOM-LEFT MAP PIN INFO BADGE */}
          <div className="hidden md:flex absolute bottom-8 left-6 z-[1000] bg-slate-900/90 backdrop-blur-xl border border-slate-700/80 p-3.5 px-4 rounded-2xl shadow-2xl text-white max-w-sm items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#241e98] via-[#2b24b1] to-[#3e3ab3] flex items-center justify-center text-white shrink-0 shadow-md">
              <MapPin size={20} />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-black text-white truncate">{city}</span>
                {isServiceable ? (
                  <span className="inline-flex items-center gap-1 text-[9px] font-bold text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded-full border border-emerald-500/30">
                    <CheckCircle2 size={9} /> Live
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-[9px] font-bold text-rose-400 bg-rose-950/80 px-2 py-0.5 rounded-full border border-rose-500/30">
                    <AlertCircle size={9} /> Outside Area
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-300 font-medium truncate mt-0.5">
                {address}
              </p>
            </div>
          </div>
        </div>

        {/* MOBILE-ONLY BOTTOM SWIGGY LOCATION & SERVICEABILITY CARD (< 768px) */}
        <div className="md:hidden relative z-[1000] bg-white/95 backdrop-blur-2xl border-t border-neutral-200/80 px-5 pt-5 pb-[calc(1.25rem+env(safe-area-inset-bottom,0px))] rounded-t-3xl shadow-[0_-10px_40px_rgba(0,0,0,0.1)] flex flex-col gap-3.5">
          <div className="flex items-start gap-3.5">
            <div className="p-3 rounded-2xl bg-gradient-to-br from-[#241e98] via-[#2b24b1] to-[#3e3ab3] text-white shrink-0 shadow-md shadow-[#241e98]/25">
              <MapPin size={22} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <h3 className="text-base font-black text-[#241e98] truncate">{city || "Selected Location"}</h3>
                {isServiceable ? (
                  <span className="inline-flex items-center gap-1 text-[10px] font-extrabold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200/80">
                    <CheckCircle size={10} /> Serviceable
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-[10px] font-extrabold text-rose-700 bg-rose-50 px-2.5 py-0.5 rounded-full border border-rose-200/80">
                    <AlertCircle size={10} /> Not Serviceable
                  </span>
                )}
              </div>
              <p className="text-xs text-neutral-600 font-semibold line-clamp-2 leading-relaxed">
                {address}
              </p>
            </div>
          </div>

          {/* SERVICEABILITY WARNING BANNER IF OUTSIDE SERVICE AREA */}
          {!isServiceable && (
            <motion.div
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-3 bg-rose-50 border border-rose-200 rounded-2xl flex items-start gap-2.5 text-left"
            >
              <ShieldAlert size={18} className="text-rose-600 shrink-0 mt-0.5" />
              <div className="text-xs">
                <p className="font-extrabold text-rose-700">Please select a serviceable location.</p>
                <p className="text-neutral-600 text-[11px] mt-0.5 font-medium">
                  Spotly operates in: <span className="font-bold text-[#241e98]">{activeStatesList}</span>. Move pin or search inside these states.
                </p>
              </div>
            </motion.div>
          )}

          {/* ACTION BUTTON */}
          <div className="flex gap-2.5 mt-0.5">
            <button
              onClick={handleConfirm}
              disabled={!isServiceable}
              className={`w-full h-12 rounded-2xl text-xs sm:text-sm font-black uppercase tracking-wider transition-all active:scale-95 shadow-xl flex items-center justify-center gap-2 ${isServiceable
                ? "bg-gradient-to-r from-[#241e98] via-[#2b24b1] to-[#3e3ab3] hover:from-[#1b1778] hover:to-[#2e2a97] text-white shadow-xl shadow-[#241e98]/30 hover:shadow-2xl cursor-pointer"
                : "bg-neutral-200 text-neutral-400 border border-neutral-300/60 cursor-not-allowed"
                }`}
            >
              {isServiceable ? (
                "Confirm Location"
              ) : (
                "Please Select a Serviceable Location"
              )}
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* RIGHT COLUMN: DESKTOP SHOWCASE & LOCATION CONTROL PORTAL (45% ON DESKTOP)  */}
      {/* ========================================================================= */}
      <div className="hidden md:flex w-[45%] h-full bg-white p-8 xl:p-12 flex-col justify-between relative z-20 text-neutral-900 overflow-y-auto">

        <div className="space-y-6 max-w-md w-full my-auto">
          {/* HEADER ROW WITH LOGO, BADGE & SKIP EXPLORE */}
          <div className="flex items-center justify-between">
            <a
              href="/"
              onClick={(e) => { e.preventDefault(); window.location.href = "/"; }}
              className="flex items-center cursor-pointer transition-transform active:scale-95 relative group"
              title="Go to Landing Screen"
            >
              <img
                src={spotlyLogo}
                alt="Spotly"
                className="h-8 w-auto object-contain"
              />
              <div className="absolute -bottom-8 left-0 hidden md:group-hover:flex items-center px-2.5 py-1 bg-slate-900/95 backdrop-blur-md text-white text-[10px] font-bold rounded-lg shadow-xl pointer-events-none whitespace-nowrap z-50 border border-white/20">
                Go to Landing Screen
              </div>
            </a>

            {onExploreMode && (
              <button
                type="button"
                onClick={() => {
                  vibrate();
                  onExploreMode();
                }}
                className="px-3.5 py-1.5 rounded-full bg-slate-100 hover:bg-slate-200 text-xs font-bold text-neutral-700 transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <span>Explore</span>
                <ArrowRight size={13} />
              </button>
            )}
          </div>

          {/* HERO SECTION */}
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              Select Location
            </h1>
            <p className="text-xs text-neutral-500 font-medium mt-1">
              Move pin or search destination
            </p>
          </div>

          {/* ACTIVE SELECTED LOCATION CARD */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 shadow-xs space-y-3">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#241e98] via-[#2b24b1] to-[#3e3ab3] text-white flex items-center justify-center shadow-xs shrink-0">
                  <MapPin size={18} />
                </div>
                <div className="min-w-0">
                  <h3 className="text-sm font-black text-slate-900 tracking-tight truncate">
                    {city || "Selected Area"}
                  </h3>
                  <p className="text-[10px] text-neutral-500 font-bold uppercase tracking-wider truncate">
                    {state || "India"}
                  </p>
                </div>
              </div>

              {isServiceable ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 shrink-0">
                  <CheckCircle2 size={12} className="text-emerald-600" />
                  <span>Available</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-100 text-rose-800 border border-rose-200 shrink-0">
                  <AlertCircle size={12} className="text-rose-600" />
                  <span>Out of Area</span>
                </span>
              )}
            </div>

            <p className="text-xs text-neutral-600 font-medium line-clamp-2 leading-relaxed bg-white p-2.5 rounded-xl border border-slate-200/60">
              {address}
            </p>
          </div>

          {/* OUT OF SERVICE WARNING BANNER */}
          {!isServiceable && (
            <motion.div
              initial={{ opacity: 0, y: 3 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2 text-xs text-rose-700 font-medium"
            >
              <ShieldAlert size={16} className="text-rose-600 shrink-0" />
              <span>Available in: <strong className="font-bold text-[#241e98]">{activeStatesList}</strong></span>
            </motion.div>
          )}

          {/* PRIMARY CONFIRM BUTTON */}
          <button
            onClick={handleConfirm}
            disabled={!isServiceable}
            className={`w-full h-12 rounded-xl text-xs sm:text-sm font-black uppercase tracking-wider transition-all active:scale-[0.98] shadow-lg flex items-center justify-center gap-2 cursor-pointer ${isServiceable
              ? "bg-gradient-to-r from-[#241e98] via-[#2b24b1] to-[#3e3ab3] hover:from-[#1b1778] hover:to-[#2e2a97] text-white shadow-xl shadow-[#241e98]/30"
              : "bg-neutral-200 text-neutral-400 border border-neutral-300/60 cursor-not-allowed"
              }`}
          >
            {isServiceable ? (
              <>
                <span>Confirm Location</span>
                <ArrowRight size={16} />
              </>
            ) : (
              <span>Select Serviceable Area</span>
            )}
          </button>
        </div>
      </div>

    </div>
  );
}
