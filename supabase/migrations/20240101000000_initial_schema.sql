-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- PROFILES
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT UNIQUE NOT NULL,
  role TEXT CHECK (role IN ('buyer','seller','collaborator')) NOT NULL DEFAULT 'buyer',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update their own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Sellers and Collaborators can view all profiles" ON profiles FOR SELECT USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('seller', 'collaborator'))
);
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- CATEGORIES
CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  parent_category_id UUID REFERENCES categories(id),
  image_url TEXT,
  product_count INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Categories are public" ON categories FOR SELECT USING (true);
CREATE POLICY "Sellers can manage categories" ON categories FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'seller')
);

-- PRODUCTS
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  price NUMERIC(10,2) NOT NULL,
  compare_at_price NUMERIC(10,2),
  stock_quantity INT NOT NULL DEFAULT 0,
  category_id UUID REFERENCES categories(id),
  tags TEXT[] NOT NULL DEFAULT '{}',
  media_urls JSONB NOT NULL DEFAULT '[]',
  status TEXT CHECK (status IN ('published','draft','archived')) NOT NULL DEFAULT 'draft',
  view_count INT NOT NULL DEFAULT 0,
  order_count INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Published products are public" ON products FOR SELECT USING (status = 'published');
CREATE POLICY "Sellers and Collaborators can see all products" ON products FOR SELECT USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('seller', 'collaborator'))
);
CREATE POLICY "Sellers and authorized collaborators can manage products" ON products FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND (role = 'seller' OR (role = 'collaborator' AND EXISTS (SELECT 1 FROM collaborators WHERE user_id = auth.uid() AND can_manage_products = true))))
);
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- CARTS
CREATE TABLE carts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  items JSONB NOT NULL DEFAULT '[]',
  last_activity_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  is_abandoned BOOLEAN NOT NULL DEFAULT false,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE carts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their cart" ON carts FOR ALL USING (auth.uid() = user_id);

-- PROMOTIONS
CREATE TABLE promotions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT CHECK (type IN ('percentage','fixed')) NOT NULL,
  value NUMERIC(10,2) NOT NULL,
  target_product_ids UUID[] NOT NULL DEFAULT '{}',
  target_category_ids UUID[] NOT NULL DEFAULT '{}',
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE promotions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Promotions are public" ON promotions FOR SELECT USING (true);
CREATE POLICY "Sellers manage promotions" ON promotions FOR ALL USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'seller'));

-- COUPONS
CREATE TABLE coupons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  type TEXT CHECK (type IN ('percentage','fixed')) NOT NULL,
  value NUMERIC(10,2) NOT NULL,
  usage_limit INT,
  usage_count INT NOT NULL DEFAULT 0,
  one_per_user BOOLEAN NOT NULL DEFAULT false,
  expires_at TIMESTAMPTZ,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE coupons ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Coupons are viewable by all authenticated" ON coupons FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Sellers manage coupons" ON coupons FOR ALL USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'seller'));

-- ORDERS
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number TEXT UNIQUE NOT NULL,
  buyer_id UUID REFERENCES profiles(id),
  buyer_phone TEXT NOT NULL,
  buyer_name TEXT NOT NULL,
  delivery_address JSONB NOT NULL,
  items JSONB NOT NULL,
  subtotal NUMERIC(10,2) NOT NULL,
  discount_amount NUMERIC(10,2) NOT NULL DEFAULT 0,
  total NUMERIC(10,2) NOT NULL,
  coupon_code TEXT,
  payment_method TEXT CHECK (payment_method IN ('moov','mix_yas','cash_on_delivery')) NOT NULL,
  payment_status TEXT CHECK (payment_status IN ('pending','proof_submitted','validated','rejected')) NOT NULL DEFAULT 'pending',
  payment_proof_url TEXT,
  order_status TEXT CHECK (order_status IN ('pending','confirmed','preparing','shipped','delivered','cancelled')) NOT NULL DEFAULT 'pending',
  status_history JSONB NOT NULL DEFAULT '[]',
  wa_message_link TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Buyers can see their own orders" ON orders FOR SELECT USING (auth.uid() = buyer_id);
CREATE POLICY "Sellers and Collaborators can see all orders" ON orders FOR SELECT USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('seller', 'collaborator'))
);
CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- REVIEWS
CREATE TABLE reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  buyer_id UUID NOT NULL REFERENCES profiles(id),
  buyer_name TEXT NOT NULL,
  rating INT CHECK (rating BETWEEN 1 AND 5) NOT NULL,
  comment TEXT,
  is_visible BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Visible reviews are public" ON reviews FOR SELECT USING (is_visible = true);
