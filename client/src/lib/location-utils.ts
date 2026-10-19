export function extractStateFromAddress(addressData: any): string | null {
  const state = addressData?.address?.state;
  return state ? state.trim() : null;
}
