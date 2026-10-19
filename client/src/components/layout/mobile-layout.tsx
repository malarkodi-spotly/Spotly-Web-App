import React, { useState, useEffect, useCallback } from "react";
import { useLocation } from "wouter";
import { Bell, Trash2, Home, Car, Plus, User, Heart, MapPin } from "lucide-react";
import BottomNav from "./bottom-nav";
import DesktopHeader from "./desktop-header";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { getApiUrl } from "@/lib/api-config";
import { useScroll } from "@/contexts/scroll-context";
import { cn } from "@/lib/utils";

interface Notification {
  id: string;
  userId: string;
  type: string;
  title: string;
  message: string;
  bookingId: string | null;
  isRead: boolean;
  createdAt: string;
}

interface MobileLayoutProps {
  children: React.ReactNode;
  showNav?: boolean;
  userType?: "customer" | "worker";
}

export default function MobileLayout({ children, showNav = false, userType }: MobileLayoutProps) {
  const [location, setLocation] = useLocation();
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const userId = localStorage.getItem("userId");
  const userName = localStorage.getItem("userName") || "User";
  const userCity = localStorage.getItem("userDetectedCity") || localStorage.getItem("selectedServiceAreaName") || "Bengaluru";

  const fetchNotifications = async () => {
    if (!userId) return;
    setIsLoading(true);
    try {
      const res = await fetch(getApiUrl(`/api/notifications/${userId}`));
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications || []);
      }
    } catch (error) {
      console.error("Failed to fetch notifications:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (notificationsOpen && userId) {
      fetchNotifications();
      fetch(getApiUrl(`/api/notifications/${userId}/read-all`), { method: "POST" }).catch(() => {});
    }
  }, [notificationsOpen, userId]);

  const handleClearAll = async () => {
    if (!userId) return;
    try {
      const res = await fetch(getApiUrl(`/api/notifications/${userId}/clear`), {
        method: "DELETE",
      });
      if (res.ok) {
        setNotifications([]);
      }
    } catch (error) {
      console.error("Failed to clear notifications:", error);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "new_job": return "💼";
      case "job_accepted": return "✓";
      case "job_rejected": return "❌";
      case "rating_received": return "⭐";
      default: return "🔔";
    }
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;
    return `${diffDays} day${diffDays > 1 ? "s" : ""} ago`;
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;
  
  const { setScrollY } = useScroll();

  const handleScroll = useCallback((e: React.UIEvent<HTMLElement>) => {
    const target = e.target as HTMLElement;
    setScrollY(target.scrollTop);
  }, [setScrollY]);

  const [currentSearch, setCurrentSearch] = useState(() => typeof window !== "undefined" ? window.location.search : "");

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

  const navLinks = userType === "customer"
    ? [
        { href: "/space-provider/home", label: "Home", icon: Home },
        { href: "/space-provider/bookings", label: "Post Space", icon: Plus },
        { href: "/space-provider/account", label: "Profile", icon: User },
      ]
    : [
        { href: "/space-seeker/home", label: "Spaces", icon: Car },
        { href: "/space-seeker/home?filter=favourites", label: "Saved", icon: Heart },
        { href: "/space-seeker/account", label: "Profile", icon: User },
      ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      {/* Top Desktop Navigation Bar (shared gradient DesktopHeader on desktop md+ screens) */}
      <div className="hidden md:block">
        <DesktopHeader
          userRole={userType === "customer" ? "provider" : "seeker"}
          activeTab={
            location.includes("account")
              ? "profile"
              : location.includes("my-spaces")
              ? "my-spaces"
              : location.includes("saved") || location.includes("favourites")
              ? "saved"
              : userType === "customer"
              ? "my-spaces"
              : "spaces"
          }
          userName={userName}
          onNotificationsOpen={() => setNotificationsOpen(true)}
          unreadCount={notifications.filter((n) => !n.isRead).length}
          locationLabel={userCity}
        />
      </div>

      {/* Main Content Area */}
      {/* Mobile rendering (< md): 100% full screen mobile layout */}
      {/* Desktop rendering (>= md): Full width fluid container */}
      <div className="flex-1 w-full flex flex-col items-center justify-start p-0 md:pt-18 md:pb-8 md:px-8 bg-slate-50">
        <div className="w-full h-screen md:h-auto md:min-h-[calc(100vh-6rem)] max-w-md md:max-w-4xl md:mx-auto md:rounded-3xl md:bg-white md:border md:border-slate-200/80 md:shadow-xl overflow-hidden flex flex-col relative">
          <main id="mobile-scroll-container" className="flex-1 overflow-y-auto hide-scrollbar relative bg-white" onScroll={handleScroll}>
            {children}
          </main>

          {/* Bottom navigation (Mobile only) */}
          {showNav && userType && (
            <div className="block md:hidden">
              <BottomNav userType={userType} />
            </div>
          )}
          {!showNav && <div className="block md:hidden safe-area-bottom bg-white" />}
        </div>
      </div>

      {/* Notifications Sheet */}
      <Sheet open={notificationsOpen} onOpenChange={setNotificationsOpen}>
        <SheetContent side="right" overlayClassName="bg-slate-900/50 backdrop-blur-xs" className="w-[80vw] max-w-[80vw] sm:w-96 p-0 rounded-l-3xl">
          <SheetHeader
            className="border-b px-4 pb-4 sticky top-0 bg-white"
            style={{ paddingTop: 'calc(1rem + env(safe-area-inset-top, 0px))' }}
          >
            <div className="flex items-center justify-between">
              <SheetTitle className="text-lg font-bold">Notifications</SheetTitle>
              {notifications.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleClearAll}
                  className="text-red-500 hover:text-red-600 hover:bg-red-50 text-xs gap-1"
                  data-testid="button-clear-notifications"
                >
                  <Trash2 size={14} />
                  Clear All
                </Button>
              )}
            </div>
          </SheetHeader>
          
          <div className="overflow-y-auto h-[calc(100vh-100px)]">
            {isLoading ? (
              <div className="p-8 text-center text-neutral-500">
                <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                <p className="text-sm">Loading...</p>
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-8 text-center text-neutral-500">
                <Bell className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p className="text-sm">No notifications yet</p>
              </div>
            ) : (
              <div className="p-2 space-y-1.5">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    onClick={async () => {
                      try {
                        await fetch(getApiUrl(`/api/notifications/${notification.id}/read`), { method: "PATCH" });
                      } catch (err) {
                        console.error("Failed to mark notification as read:", err);
                      }
                      setNotificationsOpen(false);
                      if (notification.bookingId) {
                        const targetHome = userType === "worker" ? "/space-seeker/home" : "/space-provider/home";
                        setLocation(`${targetHome}?highlight=${notification.bookingId}`);
                      }
                    }}
                    className={`p-2.5 rounded-xl cursor-pointer transition-colors hover:bg-neutral-50 border ${
                      !notification.isRead ? "bg-blue-50/80 border-blue-100" : "border-slate-100"
                    }`}
                    data-testid={`notification-${notification.id}`}
                  >
                    <div className="flex gap-2.5 items-start">
                      <div className="text-base shrink-0 p-1.5 rounded-lg bg-blue-50 text-blue-600 mt-0.5">{getNotificationIcon(notification.type)}</div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <h3 className="font-bold text-xs text-neutral-900 line-clamp-1">
                            {notification.title}
                          </h3>
                          {!notification.isRead && (
                            <span className="w-1.5 h-1.5 bg-primary rounded-full shrink-0"></span>
                          )}
                        </div>
                        <p className="text-[11px] text-neutral-600 mt-0.5 line-clamp-2 leading-snug">
                          {notification.message}
                        </p>
                        <p className="text-[10px] text-neutral-400 mt-1">
                          {formatTime(notification.createdAt)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
