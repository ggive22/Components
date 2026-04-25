import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Play } from "lucide-react";
import type { Product } from "@/lib/types";
import { formatXof } from "@/lib/format";

interface ProductCardProps {
  product: Product;
  index?: number;
}

export const ProductCard = ({ product, index = 0 }: ProductCardProps) => {
  const sortedMedia = [...(product.product_media ?? [])].sort(
    (a, b) => a.sort_order - b.sort_order,
  );
  const firstImage = sortedMedia.find((m) => m.media_type === "image");
  const firstVideo = sortedMedia.find((m) => m.media_type === "video");
  const cover = firstImage?.url ?? firstVideo?.poster_url ?? null;
  const hasVideo = !!firstVideo;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.5,
        delay: Math.min(index * 0.04, 0.3),
        ease: [0.22, 1, 0.36, 1],
      }}
    >
      <Link to={`/produit/${product.slug}`} className="group block press">
        <div className="aspect-square overflow-hidden bg-muted mb-3 relative rounded-2xl hover-soft">
          {cover ? (
            <motion.img
              src={cover}
              alt={product.name}
              loading="lazy"
              className="w-full h-full object-cover"
              whileHover={{ scale: 1.03 }}
              transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-xs text-muted-foreground">
              Aucune image
            </div>
          )}
          {hasVideo && (
            <div className="absolute top-2.5 right-2.5 bg-background/90 backdrop-blur-md rounded-full p-2 shadow-sm">
              <Play className="w-3 h-3" fill="currentColor" />
            </div>
          )}
          {product.stock_status === "rupture" && (
            <div className="absolute inset-0 bg-background/50 backdrop-blur-[2px] flex items-center justify-center">
              <span className="text-[11px] uppercase tracking-widest bg-background px-3 py-1.5 rounded-full">
                Rupture
              </span>
            </div>
          )}
        </div>
        <div className="px-1">
          <h3 className="text-sm font-medium mb-0.5 line-clamp-1 transition-colors group-hover:text-primary">
            {product.name}
          </h3>
          <p className="text-sm text-muted-foreground tabular-nums">
            {formatXof(product.price_xof)}
          </p>
        </div>
      </Link>
    </motion.div>
  );
};
