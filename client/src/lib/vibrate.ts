export function vibrate(duration: number = 50) {
  if (navigator.vibrate) {
    navigator.vibrate(duration);
  }
}
