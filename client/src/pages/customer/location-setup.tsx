import { useState, useEffect, useMemo } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { MapPin, Loader2, Navigation, AlertTriangle, CheckCircle, Shield, RotateCcw } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { getApiUrl } from "@/lib/api-config";
import { motion, AnimatePresence } from "framer-motion";
import spotlyIcon from "@assets/Logos/Spotly-4.png";

interface City {
  id: string;
  name: string;
  state?: string;
  latitude?: number;
  longitude?: number;
}

interface ServiceArea {
  id: string;
  displayName: string;
  stateName: string;
}

interface PendingDetected {
  state: string;
  city: string;
  lat: number;
  lng: number;
  address: string;
}

export default function CustomerLocationSetup() {
  const [, setLocation] = useLocation();
  const [status, setStatus] = useState<"detecting" | "error" | "state_invalid">("detecting");
  const [detectedLocationName, setDetectedLocationName] = useState("");
  const [detectedState, setDetectedState] = useState("");
  const [pulsePhase, setPulsePhase] = useState(0);
  const [selectedServiceArea, setSelectedServiceArea] = useState<ServiceArea | null>(null);
  const [pendingDetected, setPendingDetected] = useState<PendingDetected | null>(null);
  const [isPermissionDenied, setIsPermissionDenied] = useState(false);

  const { data: serviceStatesData } = useQuery({
    queryKey: ["service-states"],
    queryFn: async () => {
      try {
        const res = await fetch(getApiUrl("/api/pincodes"));
        if (!res.ok) throw new Error("Failed to fetch service states");
        return await res.json();
      } catch (err) {
        console.error("Failed to fetch service states, using fallback:", err);
        return { pincodes: [{ id: "karnataka-fallback", prefix: "Karnataka", cityName: "Karnataka", displayOrder: 1 }] };
      }
    },
    retry: 1,
  });

  const availableServiceAreas: ServiceArea[] = useMemo(() => {
    const list = (serviceStatesData?.pincodes || []) as Array<{ id: string; prefix: string; cityName: string; displayOrder: number }>;
    const seen = new Set<string>();
    const result: ServiceArea[] = [];
    const sorted = [...list].sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));
    for (const s of sorted) {
      const stateName = (s.prefix || "").trim();
      if (!stateName) continue;
      const key = stateName.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      result.push({ id: s.id, displayName: s.cityName || stateName, stateName });
    }
    return result;
  }, [serviceStatesData]);

  const completeSetup = (city: string, state: string, lat?: number, lng?: number, address?: string) => {
    if (lat !== undefined) localStorage.setItem("userLatitude", lat.toString());
    else localStorage.removeItem("userLatitude");
    if (lng !== undefined) localStorage.setItem("userLongitude", lng.toString());
    else localStorage.removeItem("userLongitude");
    localStorage.setItem("userDetectedCity", city);
    localStorage.setItem("userDetectedAddress", address || "");
    localStorage.setItem("userState", state);
    localStorage.setItem("selectedServiceAreaName", city);
    setLocation("/customer/home");
  };

  useEffect(() => {
    if (!pendingDetected || !serviceStatesData) return;
    const { state, city, lat, lng, address } = pendingDetected;
    const normalizedState = state.trim().toLowerCase();
    const isValid = !!normalizedState && availableServiceAreas.some(a => a.stateName.trim().toLowerCase() === normalizedState);
    if (isValid) {
      completeSetup(city, state, lat, lng, address);
    } else {
      setStatus("state_invalid");
    }
    setPendingDetected(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingDetected, serviceStatesData, availableServiceAreas]);

  const handleSelectServiceArea = (area: ServiceArea) => {
    setSelectedServiceArea(area);
  };

  const handleProceedWithSelectedArea = () => {
    if (!selectedServiceArea) return;
    completeSetup(selectedServiceArea.stateName, selectedServiceArea.stateName);
  };

  useEffect(() => {
    const existingCity = localStorage.getItem("userDetectedCity");
    if (existingCity) {
      setLocation("/customer/home");
    } else {
      detectLocation();
    }
  }, [setLocation]);

  useEffect(() => {
    if (status === "detecting") {
      const interval = setInterval(() => {
        setPulsePhase(p => (p + 1) % 3);
      }, 600);
      return () => clearInterval(interval);
    }
  }, [status]);

  const detectLocation = async () => {
    setStatus("detecting");
    if (!navigator.geolocation) {
      setStatus("error");
      setDetectedLocationName("Location not supported by your browser");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;

        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 4000); // 4 seconds timeout

          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&addressdetails=1&accept-language=en`,
            { signal: controller.signal }
          );
          const data = await response.json();
          clearTimeout(timeoutId);
          const cityName = data.address?.city || data.address?.town || data.address?.village || data.address?.county || data.address?.state_district || "";
          const stateName = data.address?.state || "";
          const displayLocation = cityName ? `${cityName}${stateName ? `, ${stateName}` : ""}` : stateName || "Unknown location";

          setDetectedLocationName(displayLocation);
          setDetectedState(stateName);

          const actualCityName = cityName || stateName || "Unknown location";

          setPendingDetected({
            state: stateName,
            city: actualCityName,
            lat: latitude,
            lng: longitude,
            address: data.display_name || "",
          });
        } catch (error) {
          console.error("Reverse geocoding error:", error);
          setStatus("error");
          setDetectedLocationName("Unable to detect location");
        }
      },
      (error) => {
        console.error("Geolocation error:", error);
        setStatus("error");
        if (error.code === error.PERMISSION_DENIED) {
          setDetectedLocationName("Location access denied");
        } else if (error.code === error.POSITION_UNAVAILABLE) {
          setDetectedLocationName("Location unavailable");
        } else if (error.code === error.TIMEOUT) {
          setDetectedLocationName("Location request timed out");
        } else {
          setDetectedLocationName("Unable to get location");
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  };

  const detectingDots = ["Searching", "Verifying", "Almost there"];

  return (
    <div className="h-screen w-screen flex flex-col relative overflow-hidden" style={{ background: "linear-gradient(135deg, #1b1675 0%, #241e98 40%, #3e3ab3 70%, #1e1b78 100%)" }}>
      <div className="relative z-10 flex-1 flex flex-col">
          <AnimatePresence mode="wait">
            {status === "detecting" && (
              <motion.div
                key="detecting"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex-1 flex flex-col items-center justify-center px-8"
              >
                <div className="relative mb-10" style={{ width: 200, height: 200 }}>
                  {[0, 1].map(i => (
                    <motion.div
                      key={`ripple-${i}`}
                      className="absolute rounded-full border-2 border-white/30"
                      style={{
                        top: "50%",
                        left: "50%",
                        translateX: "-50%",
                        translateY: "-50%",
                      }}
                      animate={{
                        width: [60, 200],
                        height: [60, 200],
                        opacity: [0.6, 0],
                      }}
                      transition={{
                        duration: 2.4,
                        repeat: Infinity,
                        ease: "easeOut",
                        delay: i * 0.6,
                      }}
                    />
                  ))}

                  <div
                    className="absolute rounded-full bg-white/10"
                    style={{
                      width: 120,
                      height: 120,
                      top: "50%",
                      left: "50%",
                      transform: "translate(-50%, -50%)",
                    }}
                  />
                  <div
                    className="absolute rounded-full bg-white/15"
                    style={{
                      width: 90,
                      height: 90,
                      top: "50%",
                      left: "50%",
                      transform: "translate(-50%, -50%)",
                    }}
                  />

                  <motion.div
                    className="absolute"
                    style={{
                      top: "50%",
                      left: "50%",
                      transform: "translate(-50%, -50%)",
                    }}
                    animate={{ y: [0, -6, 0] }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                  >
                    <img src={spotlyIcon} alt="Spotly" className="w-20 h-20 object-contain drop-shadow-2xl" />
                  </motion.div>
                </div>

                <motion.h1
                  className="text-2xl font-bold text-white mb-2 text-center"
                  initial={{ y: 20 }}
                  animate={{ y: 0 }}
                >
                  Finding Your Location
                </motion.h1>
                <p className="text-white/70 text-sm mb-10 text-center">
                  Please allow location access when prompted
                </p>

                <div className="flex items-center gap-3 bg-white/15 backdrop-blur-sm rounded-2xl px-6 py-4">
                  <Loader2 className="w-5 h-5 text-white animate-spin flex-shrink-0" />
                  <span className="text-white/90 text-sm font-medium">
                    {detectingDots[pulsePhase]}...
                  </span>
                </div>

                <div className="flex gap-2 mt-8">
                  {[0, 1, 2].map(i => (
                    <motion.div
                      key={i}
                      className="w-2.5 h-2.5 rounded-full"
                      animate={{
                        backgroundColor: pulsePhase === i ? "#ffffff" : "rgba(255,255,255,0.3)",
                        scale: pulsePhase === i ? 1.4 : 1
                      }}
                      transition={{ duration: 0.3 }}
                    />
                  ))}
                </div>

                <button
                  type="button"
                  onClick={() => setStatus("error")}
                  className="mt-8 text-white/70 hover:text-white text-sm font-medium underline transition-colors cursor-pointer"
                >
                  Select Location Manually
                </button>
              </motion.div>
            )}

            {status === "state_invalid" && (
              <motion.div
                key="invalid"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="flex-1 flex flex-col px-6 pt-8 pb-6 justify-between"
              >
                <div className="flex-1 flex flex-col justify-center items-center text-center px-4">
                  <div className="w-20 h-20 rounded-full bg-red-500/10 flex items-center justify-center mb-6">
                    <span className="text-4xl">🚫</span>
                  </div>
                  
                  <h1 className="text-2xl font-bold text-white mb-4">Service Not Available</h1>
                  
                  <p className="text-white/80 text-sm leading-relaxed mb-6">
                    Spotly is currently available only in Karnataka.<br />
                    We are working to expand to your location soon.
                  </p>

                  <div className="w-full bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-4 mb-8">
                    <div className="flex items-center gap-3 justify-center">
                      <MapPin className="w-5 h-5 text-red-300 flex-shrink-0" />
                      <div className="text-left">
                        <p className="text-white/50 text-[10px] uppercase tracking-wider mb-0.5">Detected Location</p>
                        <p className="text-white font-medium text-sm">{detectedLocationName}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <Button
                    onClick={detectLocation}
                    className="w-full bg-white text-[#0d3da8] hover:bg-white/90 font-semibold py-6 rounded-2xl shadow-lg"
                  >
                    <RotateCcw className="w-5 h-5 mr-2" />
                    Try Again
                  </Button>
                  
                  <div className="flex items-center justify-center gap-2">
                    <Shield className="w-3 h-3 text-white/40" />
                    <p className="text-white/40 text-[11px]">
                      Access is restricted to active service regions
                    </p>
                  </div>
                </div>
              </motion.div>
            )}

            {status === "error" && (
              <motion.div
                key="error"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="flex-1 flex flex-col items-center justify-center px-8"
              >
                <div className="relative mb-6">
                  <div className="w-24 h-24 rounded-full bg-white/10 border border-white/20 flex items-center justify-center">
                    <MapPin className="w-11 h-11 text-red-300" />
                  </div>
                </div>

                <h1 className="text-xl font-bold text-white mb-2 text-center">
                  Location Error
                </h1>
                <p className="text-white/70 text-sm mb-2 text-center leading-relaxed">
                  {detectedLocationName}
                </p>
                <p className="text-white/50 text-xs mb-8 text-center max-w-[240px]">
                  Please enable location access in your browser settings and try again
                </p>

                <Button
                  onClick={detectLocation}
                  className="w-full max-w-[280px] bg-white text-[#0d3da8] hover:bg-white/90 font-semibold py-6 rounded-2xl shadow-lg mb-6"
                >
                  <RotateCcw className="w-5 h-5 mr-2" />
                  Try Again
                </Button>

                {availableServiceAreas.length > 0 && (
                  <div className="w-full max-w-[280px]">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="h-px flex-1 bg-white/20"></div>
                      <span className="text-white/50 text-[10px] uppercase font-bold tracking-wider">Or Select Manually</span>
                      <div className="h-px flex-1 bg-white/20"></div>
                    </div>
                    <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1">
                      {availableServiceAreas.map((area) => (
                        <button
                          key={area.id}
                          onClick={() => {
                            setSelectedServiceArea(area);
                            completeSetup(area.displayName, area.stateName);
                          }}
                          className="w-full py-3 px-4 rounded-xl bg-white/10 hover:bg-white/20 text-white font-medium text-sm transition-all border border-white/10 flex items-center justify-between"
                        >
                          <span>{area.displayName}</span>
                          <span className="text-xs text-white/50">{area.stateName}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          <div className="relative z-10 px-6 pb-6 pt-2">
            <div className="flex items-center justify-center gap-1.5">
              <div className="w-1 h-1 rounded-full bg-white/30" />
              <p className="text-white/40 text-[10px] tracking-wide">
                SPOTLY PARKING
              </p>
              <div className="w-1 h-1 rounded-full bg-white/30" />
            </div>
          </div>
        </div>
      </div>
  );
}
