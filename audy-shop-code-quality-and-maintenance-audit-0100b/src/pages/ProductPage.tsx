import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Minus, Plus, ArrowLeft } from "lucide-react";
import { fetchProductBySlug } from "@/services/products";
import { formatXof } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { useCart } from "@/store/cart";
import { ProductGallery } from "@/components/ProductGallery";
import { ProductReviews } from "@/components/ProductReviews";

const ProductPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const addItem = useCart((s) => s.addItem);

  const { data: product, isLoading } = useQuery({
    queryKey: ["product", slug],
    queryFn: () => fetchProductBySlug(slug!),
    enabled: !!slug,
  });

  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    if (product) document.title = `${product.name} — Audy Shop`;
  }, [product]);

  if (isLoading) {
    return (
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 sm:py-12 grid sm:grid-cols-2 gap-8 sm:gap-12">
        <div className="aspect-square bg-muted animate-pulse rounded-2xl" />
        <div className="space-y-4">
          <div className="h-6 w-2/3 bg-muted animate-pulse rounded-lg" />
          <div className="h-4 w-1/3 bg-muted animate-pulse rounded-lg" />
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-20 text-center">
        <p className="text-sm text-muted-foreground mb-4">Produit introuvable.</p>
        <Link to="/" className="text-sm underline">
          Retour à la boutique
        </Link>
      </div>
    );
  }

  const sortedMedia = [...(product.product_media ?? [])].sort(
    (a, b) => a.sort_order - b.sort_order,
  );
  const firstImage = sortedMedia.find((m) => m.media_type === "image")?.url ?? null;
  const isOutOfStock = product.stock_status === "rupture";

  const handleOrder = () => {
    addItem(
      {
        productId: product.id,
        name: product.name,
        slug: product.slug,
        priceXof: product.price_xof,
        imageUrl: firstImage,
      },
      quantity,
    );
    navigate("/commander");
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
      className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-4 sm:py-12 pb-32 sm:pb-12"
    >
      <Link
        to="/"
        className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground mb-4 sm:mb-6 transition-colors press"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        Retour
      </Link>

      <div className="grid sm:grid-cols-2 gap-6 sm:gap-12 lg:gap-16">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        >
          <ProductGallery media={sortedMedia} productName={product.name} />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
          className="sm:pt-2"
        >
          <h1 className="text-xl sm:text-3xl font-medium mb-2 tracking-tight leading-tight">
            {product.name}
          </h1>
          <p className="text-lg sm:text-xl mb-5 sm:mb-6 tabular-nums text-primary font-medium">
            {formatXof(product.price_xof)}
          </p>

          {product.short_description && (
            <p className="text-sm text-muted-foreground mb-6 sm:mb-8 leading-relaxed">
              {product.short_description}
            </p>
          )}

          {/* Desktop / tablet quantity + CTA */}
          <div className="hidden sm:block space-y-4">
            <div className="flex items-center gap-3">
              <span className="text-sm">Quantité</span>
              <div className="inline-flex items-center border border-border rounded-full">
                <button
                  type="button"
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  className="w-10 h-10 inline-flex items-center justify-center hover:bg-muted rounded-l-full transition-colors press"
                  aria-label="Diminuer"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <span className="px-4 text-sm tabular-nums min-w-[2.5rem] text-center">
                  {quantity}
                </span>
                <button
                  type="button"
                  onClick={() => setQuantity((q) => q + 1)}
                  className="w-10 h-10 inline-flex items-center justify-center hover:bg-muted rounded-r-full transition-colors press"
                  aria-label="Augmenter"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <motion.div whileTap={{ scale: 0.98 }}>
              <Button
                onClick={handleOrder}
                disabled={isOutOfStock}
                size="lg"
                className="w-full sm:w-auto sm:min-w-[240px] rounded-full h-12"
              >
                {isOutOfStock ? "Rupture de stock" : "Commander"}
              </Button>
            </motion.div>

            <p className="text-xs text-muted-foreground pt-2">
              Paiement à la livraison · Livraison dans Lomé
            </p>
          </div>
        </motion.div>
      </div>

      <ProductReviews productId={product.id} />

      {/* Sticky mobile CTA */}
      <div className="sm:hidden fixed bottom-0 inset-x-0 z-30 bg-background/95 backdrop-blur-xl border-t border-border safe-bottom">
        <div className="px-4 pt-3 pb-2 flex items-center gap-3">
          <div className="inline-flex items-center border border-border rounded-full shrink-0">
            <button
              type="button"
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              className="w-10 h-11 inline-flex items-center justify-center press"
              aria-label="Diminuer"
            >
              <Minus className="w-3.5 h-3.5" />
            </button>
            <span className="px-2 text-sm tabular-nums min-w-[1.5rem] text-center">
              {quantity}
            </span>
            <button
              type="button"
              onClick={() => setQuantity((q) => q + 1)}
              className="w-10 h-11 inline-flex items-center justify-center press"
              aria-label="Augmenter"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>
          <Button
            onClick={handleOrder}
            disabled={isOutOfStock}
            className="flex-1 rounded-full h-11"
          >
            {isOutOfStock ? "Rupture" : `Commander · ${formatXof(product.price_xof * quantity)}`}
          </Button>
        </div>
      </div>
    </motion.div>
  );
};

export default ProductPage;