CREATE POLICY "Buyers manage their reviews" ON reviews FOR ALL USING (auth.uid() = buyer_id);
CREATE POLICY "Sellers moderate reviews" ON reviews FOR UPDATE USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'seller'));

-- FAVORITES
CREATE TABLE favorites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, product_id)
);
ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage their favorites" ON favorites FOR ALL USING (auth.uid() = user_id);

-- STORE SETTINGS
CREATE TABLE store_settings (
  id INT PRIMARY KEY DEFAULT 1,
  store_name TEXT,
  logo_url TEXT,
  banner_url TEXT,
  description TEXT,
  whatsapp_number TEXT,
  tiktok_url TEXT,
  public_phone TEXT,
  moov_number TEXT,
  mix_yas_number TEXT,
  cash_on_delivery_enabled BOOLEAN NOT NULL DEFAULT true,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT one_row CHECK (id = 1)
);
ALTER TABLE store_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Store settings are public" ON store_settings FOR SELECT USING (true);
CREATE POLICY "Sellers can manage store settings" ON store_settings FOR ALL USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'seller'));

-- COLLABORATORS
CREATE TABLE collaborators (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  invited_by UUID NOT NULL REFERENCES profiles(id),
  can_manage_products BOOLEAN NOT NULL DEFAULT false,
  can_view_orders BOOLEAN NOT NULL DEFAULT false,
  can_update_order_status BOOLEAN NOT NULL DEFAULT false,
  can_access_crm BOOLEAN NOT NULL DEFAULT false,
  can_view_dashboard BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE collaborators ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Sellers can manage collaborators" ON collaborators FOR ALL USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'seller'));
CREATE POLICY "Collaborators can see their own row" ON collaborators FOR SELECT USING (auth.uid() = user_id);

-- INVITE LINKS
CREATE TABLE invite_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token TEXT UNIQUE NOT NULL DEFAULT gen_random_uuid()::text,
  permissions JSONB NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  used_at TIMESTAMPTZ,
  created_by UUID NOT NULL REFERENCES profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE invite_links ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Sellers manage invite links" ON invite_links FOR ALL USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'seller'));

-- DAILY ANALYTICS
CREATE TABLE daily_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE UNIQUE NOT NULL,
  total_orders INT NOT NULL DEFAULT 0,
  total_revenue NUMERIC(10,2) NOT NULL DEFAULT 0,
  new_customers INT NOT NULL DEFAULT 0,
  unique_visitors INT NOT NULL DEFAULT 0,
  conversion_rate FLOAT8 NOT NULL DEFAULT 0,
  top_product_ids UUID[] NOT NULL DEFAULT '{}',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE daily_analytics ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Sellers view analytics" ON daily_analytics FOR SELECT USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'seller'));

-- SAVED ADDRESSES
CREATE TABLE saved_addresses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  label TEXT,
  full_address TEXT NOT NULL,
  latitude FLOAT8,
  longitude FLOAT8,
  is_default BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE saved_addresses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their addresses" ON saved_addresses FOR ALL USING (auth.uid() = user_id);

-- STORAGE BUCKETS SETUP (as comments for reference or via SQL if using extensions)
-- Note: In Supabase, buckets are often created via dashboard or API, but can be done via SQL
INSERT INTO storage.buckets (id, name, public) VALUES ('product-media', 'product-media', true) ON CONFLICT DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('payment-proofs', 'payment-proofs', false) ON CONFLICT DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('store-assets', 'store-assets', true) ON CONFLICT DO NOTHING;

-- STORAGE POLICIES
CREATE POLICY "Product media public select" ON storage.objects FOR SELECT USING (bucket_id = 'product-media');
CREATE POLICY "Seller manage product media" ON storage.objects FOR ALL USING (bucket_id = 'product-media' AND (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'seller')));

CREATE POLICY "Seller view payment proofs" ON storage.objects FOR SELECT USING (bucket_id = 'payment-proofs' AND (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'seller')));
CREATE POLICY "Buyer upload payment proof" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'payment-proofs' AND auth.role() = 'authenticated');

-- FUNCTIONS & TRIGGERS
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, name, phone, role)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'full_name', ''),
    REPLACE(new.email, '@store.internal', ''),
    COALESCE(new.raw_app_meta_data->>'role', 'buyer')
  );
  RETURN new;
END;
$$ language 'plpgsql' security definer;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- INDEXES
CREATE INDEX ON products(status, created_at DESC);
CREATE INDEX ON products(category_id);
CREATE INDEX ON products USING GIN(tags);
CREATE INDEX ON products USING GIN(to_tsvector('french', title || ' ' || COALESCE(description, '')));
CREATE INDEX ON orders(buyer_id, created_at DESC);
CREATE INDEX ON orders(order_status, payment_status);
CREATE INDEX ON reviews(product_id, is_visible);
