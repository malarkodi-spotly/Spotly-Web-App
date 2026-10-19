import { useEffect, lazy, Suspense, startTransition } from "react";
import { Switch, Route } from "wouter";
import { Capacitor } from "@capacitor/core";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ScrollProvider } from "@/contexts/scroll-context";
import { AuthGuardProvider } from "@/contexts/auth-guard";
import { MobileBackProvider } from "@/contexts/mobile-back-context";
import { LocationPermissionModal } from "@/components/location-permission-modal";
import { FeedbackModal } from "@/components/feedback-modal";
import NotFound from "@/pages/not-found";
import { UnderConstructionGuard } from "@/components/under-construction-guard";

import SplashPage from "@/pages/splash";
import LandingPage from "@/pages/landing";
import AuthPage from "@/pages/auth";
import RegisterPage from "@/pages/register";
import RoleSelectionPage from "@/pages/role-selection";
import GlobalLocationSetup from "@/pages/location-setup";

import CustomerHome from "@/pages/space-provider/home";
import CustomerBookings from "@/pages/space-provider/bookings";
import CustomerAccount from "@/pages/space-provider/account";
import CustomerContacts from "@/pages/space-provider/contacts";
import CustomerLocationSetup from "@/pages/space-provider/location-setup";
import BookingFlow from "@/pages/space-provider/booking-flow";

const WorkerHome = lazy(() => import("@/pages/space-seeker/home"));
const WorkerAccount = lazy(() => import("@/pages/space-seeker/account"));
import WorkerLocationSetup from "@/pages/space-seeker/location-setup";

// Preload space-seeker routes eagerly after initial render
const preloadSeekerRoutes = () => {
  import("@/pages/space-seeker/home");
  import("@/pages/space-seeker/account");
};
// Trigger preload after a short delay so it doesn't compete with initial render
if (typeof window !== "undefined") {
  setTimeout(preloadSeekerRoutes, 1500);
}

import AdminLogin from "@/pages/admin/login";
import AdminDashboard from "@/pages/admin/dashboard";
import AdminServices from "@/pages/admin/services";
import AdminCustomers from "@/pages/admin/customers";
import AdminWorkers from "@/pages/admin/workers";
import AdminBookings from "@/pages/admin/bookings";
import AdminDisclaimers from "@/pages/admin/disclaimers";
import AdminSettings from "@/pages/admin/settings";
import AdminPincodes from "@/pages/admin/pincodes";

import DisclaimerPage from "@/pages/disclaimer";
import PrivacyPolicyPage from "@/pages/privacy-policy";
import TermsAndConditionsPage from "@/pages/terms-and-conditions";
import AboutPage from "@/pages/about";
import SubscriptionPolicyPage from "@/pages/subscription-policy";
import DeleteAccountPage from "@/pages/delete-account";
import ListYourParkingSpacePage from "@/pages/list-your-parking-space";
import CustomerFeedbackPage from "@/pages/customer-feedback";
import SpotlyPreloader from "@/components/spotly-preloader";

function Router() {
  return (
    <Suspense fallback={<SpotlyPreloader fullScreen />}>
      <Switch>

        <Route path="/" component={LandingPage} />
        <Route path="/splash" component={SplashPage} />
        <Route path="/location-setup" component={GlobalLocationSetup} />
        <Route path="/auth" component={AuthPage} />
        <Route path="/auth/otp" component={AuthPage} />
        <Route path="/register" component={RegisterPage} />
        <Route path="/role-selection" component={AuthPage} />
        <Route path="/disclaimer" component={DisclaimerPage} />
        <Route path="/privacy-policy" component={PrivacyPolicyPage} />
        <Route path="/terms-and-conditions" component={TermsAndConditionsPage} />
        <Route path="/about" component={AboutPage} />
        <Route path="/subscription-policy" component={SubscriptionPolicyPage} />
        <Route path="/customer-feedback" component={CustomerFeedbackPage} />
        <Route path="/delete-account" component={DeleteAccountPage} />
        <Route path="/list-your-parking-space" component={ListYourParkingSpacePage} />

        {/* Space Provider (formerly Customer) Routes */}
        <Route path="/space-provider/location-setup" component={CustomerLocationSetup} />
        <Route path="/space-provider/home" component={CustomerHome} />
        <Route path="/space-provider/bookings" component={CustomerBookings} />
        <Route path="/space-provider/account" component={CustomerAccount} />
        <Route path="/space-provider/contacts" component={CustomerContacts} />
        <Route path="/space-provider/book/:id" component={BookingFlow} />

        {/* Space Seeker (formerly Worker) Routes */}
        <Route path="/space-seeker/service-selection">{() => { window.location.href = "/space-seeker/home"; return null; }}</Route>
        <Route path="/space-seeker/location-setup" component={WorkerLocationSetup} />
        <Route path="/space-seeker/home" component={WorkerHome} />
        <Route path="/space-seeker/account" component={WorkerAccount} />

        {/* Legacy Fallback Redirects */}
        <Route path="/customer/home">{() => { window.location.replace("/space-provider/home"); return null; }}</Route>
        <Route path="/customer/bookings">{() => { window.location.replace("/space-provider/bookings"); return null; }}</Route>
        <Route path="/customer/account">{() => { window.location.replace("/space-provider/account"); return null; }}</Route>
        <Route path="/customer/contacts">{() => { window.location.replace("/space-provider/contacts"); return null; }}</Route>
        <Route path="/customer/location-setup">{() => { window.location.replace("/space-provider/location-setup"); return null; }}</Route>
        <Route path="/worker/home">{() => { window.location.replace("/space-seeker/home"); return null; }}</Route>
        <Route path="/worker/account">{() => { window.location.replace("/space-seeker/account"); return null; }}</Route>
        <Route path="/worker/location-setup">{() => { window.location.replace("/space-seeker/location-setup"); return null; }}</Route>

        {/* Admin Routes */}
        <Route path="/admin" component={AdminLogin} />
        <Route path="/admin/dashboard" component={AdminDashboard} />
        <Route path="/admin/services" component={AdminServices} />
        <Route path="/admin/pincodes" component={AdminPincodes} />
        <Route path="/admin/customers" component={AdminCustomers} />
        <Route path="/admin/workers" component={AdminWorkers} />
        <Route path="/admin/bookings" component={AdminBookings} />
        <Route path="/admin/spotly-spaces" component={AdminBookings} />
        <Route path="/admin/disclaimers" component={AdminDisclaimers} />
        <Route path="/admin/settings" component={AdminSettings} />

        <Route component={NotFound} />
      </Switch>
    </Suspense>
  );
}

function App() {
  useEffect(() => {
    document.body.style.filter = "none";
    document.documentElement.style.filter = "none";
    document.body.style.background = "";
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <ScrollProvider>
          <AuthGuardProvider>
            <MobileBackProvider>
              <Toaster />
              <LocationPermissionModal />
              <FeedbackModal />
              <UnderConstructionGuard>
                <Router />
              </UnderConstructionGuard>
            </MobileBackProvider>
          </AuthGuardProvider>
        </ScrollProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
