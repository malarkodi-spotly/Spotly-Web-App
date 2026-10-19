import { useState, useEffect, useMemo } from "react";
import { useLocation } from "wouter";
import { Capacitor } from "@capacitor/core";
import { Button } from "@/components/ui/button";
import { MapPin, Loader2, Navigation, AlertTriangle, CheckCircle, Shield, RotateCcw, Eye } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { getApiUrl } from "@/lib/api-config";
import { motion, AnimatePresence } from "framer-motion";
import spotlyIcon from "@assets/Logos/Spotly-4.png";
import SwiggyLocationPicker from "@/components/swiggy-location-picker";

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

const LocationRequiredIcon = () => (
  <svg className="w-24 h-24 text-white" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M20 30L40 20L60 30L80 20V70L60 60L40 70L20 60V30Z" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.4" />
    <path d="M40 20V70" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.4" />
    <path d="M60 30V80" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.4" />
    <circle cx="50" cy="40" r="14" stroke="currentColor" strokeWidth="2.5" />
    <path d="M50 54V65" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
    <path d="M50 15C33.5 15 30 28.5 30 40C30 51.5 50 75 50 75C50 75 70 51.5 70 40C70 28.5 66.5 15 50 15Z" stroke="#f472b6" strokeWidth="3" strokeLinejoin="round" className="animate-pulse" />
    <circle cx="50" cy="36" r="3" fill="currentColor" />
    <path d="M50 39V45" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

const ServiceNotAvailableIcon = () => (
  <svg className="w-24 h-24 text-white" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="50" cy="50" r="35" stroke="currentColor" strokeWidth="2.5" opacity="0.3" />
    <path d="M15 50H85" stroke="currentColor" strokeWidth="2.5" opacity="0.3" />
    <path d="M50 15V85" stroke="currentColor" strokeWidth="2.5" opacity="0.3" />
    <path d="M22 30C32 40 68 40 78 30" stroke="currentColor" strokeWidth="2" opacity="0.3" />
    <path d="M22 70C32 60 68 60 78 70" stroke="currentColor" strokeWidth="2" opacity="0.3" />
    <circle cx="50" cy="50" r="18" fill="#ef4444" stroke="#ffffff" strokeWidth="3" />
    <path d="M50 42V52" stroke="#ffffff" strokeWidth="3" strokeLinecap="round" />
    <circle cx="50" cy="59" r="2.5" fill="#ffffff" />
  </svg>
);

export default function CustomerLocationSetup() {
  const [, setLocation] = useLocation();

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
      const stateName = (s.prefix || s.cityName || "").trim();
      if (!stateName) continue;
      const key = stateName.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      result.push({ id: s.id, displayName: s.cityName || stateName, stateName });
    }
    if (result.length === 0) {
      return [
        { id: "kar-default", displayName: "Karnataka", stateName: "Karnataka" },
        { id: "tn-default", displayName: "Tamil Nadu", stateName: "Tamil Nadu" },
      ];
    }
    return result;
  }, [serviceStatesData]);

  const completeSetup = (city: string, state: string, lat?: number, lng?: number, address?: string) => {
    localStorage.removeItem("exploreMode");
    if (lat !== undefined) localStorage.setItem("userLatitude", lat.toString());
    else localStorage.removeItem("userLatitude");
    if (lng !== undefined) localStorage.setItem("userLongitude", lng.toString());
    else localStorage.removeItem("userLongitude");
    localStorage.setItem("userDetectedCity", city);
    localStorage.setItem("userDetectedAddress", address || "");
    localStorage.setItem("userState", state);
    localStorage.setItem("selectedServiceAreaName", city);
    setLocation("/space-provider/home");
  };

  const handleExploreApp = () => {
    localStorage.setItem("exploreMode", "true");
    localStorage.setItem("userDetectedCity", "Bengaluru");
    localStorage.setItem("selectedServiceAreaName", "Bengaluru");
    localStorage.setItem("userState", "Karnataka");
    setLocation("/space-provider/home");
  };

  return (
    <div className="fixed inset-0 w-screen h-[100dvh] overflow-hidden z-50 bg-black/80">
      <SwiggyLocationPicker
        availableServiceAreas={availableServiceAreas}
        onConfirmLocation={(city, state, lat, lng, address) => {
          completeSetup(city, state, lat, lng, address);
        }}
        onExploreMode={handleExploreApp}
      />
    </div>
  );
}
