import { useQuery } from "@tanstack/react-query";
import { getApiUrl } from "@/lib/api-config";

export const DEFAULT_ALLOWED_PHONES = [
  "7829551049",
  "9742545584",
  "7338507767",
  "9180532078"
];

export const isAllowedPhone = (phone?: string | null, customAllowedList?: string[]): boolean => {
  if (!phone) return false;
  const digits = phone.replace(/\D/g, "").slice(-10);
  const list = customAllowedList !== undefined ? customAllowedList : DEFAULT_ALLOWED_PHONES;
  return list.some((allowed) => {
    const cleanAllowed = allowed.replace(/\D/g, "").slice(-10);
    return cleanAllowed === digits;
  });
};

export function useAllowedParkingByPhones() {
  const { data, isLoading } = useQuery<string[]>({
    queryKey: ["parking-by-allowed-phones"],
    queryFn: async () => {
      try {
        const res = await fetch(getApiUrl("/api/settings/parking_by_allowed_phones"));
        if (!res.ok) return DEFAULT_ALLOWED_PHONES;
        const json = await res.json();
        if (json.setting && json.setting.value !== undefined && json.setting.value !== null) {
          try {
            const parsed = JSON.parse(json.setting.value);
            if (Array.isArray(parsed)) {
              return parsed
                .map((p: string) => String(p).trim().replace(/\D/g, "").slice(-10))
                .filter(Boolean);
            }
          } catch {
            return DEFAULT_ALLOWED_PHONES;
          }
        }
      } catch (err) {
        console.error("Failed to fetch allowed phones setting:", err);
      }
      return DEFAULT_ALLOWED_PHONES;
    },
    staleTime: 1000 * 10,
  });

  return {
    allowedPhones: data !== undefined ? data : DEFAULT_ALLOWED_PHONES,
    isLoading,
  };
}
