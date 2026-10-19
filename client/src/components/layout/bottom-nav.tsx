import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Home, Plus, User, Car, Heart } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { isGuest } from "@/lib/guest";
import { useAuthGuard } from "@/contexts/auth-guard";

interface BottomNavProps {
  userType: "customer" | "worker";
}

const GUEST_PROTECTED_PATHS = new Set([
  "/space-provider/bookings",
]);

export default function BottomNav({ userType }: BottomNavProps) {
  const [location, setLocation] = useLocation();
  const [currentSearch, setCurrentSearch] = useState(() => typeof window !== "undefined" ? window.location.search : "");
  const { requireLogin } = useAuthGuard();

  useEffect(() => {
    const handleUrlUpdate = () => {
      if (typeof window !== "undefined") {
        setCurrentSearch(window.location.search);
      }
    };
    handleUrlUpdate();
    window.addEventListener("popstate", handleUrlUpdate);
    window.addEventListener("locationchange", handleUrlUpdate);
    return () => {
      window.removeEventListener("popstate", handleUrlUpdate);
      window.removeEventListener("locationchange", handleUrlUpdate);
    };
  }, [location]);

  const customerLinks = [
    { href: "/space-provider/home", icon: Home, label: "Home", isCenter: false },
    { href: "/space-provider/bookings", icon: Plus, label: "Post Space", isCenter: true },
    { href: "/space-provider/account", icon: User, label: "Profile", isCenter: false },
  ];

  const workerLinks = [
    { href: "/space-seeker/home", icon: Car, label: "Spaces", isCenter: false },
    { href: "/space-seeker/home?filter=favourites", icon: Heart, label: "Saved", isCenter: false },
    { href: "/space-seeker/account", icon: User, label: "Profile", isCenter: false },
  ];

  const links = userType === "customer" ? customerLinks : workerLinks;

  return (
    <div className="shrink-0 z-40 relative bg-white border-t border-slate-100/90 shadow-[0_-6px_25px_rgba(0,0,0,0.06)] pb-[max(0.75rem,env(safe-area-inset-bottom,0px))]">
      <div className="h-[62px] flex items-center justify-around px-4">
          {links.map((link) => {
            const isFavouritesTab = link.href.includes("filter=favourites");
            const isCurrentFavourites = currentSearch.includes("filter=favourites") || currentSearch.includes("filter=saved");

            let isActive = false;
            if (isFavouritesTab) {
              isActive = location.startsWith("/space-seeker/home") && isCurrentFavourites;
            } else if (link.href === "/space-seeker/home") {
              isActive = location === "/space-seeker/home" && !isCurrentFavourites;
            } else {
              isActive = location === link.href;
            }

            if (link.isCenter) {
              return (
                <button
                  key={link.href}
                  onClick={() => {
                    if ((isGuest() || !localStorage.getItem("userId") || localStorage.getItem("exploreMode") === "true") && GUEST_PROTECTED_PATHS.has(link.href)) {
                      requireLogin(link.label.toLowerCase());
                      return;
                    }
                    setLocation(link.href);
                  }}
                  className="flex flex-col items-center justify-center flex-1 h-full relative group"
                  data-testid={`nav-${link.label.toLowerCase().replace(/\s+/g, "-")}`}
                >
                  <div
                    className="w-12 h-12 rounded-full text-white flex items-center justify-center shadow-lg shadow-[#1e3a8a]/30 group-active:scale-95 transition-transform -mt-2 mb-0.5"
                    style={{ background: "linear-gradient(135deg, #1e3a8a 0%, #3b2fad 35%, #6d28d9 70%, #7c3aed 100%)" }}
                  >
                    <Plus className="w-6 h-6 stroke-[3]" />
                  </div>
                  <span className={cn(
                    "text-[10px] font-bold transition-colors duration-200",
                    isActive ? "text-[#241e98]" : "text-slate-500"
                  )}>
                    {link.label}
                  </span>
                  {isActive && (
                    <motion.div
                      layoutId="bottomNavDot"
                      className="w-1.5 h-1.5 rounded-full bg-[#241e98] mt-0.5"
                      transition={{ type: "spring", stiffness: 350, damping: 30 }}
                    />
                  )}
                </button>
              );
            }

            return (
              <button
                key={link.href}
                onClick={() => {
                  if ((isGuest() || !localStorage.getItem("userId") || localStorage.getItem("exploreMode") === "true") && GUEST_PROTECTED_PATHS.has(link.href)) {
                    requireLogin(link.label.toLowerCase());
                    return;
                  }
                  if (link.href.includes("filter=favourites")) {
                    setLocation("/space-seeker/home?filter=favourites");
                    if (typeof window !== "undefined") {
                      window.history.pushState({}, "", "/space-seeker/home?filter=favourites");
                      window.dispatchEvent(new Event("locationchange"));
                    }
                  } else {
                    setLocation(link.href);
                    if (typeof window !== "undefined") {
                      window.history.pushState({}, "", link.href);
                      window.dispatchEvent(new Event("locationchange"));
                    }
                  }
                }}
                className="flex flex-col items-center justify-center flex-1 h-full relative"
                data-testid={`nav-${link.label.toLowerCase().replace(/\s+/g, "-")}`}
              >
                <div className={cn(
                  "p-2 rounded-2xl transition-all duration-200 mb-0.5",
                  isActive ? "bg-[#ECEBFF] text-[#241e98]" : "text-slate-400"
                )}>
                  <link.icon
                    className="w-5 h-5"
                    strokeWidth={isActive ? 2.5 : 2}
                  />
                </div>
                <span className={cn(
                  "text-[10px] transition-colors duration-200",
                  isActive
                    ? "font-extrabold text-[#241e98]"
                    : "font-semibold text-slate-500"
                )}>
                  {link.label}
                </span>
                {isActive && (
                  <motion.div
                    layoutId="bottomNavDot"
                    className="w-1.5 h-1.5 rounded-full bg-[#241e98] mt-0.5"
                    transition={{ type: "spring", stiffness: 350, damping: 30 }}
                  />
                )}
              </button>
            );
          })}
        </div>
    </div>
  );
}

