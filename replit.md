# Spotly – Car & Bike Parking - Replit Agent Guide

## Overview

Spotly – Car & Bike Parking is a mobile-first PWA that connects parking space owners (Space Providers) with people looking for parking (Space Seekers). The app supports two user roles: Space Provider (lists/manages parking spaces, internally mapped to `customer` role) and Space Seeker (finds/books parking, internally mapped to `worker` role). Built as a full-stack TypeScript application with a React frontend and Express.js backend with PostgreSQL.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **Routing**: Wouter
- **State Management**: TanStack React Query
- **Styling**: Tailwind CSS with shadcn/ui components (New York style)
- **Animations**: Framer Motion
- **Design**: Mobile-first, simulating a phone interface with status bar and bottom navigation.
- **Theme**: Primary color is deep royal blue (#0d3da8).
- **UI/UX Decisions**:
    - Account Management: Delete account, session token management, "Share App" feature.
    - Notification System: City-based notifications, location-based nearby notifications (10km radius via Haversine), reassuring messages for cancellations/rejections, admin broadcast system. Space Seeker GPS coordinates saved to worker profile for proximity matching.
    - Proximity-Based Spaces: Space Seeker home shows only parking spaces within 3km radius of user's current GPS location (server-side Haversine filtering). Falls back to city-based filtering if location unavailable.
    - Pagination: Both Space Provider and Space Seeker home pages use infinite scroll (20 items per page) with "Load More" button. Backend supports `limit`, `offset`, `lat`, `lng`, `radius` query params on `/api/bookings/pending`.
    - Disclaimer System: Mandatory multilingual disclaimer page with text-to-speech and language selection.
    - Space Seeker Location Setup: Leaflet.js with OpenStreetMap for location setting.
    - Service Area Selection: State-based validation (Karnataka, Tamil Nadu, etc.) instead of pincode prefixes. Users' detected state from reverse geocoding is matched against admin-configured service states.
    - Input Validation: Description (letters-only, max 60 chars), address and name fields block digits, GPS auto-detect strips numbers.
    - Vibration Feedback: `client/src/lib/vibrate.ts` utility provides haptic feedback on button clicks and actions across all screens.
    - Splash Screen: Animated floating parking icons, shimmer effects, fade-in tagline.
    - Login Screen: Role-based background images (provider-bg.png, seeker-bg.png) with dark overlay.
    - OTP Verification: Single input field for 4-digit OTP with wide letter spacing, auto-complete support.
    - Profile Pages: Colorful gradient purple headers with overlapping profile cards.
    - Parking Cards (Seeker): Phone masking + Interested button on left; Photos + View Contacts on right. Time-ago badges on dates. Premium gate on map/directions and location text.
    - Subscription Modal: Select-then-submit flow (choose plan, then click "Subscribe Now").

### Role Mapping
- **Space Provider** = `customer` role in database/API (lists parking spaces)
- **Space Seeker** = `worker` role in database/API (finds/books parking)
- **Parking Space** = `booking` in database/API (a posted parking listing)
- Comments field format: `Rent: ₹{amount}/month | {description}[PHOTOS][...base64...][/PHOTOS]`

### Backend Architecture
- **Runtime**: Node.js with Express.js
- **Language**: TypeScript
- **API Style**: RESTful JSON API under `/api` prefix.
- **Build Output**: esbuild bundles server to CommonJS.

### Data Layer
- **Database**: PostgreSQL
- **ORM**: Drizzle ORM with drizzle-zod for schema validation.
- **Schema Location**: `shared/schema.ts` (shared between frontend and backend).
- **Migrations**: Drizzle Kit.

### Authentication Flow
- OTP-based authentication (mobile number + role combination).
- Real SMS OTP integration via InstantAlerts.in — **LIVE & WORKING** (verified May 13, 2026).
  - Sender ID: `INSTNE`, Route: `2` (Transactional)
  - DLT Template ID: `1407177916444902497`
  - Approved DLT message: `Welcome to Spotly India's No.1 Online Car & Bike Parking Space Provider & Seeker App\n\nYour OTP is: {otp}\n\nVerify your mobile number to continue accessing smart parking bookings, live parking availability, and hassle-free parking experiences.\n\nDo not share this OTP with anyone.\n\nSpotly - Find. Park. Go`
  - Server validates OTP against stored value with 10-min expiry; cooldown 30s between sends.
- Web OTP API integration for auto-reading and submitting OTPs.
- User sessions stored in-memory `userSessions` Map with 7-day expiry.
- `PATCH /api/users/me` uses session token lookup (not base64 decode) for auth.
- Admin sessions stored in-memory `adminSessions` Map with 24-hour expiry.
- **Admin API Middleware**: Express middleware on `/api/admin/*` validates admin session token (excludes `/login` and `/session` routes). Admin level (`super`/`sub`) attached to `req.adminLevel`.
- **Admin Fetch Utility**: `adminFetch()` in `client/src/lib/api-config.ts` automatically adds `Authorization: Bearer <adminToken>` header to all admin API calls.

### Key Design Patterns
- **Storage Interface Pattern**: `IStorage` interface in `server/storage.ts` abstracts database operations.
- **Schema Validation**: Zod schemas for API validation and TypeScript types.
- **Mobile Layout Wrapper**: `MobileLayout` component for consistent mobile UI.

### Admin Panel
- Comprehensive admin panel at `/admin` with server-side authentication (Super admin and Normal admin levels). All admin API routes protected by middleware.
- Navigation: Dashboard, Parking Types, Cities, Service States, Space Providers, Space Seekers, Parking Spaces, Settings.
- **Dashboard**: Shows Total Space Providers, Total Space Seekers, Total Spaces Posted, Active Cities. Payment/revenue section for super admin only.
- **Space Providers** (customers.tsx): Name, Mobile, City, Registration Date, Spaces Posted. City filter, search, Excel export. No premium references.
- **Space Seekers** (workers.tsx): Name, Mobile, City, Registration Date, Premium Status. City filter, search, Excel export.
- **Parking Spaces** (bookings.tsx): Parking Type, Location, Description, Posted By, Date Posted, Interest Count. City filter, search.
- **Parking Types** (services.tsx): Add/Edit/Delete/Toggle parking types.
- **Settings**: Coming Soon Mode, Broadcast Notifications (targets: customers=providers, workers=seekers, all), Support Info, App Version, Space Seekers Premium (super admin).
- **Excel Export**: Space Providers and Space Seekers lists can be exported to Excel files using the xlsx library.
- **City Filtering**: Available on Space Providers, Space Seekers, and Parking Spaces pages.
- **User Ordering**: Users table includes `createdAt` field for proper newest-first sorting in admin lists.
- Premium subscription is for Space Seekers only, managed by super admin in settings.
- **Premium Plans**: Admin-configurable via Settings. Each plan (Basic, Standard, Premium) has configurable price, view count, and on/off toggle. Stored in `app_settings` as `premium_{plan}_price`, `premium_{plan}_enabled`, `premium_{plan}_views`. Defaults: Basic (₹199, 10 views), Standard (₹299, 20 views), Premium (₹399, unlimited). DB user fields: `premiumPlan`, `premiumViewsRemaining`, `premiumExpiresAt`. 30-day validity. View contact reveals actual phone number. Expired/exhausted plans prompt re-subscription. Frontend fetches plans from `/api/settings/premium-plans` and only shows enabled plans.

## External Dependencies

- **Database**: PostgreSQL (via `DATABASE_URL` environment variable).
- **ORM**: Drizzle ORM.
- **SMS Gateway**: InstantAlerts.in (for OTP delivery).
- **UI Components**: Radix UI, shadcn/ui, Lucide React (icons).
- **Mapping**: Leaflet.js, OpenStreetMap (for Space Seeker location setup).
- **Development Tools**: Vite, esbuild, Tailwind CSS v4.
- **Replit-Specific**: `@replit/vite-plugin-runtime-error-modal`, `@replit/vite-plugin-cartographer`, `@replit/vite-plugin-dev-banner`.
