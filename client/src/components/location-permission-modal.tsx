import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MapPinOff, Navigation, RotateCw } from "lucide-react";
import { vibrate } from "@/lib/vibrate";
import { useRegisterModalBack } from "@/contexts/mobile-back-context";

export function LocationPermissionModal() {
  const [open, setOpen] = useState(false);
  const [customMessage, setCustomMessage] = useState<string>("");
  const [isRetrying, setIsRetrying] = useState(false);

  useRegisterModalBack(open, () => setOpen(false), "location-permission-modal");

  useEffect(() => {
    const handleLocationError = (e: Event) => {
      const customEvt = e as CustomEvent<{ message?: string }>;
      if (customEvt.detail?.message) {
        setCustomMessage(customEvt.detail.message);
      } else {
        setCustomMessage(
          "Location access permission is required to detect nearby parking spots accurately. Please allow location permissions in your browser or device settings."
        );
      }
      setOpen(true);
    };

    window.addEventListener("spotly-location-permission-error", handleLocationError);
    return () => {
      window.removeEventListener("spotly-location-permission-error", handleLocationError);
    };
  }, []);

  const handleAllowPermission = () => {
    vibrate();
    setIsRetrying(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setIsRetrying(false);
          setOpen(false);
          // Store position and dispatch location updated event
          const { latitude, longitude } = position.coords;
          localStorage.setItem("userLatitude", latitude.toString());
          localStorage.setItem("userLongitude", longitude.toString());
          window.dispatchEvent(new CustomEvent("spotly-location-updated"));
        },
        (error) => {
          setIsRetrying(false);
          if (error.code === error.PERMISSION_DENIED) {
            setCustomMessage(
              "Location permission is currently blocked in your browser or device settings. Please enable location permissions for this website and tap Allow again."
            );
          } else {
            setOpen(false);
          }
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    } else {
      setIsRetrying(false);
      setOpen(false);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[99999] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setOpen(false)}
          data-testid="modal-location-permission"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 10 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 10 }}
            transition={{ type: "spring", damping: 25, stiffness: 350 }}
            className="bg-white rounded-3xl p-6 sm:p-7 text-center shadow-2xl max-w-sm w-full relative overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header Red/Amber Badge */}
            <div className="w-16 h-16 rounded-full bg-red-100/80 border border-red-200 text-red-600 flex items-center justify-center mx-auto mb-4 shadow-inner">
              <MapPinOff size={32} className="text-red-500 animate-pulse" />
            </div>

            {/* Title */}
            <h3 className="text-lg sm:text-xl font-extrabold text-neutral-900 mb-2 leading-tight">
              Location Permission Required
            </h3>

            {/* Description */}
            <p className="text-neutral-600 text-xs sm:text-sm leading-relaxed mb-6">
              {customMessage ||
                "Location access permission is required to detect nearby parking spots accurately. Please allow location permissions in your browser or device settings."}
            </p>

            {/* Action Buttons */}
            <div className="flex flex-col gap-2.5">
              <button
                onClick={handleAllowPermission}
                disabled={isRetrying}
                className="w-full py-3.5 bg-gradient-to-r from-[#1b1675] via-[#241e98] to-[#3e3ab3] hover:from-[#16126a] hover:via-[#1e1880] hover:to-[#322f9e] text-white font-bold text-sm rounded-2xl shadow-lg shadow-[#241e98]/30 active:scale-95 transition-all flex items-center justify-center gap-2"
                data-testid="button-allow-location-permission"
              >
                {isRetrying ? (
                  <>
                    <RotateCw size={18} className="animate-spin" />
                    Requesting Permission...
                  </>
                ) : (
                  <>
                    <Navigation size={18} />
                    Allow Location Access
                  </>
                )}
              </button>

              <button
                onClick={() => {
                  vibrate();
                  setOpen(false);
                }}
                className="py-2.5 text-neutral-500 hover:text-neutral-800 text-xs font-semibold transition-colors"
                data-testid="button-dismiss-location-permission"
              >
                Dismiss
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
