import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const shippingCitiesKey = ["shipping-cities"];
export function useShippingCities() {
  return useQuery({
    queryKey: shippingCitiesKey,
    queryFn: async () => {
      const { data, error } = await supabase.from("shipping_cities").select("id,name,state,price").order("name");
      if (error) throw error;
      return data;
    },
  });
}