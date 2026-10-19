import React, { useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import {
  Bell,
  CheckCircle2,
  XCircle,
  Car,
  MapPin,
  UserCheck,
  Sparkles,
  CheckCheck,
  Trash2,
  Clock,
  ChevronRight,
  Inbox,
  Filter,
  Check,
  LogIn,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { isGuest } from "@/lib/guest";
import { useRegisterModalBack } from "@/contexts/mobile-back-context";

export interface NotificationItem {
  id: string;
  type: string;
  title: string;
  message: string;
  createdAt: string;
  isRead: boolean;
  bookingId?: string | null;
}

interface NotificationSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  notifications: NotificationItem[];
  onNotificationClick?: (notification: NotificationItem) => void;
  onClearAll?: () => void;
  onMarkAllRead?: () => void;
  isClearing?: boolean;
  isLoading?: boolean;
}

export function NotificationSheet({
  open,
  onOpenChange,
  notifications,
  onNotificationClick,
  onClearAll,
  onMarkAllRead,
  isClearing = false,
  isLoading = false,
}: NotificationSheetProps) {
  useRegisterModalBack(open, () => onOpenChange(false), "notification-sheet");
  const [filter, setFilter] = useState<"all" | "unread">("all");

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const filteredNotifications = notifications.filter((n) => {
    if (filter === "unread") return !n.isRead;
    return true;
  });

  const getIconConfig = (type: string) => {
    switch (type) {
      case "booking_accepted":
      case "job_accepted":
        return {
          icon: CheckCircle2,
          bg: "bg-emerald-500/10 text-emerald-600 ring-emerald-500/20",
          border: "border-emerald-200 dark:border-emerald-800",
          badge: "Accepted",
        };
      case "booking_cancelled":
      case "job_rejected":
        return {
          icon: XCircle,
          bg: "bg-rose-500/10 text-rose-600 ring-rose-500/20",
          border: "border-rose-200 dark:border-rose-800",
          badge: "Cancelled",
        };
      case "worker_assigned":
        return {
          icon: UserCheck,
          bg: "bg-purple-500/10 text-purple-600 ring-purple-500/20",
          border: "border-purple-200 dark:border-purple-800",
          badge: "Assigned",
        };
      case "new_job":
      case "parking_space":
      case "new_parking":
        return {
          icon: MapPin,
          bg: "bg-blue-500/10 text-blue-600 ring-blue-500/20",
          border: "border-blue-200 dark:border-blue-800",
          badge: "Parking Alert",
        };
      case "broadcast":
      case "announcement":
        return {
          icon: Sparkles,
          bg: "bg-amber-500/10 text-amber-600 ring-amber-500/20",
          border: "border-amber-200 dark:border-amber-800",
          badge: "Update",
        };
      default:
        return {
          icon: Bell,
          bg: "bg-primary/10 text-primary ring-primary/20",
          border: "border-primary/20",
          badge: "Notification",
        };
    }
  };

  const formatTimestamp = (dateString: string) => {
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMs / 3600000);
      const diffDays = Math.floor(diffMs / 86400000);

      if (isNaN(date.getTime())) return "Recently";
      if (diffMins < 1) return "Just now";
      if (diffMins < 60) return `${diffMins}m ago`;
      if (diffHours < 24) return `${diffHours}h ago`;
      if (diffDays === 1) return "Yesterday";
      return `${diffDays}d ago`;
    } catch {
      return "Recently";
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        overlayClassName="bg-slate-900/50 backdrop-blur-xs"
        className="w-[80vw] max-w-[80vw] sm:max-w-md p-0 bg-slate-50/95 dark:bg-slate-950 backdrop-blur-xl border-l border-slate-200/80 dark:border-slate-800 shadow-2xl flex flex-col h-full rounded-l-3xl"
      >
        {/* Header */}
        <SheetHeader
          className="px-5 py-4 border-b border-slate-200/80 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md sticky top-0 z-20"
          style={{ paddingTop: "calc(1rem + env(safe-area-inset-top, 0px))" }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="relative p-2 rounded-xl bg-primary/10 text-primary">
                <Bell size={20} className="stroke-[2.2]" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-primary"></span>
                  </span>
                )}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <SheetTitle className="text-lg font-bold text-slate-900 dark:text-slate-100 tracking-tight">
                    Notifications
                  </SheetTitle>
                  {unreadCount > 0 && (
                    <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-primary/10 text-primary border border-primary/20">
                      {unreadCount} new
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Stay updated with live parking & booking alerts
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-1">
              {onMarkAllRead && unreadCount > 0 && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onMarkAllRead}
                  className="h-8 w-8 text-slate-500 hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
                  title="Mark all as read"
                >
                  <CheckCheck size={16} />
                </Button>
              )}
              {onClearAll && notifications.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onClearAll}
                  disabled={isClearing}
                  className="h-8 px-2.5 text-xs font-medium text-rose-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg transition-colors gap-1.5"
                >
                  <Trash2 size={13} />
                  {isClearing ? "Clearing..." : "Clear"}
                </Button>
              )}
            </div>
          </div>

          {/* Filter Bar */}
          {notifications.length > 0 && (
            <div className="flex items-center gap-1 mt-3 p-1 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200/60 dark:border-slate-700/50">
              <button
                onClick={() => setFilter("all")}
                className={cn(
                  "flex-1 py-1.5 px-3 text-xs font-medium rounded-lg transition-all text-center flex items-center justify-center gap-1.5",
                  filter === "all"
                    ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-sm font-semibold"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
                )}
              >
                All
                <span className="px-1.5 py-0.2 rounded-md bg-slate-100 dark:bg-slate-800 text-[10px] font-bold">
                  {notifications.length}
                </span>
              </button>
              <button
                onClick={() => setFilter("unread")}
                className={cn(
                  "flex-1 py-1.5 px-3 text-xs font-medium rounded-lg transition-all text-center flex items-center justify-center gap-1.5",
                  filter === "unread"
                    ? "bg-white dark:bg-slate-900 text-primary font-semibold shadow-sm"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
                )}
              >
                Unread
                {unreadCount > 0 && (
                  <span className="px-1.5 py-0.2 rounded-md bg-primary text-white text-[10px] font-bold">
                    {unreadCount}
                  </span>
                )}
              </button>
            </div>
          )}
        </SheetHeader>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center h-64 text-slate-400 space-y-3">
              <div className="relative">
                <div className="w-10 h-10 border-3 border-primary/20 border-t-primary rounded-full animate-spin" />
              </div>
              <p className="text-xs font-medium">Fetching notifications...</p>
            </div>
          ) : filteredNotifications.length === 0 ? (
            isGuest() ? (
              <div className="flex flex-col items-center justify-center h-80 p-6 text-center">
                <div className="w-16 h-16 rounded-2xl bg-indigo-50 border border-indigo-100 text-[#241e98] flex items-center justify-center mb-4 shadow-sm">
                  <Bell size={28} />
                </div>
                <h4 className="text-base font-bold text-slate-800 dark:text-slate-200">
                  Sign in for Notifications
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-[260px] leading-relaxed">
                  Log in to receive live alerts about new parking spots, booking requests, and inquiries.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    onOpenChange(false);
                    const userRole = localStorage.getItem("userRole");
                    const roleParam = userRole === "customer" || userRole === "space-provider" ? "space-provider" : "space-seeker";
                    window.location.href = `/auth?role=${roleParam}`;
                  }}
                  className="mt-5 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#241e98] via-[#2b24b1] to-[#3e3ab3] hover:from-[#1b1778] hover:to-[#2e2a97] text-white text-xs font-bold shadow-md shadow-[#241e98]/25 transition-all cursor-pointer inline-flex items-center gap-2"
                  data-testid="button-notification-login"
                >
                  <LogIn size={14} />
                  Log In / Register
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-72 p-6 text-center">
                <div className="p-4 rounded-full bg-slate-100 dark:bg-slate-900 text-slate-400 mb-3 border border-slate-200/50 dark:border-slate-800">
                  <Inbox size={36} className="stroke-[1.5]" />
                </div>
                <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                  {filter === "unread" ? "No unread notifications" : "All caught up!"}
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-[240px]">
                  {filter === "unread"
                    ? "You have read all your recent notifications."
                    : "We'll alert you when there are new parking updates."}
                </p>
              </div>
            )
          ) : (
            <AnimatePresence mode="popLayout">
              {filteredNotifications.map((notification, index) => {
                const iconConfig = getIconConfig(notification.type);
                const IconComponent = iconConfig.icon;

                return (
                  <motion.div
                    key={notification.id}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.96 }}
                    transition={{ duration: 0.15 }}
                    onClick={() => onNotificationClick?.(notification)}
                    className={cn(
                      "p-3 rounded-2xl transition-all cursor-pointer border flex items-start gap-3",
                      !notification.isRead
                        ? "bg-blue-50/40 dark:bg-blue-950/30 border-blue-100 dark:border-blue-900/50 hover:bg-blue-50/70"
                        : "bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50"
                    )}
                  >
                    {/* Icon Badge */}
                    <div
                      className={cn(
                        "w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5",
                        iconConfig.bg
                      )}
                    >
                      <IconComponent size={16} className="stroke-[2]" />
                    </div>

                    {/* Notification Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <h3
                          className={cn(
                            "text-xs font-bold truncate",
                            !notification.isRead
                              ? "text-slate-900 dark:text-slate-100"
                              : "text-slate-700 dark:text-slate-300"
                          )}
                        >
                          {notification.title}
                        </h3>
                        {!notification.isRead && (
                          <span className="px-1.5 py-0.5 rounded-full text-[9px] font-extrabold bg-blue-600 text-white shrink-0">
                            NEW
                          </span>
                        )}
                      </div>

                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-relaxed line-clamp-2">
                        {notification.message}
                      </p>

                      <div className="flex items-center gap-1 mt-1.5 text-[10px] text-slate-400 dark:text-slate-500 font-medium">
                        <Clock size={10} className="stroke-[2]" />
                        <span>{formatTimestamp(notification.createdAt)}</span>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
