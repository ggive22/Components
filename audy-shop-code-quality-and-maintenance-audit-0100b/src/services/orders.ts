import { supabase } from "@/integrations/supabase/client";
import { logger } from "@/lib/logger";
import type { CartItem, Order, OrderItem, OrderStatus } from "@/lib/types";

export interface CheckoutPayload {
  customerName: string;
  whatsappPhone: string;
  neighborhood: string;
  notes?: string;
  items: CartItem[];
}

export interface PlacedOrder {
  id: string;
  orderNumber: number;
}

export const placeOrder = async (payload: CheckoutPayload): Promise<PlacedOrder> => {
  try {
    const total = payload.items.reduce((sum, i) => sum + i.priceXof * i.quantity, 0);

    const { data: order, error } = await supabase
      .from("orders")
      .insert({
        customer_name: payload.customerName,
        whatsapp_phone: payload.whatsappPhone,
        neighborhood: payload.neighborhood,
        notes: payload.notes ?? null,
        total_xof: total,
      })
      .select("id, order_number")
      .single();

    if (error) {
      logger.error("orders", "Failed to create order", error);
      throw error;
    }

    const items = payload.items.map((i) => ({
      order_id: order.id,
      product_id: i.productId,
      product_name: i.name,
      unit_price_xof: i.priceXof,
      quantity: i.quantity,
    }));

    const { error: itemsError } = await supabase.from("order_items").insert(items);
    if (itemsError) {
      logger.error("orders", "Failed to create order items", itemsError);
      throw itemsError;
    }

    // Fire-and-forget admin notification (non-blocking)
    supabase.functions.invoke("notify-new-order", {
      body: { orderId: order.id },
    }).catch((notifyError) => {
      logger.warn("orders", "Admin notification failed, but order was placed successfully", notifyError);
    });

    logger.info("orders", `Order placed successfully: ${order.order_number}`);
    return { id: order.id, orderNumber: order.order_number };
  } catch (error) {
    logger.error("orders", "Error in placeOrder", error);
    throw error;
  }
};

export const fetchOrders = async (): Promise<Order[]> => {
  try {
    const { data, error } = await supabase
      .from("orders")
      .select("*")
      .order("created_at", { ascending: false });
    
    if (error) {
      logger.error("orders", "Failed to fetch orders", error);
      throw error;
    }
    
    return (data ?? []) as Order[];
  } catch (error) {
    logger.error("orders", "Error in fetchOrders", error);
    throw error;
  }
};

export const fetchOrderItems = async (orderId: string): Promise<OrderItem[]> => {
  try {
    const { data, error } = await supabase
      .from("order_items")
      .select("*")
      .eq("order_id", orderId);
    
    if (error) {
      logger.error("orders", `Failed to fetch order items for ${orderId}`, error);
      throw error;
    }
    
    return (data ?? []) as OrderItem[];
  } catch (error) {
    logger.error("orders", `Error in fetchOrderItems for ${orderId}`, error);
    throw error;
  }
};

export const updateOrderStatus = async (
  orderId: string,
  status: OrderStatus,
): Promise<void> => {
  try {
    const { error } = await supabase
      .from("orders")
      .update({ status })
      .eq("id", orderId);
    
    if (error) {
      logger.error("orders", `Failed to update order ${orderId} status`, error);
      throw error;
    }
    
    logger.info("orders", `Order ${orderId} status updated to ${status}`);
  } catch (error) {
    logger.error("orders", `Error in updateOrderStatus for ${orderId}`, error);
    throw error;
  }
};
