export function isGuest(): boolean {
  if (typeof window === "undefined") return false;
  const isGuestFlag = localStorage.getItem("isGuest") === "true";
  const isExplore = localStorage.getItem("exploreMode") === "true";
  const userId = localStorage.getItem("userId");
  const isGuestId = !userId || userId.startsWith("guest_") || userId.startsWith("explore_");
  const isGuestName = localStorage.getItem("userName") === "Guest User";
  return isGuestFlag || isExplore || isGuestId || isGuestName;
}

export function enterGuestMode(role: "customer" | "worker") {
  localStorage.setItem("isGuest", "true");
  localStorage.setItem("userRole", role);
  localStorage.setItem("disclaimerAccepted", "true");
  localStorage.setItem("userName", "Guest User");
  localStorage.removeItem("userId");
  localStorage.removeItem("sessionToken");
}

export function exitGuestMode() {
  localStorage.removeItem("isGuest");
  if (localStorage.getItem("userName") === "Guest User") {
    localStorage.removeItem("userName");
  }
}
