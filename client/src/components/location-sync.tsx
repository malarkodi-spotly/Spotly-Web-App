import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MapPin, Navigation, Shield, Compass, Sparkles, CheckCircle2 } from "lucide-react";
import { getApiUrl } from "@/lib/api-config";
import { triggerLocationPermissionError } from "@/lib/location-error";
import { isGuest } from "@/lib/guest";
import { vibrate } from "@/lib/vibrate";

interface LocationSyncProps {
  onLocationUpdated?: (city: string, state: string, lat: number, lng: number) => void;
}

export function LocationSync({ onLocationUpdated }: LocationSyncProps) {
  const [showPermissionPrompt, setShowPermissionPrompt] = useState(false);
  const [showStateChangePopup, setShowStateChangePopup] = useState(false);
  const [detectedState, setDetectedState] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const userId = localStorage.getItem("userId");
  const sessionToken = localStorage.getItem("sessionToken");
  const isGuestUser = isGuest() || !userId;

  useEffect(() => {
    // If guest, do not perform DB sync or show database-driven popups
    if (isGuestUser) return;

    const checkAndSyncLocation = async () => {
      try {
        // Step 1: Fetch current user profile to get lastKnownLocation from DB
        const userRes = await fetch(getApiUrl(`/api/users/${userId}`));
        if (!userRes.ok) throw new Error("Failed to fetch user profile");
        
        const userData = await userRes.json();
        const lastKnown = userData.lastKnownLocation;

        // Check if geolocation permission is already granted
        let permissionGranted = false;
        if (navigator.permissions && navigator.permissions.query) {
          try {
            const status = await navigator.permissions.query({ name: "geolocation" });
            permissionGranted = status.state === "granted";
          } catch (e) {
            console.error("Browser permission query failed:", e);
          }
        }

        if (!lastKnown) {
          // First-Time Login: Need to ask permission and set up location
          if (permissionGranted) {
            // If already granted, perform auto geolocating
            performLocationDetection(null);
          } else {
            // Otherwise show our custom premium pre-permission prompt
            setShowPermissionPrompt(true);
          }
        } else {
          // Returning User: Auto detect GPS and compare
          performLocationDetection(lastKnown);
        }
      } catch (err) {
        console.error("Location sync initialization failed:", err);
      }
    };

    checkAndSyncLocation();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, isGuestUser]);

  const performLocationDetection = (lastKnown: { lat: number; lng: number; state: string; city: string } | null) => {
    if (!navigator.geolocation) {
      console.warn("Geolocation not supported by this browser");
      return;
    }

    setIsLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        
        try {
          // Reverse geocode via Nominatim API
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&addressdetails=1&accept-language=en`
          );
          if (!response.ok) throw new Error("Reverse geocoding request failed");
          
          const data = await response.json();
          const cityName = data.address?.city || data.address?.town || data.address?.village || data.address?.county || data.address?.state_district || "";
          const stateName = data.address?.state || "";
          const address = data.display_name || "";

          const currentLoc = {
            lat: latitude,
            lng: longitude,
            state: stateName || "Unknown State",
            city: cityName || "Unknown City",
          };

          // Save GPS coordinates for reference
          localStorage.setItem("gpsDetectedCity", currentLoc.city);
          localStorage.setItem("gpsLatitude", latitude.toString());
          localStorage.setItem("gpsLongitude", longitude.toString());

          const manualSelectedState = localStorage.getItem("userSelectedState");
          const stateMatches = !manualSelectedState || manualSelectedState.toLowerCase() === currentLoc.state.toLowerCase();

          // Only overwrite active state and coordinates if user hasn't explicitly chosen a different state
          if (stateMatches) {
            localStorage.setItem("userLatitude", latitude.toString());
            localStorage.setItem("userLongitude", longitude.toString());
            localStorage.setItem("userDetectedCity", currentLoc.city);
            localStorage.setItem("userState", currentLoc.state);
            localStorage.setItem("selectedServiceAreaName", currentLoc.city);
            localStorage.setItem("userDetectedAddress", address);
            
            const role = localStorage.getItem("userRole");
            if (role === "worker") {
              localStorage.setItem("workerState", currentLoc.state);
            }

            // Trigger local update callback if provided
            if (onLocationUpdated) {
              onLocationUpdated(currentLoc.city, currentLoc.state, latitude, longitude);
            }
          }

          // Step 3: Update DB profile with the current location
          if (sessionToken) {
            await fetch(getApiUrl("/api/users/me"), {
              method: "PATCH",
              headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${sessionToken}`
              },
              body: JSON.stringify({
                city: currentLoc.city,
                lastKnownLocation: currentLoc
              }),
            });
          }

          // Case comparison:
          if (lastKnown) {
            const stateChanged = lastKnown.state && currentLoc.state && 
              lastKnown.state.trim().toLowerCase() !== currentLoc.state.trim().toLowerCase();
            
            if (stateChanged) {
              // State changed! Show premium popup notice
              setDetectedState(currentLoc.state);
              setShowStateChangePopup(true);
            }
          }

        } catch (error) {
          console.error("Geocoding failed, using local coordinates:", error);
        } finally {
          setIsLoading(false);
        }
      },
      (error) => {
        console.error("Geolocation request failed:", error);
        setIsLoading(false);
        if (error.code === error.PERMISSION_DENIED) {
          triggerLocationPermissionError("Location access was denied. Please allow location permissions in your browser or device settings.");
        } else {
          setErrorMessage("Unable to retrieve GPS coordinates. Please try again.");
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  };

  const handleRequestPermission = () => {
    vibrate();
    setShowPermissionPrompt(false);
    performLocationDetection(null);
  };

  return (
    <>
      <AnimatePresence>
        {/* Step 1: Pre-permission modal for First-time users */}
        {showPermissionPrompt && (
          <motion.div
            className="fixed inset-0 z-[400] flex items-center justify-center px-6 cursor-pointer"
            style={{ backgroundColor: "rgba(0,0,0,0.55)", backdropFilter: "blur(6px)" }}
            onClick={() => { vibrate(); setShowPermissionPrompt(false); }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="w-full max-w-[340px] rounded-[30px] overflow-hidden shadow-2xl bg-white relative border border-neutral-100 cursor-default"
              onClick={(e) => e.stopPropagation()}
              initial={{ scale: 0.9, y: 15, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: "spring", stiffness: 350, damping: 25 }}
            >
              {/* Header section with Spotly colors */}
              <div className="bg-gradient-to-br from-[#1b1675] via-[#241e98] to-[#3e3ab3] px-6 pt-8 pb-6 text-center text-white relative">
                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center shadow-lg">
                  <Compass size={30} className="text-white animate-spin-slow" />
                </div>
                <h3 className="text-white text-xl font-extrabold mb-1">Find Nearby Parking</h3>
                <p className="text-white/80 text-xs">Seamless parking experience</p>
                <div className="absolute top-3 right-3 opacity-20">
                  <Sparkles size={24} />
                </div>
              </div>

              {/* Description */}
              <div className="px-6 py-6 text-center">
                <p className="text-[13.5px] text-neutral-600 font-semibold leading-relaxed mb-6">
                  “Allow location access to find nearby parking”
                </p>
                <div className="flex flex-col gap-2">
                  <button
                    onClick={handleRequestPermission}
                    className="w-full h-12 rounded-2xl bg-gradient-to-r from-[#241e98] via-[#2b24b1] to-[#3e3ab3] hover:from-[#1b1778] hover:to-[#2e2a97] text-white font-extrabold text-[15px] shadow-lg shadow-[#241e98]/30 active:scale-[0.98] transition-all"
                  >
                    Allow Location
                  </button>
                  <button
                    onClick={() => { vibrate(); setShowPermissionPrompt(false); }}
                    className="w-full h-11 rounded-2xl bg-neutral-100 text-neutral-500 font-semibold text-[13px] active:scale-[0.98] transition-all hover:bg-neutral-200"
                  >
                    Not Now
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* Case 2: State change popup */}
        {showStateChangePopup && (
          <motion.div
            className="fixed inset-0 z-[400] flex items-center justify-center px-6 cursor-pointer"
            style={{ backgroundColor: "rgba(0,0,0,0.6)", backdropFilter: "blur(6px)" }}
            onClick={() => { vibrate(); setShowStateChangePopup(false); }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="w-full max-w-[340px] rounded-[30px] overflow-hidden shadow-2xl bg-white relative border border-blue-100 cursor-default"
              onClick={(e) => e.stopPropagation()}
              initial={{ scale: 0.85, y: 30, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: "spring", stiffness: 320, damping: 24 }}
            >
              <div className="bg-gradient-to-br from-[#1b1675] via-[#241e98] to-[#3e3ab3] px-6 pt-8 pb-6 text-center text-white relative">
                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-white/25 backdrop-blur-md border border-white/40 flex items-center justify-center shadow-lg relative">
                  <MapPin size={30} className="text-yellow-300 animate-bounce" />
                  <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center shadow-sm">
                    <CheckCircle2 size={12} className="text-white" />
                  </div>
                </div>
                <h3 className="text-white text-lg font-extrabold mb-1">State Changed</h3>
                <p className="text-white/80 text-[11px] tracking-wide uppercase">Location Update</p>
              </div>

              <div className="px-6 py-6 text-center">
                <p className="text-[13.5px] text-neutral-700 font-medium leading-relaxed mb-6">
                  We detected you are now in <span className="font-extrabold text-[#241e98]">{detectedState}</span>.<br />
                  Showing nearby spaces.
                </p>
                <button
                  onClick={() => { vibrate(); setShowStateChangePopup(false); }}
                  className="w-full h-12 rounded-2xl bg-gradient-to-r from-[#241e98] via-[#2b24b1] to-[#3e3ab3] hover:from-[#1b1778] hover:to-[#2e2a97] text-white font-extrabold text-[15px] shadow-lg shadow-[#241e98]/30 active:scale-[0.98] transition-all"
                >
                  Explore Spaces
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
