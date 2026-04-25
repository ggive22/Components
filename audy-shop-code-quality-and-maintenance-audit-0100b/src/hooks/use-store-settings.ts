import { useQuery } from "@tanstack/react-query";
import { fetchStoreSettings } from "@/services/store-settings";

export const useStoreSettings = () => {
  return useQuery({
    queryKey: ["store-settings"],
    queryFn: fetchStoreSettings,
    staleTime: 60_000,
  });
};
