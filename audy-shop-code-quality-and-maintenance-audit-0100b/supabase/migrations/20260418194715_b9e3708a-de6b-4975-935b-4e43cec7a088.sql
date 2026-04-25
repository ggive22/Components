
-- ========== PROFILES ==========
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Profiles are publicly readable"
  ON public.profiles FOR SELECT TO public USING (true);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, display_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1))
  )
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ========== REVIEWS ==========
CREATE TABLE public.reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL,
  comment TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (product_id, user_id)
);

-- Validation trigger (instead of CHECK so it stays flexible)
CREATE OR REPLACE FUNCTION public.validate_review()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.rating < 1 OR NEW.rating > 5 THEN
    RAISE EXCEPTION 'Rating must be between 1 and 5';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER validate_review_trigger
  BEFORE INSERT OR UPDATE ON public.reviews
  FOR EACH ROW EXECUTE FUNCTION public.validate_review();

CREATE TRIGGER update_reviews_updated_at
  BEFORE UPDATE ON public.reviews
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Reviews are publicly readable"
  ON public.reviews FOR SELECT TO public USING (true);

CREATE POLICY "Authenticated users can create reviews"
  ON public.reviews FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own reviews"
  ON public.reviews FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own, admins can delete any"
  ON public.reviews FOR DELETE TO authenticated
  USING (auth.uid() = user_id OR has_role(auth.uid(), 'admin'));

CREATE INDEX idx_reviews_product ON public.reviews(product_id);

-- ========== STORE SETTINGS ==========
CREATE TABLE public.store_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_name TEXT NOT NULL DEFAULT 'Audy Shop',
  logo_url TEXT,
  singleton BOOLEAN NOT NULL DEFAULT true UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

INSERT INTO public.store_settings (store_name) VALUES ('Audy Shop');

ALTER TABLE public.store_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Store settings are publicly readable"
  ON public.store_settings FOR SELECT TO public USING (true);

CREATE POLICY "Admins can update store settings"
  ON public.store_settings FOR UPDATE TO authenticated
  USING (has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_store_settings_updated_at
  BEFORE UPDATE ON public.store_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ========== PRODUCT MEDIA (replaces product_images) ==========
CREATE TYPE public.media_type AS ENUM ('image', 'video');

CREATE TABLE public.product_media (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  media_type public.media_type NOT NULL DEFAULT 'image',
  url TEXT NOT NULL,
  poster_url TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_product_media_product ON public.product_media(product_id, sort_order);

ALTER TABLE public.product_media ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Product media are publicly readable"
  ON public.product_media FOR SELECT TO public USING (true);

CREATE POLICY "Admins manage product media - insert"
  ON public.product_media FOR INSERT TO authenticated
  WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins manage product media - update"
  ON public.product_media FOR UPDATE TO authenticated
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins manage product media - delete"
  ON public.product_media FOR DELETE TO authenticated
  USING (has_role(auth.uid(), 'admin'));

-- Migrate existing product_images to product_media
INSERT INTO public.product_media (product_id, media_type, url, sort_order, created_at)
SELECT product_id, 'image'::public.media_type, image_url, sort_order, created_at
FROM public.product_images;

-- ========== STORAGE BUCKETS ==========
INSERT INTO storage.buckets (id, name, public)
VALUES ('store-assets', 'store-assets', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public)
VALUES ('product-videos', 'product-videos', true)
ON CONFLICT (id) DO NOTHING;

-- store-assets policies
CREATE POLICY "Store assets are publicly readable"
  ON storage.objects FOR SELECT TO public
  USING (bucket_id = 'store-assets');

CREATE POLICY "Admins can upload store assets"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'store-assets' AND has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update store assets"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'store-assets' AND has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete store assets"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'store-assets' AND has_role(auth.uid(), 'admin'));

-- product-videos policies
CREATE POLICY "Product videos are publicly readable"
  ON storage.objects FOR SELECT TO public
  USING (bucket_id = 'product-videos');

CREATE POLICY "Admins can upload product videos"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'product-videos' AND has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update product videos"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'product-videos' AND has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete product videos"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'product-videos' AND has_role(auth.uid(), 'admin'));
