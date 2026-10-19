export function triggerLocationPermissionError(message?: string) {
  window.dispatchEvent(
    new CustomEvent("spotly-location-permission-error", {
      detail: {
        message: message || "Location access permission is required to detect nearby parking spots accurately. Please allow location permissions in your browser or device settings."
      }
    })
  );
}
