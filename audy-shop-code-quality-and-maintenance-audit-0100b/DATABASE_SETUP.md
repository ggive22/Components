# Audy Shop - Database Setup Guide

This guide will help you set up your Supabase database for Audy Shop e-commerce platform.

## Prerequisites

- A Supabase account (https://supabase.com)
- A new Supabase project created

## Step 1: Create Your Supabase Project

1. Go to https://supabase.com/dashboard
2. Click "New Project"
3. Fill in:
   - **Project Name**: `audy-shop` (or your preferred name)
   - **Database Password**: Choose a strong password (save it securely)
   - **Region**: Choose the closest region to your target audience (e.g., Europe for Togo)
4. Click "Create new project"
5. Wait for the project to be provisioned (2-3 minutes)

## Step 2: Run the Database Migration

### Option A: Using SQL Editor (Recommended)

1. In your Supabase dashboard, go to **SQL Editor** (left sidebar)
2. Click **"New Query"**
3. Copy the entire content from `supabase/migrations/001_complete_schema.sql`
4. Paste it into the SQL editor
5. Click **"Run"** (or press Ctrl+Enter / Cmd+Enter)
6. Verify that all queries executed successfully (you should see success messages)

### Option B: Using Supabase CLI

```bash
# Install Supabase CLI if not already installed
npm install -g supabase

# Login to Supabase
supabase login

# Link to your project (get project ID from dashboard URL)
supabase link --project-ref YOUR_PROJECT_REF

# Push migrations
supabase db push
```

## Step 3: Configure Storage Buckets

The migration script creates storage buckets automatically, but verify they exist:

1. Go to **Storage** in the left sidebar
2. You should see 3 buckets:
   - `product-images` (public)
   - `store-assets` (public)
   - `product-videos` (public)

If any bucket is missing, create it manually:
- Click "New bucket"
- Enter the bucket name
- Set "Public bucket" = true
- Click "Create bucket"

## Step 4: Verify Row Level Security (RLS)

RLS should be enabled by the migration. Verify:

1. Go to **Authentication** → **Policies**
2. Check that policies exist for these tables:
   - `user_roles`
   - `categories`
   - `products`
   - `product_media`
   - `orders`
   - `order_items`
   - `profiles`
   - `reviews`
   - `store_settings`

3. For each table, ensure RLS is enabled (toggle should be ON)

## Step 5: Get Your API Credentials

1. Go to **Settings** → **API**
2. Copy these values:
   - **Project URL**: `https://YOUR_PROJECT_REF.supabase.co`
   - **anon/public key**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` (long string)

⚠️ **IMPORTANT**: Never share or commit your `service_role` key! Only use the `anon` key in your frontend code.

## Step 6: Configure Environment Variables

Create a `.env` file in your project root (if deploying to Vercel, add these in Vercel settings):

```bash
VITE_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your_anon_key_here
```

For Vercel:
1. Go to your Vercel project settings
2. Navigate to **Environment Variables**
3. Add both variables above
4. Deploy again for changes to take effect

## Step 7: Test the Connection

1. Start your development server: `npm run dev`
2. Open the app in your browser
3. Try to:
   - View products (should load from database)
   - Create an account (first user becomes admin automatically)
   - Place a test order

## Database Schema Overview

### Tables Created

| Table | Description | RLS |
|-------|-------------|-----|
| `user_roles` | Admin role assignments | ✅ |
| `profiles` | User profiles (auto-created on signup) | ✅ |
| `categories` | Product categories | ✅ |
| `products` | Products catalog | ✅ |
| `product_media` | Product images/videos | ✅ |
| `product_images` | Legacy table (kept for compatibility) | ✅ |
| `orders` | Customer orders | ✅ |
| `order_items` | Items in each order | ✅ |
| `reviews` | Product reviews | ✅ |
| `store_settings` | Shop configuration | ✅ |

### Key Features

- **First-user-as-admin**: The first user to sign up automatically becomes admin
- **Public read access**: Products, categories, and reviews are publicly readable
- **Admin-only writes**: Only users with 'admin' role can manage products, orders, etc.
- **Auto-profile creation**: User profiles are created automatically on signup

## Seed Data (Optional)

To populate your database with sample data, run this SQL in the SQL Editor:

```sql
-- Insert sample categories
INSERT INTO categories (name, slug, sort_order) VALUES
  ('Électronique', 'electronique', 1),
  ('Mode & Vêtements', 'mode-vetements', 2),
  ('Maison & Décoration', 'maison-decoration', 3),
  ('Beauté & Santé', 'beaute-sante', 4);

-- Insert sample product
INSERT INTO products (name, slug, price_xof, short_description, category_id, stock_status)
SELECT 
  'Produit Exemple',
  'produit-exemple',
  15000,
  'Ceci est un produit de démonstration',
  id,
  'en_stock'
FROM categories 
WHERE slug = 'electronique'
LIMIT 1;
```

## Troubleshooting

### Error: "permission denied for table"
- Check that RLS policies are correctly configured
- Verify you're using the `anon` key (not service_role) in your frontend

### Error: "relation does not exist"
- Ensure migrations ran successfully
- Check that you're connected to the correct Supabase project

### Can't upload images
- Verify storage bucket exists and is public
- Check that you have admin role in the application

## Next Steps

After database setup:
1. Configure your environment variables
2. Test the application locally
3. Deploy to Vercel
4. Create your admin account (first signup)
5. Add your products via the admin panel

## Support

For issues related to:
- **Supabase**: https://supabase.com/docs or Discord community
- **Audy Shop**: Check the main README.md or open an issue on GitHub

---

**Last Updated**: 2025
**Version**: 1.0.0
