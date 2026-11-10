import { useState, useRef, useEffect, useMemo } from "react";
import { useQueryClient, useQuery } from "@tanstack/react-query";
import { getApiUrl } from "@/lib/api-config";
import { isAllowedPhone, useAllowedParkingByPhones } from "@/lib/allowedPhones";

export interface ParkingTypeOption {
  id: string;
  name: string;
  isActive: boolean;
}

export interface UseSpacePostFormOptions {
  editId?: string | null;
  onSuccess?: () => void;
}

export function useSpacePostForm(options?: UseSpacePostFormOptions) {
  const queryClient = useQueryClient();
  const userMobile = typeof window !== "undefined" ? localStorage.getItem("userMobile") || "" : "";
  const { allowedPhones } = useAllowedParkingByPhones();
  const showParkingBy = isAllowedPhone(userMobile, allowedPhones);
  const [photos, setPhotos] = useState<string[]>([]);
  const [parkingDuration, setParkingDuration] = useState("Monthly");
  const [startDate, setStartDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [parkingType, setParkingType] = useState("Car Parking");
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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [editMode, setEditMode] = useState(false);
  const [editBookingId, setEditBookingId] = useState<string | null>(options?.editId || null);
  const [detectedLat, setDetectedLat] = useState<number | null>(null);
  const [detectedLng, setDetectedLng] = useState<number | null>(null);
  const [isLoadingBooking, setIsLoadingBooking] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch parking types from services API
  useEffect(() => {
    const fetchParkingTypes = async () => {
      try {
        const res = await fetch(getApiUrl("/api/services"));
        if (res.ok) {
          const data = await res.json();
          const activeServices = (data.services || []).filter((s: any) => s.isActive);
          setParkingTypes(activeServices);
          if (activeServices.length > 0 && !selectedServiceId) {
            const defaultService = activeServices.find((s: any) => s.name?.toLowerCase().includes("car")) || activeServices[0];
            setSelectedServiceId(defaultService.id);
            setParkingType(defaultService.name);
          }
        }
      } catch (error) {
        console.error("Failed to fetch parking types:", error);
      }
    };
    fetchParkingTypes();
  }, []);

  // If editId is provided, load the existing booking
  useEffect(() => {
    const editId = options?.editId;
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
                } catch {}
              }
              let commentsNoPhotos = commentsStr.replace(/\[PHOTOS\][\s\S]*?\[\/PHOTOS\]/, "");
              const durationMatch = commentsNoPhotos.match(/\|\s*Duration:\s*([^|]+)/i);
              if (durationMatch) {
                setParkingDuration(durationMatch[1].trim());
                commentsNoPhotos = commentsNoPhotos.replace(/\|\s*Duration:\s*([^|]+)/i, "");
              }
              const sizeMatch = commentsNoPhotos.match(/\|\s*Vehicle Size:\s*([^|]+)/i) || commentsNoPhotos.match(/\|\s*Size:\s*([^|]+)/i);
              if (sizeMatch) {
                setVehicleSize(sizeMatch[1].trim());
                commentsNoPhotos = commentsNoPhotos.replace(/\|\s*Vehicle Size:\s*([^|]+)/i, "").replace(/\|\s*Size:\s*([^|]+)/i, "");
              }
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
          console.error("Failed to fetch booking for edit:", error);
        } finally {
          setIsLoadingBooking(false);
        }
      };
      fetchBooking();
    }
  }, [options?.editId]);

  const isCarSelected = useMemo(() => {
    if (!parkingType) return false;
    return parkingType.toLowerCase().includes("car");
  }, [parkingType]);

  const isInstantOwner = showParkingBy && !isPublicRoadside;
  const isDefaultOwner = !showParkingBy && !isPublicRoadside;

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

  const isFormValid = isPublicRoadside
    ? Boolean(parkingType && (selectedServiceId || parkingTypes.length === 0) && address)
    : isInstantOwner
    ? Boolean(parkingDuration && parkingType && (selectedServiceId || parkingTypes.length === 0) && address && contactPhone && contactPhone.length === 10 && description.trim())
    : Boolean(parkingDuration && parkingType && (selectedServiceId || parkingTypes.length === 0) && address && rent.trim() && description.trim());

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
      img.onerror = () => resolve(base64Str);
    });
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    const remaining = 5 - photos.length;
    const filesToProcess = Array.from(files).slice(0, remaining);
    filesToProcess.forEach((file) => {
      if (file.size > 8 * 1024 * 1024) {
        alert(`Image "${file.name}" is too large. Max allowed size is 8MB.`);
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          const rawBase64 = event.target.result as string;
          compressImage(rawBase64)
            .then((compressedBase64) => {
              setPhotos((prev) => [...prev, compressedBase64].slice(0, 5));
            })
            .catch(() => {
              setPhotos((prev) => [...prev, rawBase64].slice(0, 5));
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
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser");
      return;
    }
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
    if (!parkingType) {
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
    if (!isPublicRoadside && !description.trim()) {
      setSubmitError("Please select or enter a description for your parking space.");
      return;
    }

    setIsSubmitting(true);
    try {
      const activeServiceId = selectedServiceId || (parkingTypes[0]?.id || "default-service");
      const durationUnit = parkingDuration === "Hourly" ? "hr" : (parkingDuration === "Days" || parkingDuration === "Daily") ? "day" : "month";
      const formattedRent = isInstantOwner
        ? (rent ? `Rent: ₹${rent}/${durationUnit}` : "Rent: Hidden | Price: Hidden")
        : `Rent: ₹${rent}/${durationUnit}`;

      const commentsPayload = isPublicRoadside
        ? `Rent: ₹0/free | Duration: Public Roadside | Category: Public Roadside Parking${photos.length > 0 ? `[PHOTOS]${JSON.stringify(photos)}[/PHOTOS]` : ""}`
        : `${formattedRent}${isInstantOwner && contactPhone ? ` | Contact: ${contactPhone}` : ""}${parkingDuration ? ` | Duration: ${parkingDuration}` : ""}${vehicleSize ? ` | Vehicle Size: ${vehicleSize}` : ""}${description ? ` | ${description}` : ""}${photos.length > 0 ? `[PHOTOS]${JSON.stringify(photos)}[/PHOTOS]` : ""}`;

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
          await queryClient.invalidateQueries({ queryKey: ["myBookings"] });
          setShowSuccess(true);
          if (options?.onSuccess) options.onSuccess();
        } else {
          const errorData = await response.json().catch(() => ({ error: "Something went wrong" }));
          setSubmitError(errorData.error || "Failed to update space. Please try again.");
        }
      } else {
        const userId = localStorage.getItem("userId");
        if (!userId) {
          alert("Your session has expired. Please log in again.");
          setIsSubmitting(false);
          return;
        }
        const addrLower = (address || "").toLowerCase();
        let determinedCity = localStorage.getItem("selectedServiceAreaName") || localStorage.getItem("userDetectedCity") || null;
        if (addrLower.includes("chennai") || addrLower.includes("tamil") || /\b6[0-4]\d{4}\b/.test(addrLower)) {
          determinedCity = "Chennai";
        } else if (addrLower.includes("bengaluru") || addrLower.includes("bangalore") || addrLower.includes("karnataka") || /\b5[6-9]\d{4}\b/.test(addrLower)) {
          determinedCity = "Bengaluru";
        }
        const bookingData: Record<string, any> = {
          customerId: userId,
          serviceId: activeServiceId,
          serviceName: parkingType,
          location: address,
          city: determinedCity,
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
          await queryClient.invalidateQueries({ queryKey: ["myBookings"] });
          setShowSuccess(true);
          // Reset form fields
          setPhotos([]);
          setAddress("");
          setRent("");
          setDescription("");
          setIsPublicRoadside(false);
          if (options?.onSuccess) {
            options.onSuccess();
          }
        } else {
          const errorData = await response.json().catch(() => ({ error: "Failed to post space" }));
          setSubmitError(errorData.error || "Failed to post space. Please try again.");
        }
      }
    } catch (error) {
      console.error("Failed to save space:", error);
      setSubmitError("Network error. Please check your connection and try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    photos,
    setPhotos,
    handlePhotoUpload,
    removePhoto,
    fileInputRef,
    parkingDuration,
    setParkingDuration,
    isPublicRoadside,
    setIsPublicRoadside,
    startDate,
    setStartDate,
    startTime,
    setStartTime,
    endTime,
    setEndTime,
    parkingType,
    setParkingType,
    parkingTypes,
    setSelectedServiceId,
    isCarSelected,
    vehicleSize,
    setVehicleSize,
    address,
    setAddress,
    handleAutoDetect,
    isDetecting,
    showLocationPickerModal,
    setShowLocationPickerModal,
    rent,
    setRent,
    contactPhone,
    setContactPhone,
    description,
    setDescription,
    isFormValid,
    missingFields,
    handleSubmit,
    isSubmitting,
    submitError,
    setSubmitError,
    showSuccess,
    setShowSuccess,
    editMode,
    isLoadingBooking,
    detectedLat,
    setDetectedLat,
    detectedLng,
    setDetectedLng,
    showParkingBy,
    isInstantOwner,
    isDefaultOwner,
  };
}
