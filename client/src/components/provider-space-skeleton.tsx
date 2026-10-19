import React from "react";

interface ProviderSkeletonProps {
  count?: number;
  showHeader?: boolean;
}

/**
 * Shimmering overlay element for skeleton boxes
 */
function ShimmerBar({ className = "" }: { className?: string }) {
  return (
    <div
      className={`absolute inset-0 pointer-events-none -translate-x-full animate-skeleton-shimmer bg-gradient-to-r from-transparent via-white/50 to-transparent ${className}`}
    />
  );
}

/**
 * Desktop Skeleton for "My Spaces" list
 * Matches the exact horizontal layout of desktop provider space cards:
 * Image thumbnail with pill badges | Middle details (location, date/time, rent/duration/vehicle badges) | Right vertical action buttons
 */
export function ProviderDesktopSpaceSkeleton({ count = 3, showHeader = true }: ProviderSkeletonProps) {
  const items = Array.from({ length: Math.max(1, count) });

  return (
    <div className="space-y-4 font-sans" data-testid="provider-desktop-space-skeleton">
      {showHeader && (
        <div className="flex items-center justify-between mb-4 animate-pulse">
          <div>
            <div className="flex items-center gap-2.5">
              <h2 className="text-xl font-black text-slate-900 tracking-tight">Your Parking Spaces</h2>
              <div className="h-5 w-20 bg-indigo-100/80 rounded-full" />
            </div>
            <div className="h-3.5 w-60 bg-slate-200/70 rounded-md mt-1.5" />
          </div>
          <div className="h-9 w-32 rounded-xl bg-amber-200/60" />
        </div>
      )}

      <div className="space-y-3.5">
        {items.map((_, index) => (
          <div
            key={index}
            className="bg-white rounded-3xl border border-slate-200/90 p-5 shadow-xs flex flex-col xl:flex-row xl:items-center justify-between gap-5 relative overflow-hidden"
          >
            {/* Full Card Shimmer Sweep */}
            <ShimmerBar />

            {/* Left Section: Image Thumbnail + Details */}
            <div className="flex items-start sm:items-center gap-4 sm:gap-5 min-w-0 flex-1">
              {/* Image Thumbnail Skeleton */}
              <div className="w-32 h-26 sm:w-36 sm:h-28 rounded-2xl bg-slate-200/90 shrink-0 relative overflow-hidden">
                <ShimmerBar />
                {/* Top-left category badge placeholder */}
                <div className="absolute top-2 left-2 w-16 h-4 bg-slate-300/80 rounded-lg" />
                {/* Bottom-left photo count placeholder */}
                <div className="absolute bottom-2 left-2 w-7 h-4 bg-slate-400/50 rounded-lg" />
              </div>

              {/* Middle Details Column Skeleton */}
              <div className="min-w-0 flex-1 space-y-2">
                {/* Location Row + Seekers Interested Badge */}
                <div className="flex items-center gap-2.5 flex-wrap">
                  <div className="flex items-center gap-1.5">
                    <div className="w-4 h-4 rounded-full bg-slate-300/80 shrink-0" />
                    <div className="h-4.5 w-44 sm:w-60 bg-slate-200/90 rounded-lg" />
                  </div>
                  {/* Seekers Interested Pill */}
                  <div className="h-5.5 w-32 bg-amber-100/80 rounded-full border border-amber-200/60" />
                </div>

                {/* Date and Time Row */}
                <div className="flex items-center gap-1.5">
                  <div className="w-3.5 h-3.5 rounded bg-slate-200 shrink-0" />
                  <div className="h-3.5 w-40 bg-slate-200/70 rounded-md" />
                </div>

                {/* Badges Row (Rent + Duration + Vehicle Size) */}
                <div className="flex items-center gap-2 pt-1 flex-wrap">
                  {/* Rent Pill */}
                  <div className="h-6 w-24 bg-emerald-100/80 rounded-full border border-emerald-200/60" />
                  {/* Duration Pill */}
                  <div className="h-6 w-20 bg-indigo-100/80 rounded-full border border-indigo-200/60" />
                  {/* Vehicle Spec Pill */}
                  <div className="h-6 w-16 bg-slate-200/90 rounded-full border border-slate-200" />
                </div>
              </div>
            </div>

            {/* Right Section: Action Buttons Column (Edit, Delete, View) */}
            <div className="flex flex-col gap-2 shrink-0 w-full sm:w-36 pt-3 xl:pt-0 border-t xl:border-t-0 border-slate-100 justify-center">
              <div className="h-8 w-full bg-[#ECEBFF] rounded-xl border border-[#241e98]/15" />
              <div className="h-8 w-full bg-[#FFF1F2] rounded-xl border border-[#E11D48]/10" />
              <div className="h-8 w-full bg-slate-100 rounded-xl border border-slate-200" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Mobile Skeleton for "My Space Lists"
 * Matches the exact mobile provider card:
 * Rounded-3xl card, left image (94px/104px), right column with title, seekers count, badges, and 2 bottom buttons
 */
export function ProviderMobileSpaceSkeleton({ count = 3 }: { count?: number }) {
  const items = Array.from({ length: Math.max(1, count) });

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 py-1 px-1 font-sans" data-testid="provider-mobile-space-skeleton">
      {items.map((_, index) => (
        <div
          key={index}
          className="bg-white rounded-3xl p-3.5 border border-slate-100/90 shadow-xl shadow-slate-200/40 relative overflow-hidden"
        >
          {/* Shimmer sweep */}
          <ShimmerBar />

          <div className="flex gap-3.5 items-start relative">
            {/* Left Image Thumbnail */}
            <div className="w-[94px] h-[94px] sm:w-[104px] sm:h-[104px] rounded-2xl bg-slate-200/90 flex-shrink-0 relative overflow-hidden">
              <ShimmerBar />
              {/* Category pill */}
              <div className="absolute top-2 left-2 w-12 h-3.5 bg-slate-300/80 rounded-lg" />
              {/* Photos count pill */}
              <div className="absolute bottom-2 left-2 w-7 h-3 bg-slate-400/50 rounded-lg" />
            </div>

            {/* Right Details */}
            <div className="flex-1 min-w-0 flex flex-col justify-between min-h-[94px] sm:min-h-[104px] py-0.5">
              <div>
                {/* Location row + Heart badge */}
                <div className="flex items-start justify-between gap-1.5 mb-1.5">
                  <div className="flex items-center gap-1.5 flex-1 min-w-0">
                    <div className="w-3.5 h-3.5 rounded-full bg-slate-200 shrink-0" />
                    <div className="h-4 w-32 sm:w-40 bg-slate-200/90 rounded-md" />
                  </div>
                  <div className="h-4.5 w-11 bg-rose-100/80 rounded-full shrink-0 border border-rose-200/60" />
                </div>

                {/* Date and Time row */}
                <div className="flex items-center gap-1.5 mb-2.5">
                  <div className="w-3 h-3 rounded bg-slate-200 shrink-0" />
                  <div className="h-3 w-28 bg-slate-200/70 rounded-md" />
                </div>
              </div>

              {/* Badges row */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <div className="h-5 w-16 bg-emerald-100/80 rounded-full border border-emerald-200/50" />
                <div className="h-5 w-14 bg-indigo-100/80 rounded-full border border-indigo-200/50" />
                <div className="h-5 w-12 bg-slate-200/80 rounded-full" />
              </div>
            </div>
          </div>

          {/* Bottom Action Buttons (Edit Space + Delete Space) */}
          <div className="grid grid-cols-2 gap-3 mt-3.5 pt-1">
            <div className="h-9 w-full bg-[#ECEBFF] rounded-xl border border-[#241e98]/15" />
            <div className="h-9 w-full bg-[#FFF1F2] rounded-xl border border-[#E11D48]/10" />
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * Single Space Skeleton
 * Renders a single skeleton card gracefully, adapting for desktop or mobile screen
 */
export function ProviderSingleSpaceSkeleton({ className = "" }: { className?: string }) {
  return (
    <div className={`w-full ${className}`}>
      {/* Desktop view */}
      <div className="hidden md:block">
        <ProviderDesktopSpaceSkeleton count={1} showHeader={false} />
      </div>
      {/* Mobile view */}
      <div className="block md:hidden">
        <ProviderMobileSpaceSkeleton count={1} />
      </div>
    </div>
  );
}

/**
 * Skeleton for Provider Dashboard KPI Stat Cards & Fleet Summary Card
 */
export function ProviderDashboardSkeleton() {
  return (
    <div className="space-y-4 mb-7 animate-pulse font-sans">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Card 1: Active Spaces */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div className="w-9 h-9 rounded-xl bg-emerald-100/80 mb-3" />
          <div>
            <div className="h-3 w-24 bg-slate-200/80 rounded-md" />
            <div className="h-7 w-12 bg-slate-200 rounded-md mt-1.5" />
          </div>
          <div className="h-3 w-32 bg-indigo-100/80 rounded-md mt-2.5" />
        </div>

        {/* Card 2: Total Listed Spots */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div className="w-9 h-9 rounded-xl bg-blue-100/80 mb-3" />
          <div>
            <div className="h-3 w-28 bg-slate-200/80 rounded-md" />
            <div className="h-7 w-12 bg-slate-200 rounded-md mt-1.5" />
          </div>
          <div className="h-3 w-28 bg-blue-100/80 rounded-md mt-2.5" />
        </div>
      </div>

      {/* Fleet Summary Card */}
      <div className="p-5 rounded-2xl border border-slate-200/80 bg-white shadow-xs flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-4 w-64 bg-slate-200/90 rounded-md" />
          <div className="h-3 w-80 bg-slate-200/60 rounded-md" />
        </div>
        <div className="h-8 w-28 bg-slate-200/90 rounded-xl" />
      </div>
    </div>
  );
}

/**
 * Skeleton for spaces inside modals (e.g. Earnings modal)
 */
export function ProviderModalListSkeleton({ count = 2 }: { count?: number }) {
  const items = Array.from({ length: Math.max(1, count) });

  return (
    <div className="space-y-2">
      {items.map((_, i) => (
        <div
          key={i}
          className="flex items-center justify-between p-3 rounded-xl border border-slate-100 bg-slate-50/50 relative overflow-hidden animate-pulse"
        >
          <div className="min-w-0 flex-1 mr-2 space-y-1.5">
            <div className="h-3.5 w-36 bg-slate-200 rounded-md" />
            <div className="h-3 w-24 bg-slate-200/60 rounded-md" />
          </div>
          <div className="h-4 w-14 bg-slate-200 rounded-md shrink-0" />
        </div>
      ))}
    </div>
  );
}
