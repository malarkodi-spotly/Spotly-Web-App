import { Capacitor } from "@capacitor/core";
import { PrivacyScreen } from "@capacitor-community/privacy-screen";

/**
 * Check if the event target is a valid text input or textarea
 * so user typing, backspace, and cursor positioning remain fully functional.
 */
function isEditableElement(target: EventTarget | null): boolean {
  if (!target || !(target instanceof HTMLElement)) return false;
  if (target.isContentEditable) return true;
  const tagName = target.tagName.toLowerCase();
  if (tagName === "textarea") return true;
  if (tagName === "input") {
    const inputType = (target as HTMLInputElement).type?.toLowerCase() || "text";
    const nonTextTypes = ["button", "checkbox", "color", "file", "hidden", "image", "radio", "range", "reset", "submit"];
    return !nonTextTypes.includes(inputType);
  }
  return false;
}

/**
 * Set up screenshot and screen recording blocking
 */
function setupScreenshotProtection() {
  if (typeof window === "undefined") return;

  // Create an unobtrusive security blackout overlay for app-switching / screenshot deterrence
  let shield = document.getElementById("spotly-security-shield");
  if (!shield) {
    shield = document.createElement("div");
    shield.id = "spotly-security-shield";
    shield.style.cssText = `
      position: fixed;
      inset: 0;
      background: #020b50;
      z-index: 2147483647;
      display: none;
      align-items: center;
      justify-content: center;
      flex-direction: column;
      color: #ffffff;
      font-family: 'Outfit', sans-serif;
      pointer-events: none;
      user-select: none;
      -webkit-user-select: none;
    `;
    shield.innerHTML = `
      <div style="width: 64px; height: 64px; border-radius: 50%; background: rgba(255,255,255,0.1); display: flex; align-items: center; justify-content: center; margin-bottom: 12px;">
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
        </svg>
      </div>
      <p style="font-size: 15px; font-weight: 700; margin: 0; letter-spacing: -0.02em;">Spotly Security</p>
      <p style="font-size: 11px; opacity: 0.7; margin: 4px 0 0 0;">Protected Screen</p>
    `;
    document.body.appendChild(shield);
  }

  // Cover screen when app loses focus (e.g. app switcher, screen capture overlays)
  const handleVisibilityChange = () => {
    if (!shield) return;
    if (document.hidden) {
      shield.style.display = "flex";
    } else {
      shield.style.display = "none";
    }
  };

  document.addEventListener("visibilitychange", handleVisibilityChange);
  window.addEventListener("blur", () => {
    if (shield && document.hidden) shield.style.display = "flex";
  });
  window.addEventListener("focus", () => {
    if (shield) shield.style.display = "none";
  });

  // Block PrintScreen key and keyboard shortcuts (clears clipboard and flashes shield)
  window.addEventListener(
    "keyup",
    (e: KeyboardEvent) => {
      if (e.key === "PrintScreen" || e.code === "PrintScreen" || e.keyCode === 44) {
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText("").catch(() => {});
        }
        if (shield) {
          shield.style.display = "flex";
          setTimeout(() => {
            if (shield) shield.style.display = "none";
          }, 800);
        }
      }
    },
    { capture: true }
  );

  window.addEventListener(
    "keydown",
    (e: KeyboardEvent) => {
      // Prevent Print (Ctrl+P / Cmd+P)
      if ((e.ctrlKey || e.metaKey) && (e.key?.toLowerCase() === "p" || e.code === "KeyP")) {
        e.preventDefault();
        e.stopImmediatePropagation();
        return;
      }
      // Prevent Save Page (Ctrl+S / Cmd+S)
      if ((e.ctrlKey || e.metaKey) && (e.key?.toLowerCase() === "s" || e.code === "KeyS")) {
        e.preventDefault();
        e.stopImmediatePropagation();
        return;
      }
      // Prevent View Source (Ctrl+U / Cmd+U)
      if ((e.ctrlKey || e.metaKey) && (e.key?.toLowerCase() === "u" || e.code === "KeyU")) {
        e.preventDefault();
        e.stopImmediatePropagation();
        return;
      }
    },
    { capture: true }
  );
}

/**
 * Set up text, copy, selection, and drag protection
 */
function setupCopyAndContentProtection() {
  if (typeof document === "undefined") return;

  // Prevent copying text anywhere outside of form inputs
  document.addEventListener(
    "copy",
    (e: ClipboardEvent) => {
      if (!isEditableElement(e.target)) {
        e.preventDefault();
        e.stopPropagation();
        if (e.clipboardData) {
          e.clipboardData.clearData();
        }
      }
    },
    { capture: true }
  );

  // Prevent cutting text anywhere outside of form inputs
  document.addEventListener(
    "cut",
    (e: ClipboardEvent) => {
      if (!isEditableElement(e.target)) {
        e.preventDefault();
        e.stopPropagation();
      }
    },
    { capture: true }
  );

  // Prevent context menu (right click & mobile long-press callout) outside of form inputs
  document.addEventListener(
    "contextmenu",
    (e: MouseEvent) => {
      if (!isEditableElement(e.target)) {
        e.preventDefault();
        e.stopPropagation();
      }
    },
    { capture: true }
  );

  // Prevent text selection highlighting across content
  document.addEventListener(
    "selectstart",
    (e: Event) => {
      if (!isEditableElement(e.target)) {
        e.preventDefault();
      }
    },
    { capture: true }
  );

  // Prevent dragging of any images, links, or text
  document.addEventListener(
    "dragstart",
    (e: DragEvent) => {
      e.preventDefault();
    },
    { capture: true }
  );
}

/**
 * Initialize all mobile & web protection layers
 */
export async function initAppSecurity() {
  // 1. Native Mobile APK/AAB: Enable Android FLAG_SECURE & iOS PrivacyScreen
  if (Capacitor.isNativePlatform()) {
    try {
      await PrivacyScreen.enable();
      console.info("[Spotly Security] Native PrivacyScreen (FLAG_SECURE) active - screenshots and screen recordings blocked.");
    } catch (err) {
      console.warn("[Spotly Security] PrivacyScreen native error:", err);
    }
  }

  // 2. Check if native Android bridge was injected by custom WebView / APK wrapper
  try {
    const win = window as any;
    if (win.SpotlySecurity?.enableScreenshotProtection) {
      win.SpotlySecurity.enableScreenshotProtection();
    }
    if (win.Android?.setSecureFlag) {
      win.Android.setSecureFlag(true);
    }
  } catch {}

  // 3. Setup event-level copy, cut, contextmenu, drag, and selection protections
  setupCopyAndContentProtection();

  // 4. Setup screenshot deterrence and print-prevention
  setupScreenshotProtection();
}
