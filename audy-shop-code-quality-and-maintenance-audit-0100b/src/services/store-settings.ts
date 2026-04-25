import { supabase } from "@/integrations/supabase/client";
import { logger } from "@/lib/logger";
import type { StoreSettings } from "@/lib/types";

export const fetchStoreSettings = async (): Promise<StoreSettings | null> => {
  try {
    const { data, error } = await supabase
      .from("store_settings")
      .select("id, store_name, logo_url")
      .limit(1)
      .maybeSingle();
    
    if (error) {
      logger.error("store-settings", "Failed to fetch store settings", error);
      throw error;
    }
    
    return data;
  } catch (error) {
    logger.error("store-settings", "Error in fetchStoreSettings", error);
    throw error;
  }
};

export const updateStoreSettings = async (
  id: string,
  payload: { store_name?: string; logo_url?: string | null },
) => {
  try {
    const { error } = await supabase.from("store_settings").update(payload).eq("id", id);
    
    if (error) {
      logger.error("store-settings", `Failed to update store settings ${id}`, error);
      throw error;
    }
    
    logger.info("store-settings", `Store settings ${id} updated`);
  } catch (error) {
    logger.error("store-settings", `Error in updateStoreSettings for ${id}`, error);
    throw error;
  }
};

export const uploadStoreLogo = async (file: File): Promise<string> => {
  try {
    const ext = file.name.split(".").pop() ?? "png";
    const path = `logo-${Date.now()}.${ext}`;
    
    const { error } = await supabase.storage
      .from("store-assets")
      .upload(path, file, { upsert: true, cacheControl: "3600" });
    
    if (error) {
      logger.error("store-settings", "Failed to upload store logo", error);
      throw error;
    }
    
    const { data } = supabase.storage.from("store-assets").getPublicUrl(path);
    logger.info("store-settings", `Store logo uploaded: ${path}`);
    return data.publicUrl;
  } catch (error) {
    logger.error("store-settings", "Error in uploadStoreLogo", error);
    throw error;
  }
};
