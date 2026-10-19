import { useState, useEffect, useCallback } from "react";
import { useLocation, useRoute } from "wouter";
import MobileLayout from "@/components/layout/mobile-layout";
import {
  ArrowLeft,
  MapPin,
  Calendar as CalendarIcon,
  CheckCircle2,
  Phone,
  Search,
  Loader,
  Mail,
} from "lucide-react";
import { SERVICES } from "@/lib/mock-data";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { getApiUrl } from "@/lib/api-config";
import { AnimatePresence, motion } from "framer-motion";
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

const customMarkerIcon = new L.Icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

function MapCenterController({ center }: { center: { lat: number; lng: number } | null }) {
  const map = useMap();
  
  useEffect(() => {
    if (center) {
      map.setView([center.lat, center.lng], 15);
    }
  }, [center, map]);
  
  return null;
}

function LocationMarker({
  position,
  onLocationSelect,
}: {
  position: { lat: number; lon: number } | null;
  onLocationSelect: (lat: number, lon: number) => void;
}) {
  useMapEvents({
    click(e) {
      onLocationSelect(e.latlng.lat, e.latlng.lng);
    },
  });

  return position ? (
    <Marker position={[position.lat, position.lon]} icon={customMarkerIcon} />
  ) : null;
}


interface LocationSuggestion {
  display_name: string;
  lat: string;
  lon: string;
}

