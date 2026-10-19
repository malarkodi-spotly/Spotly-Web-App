import React, { createContext, useContext, useEffect, useRef, useCallback } from "react";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { Capacitor } from "@capacitor/core";
import { App as CapApp } from "@capacitor/app";

type CloseHandler = () => boolean | void;

interface MobileBackContextType {
  registerModal: (id: string, onClose: CloseHandler) => () => void;
  goBack: () => boolean;
}

const MobileBackContext = createContext<MobileBackContextType | null>(null);

const ROOT_HOME_ROUTES = new Set([
  "/",
  "/splash",
  "/auth",
  "/auth/otp",
  "/role-selection",
  "/space-provider/home",
  "/space-seeker/home",
  "/worker/home",
  "/admin",
  "/admin/dashboard",
]);

export const MobileBackProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const modalStackRef = useRef<Array<{ id: string; onClose: CloseHandler }>>([]);
  const historyStackRef = useRef<string[]>([]);
  const lastBackTimeRef = useRef<number>(0);
  const isBackNavigatingRef = useRef<boolean>(false);
  const [location, setLocation] = useLocation();
  const { toast } = useToast();

  // Track location changes and maintain navigation stack cleanly without corrupting window history
  useEffect(() => {
    if (isBackNavigatingRef.current) {
      isBackNavigatingRef.current = false;
      return;
    }

    const stack = historyStackRef.current;
    if (stack.length === 0 || stack[stack.length - 1] !== location) {
      stack.push(location);
      // Cap stack size to prevent unbounded memory growth
      if (stack.length > 50) {
        stack.shift();
      }
    }
  }, [location]);

  /**
   * Register an open modal/sheet/dialog close callback.
   * Returns an unregister function to call when modal closes/unmounts.
   */
  const registerModal = useCallback((id: string, onClose: CloseHandler) => {
    // Avoid duplicate registrations with the same ID
    modalStackRef.current = modalStackRef.current.filter((m) => m.id !== id);
    modalStackRef.current.push({ id, onClose });

    return () => {
      modalStackRef.current = modalStackRef.current.filter((m) => m.id !== id);
    };
  }, []);

  /**
   * Helper to close any open DOM-based Radix dialog, alert dialog, sheet, or overlay
   */
  const tryCloseDomModals = useCallback((): boolean => {
    try {
      // 1. Check for open Radix Dialogs, Sheets, or Alert Dialogs
      const openDialogs = document.querySelectorAll(
        '[role="dialog"][data-state="open"], [role="alertdialog"][data-state="open"], [data-radix-portal] [data-state="open"]'
      );

      if (openDialogs.length > 0) {
        // Dispatch Escape key event to trigger standard Radix modal close
        const escEvent = new KeyboardEvent("keydown", {
          key: "Escape",
          code: "Escape",
          keyCode: 27,
          which: 27,
          bubbles: true,
          cancelable: true,
        });

        const activeTarget = document.activeElement || document;
        activeTarget.dispatchEvent(escEvent);

        // Also attempt to click standard close button inside top modal if still open
        const topDialog = openDialogs[openDialogs.length - 1];
        const closeBtn = topDialog.querySelector<HTMLElement>(
          'button[aria-label="Close"], button[data-radix-dialog-close], button.lucide-x'
        );
        if (closeBtn) {
          closeBtn.click();
        }

        return true;
      }

      // 2. Check for active open custom overlays/drawers with fixed backdrop
      const openCustomOverlays = document.querySelectorAll<HTMLElement>(
        '.fixed.inset-0.z-50:not([data-state="closed"])'
      );
      if (openCustomOverlays.length > 0) {
        const topOverlay = openCustomOverlays[openCustomOverlays.length - 1];
        const overlayCloseBtn = topOverlay.querySelector<HTMLElement>(
          'button[aria-label="Close"], button'
        );
        if (overlayCloseBtn) {
          overlayCloseBtn.click();
          return true;
        }
      }
    } catch (e) {
      console.warn("[MobileBack] Error trying DOM modal close:", e);
    }
    return false;
  }, []);

  /**
   * Central Android / Mobile Back Event Handler
   * Priority:
   * 1. Registered modal / popup / sheet
   * 2. DOM modal / overlay / sheet
   * 3. Previous navigation history
   * 4. Section home fallback (if not on root)
   * 5. Double-back-to-exit on root/home screen
   */
  const handleBackEvent = useCallback((): boolean => {
    // 1. If there's an explicitly registered open modal, close the top-most modal
    if (modalStackRef.current.length > 0) {
      const topModal = modalStackRef.current.pop();
      if (topModal) {
        try {
          topModal.onClose();
        } catch (err) {
          console.warn("[MobileBack] Error closing registered modal:", err);
        }
        return true; // Handled, do not navigate or exit
      }
    }

    // 2. If an unregistered Radix modal or DOM overlay is active, close it
    if (tryCloseDomModals()) {
      return true; // Handled, do not navigate or exit
    }

    const stack = historyStackRef.current;

    // 3. If navigation stack has previous screens, navigate back to previous screen
    if (stack.length > 1) {
      stack.pop(); // Remove current page from stack
      const previousPage = stack[stack.length - 1];
      if (previousPage && previousPage !== location) {
        isBackNavigatingRef.current = true;
        setLocation(previousPage);
        return true; // Handled, screen navigated back
      }
    }

    // 4. Fallback check if user opened a deep-link directly and stack is 1
    const isHomeRoute = ROOT_HOME_ROUTES.has(location);

    if (!isHomeRoute) {
      isBackNavigatingRef.current = true;
      if (location.startsWith("/space-seeker")) {
        setLocation("/space-seeker/home");
      } else if (location.startsWith("/space-provider")) {
        setLocation("/space-provider/home");
      } else if (location.startsWith("/worker")) {
        setLocation("/space-seeker/home");
      } else if (location.startsWith("/admin")) {
        setLocation("/admin");
      } else {
        setLocation("/auth");
      }
      return true; // Handled, navigated to root section
    }

    // 5. User is on main root/home route -> Double Back to Exit App
    const now = Date.now();
    const DOUBLE_BACK_THRESHOLD = 2000; // 2 seconds

    if (now - lastBackTimeRef.current < DOUBLE_BACK_THRESHOLD) {
      // User pressed back again within 2s -> exit the application
      if (Capacitor.isNativePlatform() || Capacitor.getPlatform() === "android") {
        CapApp.exitApp();
      }
      return false; // Allow app exit
    }

    // First back tap: record timestamp and show user toast feedback
    lastBackTimeRef.current = now;

    toast({
      title: "Spotly",
      description: "Press back again to exit",
      duration: 2000,
    });

    return true; // Prevent app from closing on first tap
  }, [location, setLocation, toast, tryCloseDomModals]);

  // Setup Capacitor native back button listener and browser popstate listener
  useEffect(() => {
    let capListenerHandle: any = null;

    const setupListener = async () => {
      try {
        if (Capacitor.isNativePlatform() || Capacitor.getPlatform() === "android") {
          capListenerHandle = await CapApp.addListener("backButton", () => {
            handleBackEvent();
          });
        }
      } catch (err) {
        console.warn("[MobileBack] Native backButton listener registration error:", err);
      }
    };

    setupListener();

    // Web fallback for mobile browser testing
    const onPopState = () => {
      if (!Capacitor.isNativePlatform()) {
        handleBackEvent();
      }
    };

    window.addEventListener("popstate", onPopState);

    return () => {
      window.removeEventListener("popstate", onPopState);
      if (capListenerHandle && typeof capListenerHandle.remove === "function") {
        capListenerHandle.remove();
      }
    };
  }, [handleBackEvent]);

  return (
    <MobileBackContext.Provider value={{ registerModal, goBack: handleBackEvent }}>
      {children}
    </MobileBackContext.Provider>
  );
};

export const useMobileBack = () => {
  const ctx = useContext(MobileBackContext);
  if (!ctx) {
    throw new Error("useMobileBack must be used within MobileBackProvider");
  }
  return ctx;
};

/**
 * Hook to automatically register and close any modal, sheet, or overlay on mobile back button press.
 * Automatically cleans up on unmount or when isOpen becomes false.
 */
export const useRegisterModalBack = (isOpen: boolean, onClose: () => void, modalId?: string) => {
  const { registerModal } = useMobileBack();
  const idRef = useRef(modalId || `modal_${Math.random().toString(36).substring(2, 9)}`);

  useEffect(() => {
    if (isOpen) {
      const unregister = registerModal(idRef.current, onClose);
      return () => {
        unregister();
      };
    }
  }, [isOpen, onClose, registerModal]);
};
