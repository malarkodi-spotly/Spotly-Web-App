import { useState, useRef, useEffect, useMemo } from "react";
import { useLocation } from "wouter";
import MobileLayout from "@/components/layout/mobile-layout";
import { Camera, Navigation, IndianRupee, Plus, X, Loader2, CheckCircle2, Pencil, Car, Bike, Check, MapPin, ChevronRight, Map, Sparkles, ShieldCheck, Sun, Building2, Home, AlertCircle, ArrowLeft, Phone, EyeOff } from "lucide-react";
import { getApiUrl } from "@/lib/api-config";
import { motion, AnimatePresence } from "framer-motion";
import { useQueryClient, useQuery } from "@tanstack/react-query";
import SwiggyLocationPicker from "@/components/swiggy-location-picker";
import SpaceProviderDesktopPostSpace from "@/components/space-provider-desktop-post-space";
import { isAllowedPhone, useAllowedParkingByPhones } from "@/lib/allowedPhones";
import { useRegisterModalBack } from "@/contexts/mobile-back-context";

interface ParkingTypeOption {
  id: string;
  name: string;
  isActive: boolean;
}

interface ServiceArea {
  id: string;
  displayName: string;
  stateName: string;
}

export default function CustomerBookings() {
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const [photos, setPhotos] = useState<string[]>([]);
  const [parkingDuration, setParkingDuration] = useState("");
  const [startDate, setStartDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [parkingType, setParkingType] = useState("");
  const [vehicleSize, setVehicleSize] = useState("");
  const [selectedServiceId, setSelectedServiceId] = useState("");
  const [parkingTypes, setParkingTypes] = useState<ParkingTypeOption[]>([]);
  const [address, setAddress] = useState("");
  const [rent, _setRent] = useState("");
  const setRent = (val: string | ((prev: string) => string)) => {
    if (typeof val === "function") {
      _setRent((prev) => {
        const next = val(prev);
        return next.replace(/\D/g, "").slice(0, 4);
      });
    } else {
      _setRent(val.replace(/\D/g, "").slice(0, 4));
    }
  };
  const [description, setDescription] = useState("");
  const [contactPhone, setContactPhone] = useState(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("userMobile") || "";
      return saved.replace(/\D/g, "").slice(-10);
    }
    return "";
  });
  const [isPublicRoadside, setIsPublicRoadside] = useState(false);
  const [isDetecting, setIsDetecting] = useState(false);
  const [showLocationPickerModal, setShowLocationPickerModal] = useState(false);
  const userMobile = typeof window !== "undefined" ? localStorage.getItem("userMobile") || "" : "";
  const { allowedPhones } = useAllowedParkingByPhones();
  const showParkingBy = isAllowedPhone(userMobile, allowedPhones);
  const isInstantOwner = showParkingBy && !isPublicRoadside;
  const isDefaultOwner = !showParkingBy && !isPublicRoadside;

  useEffect(() => {
    if (isPublicRoadside && vehicleSize) {
      setVehicleSize("");
    }
  }, [isPublicRoadside, vehicleSize]);

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

  const isCarSelected = useMemo(() => {
    if (!parkingType) return false;
    return parkingType.toLowerCase().includes("car");
  }, [parkingType]);

  const needsDateTime = false;

  const missingFields = useMemo(() => {
    const list: string[] = [];
    if (!isPublicRoadside && !parkingDuration) list.push("Parking Duration");
    if (!parkingType) list.push("Parking Type");
    if (!address) list.push("Location");
    if (isDefaultOwner && (!rent || !rent.trim())) list.push("Rent");
    if (isInstantOwner && (!contactPhone || contactPhone.length !== 10)) list.push("Contact Mobile Number");
    if (!isPublicRoadside && !description.trim()) list.push("Description");
    return list;
  }, [isPublicRoadside, isDefaultOwner, isInstantOwner, parkingDuration, parkingType, address, rent, contactPhone, description]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [editMode, setEditMode] = useState(false);
  const [editBookingId, setEditBookingId] = useState<string | null>(null);
  const [detectedLat, setDetectedLat] = useState<number | null>(null);
  const [detectedLng, setDetectedLng] = useState<number | null>(null);
  const [sessionValid, setSessionValid] = useState(() => {
    return typeof window !== "undefined" && Boolean(localStorage.getItem("userId"));
  });
  const [isLoadingBooking, setIsLoadingBooking] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Register modals with Android Back Button handler
  useRegisterModalBack(showLocationPickerModal, () => setShowLocationPickerModal(false), "sp-location-picker");
  useRegisterModalBack(showSuccess, () => setShowSuccess(false), "sp-booking-success");

  useEffect(() => {
    const validateSession = async () => {
      const userId = localStorage.getItem("userId");
      if (!userId) {
        setLocation("/auth?role=space-provider");
        return;
      }
      try {
        const res = await fetch(getApiUrl(`/api/users/${userId}`));
        if (!res.ok) {
          localStorage.removeItem("userId");
          localStorage.removeItem("userRole");
          localStorage.removeItem("userMobile");
          setLocation("/auth?role=space-provider");
          return;
        }
        const data = await res.json();
        if (data.mobile) {
          localStorage.setItem("userMobile", data.mobile);
          setContactPhone((prev) => prev || data.mobile.replace(/\D/g, "").slice(-10));
        }
        if (data.role && data.role !== "customer") {
          localStorage.removeItem("userId");
          localStorage.removeItem("userRole");
          localStorage.removeItem("userMobile");
          localStorage.removeItem("sessionToken");
          localStorage.setItem("userRole", "customer");
          setLocation("/auth?role=space-provider");
          return;
        }
        setSessionValid(true);
      } catch {
        // Transient network error - preserve existing session if userId is present
      }
    };
    validateSession();

    const fetchParkingTypes = async () => {
      try {
        const res = await fetch(getApiUrl("/api/services"));
        if (res.ok) {
          const data = await res.json();
          setParkingTypes((data.services || []).filter((s: any) => s.isActive));
        }
      } catch (error) {
        console.error("Failed to fetch parking types:", error);
      }
    };
    fetchParkingTypes();

    const params = new URLSearchParams(window.location.search);
    const editId = params.get("edit");
    if (editId) {
      setEditMode(true);
      setEditBookingId(editId);
      setIsLoadingBooking(true);
      const fetchBooking = async () => {
        try {
          const res = await fetch(getApiUrl(`/api/bookings/${editId}`));
          if (res.ok) {
            const data = await res.json();
            const booking = data.booking;
            if (booking) {
              setParkingType(booking.serviceName || "");
              setSelectedServiceId(booking.serviceId || "");
              setAddress(booking.location || "");
              if (typeof booking.latitude === "number") setDetectedLat(booking.latitude);
              if (typeof booking.longitude === "number") setDetectedLng(booking.longitude);
              const commentsStr: string = booking.comments || "";
              const isRoadside = commentsStr.includes("Category: Public Roadside Parking") || commentsStr.includes("Public Roadside");
              if (isRoadside) {
                setIsPublicRoadside(true);
              }
              const rentMatch = commentsStr.match(/Rent:\s*₹?\s*(\d+)/);
              if (rentMatch) setRent(rentMatch[1].replace(/\D/g, "").slice(0, 4));
              const photosMatch = commentsStr.match(/\[PHOTOS\]([\s\S]*?)\[\/PHOTOS\]/);
              if (photosMatch) {
                try {
                  const parsedPhotos = JSON.parse(photosMatch[1]);
                  if (Array.isArray(parsedPhotos)) setPhotos(parsedPhotos);
                } catch { }
              }
              let commentsNoPhotos = commentsStr.replace(/\[PHOTOS\][\s\S]*?\[\/PHOTOS\]/, "");

              // Parse parking duration from comments if available
              const durationMatch = commentsNoPhotos.match(/\|\s*Duration:\s*([^|]+)/i);
              if (durationMatch) {
                setParkingDuration(durationMatch[1].trim());
                commentsNoPhotos = commentsNoPhotos.replace(/\|\s*Duration:\s*([^|]+)/i, "");
              }

              // Parse start date/time from comments if available
              const dateMatch = commentsNoPhotos.match(/\|\s*Date:\s*([^|]+)/i);
              if (dateMatch) {
                setStartDate(dateMatch[1].trim());
                commentsNoPhotos = commentsNoPhotos.replace(/\|\s*Date:\s*([^|]+)/i, "");
              }
              const timeMatch = commentsNoPhotos.match(/\|\s*Time:\s*([^|]+)/i);
              if (timeMatch) {
                setStartTime(timeMatch[1].trim());
                commentsNoPhotos = commentsNoPhotos.replace(/\|\s*Time:\s*([^|]+)/i, "");
              }
              const endTimeMatch = commentsNoPhotos.match(/\|\s*End Time:\s*([^|]+)/i);
              if (endTimeMatch) {
                setEndTime(endTimeMatch[1].trim());
                commentsNoPhotos = commentsNoPhotos.replace(/\|\s*End Time:\s*([^|]+)/i, "");
              }

              // Parse vehicle size from comments if available
              const sizeMatch = commentsNoPhotos.match(/\|\s*Vehicle Size:\s*([^|]+)/i) || commentsNoPhotos.match(/\|\s*Size:\s*([^|]+)/i);
              if (sizeMatch) {
                setVehicleSize(sizeMatch[1].trim());
                commentsNoPhotos = commentsNoPhotos.replace(/\|\s*Vehicle Size:\s*([^|]+)/i, "").replace(/\|\s*Size:\s*([^|]+)/i, "");
              }

              // Parse Contact Phone from comments if available
              const contactMatch = commentsNoPhotos.match(/\|\s*(?:Contact|Mobile|Phone):\s*([0-9]{10})/i);
              if (contactMatch) {
                setContactPhone(contactMatch[1].trim());
                commentsNoPhotos = commentsNoPhotos.replace(/\|\s*(?:Contact|Mobile|Phone):\s*([0-9]{10})/i, "");
              }

              const descMatch = commentsNoPhotos.match(/\|\s*([\s\S]+)$/);
              if (descMatch) {
                setDescription(descMatch[1].trim());
              }
            }
          }
        } catch (error) {
          console.error("Failed to fetch booking:", error);
        } finally {
          setIsLoadingBooking(false);
        }
      };
      fetchBooking();
    }
  }, []);

  const compressImage = (base64Str: string, maxWidth = 500, maxHeight = 500, quality = 0.4): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.src = base64Str;
      img.onload = () => {
        const canvas = document.createElement("canvas");
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const compressed = canvas.toDataURL("image/jpeg", quality);
          // If still larger than 350KB (approx 450,000 chars base64), compress more aggressively
          if (compressed.length > 450000) {
            const secondCanvas = document.createElement("canvas");
            secondCanvas.width = 350;
            secondCanvas.height = Math.round((height * 350) / width);
            const secondCtx = secondCanvas.getContext("2d");
            if (secondCtx) {
              secondCtx.drawImage(img, 0, 0, secondCanvas.width, secondCanvas.height);
              resolve(secondCanvas.toDataURL("image/jpeg", 0.3));
            } else {
              resolve(compressed);
            }
          } else {
            resolve(compressed);
          }
        } else {
          resolve(base64Str);
        }
      };
      img.onerror = () => {
        resolve(base64Str);
      };
    });
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const remaining = 4 - photos.length;
    const filesToProcess = Array.from(files).slice(0, remaining);

    filesToProcess.forEach((file) => {
      // Validate file size limit before upload: 8MB
      if (file.size > 8 * 1024 * 1024) {
        alert(`Image "${file.name}" is too large. Max allowed size is 8MB.`);
        return;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          const rawBase64 = event.target.result as string;
          compressImage(rawBase64).then((compressedBase64) => {
            // Check if final size is within a safe limit: 350KB
            if (compressedBase64.length > 480000) {
              alert(`Could not compress "${file.name}" sufficiently. Please use a smaller image.`);
              return;
            }
            setPhotos((prev) => [...prev, compressedBase64].slice(0, 4));
          }).catch(() => {
            if (rawBase64.length < 480000) {
              setPhotos((prev) => [...prev, rawBase64].slice(0, 4));
            } else {
              alert("Image is too large to upload without compression.");
            }
          });
        }
      };
      reader.readAsDataURL(file);
    });

    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removePhoto = (index: number) => {
    setPhotos((prev) => prev.filter((_, i) => i !== index));
  };

  const handleAutoDetect = () => {
    if (!navigator.geolocation) return;

    setIsDetecting(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        setDetectedLat(latitude);
        setDetectedLng(longitude);
        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&accept-language=en`
          );
          const data = await response.json();
          setAddress(data.display_name || "Location detected");
        } catch {
          setAddress("Location detected");
        }
        setIsDetecting(false);
      },
      () => {
        setIsDetecting(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleSubmit = async () => {
    setSubmitError("");
    if (!isPublicRoadside && !parkingDuration) {
      setSubmitError("Please select a parking duration.");
      return;
    }
    if (!parkingType || !selectedServiceId) {
      setSubmitError("Please select a parking type.");
      return;
    }
    if (!address) {
      setSubmitError("Please enter an address or use Auto Detect.");
      return;
    }
    if (isDefaultOwner && (!rent || !rent.trim())) {
      setSubmitError("Please enter the rent amount.");
      return;
    }
    if (isInstantOwner && (!contactPhone || contactPhone.length !== 10)) {
      setSubmitError("Please enter a valid 10-digit contact mobile number.");
      return;
    }
    if (!isPublicRoadside && rent && (rent.length > 4 || Number(rent) > 9999)) {
      setSubmitError("Monthly rent must be at most 4 digits (up to ₹9,999).");
      return;
    }
    if (!isPublicRoadside && !description.trim()) {
      setSubmitError("Please select a description for your parking space.");
      return;
    }
    setIsSubmitting(true);

    try {
      const durationUnit = parkingDuration === "Hourly" ? "hr" : (parkingDuration === "Days" || parkingDuration === "Daily") ? "day" : "month";
      const formattedRent = isInstantOwner
        ? (rent ? `Rent: ₹${rent}/${durationUnit}` : "Rent: Hidden | Price: Hidden")
        : `Rent: ₹${rent}/${durationUnit}`;
      const commentsPayload = isPublicRoadside
        ? `Rent: ₹0/free | Duration: Public Roadside | Category: Public Roadside Parking${photos.length > 0 ? `[PHOTOS]${JSON.stringify(photos)}[/PHOTOS]` : ""}`
        : `${formattedRent}${isInstantOwner && contactPhone ? ` | Contact: ${contactPhone}` : ""}${parkingDuration ? ` | Duration: ${parkingDuration}` : ""}${needsDateTime && startDate ? ` | Date: ${startDate}` : ""}${needsDateTime && startTime ? ` | Time: ${startTime}` : ""}${needsDateTime && endTime ? ` | End Time: ${endTime}` : ""}${vehicleSize ? ` | Vehicle Size: ${vehicleSize}` : ""}${description ? ` | ${description}` : ""}${photos.length > 0 ? `[PHOTOS]${JSON.stringify(photos)}[/PHOTOS]` : ""}`;

      if (editMode && editBookingId) {
        const response = await fetch(getApiUrl(`/api/bookings/${editBookingId}`), {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            serviceName: parkingType,
            location: address,
            comments: commentsPayload,
            date: new Date().toISOString().split("T")[0],
            time: new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }),
            latitude: detectedLat,
            longitude: detectedLng,
          }),
        });

        if (response.ok) {
          queryClient.invalidateQueries({ queryKey: ["myBookings"] });
          setShowSuccess(true);
        } else {
          const errorData = await response.json().catch(() => ({ error: "Something went wrong" }));
          setSubmitError(errorData.error || "Failed to update space. Please try again.");
        }
      } else {
        const userId = localStorage.getItem("userId");
        if (!userId) {
          alert("Your session has expired. Please log in again.");
          setLocation("/auth?role=space-provider");
          setIsSubmitting(false);
          return;
        }
        const userCity = localStorage.getItem("selectedServiceAreaName") || localStorage.getItem("userDetectedCity") || null;
        const bookingData: Record<string, any> = {
          customerId: userId,
          serviceId: selectedServiceId,
          serviceName: parkingType,
          location: address,
          city: userCity,
          comments: commentsPayload,
          status: "pending",
          date: new Date().toISOString().split("T")[0],
          time: new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }),
          bookedAt: new Date().toISOString(),
        };
        if (detectedLat !== null && detectedLng !== null) {
          bookingData.latitude = detectedLat;
          bookingData.longitude = detectedLng;
        }
        const response = await fetch(getApiUrl("/api/bookings"), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(bookingData),
        });

        if (response.ok) {
          queryClient.invalidateQueries({ queryKey: ["myBookings"] });
          setShowSuccess(true);
          setLocation("/space-provider/home?refresh=1");
        } else {
          const errorData = await response.json().catch(() => ({}));
          const errorMsg = errorData.error || errorData.message || "";
          if (errorMsg.toLowerCase().includes("user not found") || errorMsg.toLowerCase().includes("log in") || response.status === 401) {
            localStorage.removeItem("userId");
            localStorage.removeItem("userRole");
            localStorage.removeItem("userMobile");
            alert("Your session has expired. Please log in again.");
            setLocation("/auth?role=space-provider");
            return;
          }
          setSubmitError(errorMsg || "Failed to post space. Please try again.");
        }
      }
    } catch (error) {
      console.error("Failed to save space:", error);
      setSubmitError("Network error. Please check your connection and try again.");
    }

    setIsSubmitting(false);
  };

  const isFormValid = isPublicRoadside
    ? Boolean(parkingType && selectedServiceId && address)
    : isInstantOwner
    ? Boolean(parkingDuration && parkingType && selectedServiceId && address && contactPhone && contactPhone.length === 10 && description.trim())
    : Boolean(parkingDuration && parkingType && selectedServiceId && address && rent.trim() && description.trim());

  if (!sessionValid || (editMode && isLoadingBooking)) {
    return (
      <MobileLayout showNav userType="customer">
        <div className="min-h-full bg-neutral-100">
          {/* Skeleton Header */}
          <div
            className="px-6 pt-[calc(1.25rem+env(safe-area-inset-top,0px))] pb-[54px] relative overflow-hidden"
            style={{ background: "linear-gradient(135deg, #1e3a8a 0%, #3b2fad 35%, #6d28d9 70%, #7c3aed 100%)" }}
          >
            <div className="absolute top-0 right-0 w-48 h-48 bg-white/5 rounded-full blur-3xl" />
            <div className="relative z-10 flex items-center gap-3.5 mb-2">
              <div className="w-10 h-10 rounded-full bg-white/15 border border-white/20 flex items-center justify-center">
                <ArrowLeft size={18} className="text-white/60" />
              </div>
              <div className="space-y-1.5">
                <div className="h-6 w-32 bg-white/20 rounded-lg animate-pulse" />
                <div className="h-3 w-48 bg-white/10 rounded animate-pulse" />
              </div>
            </div>
          </div>

          {/* Skeleton Form Completion Card */}
          <div className="px-5 -mt-6 relative z-20 mb-4">
            <div className="bg-white rounded-3xl p-4 shadow-xl border border-slate-100">
              <div className="flex items-center justify-between mb-3">
                <div className="h-4 w-32 bg-slate-200 rounded animate-pulse" />
                <div className="h-4 w-24 bg-slate-200 rounded animate-pulse" />
              </div>
              <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full w-[30%] bg-slate-200 rounded-full animate-pulse" />
              </div>
            </div>
          </div>

          <div className="px-5 pb-10 space-y-6" data-testid="loader-edit-booking">

            {/* Photos skeleton */}
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="h-4 w-16 bg-slate-200 rounded animate-pulse" />
                  <div className="h-5 w-16 bg-slate-100 rounded-full animate-pulse" />
                </div>
                <div className="h-4 w-20 bg-slate-200 rounded animate-pulse" />
              </div>
              <div className="h-3 w-3/4 bg-slate-100 rounded animate-pulse mb-3" />
              <div className="grid grid-cols-4 gap-3">
                <div className="aspect-square rounded-2xl bg-slate-200 animate-pulse" />
                <div className="aspect-square rounded-2xl bg-slate-100 animate-pulse border-2 border-dashed border-slate-200" />
              </div>
            </div>

            {/* Address skeleton */}
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
              <div className="flex items-center justify-between mb-3">
                <div className="h-4 w-36 bg-slate-200 rounded animate-pulse" />
                <div className="h-7 w-24 bg-slate-200 rounded-full animate-pulse" />
              </div>
              <div className="rounded-2xl border-2 border-dashed border-slate-200 p-4 flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-slate-200 animate-pulse shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-3/4 bg-slate-200 rounded animate-pulse" />
                  <div className="h-3 w-1/2 bg-slate-100 rounded animate-pulse" />
                </div>
                <div className="h-8 w-16 bg-slate-200 rounded-xl animate-pulse shrink-0" />
              </div>
            </div>

            {/* Parking Duration skeleton */}
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
              <div className="h-4 w-36 bg-slate-200 rounded animate-pulse mb-3" />
              <div className="flex gap-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex-1 h-20 bg-slate-100 rounded-2xl border-2 border-slate-200 animate-pulse" />
                ))}
              </div>
            </div>

            {/* Parking Type skeleton */}
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
              <div className="h-4 w-28 bg-slate-200 rounded animate-pulse mb-3" />
              <div className="grid grid-cols-3 gap-2">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className="h-16 bg-slate-100 rounded-xl border border-slate-200 animate-pulse" />
                ))}
              </div>
            </div>

            {/* Rent skeleton */}
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
              <div className="h-4 w-24 bg-slate-200 rounded animate-pulse mb-3" />
              <div className="h-14 bg-slate-100 rounded-2xl border border-slate-200 animate-pulse" />
            </div>

            {/* Description skeleton */}
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
              <div className="h-4 w-28 bg-slate-200 rounded animate-pulse mb-3" />
              <div className="h-28 bg-slate-100 rounded-2xl border border-slate-200 animate-pulse" />
            </div>

            {/* Submit button skeleton */}
            <div className="h-14 bg-indigo-100/60 rounded-2xl animate-pulse" />
          </div>
        </div>
      </MobileLayout>
    );
  }

  return (
    <>
      {/* ===== DESKTOP VIEW (>= 768px) ===== */}
      <div className="hidden md:block min-h-screen bg-[#f8fafc]">
        <SpaceProviderDesktopPostSpace
          showParkingBy={showParkingBy}
          photos={photos}
          onPhotoUpload={handlePhotoUpload}
          onRemovePhoto={removePhoto}
          fileInputRef={fileInputRef}
          parkingDuration={parkingDuration}
          setParkingDuration={setParkingDuration}
          isPublicRoadside={isPublicRoadside}
          setIsPublicRoadside={setIsPublicRoadside}
          needsDateTime={needsDateTime}
          startDate={startDate}
          setStartDate={setStartDate}
          startTime={startTime}
          setStartTime={setStartTime}
          endTime={endTime}
          setEndTime={setEndTime}
          parkingType={parkingType}
          setParkingType={setParkingType}
          parkingTypes={parkingTypes}
          setSelectedServiceId={setSelectedServiceId}
          isCarSelected={isCarSelected}
          vehicleSize={vehicleSize}
          setVehicleSize={setVehicleSize}
          address={address}
          setAddress={setAddress}
          onAutoDetect={handleAutoDetect}
          isDetecting={isDetecting}
          onOpenMapPicker={() => setShowLocationPickerModal(true)}
          rent={rent}
          setRent={setRent}
          contactPhone={contactPhone}
          setContactPhone={setContactPhone}
          description={description}
          setDescription={setDescription}
          isFormValid={isFormValid}
          missingFields={missingFields}
          onSubmit={handleSubmit}
          isSubmitting={isSubmitting}
          submitError={submitError}
          editMode={editMode}
        />
      </div>

      {/* ===== MOBILE VIEW (< 768px) - 100% PRESERVED ===== */}
      <div className="block md:hidden">
        <MobileLayout showNav userType="customer">
          <div className="min-h-full bg-slate-50/50">
        {/* Top Header Section */}
        <div className="sticky top-0 z-30 bg-white shadow-xs md:relative md:top-auto md:bg-transparent md:shadow-none md:max-w-4xl md:mx-auto">
          {/* Gradient Header */}
          <div
            className="px-6 pt-[calc(1.25rem+env(safe-area-inset-top,0px))] pb-[54px] relative overflow-hidden md:rounded-3xl md:pt-6 md:pb-16 md:shadow-xl"
            style={{ background: "linear-gradient(135deg, #1e3a8a 0%, #3b2fad 35%, #6d28d9 70%, #7c3aed 100%)" }}
          >
            {/* Subtle Glows */}
            <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-br from-[#3e3ab3]/30 to-purple-600/30 rounded-full blur-3xl"></div>
            <div className="absolute bottom-0 left-0 w-40 h-40 bg-purple-500/15 rounded-full blur-2xl"></div>

            {/* Reused Header Graphic (Original source artwork cutout PNG aligned flush) */}
            <div className="absolute right-0 bottom-0 top-0 w-[85%] pointer-events-none overflow-hidden flex items-end justify-end z-0">
              <img
                src="/header_parking_cars_transparent.png"
                alt="Spotly Parking Cars Scene"
                className="h-[79px] mb-[20px] sm:h-[135px] max-w-none object-contain object-right-bottom filter drop-shadow-sm translate-y-1"
              />
            </div>

            {/* Header Content */}
            <div className="relative z-10 flex items-center gap-3.5 mb-2">
              <button
                type="button"
                onClick={() => setLocation("/space-provider/home")}
                className="w-10 h-10 rounded-full bg-white/15 hover:bg-white/25 border border-white/20 backdrop-blur-md flex items-center justify-center text-white active:scale-95 transition-all cursor-pointer shadow-xs"
                aria-label="Back"
                data-testid="button-back-header"
              >
                <ArrowLeft size={18} className="text-white" />
              </button>
              <div>
                <h1 className="text-xl md:text-2xl font-black text-white tracking-tight">
                  {editMode ? "Edit Space" : "Post a Space"}
                </h1>
                <p className="text-[11px] md:text-xs font-semibold text-indigo-200 mt-0.5">
                  {editMode ? "Update your parking space details" : "Fill in details to list your parking space"}
                </p>
              </div>
            </div>
          </div>

          {/* Floating Form Completion Card (Overlapping header) */}
          {(() => {
            const filled = isPublicRoadside
              ? [!!parkingType, !!address.trim(), photos.length > 0].filter(Boolean).length
              : [
                  !!parkingType,
                  !!address.trim(),
                  !!rent.trim(),
                  !!description.trim(),
                  photos.length > 0,
                ].filter(Boolean).length;
            const total = isPublicRoadside ? 3 : 5;
            const pct = Math.round((filled / total) * 100);
            const label =
              pct === 100
                ? "Ready to post!"
                : pct >= 80
                  ? "Almost done"
                  : pct >= 60
                    ? "Good progress"
                    : pct >= 40
                      ? "Keep going"
                      : pct >= 20
                        ? "Just started"
                        : "Get started";
            return (
              <div className="px-5 -mt-6 relative z-20 mb-2 md:max-w-4xl md:mx-auto md:-mt-8 md:mb-4" data-testid="form-strength-container">
                <div className="bg-white rounded-3xl p-4 md:p-5 shadow-xl shadow-[#3b2fad]/10 border border-slate-100">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs md:text-sm font-black text-slate-800">Form Completion</span>
                    <span
                      className="text-xs md:text-sm font-bold text-slate-600"
                      data-testid="text-form-strength-percent"
                    >
                      {pct}% • {label}
                    </span>
                  </div>
                  <div className="w-full h-2.5 md:h-3 bg-indigo-50 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500 ease-out shadow-xs"
                      style={{ width: `${pct}%`, background: "linear-gradient(135deg, #1e3a8a 0%, #3b2fad 35%, #6d28d9 70%, #7c3aed 100%)" }}
                      data-testid="bar-form-strength"
                    />
                  </div>
                </div>
              </div>
            );
          })()}
        </div>

        <div className="px-6 pb-8 space-y-7 relative z-10 md:max-w-4xl md:mx-auto md:bg-white md:rounded-3xl md:shadow-xl md:p-10 md:mb-12 md:mt-4 md:border md:border-slate-100">
          {/* 1. PHOTOS SECTION */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-sm md:text-base font-bold text-neutral-900 flex items-center gap-1.5">
                <span>Photos</span>
                <span className="text-[10px] md:text-xs font-bold text-[#3b2fad] bg-indigo-50 px-2.5 py-0.5 rounded-full border border-indigo-200/80">
                  Optional
                </span>
              </label>
              <span className="text-xs md:text-sm font-bold text-neutral-400">
                {photos.length}/4 Photos
              </span>
            </div>
            <p className="text-xs md:text-sm text-neutral-500 mb-3.5">
              Upload up to 4 photos of your parking slot to get 3x more bookings
            </p>

            <div className="grid grid-cols-4 md:grid-cols-6 gap-3 md:gap-4">
              {photos.map((photo, index) => (
                <div
                  key={index}
                  className="relative group aspect-square rounded-2xl overflow-hidden border-2 border-indigo-200 shadow-md shadow-[#3b2fad]/5 bg-neutral-100"
                >
                  <img
                    src={photo}
                    alt={`Space photo ${index + 1}`}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  {index === 0 && (
                    <span
                      style={{ background: "linear-gradient(135deg, #1e3a8a 0%, #3b2fad 50%, #7c3aed 100%)" }}
                      className="absolute bottom-1 left-1 backdrop-blur-sm text-white text-[9px] md:text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded-md shadow-sm"
                    >
                      Cover
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => removePhoto(index)}
                    className="absolute top-1.5 right-1.5 w-6 h-6 bg-red-500/90 text-white rounded-full flex items-center justify-center shadow-md hover:bg-red-600 hover:scale-110 active:scale-95 transition-all cursor-pointer"
                    data-testid={`button-remove-photo-${index}`}
                    title="Remove photo"
                  >
                    <X size={13} className="stroke-[3]" />
                  </button>
                </div>
              ))}

              {photos.length < 4 && (
                <label
                  htmlFor="space-photo-upload-input"
                  className="aspect-square rounded-2xl border-2 border-dashed border-[#3b2fad]/40 bg-gradient-to-br from-indigo-50/80 via-purple-50/30 to-white flex flex-col items-center justify-center gap-1 hover:border-[#3b2fad] hover:bg-indigo-50/60 active:scale-95 transition-all cursor-pointer shadow-sm group select-none"
                  data-testid="button-add-photos"
                >
                  <div
                    style={{ background: "linear-gradient(135deg, #1e3a8a 0%, #3b2fad 35%, #6d28d9 70%, #7c3aed 100%)" }}
                    className="w-9 h-9 md:w-11 md:h-11 rounded-full text-white flex items-center justify-center shadow-md shadow-[#3b2fad]/25 group-hover:scale-110 transition-transform pointer-events-none"
                  >
                    <Camera size={18} />
                  </div>
                  <span className="text-[11px] md:text-xs font-bold text-[#3b2fad] mt-0.5 pointer-events-none">Add</span>
                  <input
                    id="space-photo-upload-input"
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={handlePhotoUpload}
                  />
                </label>
              )}
            </div>
          </div>
          <div>
            <div className="flex items-center justify-between mb-2.5">
              <label className="text-sm md:text-base font-bold text-neutral-800 flex items-center gap-1">
                <span>Address / Location</span>
                <span className="text-red-500">*</span>
              </label>
              <button
                type="button"
                onClick={handleAutoDetect}
                disabled={isDetecting}
                style={{ background: "linear-gradient(135deg, #1e3a8a 0%, #3b2fad 35%, #6d28d9 70%, #7c3aed 100%)" }}
                className="flex items-center gap-1.5 px-3.5 py-1.5 md:px-4 md:py-2 text-white text-xs md:text-sm font-bold rounded-full transition-all hover:opacity-95 active:scale-95 shrink-0 cursor-pointer shadow-md shadow-[#3b2fad]/25"
                data-testid="button-auto-detect"
              >
                {isDetecting ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <Navigation size={14} className="fill-white" />
                )}
                <span>{isDetecting ? "Detecting..." : "Auto Detect"}</span>
              </button>
            </div>

            {/* Interactive Tap-to-Select Location UI Card */}
            <div
              onClick={() => setShowLocationPickerModal(true)}
              className={`relative overflow-hidden rounded-2xl transition-all duration-200 cursor-pointer active:scale-[0.99] border ${address
                ? "bg-gradient-to-br from-indigo-50/90 via-white to-indigo-50/40 border-indigo-200/90 shadow-sm hover:border-[#3b2fad] hover:shadow-md"
                : "bg-gradient-to-r from-indigo-50/70 via-purple-50/50 to-indigo-50/70 border-2 border-dashed border-indigo-300 hover:border-[#3b2fad] hover:bg-indigo-100/50 shadow-sm"
                }`}
              data-testid="input-address"
            >
              {address ? (
                <div className="p-4 md:p-5">
                  <div className="flex items-start gap-3.5 md:gap-4">
                    <div
                      style={{ background: "linear-gradient(135deg, #1e3a8a 0%, #3b2fad 35%, #6d28d9 70%, #7c3aed 100%)" }}
                      className="w-10 h-10 md:w-12 md:h-12 rounded-xl text-white flex items-center justify-center shrink-0 shadow-md shadow-[#3b2fad]/20 mt-0.5"
                    >
                      <MapPin size={22} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="inline-flex items-center gap-1 text-[10px] md:text-xs font-extrabold uppercase tracking-wider text-[#3b2fad] bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-200/80">
                          <CheckCircle2 size={10} className="text-[#3b2fad]" />
                          Location Selected
                        </span>
                        {detectedLat && detectedLng && (
                          <span className="text-[10px] md:text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                            GPS Pinned
                          </span>
                        )}
                      </div>
                      <p className="text-sm md:text-base font-semibold text-neutral-800 leading-snug line-clamp-3">
                        {address}
                      </p>
                      <div className="flex items-center gap-1.5 mt-2.5 text-xs md:text-sm font-bold text-[#3b2fad]">
                        <Map size={14} />
                        <span>Click to view or change location on map</span>
                        <ChevronRight size={14} className="ml-auto" />
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-4 md:p-5 flex items-center gap-3.5 md:gap-4">
                  <div
                    style={{ background: "linear-gradient(135deg, #1e3a8a 0%, #3b2fad 35%, #6d28d9 70%, #7c3aed 100%)" }}
                    className="w-11 h-11 md:w-13 md:h-13 rounded-2xl text-white flex items-center justify-center shrink-0 shadow-lg shadow-[#3b2fad]/25 group-hover:scale-105 transition-transform"
                  >
                    <MapPin size={24} className="animate-bounce" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm md:text-base font-bold text-neutral-900 flex items-center gap-1">
                      <span>Click to select location on map</span>
                      <Sparkles size={14} className="text-amber-500 fill-amber-500" />
                    </h4>
                    <p className="text-xs md:text-sm text-neutral-500 mt-0.5">
                      Choose street, building or pin exact spot on interactive map
                    </p>
                  </div>
                  <div
                    style={{ background: "linear-gradient(135deg, #1e3a8a 0%, #3b2fad 35%, #6d28d9 70%, #7c3aed 100%)" }}
                    className="px-3.5 py-2 text-white text-xs md:text-sm font-bold rounded-xl shadow-sm flex items-center gap-1 shrink-0"
                  >
                    <span>Select</span>
                    <ChevronRight size={14} />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* 1.5. PARKING BY (OWNER / SPOTLY) SECTION (Allowed numbers only) */}
          {showParkingBy && (
            <div>
              <div className="flex items-center justify-between mb-2.5">
              <label className="text-sm md:text-base font-bold text-neutral-900 flex items-center gap-1">
                <span>Parking By (Instant Owner / Spotly)</span>
                <span className="text-red-500">*</span>
              </label>
              <span
                className={`text-[10px] md:text-xs font-bold px-2 py-0.5 rounded-full border transition-all ${
                  isPublicRoadside
                    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                    : "bg-indigo-50 text-[#3b2fad] border-indigo-200"
                }`}
              >
                {isPublicRoadside ? "By Spotly (Public)" : "Instant Owner (Usual Form)"}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {/* Option 1: Space Owner */}
              <div
                role="button"
                tabIndex={0}
                onClick={() => {
                  if (isPublicRoadside) {
                    setIsPublicRoadside(false);
                    setParkingDuration("Monthly");
                  }
                }}
                className={`p-3.5 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between gap-2.5 select-none relative active:scale-[0.98] ${
                  !isPublicRoadside
                    ? "border-[#3b2fad] bg-gradient-to-br from-indigo-50/90 via-white to-purple-50/30 shadow-md shadow-[#3b2fad]/10"
                    : "border-neutral-200/90 bg-white hover:border-[#3b2fad]/40"
                }`}
                data-testid="option-mobile-parking-by-owner"
              >
                <div className="flex items-start justify-between gap-2.5">
                  <div className="flex items-center gap-2.5">
                    <div
                      style={
                        !isPublicRoadside
                          ? {
                              background:
                                "linear-gradient(135deg, #1e3a8a 0%, #3b2fad 35%, #6d28d9 70%, #7c3aed 100%)",
                            }
                          : undefined
                      }
                      className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-all ${
                        !isPublicRoadside
                          ? "text-white shadow-xs shadow-[#3b2fad]/25"
                          : "bg-neutral-100 text-neutral-600"
                      }`}
                    >
                      <Building2 size={18} />
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-neutral-900">
                          Instant Owner
                        </span>
                        <span
                          className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                            !isPublicRoadside
                              ? "bg-indigo-100 text-[#3b2fad]"
                              : "bg-neutral-100 text-neutral-500"
                          }`}
                        >
                          {!isPublicRoadside ? "Selected" : "Usual Form"}
                        </span>
                      </div>
                      <span className="text-[10px] font-medium text-indigo-600/90 block mt-0.5">
                        Private Parking Space
                      </span>
                    </div>
                  </div>

                  <div
                    className={`w-4 h-4 rounded-full flex items-center justify-center transition-all shrink-0 mt-0.5 ${
                      !isPublicRoadside
                        ? "border-2 border-[#3b2fad] bg-[#3b2fad] text-white"
                        : "border-2 border-neutral-300 bg-white"
                    }`}
                  >
                    {!isPublicRoadside && <Check size={10} strokeWidth={3} />}
                  </div>
                </div>

                <p className="text-[10px] text-neutral-500 leading-relaxed">
                  List private space as Instant Owner. Set your custom rent, duration, and amenities.
                </p>
              </div>

              {/* Option 2: By Spotly (Public Space Parking) */}
              <div
                role="button"
                tabIndex={0}
                onClick={() => {
                  if (!isPublicRoadside) {
                    setIsPublicRoadside(true);
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
                className={`p-3.5 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between gap-2.5 select-none relative active:scale-[0.98] ${
                  isPublicRoadside
                    ? "border-[#3b2fad] bg-gradient-to-br from-indigo-50/90 via-white to-purple-50/30 shadow-md shadow-[#3b2fad]/10"
                    : "border-neutral-200/90 bg-white hover:border-[#3b2fad]/40"
                }`}
                data-testid="option-mobile-parking-by-spotly"
              >
                <div className="flex items-start justify-between gap-2.5">
                  <div className="flex items-center gap-2.5">
                    <div
                      style={
                        isPublicRoadside
                          ? {
                              background:
                                "linear-gradient(135deg, #1e3a8a 0%, #3b2fad 35%, #6d28d9 70%, #7c3aed 100%)",
                            }
                          : undefined
                      }
                      className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-all ${
                        isPublicRoadside
                          ? "text-white shadow-xs shadow-[#3b2fad]/25"
                          : "bg-neutral-100 text-neutral-600"
                      }`}
                    >
                      <Navigation size={18} />
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-neutral-900">
                          By Spotly
                        </span>
                        <span
                          className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                            isPublicRoadside
                              ? "bg-emerald-100 text-emerald-700 border border-emerald-200"
                              : "bg-neutral-100 text-neutral-500"
                          }`}
                        >
                          {isPublicRoadside ? "Active" : "Free / Roadside"}
                        </span>
                      </div>
                      <span className="text-[10px] font-medium text-emerald-700/90 block mt-0.5">
                        Public Space Parking
                      </span>
                    </div>
                  </div>

                  <div
                    className={`w-4 h-4 rounded-full flex items-center justify-center transition-all shrink-0 mt-0.5 ${
                      isPublicRoadside
                        ? "border-2 border-[#3b2fad] bg-[#3b2fad] text-white"
                        : "border-2 border-neutral-300 bg-white"
                    }`}
                  >
                    {isPublicRoadside && <Check size={10} strokeWidth={3} />}
                  </div>
                </div>

                <p className="text-[10px] text-neutral-500 leading-relaxed">
                  Mark a free public roadside or open street spot. Hides rent and duration.
                </p>
              </div>
            </div>
          </div>
          )}

          {/* 2. PARKING DURATION SECTION (Hidden when Public Roadside is selected) */}
          {!isPublicRoadside && (
            <div>
              <label className="text-sm md:text-base font-bold text-neutral-900 flex items-center gap-1 mb-3">
                <span>Parking Duration</span>
                <span className="text-red-500">*</span>
              </label>
              <div className="flex gap-3">
                {(["Hourly", "Days", "Monthly"] as const).map((dur) => {
                  const isSelected = parkingDuration === dur;
                  const icon = dur === "Hourly" ? "⏱️" : dur === "Days" ? "📅" : "🗓️";
                  const sub = dur === "Hourly" ? "Per Hour" : dur === "Days" ? "Per Day" : "Per Month";
                  return (
                    <button
                      key={dur}
                      type="button"
                      onClick={() => setParkingDuration(dur)}
                      className={`relative flex-1 flex flex-col items-center justify-center py-3.5 px-2 rounded-2xl border-2 transition-all duration-200 active:scale-[0.97] cursor-pointer gap-1 ${isSelected
                        ? "border-[#3b2fad] bg-gradient-to-b from-indigo-50/90 via-white to-purple-50/30 shadow-md shadow-[#3b2fad]/15"
                        : "border-neutral-200 bg-white hover:border-[#3b2fad]/40 hover:bg-indigo-50/20"
                        }`}
                      data-testid={`option-duration-${dur.toLowerCase()}`}
                    >
                      <span className="text-xl leading-none">{icon}</span>
                      <span className={`text-xs font-black leading-tight mt-0.5 ${isSelected ? "text-[#3b2fad]" : "text-neutral-800"
                        }`}>{dur}</span>
                      <span className={`text-[9px] font-semibold ${isSelected ? "text-[#3b2fad]/70" : "text-neutral-400"
                        }`}>{sub}</span>
                      {isSelected && (
                        <div
                          style={{ background: "linear-gradient(135deg, #1e3a8a 0%, #3b2fad 50%, #7c3aed 100%)" }}
                          className="absolute top-2 right-2 w-4 h-4 rounded-full flex items-center justify-center shadow-xs"
                        >
                          <Check size={9} className="text-white stroke-[3]" />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* 3. PARKING TYPE SECTION */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm md:text-base font-bold text-neutral-900 flex items-center gap-1">
                <span>Parking Type</span>
                <span className="text-red-500">*</span>
              </label>
              {parkingType && (
                <span className="text-[11px] md:text-xs font-bold text-[#3b2fad] bg-indigo-50 px-2.5 py-0.5 rounded-full border border-indigo-200/80">
                  {parkingType}
                </span>
              )}
            </div>
            <div className={`grid gap-3 md:gap-5 ${isPublicRoadside ? "grid-cols-2" : "grid-cols-3"}`}>
              {parkingTypes
                .filter((type) => {
                  if (!isPublicRoadside) return true;
                  const nameLower = type.name.toLowerCase();
                  return !nameLower.includes("both") && !nameLower.includes("car and bike");
                })
                .map((type) => {
                const isSelected = parkingType === type.name;
                const nameLower = type.name.toLowerCase();
                const isCar = nameLower.includes("car") && !nameLower.includes("bike");
                const isBike = nameLower.includes("bike") && !nameLower.includes("car");

                let subtext = "Both Vehicles";
                if (isCar) subtext = "Car Only";
                if (isBike) subtext = "Bike Only";

                return (
                  <button
                    key={type.id}
                    type="button"
                    onClick={() => {
                      setParkingType(type.name);
                      setSelectedServiceId(type.id);
                      if (!type.name.toLowerCase().includes("car")) {
                        setVehicleSize("");
                      }
                    }}
                    className={`relative flex flex-col items-center justify-between p-3.5 pt-4 md:p-5 rounded-2xl border-2 transition-all duration-200 active:scale-[0.97] cursor-pointer ${isSelected
                      ? "border-[#3b2fad] bg-gradient-to-b from-indigo-50/90 via-white to-purple-50/30 shadow-md shadow-[#3b2fad]/15"
                      : "border-neutral-200/90 bg-white hover:border-[#3b2fad]/40 hover:bg-indigo-50/20"
                      }`}
                    data-testid={`option-${type.name.toLowerCase().replace(/\s+/g, "-")}`}
                  >
                    {isSelected && (
                      <div
                        style={{ background: "linear-gradient(135deg, #1e3a8a 0%, #3b2fad 50%, #7c3aed 100%)" }}
                        className="absolute top-2 right-2 md:top-3 md:right-3 w-5 h-5 md:w-6 md:h-6 rounded-full flex items-center justify-center shadow-xs"
                      >
                        <Check size={12} className="text-white stroke-[3]" />
                      </div>
                    )}

                    <div
                      style={isSelected ? { background: "linear-gradient(135deg, #1e3a8a 0%, #3b2fad 35%, #6d28d9 70%, #7c3aed 100%)" } : undefined}
                      className={`w-12 h-12 md:w-16 md:h-16 rounded-2xl flex items-center justify-center mb-2 transition-transform duration-200 ${isSelected
                      ? "text-white shadow-md shadow-[#3b2fad]/30 scale-105"
                      : "bg-neutral-100 text-neutral-600"
                      }`}
                    >
                      {isCar ? (
                        <Car size={26} className={isSelected ? "text-white" : "text-neutral-600"} />
                      ) : isBike ? (
                        <Bike size={26} className={isSelected ? "text-white" : "text-neutral-600"} />
                      ) : (
                        <div className="flex items-center gap-1">
                          <Car size={20} className={isSelected ? "text-white" : "text-neutral-600"} />
                          <Bike size={17} className={isSelected ? "text-white" : "text-neutral-600"} />
                        </div>
                      )}
                    </div>

                    <div className="text-center w-full">
                      <span className={`block text-xs md:text-sm font-black leading-tight ${isSelected ? "text-[#3b2fad]" : "text-neutral-800"
                        }`}>
                        {type.name}
                      </span>
                      <span className={`block text-[9px] md:text-xs font-semibold mt-0.5 ${isSelected ? "text-[#3b2fad]/80" : "text-neutral-400"
                        }`}>
                        {subtext}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* VEHICLE SIZE SECTION (Shown when Car Type is selected and Space Owner mode) */}
            <AnimatePresence>
              {isCarSelected && !isPublicRoadside && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.25 }}
                  className="mt-3.5 pt-3.5 border-t border-dashed border-indigo-200 overflow-hidden"
                >
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs md:text-sm font-bold text-neutral-800 flex items-center gap-1.5">
                      <Car className="w-3.5 h-3.5 md:w-4 md:h-4 text-[#3b2fad]" />
                      <span>Type of Vehicle Size</span>
                    </label>
                    {vehicleSize && (
                      <span className="text-[10px] md:text-xs font-bold text-[#3b2fad] bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-200/80">
                        {vehicleSize}
                      </span>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-2 md:gap-3 pt-0.5">
                    {[
                      { id: "hatchback", label: "Hatchback" },
                      { id: "sedan", label: "Sedan" },
                      { id: "suv", label: "SUV" },
                      { id: "all-sizes", label: "All" },
                    ].map((option) => {
                      const isSelected = vehicleSize === option.label;
                      return (
                        <button
                          key={option.id}
                          type="button"
                          onClick={() => {
                            setVehicleSize(isSelected ? "" : option.label);
                          }}
                          style={isSelected ? { background: "linear-gradient(135deg, #1e3a8a 0%, #3b2fad 35%, #6d28d9 70%, #7c3aed 100%)" } : undefined}
                          className={`px-3.5 py-2 md:px-5 md:py-2.5 rounded-xl text-xs md:text-sm font-bold transition-all duration-200 active:scale-95 cursor-pointer flex items-center gap-1.5 ${isSelected
                            ? "text-white shadow-sm shadow-[#3b2fad]/25 ring-2 ring-[#3b2fad]/30"
                            : "bg-white text-neutral-700 border border-neutral-200 hover:border-[#3b2fad]/40 hover:bg-indigo-50/30"
                            }`}
                          data-testid={`option-vehicle-size-${option.id}`}
                        >
                          {isSelected && <Check size={13} className="text-white stroke-[3]" />}
                          <span>{option.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>


          {/* RENT SECTION (Default Space Owner) */}
          {isDefaultOwner && (
            <div>
              <label className="block text-sm md:text-base font-bold text-neutral-900 mb-2">
                {parkingDuration === "Hourly"
                  ? "Hourly Rent (₹)"
                  : (parkingDuration === "Daily" || parkingDuration === "Days")
                  ? "Daily Rent (₹)"
                  : "Monthly Rent (₹)"}{" "}
                <span className="text-red-500">*</span>
              </label>
              <div className="flex gap-2">
                <div className="relative flex-1 flex items-center bg-white border-2 border-neutral-200 focus-within:border-[#3b2fad] focus-within:ring-4 focus-within:ring-indigo-100 rounded-2xl p-2.5 md:p-3.5 shadow-sm transition-all">
                  <div
                    style={{ background: "linear-gradient(135deg, #1e3a8a 0%, #3b2fad 35%, #6d28d9 70%, #7c3aed 100%)" }}
                    className="w-11 h-11 md:w-12 md:h-12 rounded-xl text-white flex items-center justify-center font-black text-lg md:text-xl shadow-md shadow-[#3b2fad]/20 shrink-0"
                  >
                    ₹
                  </div>
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    value={rent}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, "").slice(0, 4);
                      setRent(val);
                    }}
                    maxLength={4}
                    placeholder="e.g. 2500"
                    className="w-full px-3 bg-transparent text-lg md:text-xl font-bold text-neutral-900 placeholder:text-neutral-300 outline-none"
                    data-testid="input-rent"
                  />
                </div>
                <div className="px-4 py-3 bg-neutral-100 border-2 border-neutral-200 rounded-2xl text-xs md:text-sm font-bold text-neutral-600 flex items-center shrink-0 select-none">
                  {parkingDuration === "Hourly"
                    ? "/ hour"
                    : (parkingDuration === "Daily" || parkingDuration === "Days")
                    ? "/ day"
                    : "/ month"}
                </div>
              </div>
            </div>
          )}

          {/* CONTACT MOBILE NUMBER SECTION (When Instant Owner is selected) */}
          {isInstantOwner && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm md:text-base font-bold text-neutral-900 flex items-center gap-1">
                  <span>Contact Mobile Number</span>
                  <span className="text-red-500">*</span>
                </label>
                <span className="text-[10px] md:text-xs font-semibold text-neutral-500 bg-neutral-100 px-2 py-0.5 rounded-md">
                  Visible to Seekers
                </span>
              </div>

              <div className="relative flex items-center bg-white border-2 border-neutral-200 focus-within:border-[#3b2fad] focus-within:ring-4 focus-within:ring-indigo-100 rounded-2xl p-2.5 md:p-3.5 shadow-sm transition-all">
                <div
                  style={{ background: "linear-gradient(135deg, #1e3a8a 0%, #3b2fad 35%, #6d28d9 70%, #7c3aed 100%)" }}
                  className="w-11 h-11 md:w-12 md:h-12 rounded-xl text-white flex items-center justify-center font-black text-lg md:text-xl shadow-md shadow-[#3b2fad]/20 shrink-0"
                >
                  <Phone size={18} />
                </div>
                <div className="px-2.5 font-bold text-sm md:text-base text-neutral-500 select-none">
                  +91
                </div>
                <input
                  type="tel"
                  inputMode="numeric"
                  value={contactPhone}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, "").slice(0, 10);
                    setContactPhone(val);
                  }}
                  maxLength={10}
                  placeholder="Enter 10-digit mobile number"
                  className="w-full px-2 py-1 bg-transparent text-[17px] md:text-lg font-bold text-neutral-900 placeholder:text-neutral-300 outline-none"
                  data-testid="input-contact-phone"
                />
                {contactPhone && contactPhone.length === 10 && (
                  <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-xl shrink-0 border border-emerald-200 mr-1 flex items-center gap-1">
                    <Check size={12} className="stroke-[3]" />
                    <span>Valid</span>
                  </span>
                )}
              </div>
            </div>
          )}

          {/* DESCRIPTION SECTION (Hidden when Public Roadside is selected) */}
          {!isPublicRoadside && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm md:text-base font-bold text-neutral-900 flex items-center gap-1">
                  <span>Description / Features</span>
                  <span className="text-red-500">*</span>
                </label>
              </div>
              <div className="grid grid-cols-2 gap-2.5 md:gap-4">
                {[
                  {
                    badge: "GATED PLACE + CCTV",
                    text: "Gated community or secured premises with 24/7 security and CCTV surveillance.",
                    icon: ShieldCheck,
                  },
                  {
                    badge: "HOME + CCTV",
                    text: "Parking available at a private home with CCTV/security.",
                    icon: Home,
                  },
                  {
                    badge: "APARTMENT FULL SAFETY",
                    text: "Parking inside an apartment/residential complex with security and controlled access.",
                    icon: Building2,
                  },
                  {
                    badge: "INDEPENDENT HOUSE / VILLA",
                    text: "Private parking at an independent house or villa.",
                    icon: Home,
                  },
                ].map((item) => {
                  const isSelected = description === item.text || description.toLowerCase().includes(item.badge.toLowerCase());
                  const IconComponent = item.icon;
                  return (
                    <button
                      key={item.text}
                      type="button"
                      onClick={() => setDescription(isSelected ? "" : item.text)}
                      className={`w-full text-left p-3.5 md:p-5 rounded-2xl border-2 transition-all duration-200 flex flex-col justify-between active:scale-[0.97] min-h-[120px] md:min-h-[140px] cursor-pointer ${isSelected
                        ? "border-[#3b2fad] bg-gradient-to-b from-indigo-50/90 via-white to-purple-50/30 shadow-md shadow-[#3b2fad]/15"
                        : "border-neutral-200/90 bg-white text-neutral-700 hover:border-[#3b2fad]/40 hover:bg-indigo-50/20"
                        }`}
                      data-testid={`option-desc-${item.text.split(" ").slice(0, 3).join("-").toLowerCase()}`}
                    >
                      <div className="flex items-center justify-between w-full mb-2">
                        <div
                          style={isSelected ? { background: "linear-gradient(135deg, #1e3a8a 0%, #3b2fad 35%, #6d28d9 70%, #7c3aed 100%)" } : undefined}
                          className={`w-8 h-8 md:w-10 md:h-10 rounded-xl flex items-center justify-center shrink-0 transition-transform ${isSelected
                            ? "text-white shadow-md shadow-[#3b2fad]/20 scale-105"
                            : "bg-neutral-100 text-neutral-500"
                            }`}
                        >
                          <IconComponent size={18} />
                        </div>

                        <div
                          style={isSelected ? { background: "linear-gradient(135deg, #1e3a8a 0%, #3b2fad 50%, #7c3aed 100%)" } : undefined}
                          className={`w-5 h-5 md:w-6 md:h-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${isSelected ? "border-[#3b2fad] text-white shadow-xs" : "border-neutral-300 bg-white"
                            }`}
                        >
                          {isSelected && <Check size={12} className="text-white stroke-[3]" />}
                        </div>
                      </div>

                      <div className="w-full">
                        <span className={`block text-[10px] md:text-xs font-extrabold uppercase tracking-wider mb-1 ${isSelected ? "text-[#3b2fad]" : "text-neutral-400"
                          }`}>
                          {item.badge}
                        </span>
                        <p className={`text-[11px] md:text-xs font-semibold leading-snug line-clamp-3 ${isSelected ? "text-neutral-900" : "text-neutral-600"
                          }`}>
                          {item.text}
                        </p>
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
              <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                <CheckCircle2 size={18} />
              </div>
              <div className="min-w-0">
                <h4 className="text-xs font-bold text-emerald-950">
                  By Spotly — Public Space Parking Ready
                </h4>
                <p className="text-[11px] text-emerald-700/90 mt-0.5 leading-snug">
                  Duration, rent, and description are omitted. Drivers can discover and navigate directly to this spot.
                </p>
              </div>
            </div>
          )}

          {submitError && (
            <div className="bg-red-50 border border-red-200 rounded-2xl px-4 py-3 text-red-700 text-sm mb-3" data-testid="text-submit-error">
              {submitError}
            </div>
          )}

          {/* Missing mandatory fields helper message above submit button */}
          {!isFormValid && missingFields.length > 0 && (
            <div
              className="flex items-center gap-2 px-3.5 py-2.5 md:px-5 md:py-3.5 bg-amber-50 border border-amber-200/90 rounded-2xl text-amber-800 text-xs md:text-sm font-semibold mb-3 shadow-xs"
              data-testid="text-missing-fields-warning"
            >
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>
                Please fill required field{missingFields.length > 1 ? "s" : ""}:{" "}
                <strong className="font-extrabold text-amber-900">{missingFields.join(", ")}</strong>
              </span>
            </div>
          )}

          <button
            onClick={handleSubmit}
            disabled={!isFormValid || isSubmitting}
            style={isFormValid ? { background: "linear-gradient(135deg, #1e3a8a 0%, #3b2fad 35%, #6d28d9 70%, #7c3aed 100%)" } : undefined}
            className={`w-full py-4 md:py-5 rounded-2xl font-black text-white text-base md:text-lg shadow-xl hover:shadow-2xl transition-all duration-300 cursor-pointer ${isFormValid
              ? "hover:opacity-95 shadow-[#3b2fad]/30 active:scale-[0.98]"
              : "bg-neutral-300 cursor-not-allowed"
              }`}
            data-testid="button-post-space"
          >
            {isSubmitting ? (
              <div className="flex items-center justify-center gap-2">
                <Loader2 size={20} className="animate-spin" />
                {editMode ? "Updating..." : "Posting..."}
              </div>
            ) : (
              editMode
                ? isPublicRoadside
                  ? "Update Roadside Parking"
                  : "Update My Space"
                : isPublicRoadside
                ? "Post Roadside Parking"
                : "Post My Space"
            )}
          </button>
        </div>
        </div>
      </MobileLayout>
    </div>

        <AnimatePresence>
          {showLocationPickerModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[9099] bg-black/70 backdrop-blur-md flex items-center justify-center p-2 sm:p-4"
              onClick={() => setShowLocationPickerModal(false)}
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="w-[98%] h-[94%] max-w-4xl bg-neutral-900 rounded-3xl overflow-hidden flex flex-col shadow-2xl border border-neutral-700 relative z-[9100]"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="p-3.5 bg-neutral-900 flex items-center justify-between text-white border-b border-neutral-800 shrink-0 relative z-[9101]">
                  <div className="flex items-center gap-2.5">
                    <div
                      style={{ background: "linear-gradient(135deg, #1e3a8a 0%, #3b2fad 35%, #6d28d9 70%, #7c3aed 100%)" }}
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-white shadow-xs"
                    >
                      <Navigation size={16} />
                    </div>
                    <div>
                      <span className="font-extrabold text-sm block leading-tight">Select Space Location</span>
                      <span className="text-[10px] text-neutral-400 block">Pin exact spot or search destination</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowLocationPickerModal(false)}
                    className="w-9 h-9 rounded-full bg-neutral-800 hover:bg-neutral-700 active:scale-95 flex items-center justify-center text-neutral-300 hover:text-white transition-all cursor-pointer border border-neutral-700"
                    title="Close"
                  >
                    <X size={18} />
                  </button>
                </div>
                <div className="flex-1 relative overflow-hidden">
                  <SwiggyLocationPicker
                    availableServiceAreas={availableServiceAreas}
                    onConfirmLocation={(city, state, lat, lng, confirmedAddress) => {
                      const finalAddr = confirmedAddress || `${city}, ${state}`;
                      setAddress(finalAddr);
                      if (lat !== undefined && lng !== undefined) {
                        setDetectedLat(lat);
                        setDetectedLng(lng);
                      }
                      setShowLocationPickerModal(false);
                    }}
                  />
                </div>
              </motion.div>
            </motion.div>
          )}

          {showSuccess && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[9099] bg-black/60 backdrop-blur-md flex items-center justify-center px-6 cursor-pointer"
              onClick={() => {
                setShowSuccess(false);
                setLocation("/space-provider/home");
              }}
            >
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                className="bg-white rounded-3xl p-8 text-center shadow-2xl max-w-sm w-full cursor-default"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 size={44} className="text-green-500" />
                </div>
                <h3 className="text-xl font-bold text-neutral-900 mb-2">{editMode ? "Space Updated!" : "Space Posted!"}</h3>
                <p className="text-neutral-500 text-sm mb-6">{editMode ? "Your parking space has been updated successfully." : "Your parking space has been listed successfully."}</p>
                <button
                  onClick={() => {
                    setShowSuccess(false);
                    setLocation("/space-provider/home");
                  }}
                  style={{ background: "linear-gradient(135deg, #1e3a8a 0%, #3b2fad 35%, #6d28d9 70%, #7c3aed 100%)" }}
                  className="w-full py-3.5 text-white font-bold rounded-2xl shadow-lg shadow-[#3b2fad]/30 hover:opacity-95 hover:shadow-xl active:scale-[0.98] transition-all cursor-pointer"
                  data-testid="button-go-home"
                >
                  Go to Home
                </button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
    </>
  );
}