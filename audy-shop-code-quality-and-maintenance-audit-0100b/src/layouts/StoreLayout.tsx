import { Link, Outlet, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { StoreHeader } from "@/components/StoreHeader";
import { STORE_TAGLINE } from "@/lib/constants";
import { useStoreSettings } from "@/hooks/use-store-settings";

export const StoreLayout = () => {
  const location = useLocation();
  const { data: settings } = useStoreSettings();
  const storeName = settings?.store_name ?? "Audy Shop";

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <StoreHeader />
      <main className="flex-1">
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          >
            <Outlet />
          </motion.div>
        </AnimatePresence>
      </main>
      <footer className="border-t border-border mt-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 text-xs text-muted-foreground flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <span>
            © {new Date().getFullYear()} {storeName} — {STORE_TAGLINE}
          </span>
          <div className="flex items-center gap-4">
            <span>Lomé, Togo · Paiement à la livraison</span>
            <Link
              to="/admin/connexion"
              className="hover:text-foreground transition-colors"
            >
              Admin
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
};
