export const TABLES = {
  PROFILES: 'profiles',
  SAVED_ADDRESSES: 'saved_addresses',
  CATEGORIES: 'categories',
  PRODUCTS: 'products',
  CARTS: 'carts',
  PROMOTIONS: 'promotions',
  COUPONS: 'coupons',
  ORDERS: 'orders',
  REVIEWS: 'reviews',
  FAVORITES: 'favorites',
  STORE_SETTINGS: 'store_settings',
  COLLABORATORS: 'collaborators',
  INVITE_LINKS: 'invite_links',
  DAILY_ANALYTICS: 'daily_analytics',
} as const;

export const STORAGE_BUCKETS = {
  PRODUCT_MEDIA: 'product-media',
  PAYMENT_PROOFS: 'payment-proofs',
  STORE_ASSETS: 'store-assets',
} as const;

export const ORDER_STATUSES = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  PREPARING: 'preparing',
  SHIPPED: 'shipped',
  DELIVERED: 'delivered',
  CANCELLED: 'cancelled',
} as const;

export const PAYMENT_STATUSES = {
  PENDING: 'pending',
  PROOF_SUBMITTED: 'proof_submitted',
  VALIDATED: 'validated',
  REJECTED: 'rejected',
} as const;

export const PAYMENT_METHODS = {
  MOOV: 'moov',
  MIX_YAS: 'mix_yas',
  CASH_ON_DELIVERY: 'cash_on_delivery',
} as const;

export const ROLES = {
  BUYER: 'buyer',
  SELLER: 'seller',
  COLLABORATOR: 'collaborator',
} as const;
