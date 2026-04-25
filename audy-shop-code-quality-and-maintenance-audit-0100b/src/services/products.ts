import { supabase } from "@/integrations/supabase/client";
import { logger } from "@/lib/logger";
import type { Category, Product } from "@/lib/types";

const PRODUCT_SELECT =
  "id, name, slug, price_xof, short_description, category_id, stock_status, sort_order, product_media(id, product_id, media_type, url, poster_url, sort_order)";

export const fetchCategories = async (): Promise<Category[]> => {
  try {
    const { data, error } = await supabase
      .from("categories")
      .select("id, name, slug, sort_order")
      .order("sort_order", { ascending: true });
    
    if (error) {
      logger.error("products", "Failed to fetch categories", error);
      throw error;
    }
    
    return data ?? [];
  } catch (error) {
    logger.error("products", "Error in fetchCategories", error);
    throw error;
  }
};

export const fetchProducts = async (categorySlug?: string): Promise<Product[]> => {
  try {
    let query = supabase
      .from("products")
      .select(PRODUCT_SELECT)
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: false });

    if (categorySlug && categorySlug !== "tout") {
      const { data: cat, error: catError } = await supabase
        .from("categories")
        .select("id")
        .eq("slug", categorySlug)
        .maybeSingle();
      
      if (catError) {
        logger.error("products", "Failed to fetch category", catError);
        throw catError;
      }
      
      if (cat) query = query.eq("category_id", cat.id);
    }

    const { data, error } = await query;
    
    if (error) {
      logger.error("products", "Failed to fetch products", error);
      throw error;
    }
    
    return (data ?? []) as Product[];
  } catch (error) {
    logger.error("products", "Error in fetchProducts", error);
    throw error;
  }
};

export const fetchProductBySlug = async (slug: string): Promise<Product | null> => {
  try {
    const { data, error } = await supabase
      .from("products")
      .select(PRODUCT_SELECT)
      .eq("slug", slug)
      .maybeSingle();
    
    if (error) {
      logger.error("products", `Failed to fetch product ${slug}`, error);
      throw error;
    }
    
    return (data as Product) ?? null;
  } catch (error) {
    logger.error("products", `Error in fetchProductBySlug for ${slug}`, error);
    throw error;
  }
};
