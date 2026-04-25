import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { fetchCategories, fetchProducts } from "@/services/products";
import { ProductCard } from "@/components/ProductCard";
import { CategoryFilter } from "@/components/CategoryFilter";

const Index = () => {
  const [searchParams] = useSearchParams();
  const searchQuery = searchParams.get("q")?.toLowerCase() ?? "";
  const [activeCategory, setActiveCategory] = useState<string>("tout");

  const { data: categories = [] } = useQuery({
    queryKey: ["categories"],
    queryFn: fetchCategories,
  });

  const { data: products = [], isLoading } = useQuery({
    queryKey: ["products", activeCategory],
    queryFn: () => fetchProducts(activeCategory),
  });

  useEffect(() => {
    document.title = "Audy Shop — Style & Qualité livrés chez vous";
  }, []);

  const visibleProducts = useMemo(() => {
    if (!searchQuery) return products;
    return products.filter((p) =>
      p.name.toLowerCase().includes(searchQuery) ||
      p.short_description.toLowerCase().includes(searchQuery),
    );
  }, [products, searchQuery]);

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6 sm:py-12">
      {searchQuery && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-sm text-muted-foreground mb-5"
        >
          Résultats pour « {searchQuery} »
        </motion.p>
      )}

      <CategoryFilter
        categories={categories}
        active={activeCategory}
        onChange={setActiveCategory}
      />

      {isLoading ? (
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="aspect-square bg-muted animate-pulse rounded-2xl" />
          ))}
        </div>
      ) : visibleProducts.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="py-20 text-center text-muted-foreground text-sm"
        >
          Aucun produit pour le moment.
        </motion.div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {visibleProducts.map((p, i) => (
            <ProductCard key={p.id} product={p} index={i} />
          ))}
        </div>
      )}
    </div>
  );
};

export default Index;
