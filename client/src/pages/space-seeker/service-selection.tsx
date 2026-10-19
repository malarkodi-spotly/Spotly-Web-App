import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import MobileLayout from "@/components/layout/mobile-layout";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2, Car, Bike, ParkingCircle, type LucideIcon } from "lucide-react";
import { motion } from "framer-motion";
import { getApiUrl } from "@/lib/api-config";

interface Service {
  id: string;
  name: string;
  icon: string;
  description: string;
  isActive: boolean;
  displayOrder: number;
}

const getParkingIcon = (name: string): { icon: LucideIcon; color: string; bg: string } => {
  const lower = name.toLowerCase();
  if (lower.includes("car") && lower.includes("bike")) {
    return { icon: ParkingCircle, color: "text-blue-600", bg: "bg-blue-100" };
  }
  if (lower.includes("bike")) {
    return { icon: Bike, color: "text-blue-600", bg: "bg-blue-100" };
  }
  if (lower.includes("car")) {
    return { icon: Car, color: "text-green-600", bg: "bg-green-100" };
  }
  return { icon: ParkingCircle, color: "text-primary", bg: "bg-blue-100" };
};

export default function WorkerServiceSelection() {
  const [, setLocation] = useLocation();
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [services, setServices] = useState<Service[]>([]);
  const [isLoadingServices, setIsLoadingServices] = useState(true);

  useEffect(() => {
    const fetchServices = async () => {
      try {
        const res = await fetch(getApiUrl("/api/services"));
        if (res.ok) {
          const data = await res.json();
          setServices((data.services || []).filter((s: Service) => s.isActive));
        }
      } catch (error) {
        console.error("Failed to fetch services:", error);
      } finally {
        setIsLoadingServices(false);
      }
    };
    fetchServices();
  }, []);

  const toggleService = (serviceId: string) => {
    setSelectedServices((prev) =>
      prev.includes(serviceId)
        ? prev.filter((id) => id !== serviceId)
        : [...prev, serviceId]
    );
  };

  const handleContinue = async () => {
    if (selectedServices.length === 0) return;
    
    setIsLoading(true);
    localStorage.setItem("workerServices", JSON.stringify(selectedServices));
    
    setTimeout(() => {
      setIsLoading(false);
      setLocation("/space-seeker/location-setup");
    }, 500);
  };

  return (
    <MobileLayout>
      <div className="h-full flex flex-col p-6 bg-white">
        <button
          onClick={() => setLocation("/auth?role=space-seeker")}
          className="w-10 h-10 rounded-full bg-neutral-100 flex items-center justify-center text-neutral-600 hover:bg-neutral-200 transition-colors mb-6"
          data-testid="button-back-service-selection"
        >
          <ArrowLeft size={20} />
        </button>

        <div className="flex-1 flex flex-col">
          <div className="mb-6">
            <h2 className="text-2xl font-bold font-heading text-neutral-900 mb-2">
              Select Parking Interest
            </h2>
            <p className="text-sm text-neutral-500">
              Choose the type of parking you're looking for
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-auto overflow-y-auto">
            {isLoadingServices ? (
              <div className="col-span-2 flex items-center justify-center py-8">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : (
              services.map((service, index) => {
                const { icon: IconComponent, color, bg } = getParkingIcon(service.name);
                const isSelected = selectedServices.includes(service.name);
                
                return (
                  <motion.button
                    key={service.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.05 }}
                    onClick={() => toggleService(service.name)}
                    className={`relative p-4 rounded-2xl border-2 transition-all flex flex-col items-center text-center ${
                      isSelected
                        ? "border-primary bg-primary/5 shadow-md"
                        : "border-neutral-200 bg-white hover:border-neutral-300"
                    }`}
                    data-testid={`button-service-${service.name}`}
                  >
                    {isSelected && (
                      <div className="absolute top-2 right-2 w-5 h-5 bg-primary rounded-full flex items-center justify-center">
                        <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    )}
                    
                    <div className={`w-12 h-12 ${bg} rounded-xl flex items-center justify-center mb-3`}>
                      <IconComponent size={24} className={color} />
                    </div>
                    
                    <p className="font-semibold text-neutral-900 text-sm">
                      {service.name}
                    </p>
                  </motion.button>
                );
              })
            )}
          </div>

          <div className="pt-6 space-y-3">
            <p className="text-xs text-neutral-500 text-center">
              {selectedServices.length === 0
                ? "Please select at least one parking type"
                : `${selectedServices.length} type${selectedServices.length !== 1 ? "s" : ""} selected`}
            </p>
            <Button
              onClick={handleContinue}
              disabled={selectedServices.length === 0 || isLoading}
              className="w-full h-12 rounded-xl text-base"
              data-testid="button-continue-services"
            >
              {isLoading ? "Continuing..." : "Continue"}
            </Button>
          </div>
        </div>
      </div>
    </MobileLayout>
  );
}
