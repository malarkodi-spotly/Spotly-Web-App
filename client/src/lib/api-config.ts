// =============================================================================
// API CONFIGURATION FOR MOBILE APK & AAB BUILDS
// =============================================================================

import { Capacitor, CapacitorHttp } from "@capacitor/core";

// PRODUCTION API BASE URL FOR SPOTLY MOBILE APP & WEB
export const PRODUCTION_API_URL = "https://spotlyindia.org";

export function getApiBaseUrl(): string {
  // 1. Explicit Vite environment variable if set during build
  const envUrl = import.meta.env.VITE_API_BASE_URL;
  if (envUrl && envUrl.trim() !== "") {
    return envUrl.trim().replace(/\/+$/, "");
  }

  // 2. Native Mobile APK / AAB (Capacitor or file:// protocol)
  if (typeof window !== "undefined") {
    const isNative =
      Capacitor.isNativePlatform() ||
      window.location.protocol === "file:" ||
      window.location.hostname === "capacitor";

    if (isNative) {
      return PRODUCTION_API_URL;
    }

    // 3. Web Browser (Development or Production): Use relative path (same origin)
    // so API requests hit the current web server hosting the app.
    return "";
  }

  // 4. Default Production Domain fallback (SSR/Node)
  return PRODUCTION_API_URL;
}

export const API_BASE_URL = getApiBaseUrl();

export function getApiUrl(path: string): string {
  const baseUrl = getApiBaseUrl();
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  if (!baseUrl) return cleanPath;
  return `${baseUrl}${cleanPath}`;
}

export async function safeFetch(path: string, options: RequestInit = {}): Promise<Response> {
  const fullUrl = getApiUrl(path);

  if (Capacitor.isNativePlatform()) {
    try {
      const method = (options.method || "GET").toUpperCase();
      let data: any = undefined;
      if (options.body) {
        if (typeof options.body === "string") {
          try {
            data = JSON.parse(options.body);
          } catch {
            data = options.body;
          }
        } else {
          data = options.body;
        }
      }

      const headers: Record<string, string> = {
        "Content-Type": "application/json",
        "Origin": "http://localhost:5000",
      };
      if (options.headers) {
        if (options.headers instanceof Headers) {
          options.headers.forEach((val, key) => {
            headers[key] = val;
          });
        } else if (Array.isArray(options.headers)) {
          options.headers.forEach(([key, val]) => {
            headers[key] = val;
          });
        } else {
          Object.assign(headers, options.headers);
        }
      }

      const res = await CapacitorHttp.request({
        url: fullUrl,
        method: method,
        headers: headers,
        data: data,
      });

      const bodyText = typeof res.data === "object" ? JSON.stringify(res.data) : (res.data != null ? String(res.data) : "");
      const resHeaders = new Headers();
      if (res.headers) {
        Object.entries(res.headers).forEach(([k, v]) => {
          if (v != null) resHeaders.set(k, String(v));
        });
      }

      return new Response(bodyText, {
        status: res.status,
        statusText: res.status >= 200 && res.status < 300 ? "OK" : "Error",
        headers: resHeaders,
      });
    } catch (nativeErr) {
      console.warn("Native CapacitorHttp request error, fallback to fetch:", nativeErr);
    }
  }

  return fetch(fullUrl, options);
}

let activeLoaderCount = 0;
let loaderOverlay: HTMLDivElement | null = null;

function showGlobalLoader() {
  activeLoaderCount++;
  if (loaderOverlay) return;

  loaderOverlay = document.createElement("div");
  loaderOverlay.id = "global-admin-loader";
  loaderOverlay.style.position = "fixed";
  loaderOverlay.style.top = "0";
  loaderOverlay.style.left = "0";
  loaderOverlay.style.width = "100vw";
  loaderOverlay.style.height = "100vh";
  loaderOverlay.style.backgroundColor = "rgba(0, 0, 0, 0.6)";
  loaderOverlay.style.backdropFilter = "blur(4px)";
  loaderOverlay.style.display = "flex";
  loaderOverlay.style.flexDirection = "column";
  loaderOverlay.style.justifyContent = "center";
  loaderOverlay.style.alignItems = "center";
  loaderOverlay.style.zIndex = "99999";

  const spinnerContainer = document.createElement("div");
  spinnerContainer.style.display = "flex";
  spinnerContainer.style.flexDirection = "column";
  spinnerContainer.style.alignItems = "center";
  spinnerContainer.style.backgroundColor = "rgba(255, 255, 255, 0.1)";
  spinnerContainer.style.padding = "30px 40px";
  spinnerContainer.style.borderRadius = "20px";
  spinnerContainer.style.border = "1px solid rgba(255, 255, 255, 0.2)";
  spinnerContainer.style.boxShadow = "0 8px 32px 0 rgba(0, 0, 0, 0.37)";

  const spinner = document.createElement("div");
  spinner.className = "admin-spin";
  spinner.style.width = "50px";
  spinner.style.height = "50px";
  spinner.style.border = "5px solid rgba(255, 255, 255, 0.2)";
  spinner.style.borderTop = "5px solid #a855f7";
  spinner.style.borderRadius = "50%";

  if (!document.getElementById("admin-loader-styles")) {
    const styleEl = document.createElement("style");
    styleEl.id = "admin-loader-styles";
    styleEl.innerHTML = `
      @keyframes admin-spin-anim {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
      .admin-spin {
        animation: admin-spin-anim 1s linear infinite;
      }
    `;
    document.head.appendChild(styleEl);
  }

  const label = document.createElement("p");
  label.innerText = "Processing request, please wait...";
  label.style.marginTop = "20px";
  label.style.color = "#ffffff";
  label.style.fontSize = "16px";
  label.style.fontWeight = "600";
  label.style.fontFamily = "system-ui, sans-serif";

  spinnerContainer.appendChild(spinner);
  spinnerContainer.appendChild(label);
  loaderOverlay.appendChild(spinnerContainer);
  document.body.appendChild(loaderOverlay);
}

function hideGlobalLoader() {
  activeLoaderCount = Math.max(0, activeLoaderCount - 1);
  if (activeLoaderCount === 0 && loaderOverlay) {
    document.body.removeChild(loaderOverlay);
    loaderOverlay = null;
  }
}

export async function adminFetch(path: string, options: RequestInit = {}): Promise<Response> {
  const method = (options.method || "GET").toUpperCase();
  const isWrite = method === "POST" || method === "PUT" || method === "PATCH" || method === "DELETE";

  if (isWrite) {
    showGlobalLoader();
  }

  try {
    const token = localStorage.getItem("adminToken");
    const headers = new Headers(options.headers || {});
    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }
    if (!headers.has("Content-Type") && options.body) {
      headers.set("Content-Type", "application/json");
    }
    const res = await fetch(getApiUrl(path), { ...options, headers });
    if (res.status === 401 && path.startsWith("/api/admin")) {
      localStorage.removeItem("isAdmin");
      localStorage.removeItem("adminToken");
      localStorage.removeItem("adminLevel");
      window.location.href = "/admin";
    }
    return res;
  } finally {
    if (isWrite) {
      hideGlobalLoader();
    }
  }
}
