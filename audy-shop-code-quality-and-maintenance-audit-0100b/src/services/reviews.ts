import { supabase } from "@/integrations/supabase/client";
import { logger } from "@/lib/logger";
import type { Review } from "@/lib/types";

export const fetchReviewsForProduct = async (productId: string): Promise<Review[]> => {
  try {
    const { data, error } = await supabase
      .from("reviews")
      .select("id, product_id, user_id, rating, comment, created_at")
      .eq("product_id", productId)
      .order("created_at", { ascending: false });
    
    if (error) {
      logger.error("reviews", `Failed to fetch reviews for product ${productId}`, error);
      throw error;
    }
    
    if (!data || data.length === 0) return [];

    const userIds = Array.from(new Set(data.map((r) => r.user_id)));
    const { data: profiles, error: profileError } = await supabase
      .from("profiles")
      .select("user_id, display_name")
      .in("user_id", userIds);

    if (profileError) {
      logger.error("reviews", "Failed to fetch profiles", profileError);
      throw profileError;
    }

    const map = new Map((profiles ?? []).map((p) => [p.user_id, p.display_name]));
    return data.map((r) => ({
      ...r,
      profile: { display_name: map.get(r.user_id) ?? "Client" },
    }));
  } catch (error) {
    logger.error("reviews", `Error in fetchReviewsForProduct for ${productId}`, error);
    throw error;
  }
};

export const fetchAllReviews = async (): Promise<Review[]> => {
  try {
    const { data, error } = await supabase
      .from("reviews")
      .select("id, product_id, user_id, rating, comment, created_at")
      .order("created_at", { ascending: false });
    
    if (error) {
      logger.error("reviews", "Failed to fetch all reviews", error);
      throw error;
    }
    
    if (!data || data.length === 0) return [];

    const userIds = Array.from(new Set(data.map((r) => r.user_id)));
    const productIds = Array.from(new Set(data.map((r) => r.product_id)));

    const [{ data: profiles, error: profileError }, { data: products, error: productError }] = await Promise.all([
      supabase.from("profiles").select("user_id, display_name").in("user_id", userIds),
      supabase.from("products").select("id, name").in("id", productIds),
    ]);

    if (profileError) {
      logger.error("reviews", "Failed to fetch profiles", profileError);
      throw profileError;
    }
    
    if (productError) {
      logger.error("reviews", "Failed to fetch products", productError);
      throw productError;
    }

    const profileMap = new Map((profiles ?? []).map((p) => [p.user_id, p.display_name]));
    const productMap = new Map((products ?? []).map((p) => [p.id, p.name]));
    
    return data.map((r) => ({
      ...r,
      profile: { display_name: profileMap.get(r.user_id) ?? "Client" },
      product_name: productMap.get(r.product_id) ?? "—",
    }));
  } catch (error) {
    logger.error("reviews", "Error in fetchAllReviews", error);
    throw error;
  }
};

export const createReview = async (
  productId: string,
  userId: string,
  rating: number,
  comment: string,
) => {
  try {
    const { error } = await supabase.from("reviews").upsert(
      {
        product_id: productId,
        user_id: userId,
        rating,
        comment: comment.trim(),
      },
      { onConflict: "product_id,user_id" },
    );
    
    if (error) {
      logger.error("reviews", `Failed to create review for product ${productId}`, error);
      throw error;
    }
    
    logger.info("reviews", `Review created for product ${productId} by user ${userId}`);
  } catch (error) {
    logger.error("reviews", `Error in createReview for product ${productId}`, error);
    throw error;
  }
};

export const deleteReview = async (id: string) => {
  try {
    const { error } = await supabase.from("reviews").delete().eq("id", id);
    
    if (error) {
      logger.error("reviews", `Failed to delete review ${id}`, error);
      throw error;
    }
    
    logger.info("reviews", `Review ${id} deleted`);
  } catch (error) {
    logger.error("reviews", `Error in deleteReview for ${id}`, error);
    throw error;
  }
};
