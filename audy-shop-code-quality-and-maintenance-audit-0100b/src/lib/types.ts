export type StockStatus = "en_stock" | "rupture";
export type OrderStatus = "nouvelle" | "confirmee" | "livree" | "annulee";
export type MediaType = "image" | "video";

export interface Category {
  id: string;
  name: string;
  slug: string;
  sort_order: number;
}

export interface ProductMedia {
  id: string;
  product_id: string;
  media_type: MediaType;
  url: string;
  poster_url: string | null;
  sort_order: number;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  price_xof: number;
  short_description: string;
  category_id: string | null;
  stock_status: StockStatus;
  sort_order: number;
  product_media: ProductMedia[];
}

export interface CartItem {
  productId: string;
  name: string;
  slug: string;
  priceXof: number;
  imageUrl: string | null;
  quantity: number;
}

export interface Order {
  id: string;
  order_number: number;
  customer_name: string;
  whatsapp_phone: string;
  neighborhood: string;
  notes: string | null;
  total_xof: number;
  status: OrderStatus;
  created_at: string;
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string | null;
  product_name: string;
  unit_price_xof: number;
  quantity: number;
}

export interface Profile {
  id: string;
  user_id: string;
  display_name: string;
}

export interface Review {
  id: string;
  product_id: string;
  user_id: string;
  rating: number;
  comment: string;
  created_at: string;
  profile?: { display_name: string } | null;
  product_name?: string;
}

export interface StoreSettings {
  id: string;
  store_name: string;
  logo_url: string | null;
}

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  nouvelle: "Nouvelle",
  confirmee: "Confirmée",
  livree: "Livrée",
  annulee: "Annulée",
};