export default function BookingFlow() {
  const [, setLocation] = useLocation();
  const [match, params] = useRoute("/customer/book/:id");
  const serviceId = params?.id;
  const service = SERVICES.find((s) => s.id === serviceId);

  const [date, setDate] = useState<Date>();
  const [time, setTime] = useState("");
  const [address, setAddress] = useState("");
  const [comments, setComments] = useState("");
  const [showSuccess, setShowSuccess] = useState(false);
  const [showCustomerCare, setShowCustomerCare] = useState(false);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [searchInput, setSearchInput] = useState("");
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [locationSuggestions, setLocationSuggestions] = useState<LocationSuggestion[]>([]);
  const [selectedCoords, setSelectedCoords] = useState<{ lat: number; lon: number } | null>(null);

  const [isBooking, setIsBooking] = useState(false);
  const [bookingError, setBookingError] = useState<string | null>(null);
  const [attemptedSubmit, setAttemptedSubmit] = useState(false);
  const [supportPhone, setSupportPhone] = useState("+91 98765 43210");
  const [supportEmail, setSupportEmail] = useState("info@spotlyindia.org");

  useEffect(() => {
    const fetchSettings = async () => {
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
        console.error("Failed to fetch settings:", error);
      }
    };
    fetchSettings();
  }, []);

  const handleBook = async () => {
    setAttemptedSubmit(true);
    
    // Check if user is logged in
    const customerId = localStorage.getItem("userId");
    if (!customerId) {
      setBookingError("Please login to book a service");
      setTimeout(() => {
        setLocation("/auth?role=customer");
      }, 1500);
      return;
    }
    
    // Validate required fields before proceeding
    if (!date || !time || !address) {
      setBookingError("Please fill in all required fields: Date, Time, and Location");
      return;
    }
    
    setIsBooking(true);
    setBookingError(null);
    
    // Calculate scheduledAt timestamp
    let scheduledAt = new Date().toISOString();
    if (date && time) {
      try {
        const timeMatch = time.match(/(\d+):(\d+)\s*(AM|PM)?/i);
        if (timeMatch) {
          let hours = parseInt(timeMatch[1]);
          const minutes = parseInt(timeMatch[2]);
          const period = timeMatch[3]?.toUpperCase();
          
          if (period === "PM" && hours !== 12) {
            hours += 12;
          } else if (period === "AM" && hours === 12) {
            hours = 0;
          }
          
          const scheduledDate = new Date(date);
          scheduledDate.setHours(hours, minutes, 0, 0);
          scheduledAt = scheduledDate.toISOString();
        }
      } catch (e) {
        scheduledAt = new Date().toISOString();
      }
    }

    
    try {
      // Format date and time for the booking
      const formattedDate = date ? format(date, "yyyy-MM-dd") : "";
      const bookedAt = new Date().toISOString();
      
      // Extract city from address (last part after comma usually)
      const addressParts = address.split(',').map(p => p.trim());
      let cityName = addressParts.length >= 2 ? addressParts[addressParts.length - 2] : '';
      // Clean up city name (remove pin code if present)
      cityName = cityName.replace(/\d+/g, '').trim();
      
      // Create booking via API
      const response = await fetch(getApiUrl('/api/bookings'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId: customerId,
          serviceId: serviceId,
          serviceName: service?.name || serviceId,
          date: formattedDate,
          time: time,
          location: address,
          latitude: selectedCoords?.lat || null,
          longitude: selectedCoords?.lon || null,
          city: cityName || null,
          comments: comments || null,
          status: "pending",
          bookedAt: bookedAt,
          scheduledAt: scheduledAt
        })
      });
      
      const data = await response.json();
      
      if (data.success && data.booking) {
        setShowSuccess(true);
      } else {
        setBookingError(data.error || "Failed to create booking. Please try again.");
      }
    } catch (error) {
      console.error("Booking error:", error);
      setBookingError("Network error. Please check your connection and try again.");
    }
    
    setIsBooking(false);
  };

  const handleCurrentLocation = () => {
    setIsLoadingLocation(true);
    
    if (!navigator.geolocation) {
      setIsLoadingLocation(false);
      alert("Geolocation is not supported by your browser");
      return;
    }
    
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&accept-language=en`
          );
          const data = await response.json();
          const fullAddress = data.display_name || `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
          
          setAddress(fullAddress);
          setSelectedCoords({ lat: latitude, lon: longitude });
          setShowLocationModal(false);
        } catch (error) {
          console.error("Failed to get address:", error);
          setAddress(`${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
          setSelectedCoords({ lat: latitude, lon: longitude });
          setShowLocationModal(false);
        } finally {
          setIsLoadingLocation(false);
        }
      },
      (error) => {
        console.error("Geolocation error:", error);
        setIsLoadingLocation(false);
        alert("Unable to get your location. Please enable location services and try again.");
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  };

  // Debounced search for location suggestions using Nominatim API
  useEffect(() => {
    if (!searchInput.trim() || searchInput.length < 3) {
      setLocationSuggestions([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(searchInput + " India")}&format=json&addressdetails=1&limit=8`
        );
        const data = await response.json();
        
        const suggestions: LocationSuggestion[] = data.map((item: any) => ({
          display_name: item.display_name,
          lat: item.lat,
          lon: item.lon
        }));
        
        setLocationSuggestions(suggestions);
      } catch (error) {
        console.error("Location search error:", error);
        setLocationSuggestions([]);
      } finally {
        setIsSearching(false);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [searchInput]);

  const handleSearchChange = (value: string) => {
    setSearchInput(value);
  };

  const handleSelectLocation = (suggestion: LocationSuggestion) => {
    setAddress(suggestion.display_name);
    setSelectedCoords({ lat: parseFloat(suggestion.lat), lon: parseFloat(suggestion.lon) });
    setShowLocationModal(false);
    setSearchInput("");
    setLocationSuggestions([]);
  };

  const handleMapTap = async (lat: number, lon: number) => {
    setSelectedCoords({ lat, lon });
    setIsLoadingLocation(true);
    
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&accept-language=en`
      );
      const data = await response.json();
      
      if (data.display_name) {
        const addressParts = data.display_name.split(',').map((p: string) => p.trim());
        const shortAddress = addressParts.slice(0, 4).join(', ');
        setAddress(shortAddress);
      }
    } catch (error) {
      console.error("Reverse geocoding error:", error);
      setAddress(`${lat.toFixed(4)}, ${lon.toFixed(4)}`);
    } finally {
      setIsLoadingLocation(false);
    }
  };

  if (!service) return null;

  const filledCount = [!!date, !!time, !!address.trim(), !!comments.trim()].filter(Boolean).length;
  const formStrength = Math.round((filledCount / 4) * 100);
  const strengthColor =
    formStrength === 100
      ? "from-blue-500 to-blue-700"
      : formStrength >= 75
      ? "from-blue-400 to-blue-600"
      : formStrength >= 50
      ? "from-sky-400 to-blue-500"
      : formStrength >= 25
      ? "from-blue-300 to-blue-400"
      : "from-red-400 to-red-500";
  const strengthLabel =
    formStrength === 100
      ? "Ready to post"
      : formStrength >= 75
      ? "Almost there"
      : formStrength >= 50
      ? "Good progress"
      : formStrength >= 25
      ? "Keep going"
      : "Get started";

  return (
    <MobileLayout>
      <div className="flex flex-col h-full bg-white">
        {/* Header */}
        <header className="sticky top-0 bg-white z-30 border-b border-neutral-100 shadow-sm">
          <div className="px-4 py-4 flex items-center gap-3 justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setLocation("/customer/home")}
                className="w-10 h-10 rounded-full bg-neutral-100 flex items-center justify-center text-neutral-600 hover:bg-neutral-200 transition-colors"
                data-testid="button-back"
              >
                <ArrowLeft size={20} />
              </button>
              <h2 className="text-lg font-bold font-heading text-neutral-900">
                Book {service.name}
              </h2>
            </div>
            <button
              onClick={() => setShowCustomerCare(true)}
              className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary hover:bg-primary/20 transition-colors"
              data-testid="button-customer-care"
            >
              <Phone size={20} />
            </button>
          </div>
          {/* Form Strength Progress Bar */}
          <div className="px-4 pb-2.5" data-testid="form-strength-container">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[11px] font-semibold text-neutral-600">Form completion</span>
              <span
                className="text-[11px] font-bold text-[#0d3da8]"
                data-testid="text-form-strength-percent"
              >
                {formStrength}% · {strengthLabel}
              </span>
            </div>
            <div className="w-full h-2 bg-neutral-100 rounded-full overflow-hidden">
              <div
                className={`h-full bg-gradient-to-r ${strengthColor} rounded-full transition-all duration-500 ease-out`}
                style={{ width: `${formStrength}%` }}
                data-testid="bar-form-strength"
              />
            </div>
          </div>
        </header>

        <div className="flex-1 p-6 space-y-8 overflow-y-auto">
          {/* Date Selection */}
          <div className="space-y-3">
            <label className="text-sm font-bold text-neutral-900">
              Select Date <span className="text-red-500">*</span>
            </label>
            <div className="flex justify-center">
              <Calendar
                mode="single"
                selected={date}
                onSelect={setDate}
                disabled={(date) =>
                  date < new Date(new Date().setHours(0, 0, 0, 0))
                }
                className={cn(
                  "rounded-3xl border shadow-sm",
                  attemptedSubmit && !date ? "border-red-300 bg-red-50/30" : "border-neutral-100"
                )}
              />
            </div>
            {attemptedSubmit && !date && (
              <p className="text-xs text-red-500 text-center">Please select a date</p>
            )}
          </div>

          {/* Time Selection */}
          <div className="space-y-3">
            <label className="text-sm font-bold text-neutral-900">
              Select Time <span className="text-red-500">*</span>
            </label>
            <div className={cn(
              "grid grid-cols-3 gap-3 p-2 rounded-2xl",
              attemptedSubmit && !time ? "bg-red-50/50 border border-red-200" : ""
            )}>
              {[
                "08:00 AM",
                "09:00 AM",
                "10:00 AM",
                "11:00 AM",
                "12:00 PM",
                "01:00 PM",
                "02:00 PM",
                "03:00 PM",
                "04:00 PM",
                "05:00 PM",
                "06:00 PM",
                "07:00 PM",
                "08:00 PM",
              ].map((t) => {
                const isToday = date && date.toDateString() === new Date().toDateString();
                let isPast = false;
                if (isToday) {
                  const now = new Date();
                  const timeMatch = t.match(/(\d+):(\d+)\s*(AM|PM)/i);
                  if (timeMatch) {
                    let hours = parseInt(timeMatch[1]);
                    const minutes = parseInt(timeMatch[2]);
                    const period = timeMatch[3].toUpperCase();
                    if (period === "PM" && hours !== 12) hours += 12;
                    else if (period === "AM" && hours === 12) hours = 0;
                    const slotTime = new Date();
                    slotTime.setHours(hours, minutes, 0, 0);
                    isPast = slotTime <= now;
                  }
                }
                return (
                  <button
                    key={t}
                    onClick={() => !isPast && setTime(t)}
                    disabled={isPast}
                    className={cn(
                      "py-3 rounded-xl text-sm font-medium border transition-all",
                      isPast
                        ? "bg-neutral-100 text-neutral-400 border-neutral-200 cursor-not-allowed opacity-50"
                        : time === t
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-white text-neutral-600 border-neutral-200 hover:border-primary/50",
                    )}
                    data-testid={`button-time-${t.replace(/[:\s]/g, '-')}`}
                  >
                    {t}
                  </button>
                );
              })}
            </div>
            {attemptedSubmit && !time && (
              <p className="text-xs text-red-500">Please select a time slot</p>
            )}
          </div>

          {/* Comments */}
          <div className="space-y-3">
            <label className="text-sm font-bold text-neutral-900">
              Comments (Optional)
            </label>
            <textarea
              value={comments}
              onChange={(e) => {
                const value = e.target.value;
                if (!/[0-9]/.test(value)) {
                  setComments(value.slice(0, 80));
                }
              }}
              placeholder="Add any special instructions or requests..."
              maxLength={70}
              rows={2}
              className="w-full p-3 rounded-xl border border-neutral-200 focus:border-primary focus:outline-none bg-white text-sm resize-none"
              data-testid="textarea-comments"
            />
            <p className="text-xs text-neutral-400">Text only, no numbers allowed</p>
          </div>

          {/* Location Selection */}
          <div className="space-y-3">
            <label className="text-sm font-bold text-neutral-900">
              Location <span className="text-red-500">*</span>
            </label>
            <button
              onClick={() => setShowLocationModal(true)}
              className={`w-full bg-neutral-50 p-4 rounded-2xl flex items-center gap-3 border transition-colors text-left ${
                address
                  ? "border-neutral-100 hover:border-primary/30 hover:bg-primary/5"
                  : attemptedSubmit ? "border-red-300 bg-red-50/50" : "border-neutral-200"
              }`}
              data-testid="button-change-location"
            >
              <MapPin
                className={`shrink-0 ${address ? "text-primary" : attemptedSubmit ? "text-red-400" : "text-neutral-400"}`}
                size={20}
              />
              <div className="flex-1 min-w-0">
                <p
                  className={`text-sm font-medium truncate ${address ? "text-neutral-900" : "text-neutral-400"}`}
                >
                  {address || "Select a location"}
                </p>
              </div>
              <span className="text-xs font-bold text-primary shrink-0">
                SELECT
              </span>
            </button>
            {attemptedSubmit && !address && (
              <p className="text-xs text-red-500">Please select a location</p>
            )}
          </div>
        </div>

        {/* Footer Action */}
        <div className="p-6 border-t border-neutral-100 bg-white">
          {bookingError && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl">
              <p className="text-sm text-red-600 text-center">{bookingError}</p>
            </div>
          )}
          <Button
            className="w-full h-14 text-lg rounded-2xl font-bold"
            disabled={isBooking}
            onClick={handleBook}
            data-testid="button-proceed-book"
          >
            {isBooking ? (
              <>
                <Loader className="w-5 h-5 animate-spin mr-2" />
                Booking...
              </>
            ) : (
              "Proceed to Book"
            )}
          </Button>
        </div>

        <AnimatePresence>
        {showLocationModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center px-4" onClick={() => setShowLocationModal(false)}>
            <motion.div initial={{ scale: 0.85, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.85, opacity: 0 }} className="bg-white rounded-3xl shadow-2xl max-w-md w-full h-[95vh] max-h-[95vh] flex flex-col overflow-hidden" onClick={(e) => e.stopPropagation()}>
              <div className="p-6 border-b border-neutral-100">
                <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-3">
                  <MapPin size={32} className="text-primary" />
                </div>
                <h3 className="text-lg font-bold text-neutral-900 text-center">Select Location</h3>
              </div>

              <div className="flex-1 overflow-y-auto">
                <div className="p-6 space-y-4">
                  <div className="w-full h-48 rounded-2xl overflow-hidden border border-neutral-200 relative">
                    <MapContainer center={selectedCoords ? [selectedCoords.lat, selectedCoords.lon] : [20.5937, 78.9629]} zoom={selectedCoords ? 15 : 5} style={{ height: "100%", width: "100%" }} zoomControl={true} attributionControl={false}>
                      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                      <LocationMarker position={selectedCoords} onLocationSelect={handleMapTap} />
                      {selectedCoords && <MapCenterController center={{ lat: selectedCoords.lat, lng: selectedCoords.lon }} />}
                    </MapContainer>
                    {!selectedCoords && (
                      <div className="absolute bottom-2 left-2 right-2 bg-white/90 backdrop-blur-sm rounded-lg px-3 py-2 text-center shadow-md">
                        <p className="text-xs text-neutral-600 font-medium">Tap on map to select location</p>
                      </div>
                    )}
                    {isLoadingLocation && (
                      <div className="absolute inset-0 bg-white/70 flex items-center justify-center">
                        <Loader className="w-6 h-6 animate-spin text-primary" />
                      </div>
                    )}
                  </div>

                  <button onClick={handleCurrentLocation} disabled={isLoadingLocation} className="w-full bg-primary text-white py-3 rounded-xl font-semibold flex items-center justify-center gap-2 hover:bg-primary/90 transition-colors disabled:opacity-50 shadow-md" data-testid="button-current-location">
                    {isLoadingLocation ? <><Loader className="w-4 h-4 animate-spin" /> Locating...</> : <><MapPin className="w-4 h-4" /> Use Current Location</>}
                  </button>

                  <div className="relative">
                    <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-4 h-4 text-neutral-400" />
                    <input type="text" placeholder="Search location..." value={searchInput} onChange={(e) => handleSearchChange(e.target.value)} className="w-full pl-10 pr-4 py-3 rounded-xl border border-neutral-200 focus:border-primary focus:outline-none bg-neutral-50 text-sm" data-testid="input-location-search" />
                  </div>

                  <div className="space-y-1">
                    {isSearching ? (
                      <div className="flex items-center justify-center py-8"><Loader className="w-5 h-5 animate-spin text-primary" /><span className="ml-2 text-sm text-neutral-500">Searching...</span></div>
                    ) : searchInput && locationSuggestions.length > 0 ? (
                      <div className="bg-white rounded-xl border border-neutral-200 divide-y divide-neutral-100 overflow-hidden">
                        {locationSuggestions.map((suggestion, idx) => {
                          const parts = suggestion.display_name.split(", ");
                          const mainText = parts[0];
                          const secondaryText = parts.slice(1).join(", ");
                          return (
                            <button key={idx} onClick={() => handleSelectLocation(suggestion)} className="w-full text-left px-4 py-3 hover:bg-neutral-50 transition-colors flex items-start gap-3" data-testid={`location-suggestion-${idx}`}>
                              <div className="w-10 h-10 rounded-full bg-neutral-100 flex items-center justify-center shrink-0"><MapPin className="w-5 h-5 text-neutral-600" /></div>
                              <div className="flex-1 min-w-0 pt-0.5"><p className="text-sm font-medium text-neutral-900 truncate">{mainText}</p><p className="text-xs text-neutral-500 truncate mt-0.5">{secondaryText}</p></div>
                            </button>
                          );
                        })}
                      </div>
                    ) : searchInput && searchInput.length >= 3 ? (
                      <div className="text-center py-6"><MapPin className="w-8 h-8 text-neutral-300 mx-auto mb-2" /><p className="text-sm text-neutral-500">No locations found</p><p className="text-xs text-neutral-400 mt-2">Try searching for a nearby landmark, road, or area name</p></div>
                    ) : searchInput ? (
                      <div className="text-center py-4"><p className="text-xs text-neutral-400">Type at least 3 characters to search</p></div>
                    ) : (
                      <div className="text-center py-4"><p className="text-xs text-neutral-400">Search for an address or landmark</p></div>
                    )}
                  </div>
                </div>
              </div>

              <div className="p-6 border-t border-neutral-100 bg-white">
                <button onClick={() => setShowLocationModal(false)} className="w-full py-3 bg-neutral-100 text-neutral-700 font-bold rounded-2xl hover:bg-neutral-200 transition-colors" data-testid="button-close-location">Close</button>
              </div>
            </motion.div>
          </motion.div>
        )}

        {showCustomerCare && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center px-6" onClick={() => setShowCustomerCare(false)}>
            <motion.div initial={{ scale: 0.85, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.85, opacity: 0 }} className="bg-white rounded-3xl p-6 text-center shadow-2xl max-w-sm w-full" onClick={(e) => e.stopPropagation()}>
              <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-4">
                <Phone size={32} className="text-primary" />
              </div>
              <h3 className="text-lg font-bold text-neutral-900 mb-1">Help & Support</h3>
              <p className="text-neutral-500 text-xs mb-5">We're here to help!</p>
              <div className="space-y-2 text-left">
                <a href={`tel:${supportPhone.replace(/\s/g, '')}`} className="flex items-center gap-3 p-3 bg-green-50 rounded-xl hover:bg-green-100 transition-colors no-underline" data-testid="link-call-support-booking">
                  <div className="w-9 h-9 bg-green-500 rounded-full flex items-center justify-center"><Phone className="w-4 h-4 text-white" /></div>
                  <div className="text-left"><p className="font-semibold text-neutral-900 text-sm">Call Us</p><p className="text-xs text-neutral-600">{supportPhone}</p></div>
                </a>
                <a href={`mailto:${supportEmail}`} className="flex items-center gap-3 p-3 bg-blue-50 rounded-xl hover:bg-blue-100 transition-colors no-underline" data-testid="link-email-support-booking">
                  <div className="w-9 h-9 bg-blue-500 rounded-full flex items-center justify-center"><Mail className="w-4 h-4 text-white" /></div>
                  <div className="text-left"><p className="font-semibold text-neutral-900 text-sm">Email Us</p><p className="text-xs text-neutral-600">{supportEmail}</p></div>
                </a>
              </div>
              <button onClick={() => setShowCustomerCare(false)} className="mt-5 w-full py-3 bg-gradient-to-r from-[#0d3da8] to-[#1d4ed8] text-white font-bold rounded-2xl hover:from-[#092c7d] hover:to-[#1a56db] shadow-xl shadow-[#0d3da8]/25 transition-colors" data-testid="button-close-care">Close</button>
            </motion.div>
          </motion.div>
        )}

        {showSuccess && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center px-6" onClick={() => {}}>
            <motion.div initial={{ scale: 0.85, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.85, opacity: 0 }} className="bg-white rounded-3xl p-6 text-center shadow-2xl max-w-sm w-full" onClick={(e) => e.stopPropagation()}>
              <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 size={40} className="text-green-600" />
              </div>
              <h3 className="text-xl font-bold text-neutral-900 mb-2">Space Posted!</h3>
              <p className="text-neutral-500 text-xs mb-6">Your parking space has been posted successfully. Space Seekers will be able to find it.</p>
              <button onClick={() => setLocation("/customer/bookings")} className="w-full py-3 bg-[#241e98] hover:bg-[#1c177c] text-white font-bold rounded-2xl shadow-lg shadow-[#241e98]/30 transition-colors">View My Spaces</button>
            </motion.div>
          </motion.div>
        )}
        </AnimatePresence>
      </div>
    </MobileLayout>
  );
}
