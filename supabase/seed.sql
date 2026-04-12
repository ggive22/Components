-- Seed initial store settings for Audy Shop
INSERT INTO store_settings (id, store_name, description, moov_number, mix_yas_number, public_phone, whatsapp_number)
VALUES (1, 'Audy Shop', 'Votre boutique premium de produits importés de Chine au Togo.', '+22890000000', '+22870000000', '+22890000000', '+22890000000')
ON CONFLICT (id) DO NOTHING;

-- Seed default categories
INSERT INTO categories (name, slug)
VALUES
('Électronique', 'electronique'),
('Mode & Beauté', 'mode-et-beaute'),
('Maison & Déco', 'maison-et-deco')
ON CONFLICT (slug) DO NOTHING;
