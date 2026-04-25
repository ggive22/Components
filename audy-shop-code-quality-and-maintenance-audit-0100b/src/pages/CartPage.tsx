import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Minus, Plus, X, ShoppingBag } from "lucide-react";
import { useCart } from "@/store/cart";
import { formatXof } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { useEffect } from "react";

const CartPage = () => {
  const items = useCart((s) => s.items);
  const updateQuantity = useCart((s) => s.updateQuantity);
  const removeItem = useCart((s) => s.removeItem);
  const total = useCart((s) => s.totalXof());

  useEffect(() => {
    document.title = "Panier — Audy Shop";
  }, []);

  if (items.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        className="mx-auto max-w-2xl px-4 py-16 sm:py-20 text-center"
      >
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-secondary mb-5">
          <ShoppingBag className="w-6 h-6 text-muted-foreground" strokeWidth={1.5} />
        </div>
        <h1 className="text-xl font-medium mb-2">Votre panier est vide</h1>
        <p className="text-sm text-muted-foreground mb-6">
          Découvrez nos produits.
        </p>
        <Link to="/">
          <Button size="lg" className="rounded-full px-8 h-11">
            Voir la boutique
          </Button>
        </Link>
      </motion.div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 py-6 sm:py-12 pb-32 sm:pb-12">
      <h1 className="text-xl sm:text-2xl font-medium mb-6 sm:mb-8 tracking-tight">
        Panier
      </h1>

      <ul className="space-y-3">
        <AnimatePresence initial={false}>
          {items.map((item, i) => (
            <motion.li
              key={item.productId}
              layout
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3, delay: i * 0.04, ease: [0.22, 1, 0.36, 1] }}
              className="bg-card rounded-2xl p-3 sm:p-4 flex gap-3 sm:gap-4 border border-border"
            >
              <Link
                to={`/produit/${item.slug}`}
                className="w-20 h-20 sm:w-24 sm:h-24 bg-muted rounded-xl flex-shrink-0 overflow-hidden press"
              >
                {item.imageUrl ? (
                  <img
                    src={item.imageUrl}
                    alt={item.name}
                    className="w-full h-full object-cover"
                  />
                ) : null}
              </Link>
              <div className="flex-1 min-w-0 flex flex-col justify-between gap-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <Link
                      to={`/produit/${item.slug}`}
                      className="text-sm font-medium block truncate"
                    >
                      {item.name}
                    </Link>
                    <p className="text-sm text-muted-foreground mt-0.5 tabular-nums">
                      {formatXof(item.priceXof)}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeItem(item.productId)}
                    className="w-8 h-8 -mt-1 -mr-1 inline-flex items-center justify-center rounded-full text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors press"
                    aria-label="Retirer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <div className="flex items-center justify-between">
                  <div className="inline-flex items-center border border-border rounded-full">
                    <button
                      type="button"
                      onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                      className="w-9 h-9 inline-flex items-center justify-center rounded-l-full hover:bg-muted press"
                      aria-label="Diminuer"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="px-3 text-sm tabular-nums min-w-[2rem] text-center">
                      {item.quantity}
                    </span>
                    <button
                      type="button"
                      onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                      className="w-9 h-9 inline-flex items-center justify-center rounded-r-full hover:bg-muted press"
                      aria-label="Augmenter"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                  <span className="text-sm font-medium tabular-nums">
                    {formatXof(item.priceXof * item.quantity)}
                  </span>
                </div>
              </div>
            </motion.li>
          ))}
        </AnimatePresence>
      </ul>

      {/* Desktop checkout */}
      <div className="hidden sm:block mt-8">
        <div className="flex items-center justify-between pb-4 mb-4 border-t border-border pt-6">
          <span className="text-sm text-muted-foreground">Total</span>
          <span className="text-xl font-medium tabular-nums">{formatXof(total)}</span>
        </div>
        <Link to="/commander">
          <Button size="lg" className="w-full rounded-full h-12">
            Passer la commande
          </Button>
        </Link>
        <p className="text-xs text-muted-foreground text-center mt-3">
          Paiement à la livraison
        </p>
      </div>

      {/* Mobile sticky checkout */}
      <div className="sm:hidden fixed bottom-0 inset-x-0 z-30 bg-background/95 backdrop-blur-xl border-t border-border safe-bottom">
        <div className="px-4 pt-3 pb-2">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-muted-foreground">Total</span>
            <span className="text-base font-medium tabular-nums">
              {formatXof(total)}
            </span>
          </div>
          <Link to="/commander" className="block">
            <Button className="w-full rounded-full h-11">
              Passer la commande
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default CartPage;
