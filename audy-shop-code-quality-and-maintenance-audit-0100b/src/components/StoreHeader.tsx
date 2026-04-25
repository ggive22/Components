import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Search, ShoppingBag, User } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useCart } from "@/store/cart";
import { useStoreSettings } from "@/hooks/use-store-settings";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

export const StoreHeader = () => {
  const navigate = useNavigate();
  const totalItems = useCart((s) => s.totalItems());
  const { data: settings } = useStoreSettings();
  const { user } = useAuth();
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [scrolled, setScrolled] = useState(false);

  const storeName = settings?.store_name ?? "Audy Shop";
  const logoUrl = settings?.logo_url;

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      navigate(`/?q=${encodeURIComponent(query.trim())}`);
      setSearchOpen(false);
      setQuery("");
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  return (
    <header
      className={cn(
        "sticky top-0 z-40 transition-all duration-300",
        scrolled
          ? "bg-background/80 backdrop-blur-xl border-b border-border"
          : "bg-background border-b border-transparent",
      )}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <Link
          to="/"
          className="flex items-center gap-2.5 group press"
          aria-label={`${storeName} — accueil`}
        >
          <span className="logo-bubble inline-flex items-center justify-center h-9 w-9 rounded-full overflow-hidden">
            <AnimatePresence mode="wait">
              {logoUrl ? (
                <motion.img
                  key="logo"
                  src={logoUrl}
                  alt={storeName}
                  initial={{ opacity: 0, scale: 0.85 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                  className="h-7 w-7 object-contain"
                />
              ) : (
                <motion.span
                  key="initial"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="text-sm font-semibold text-primary tracking-tight"
                >
                  {storeName.charAt(0).toUpperCase()}
                </motion.span>
              )}
            </AnimatePresence>
          </span>
          <span className="text-base sm:text-lg font-semibold tracking-tight">
            {storeName}
          </span>
        </Link>

        <div className="flex items-center gap-0.5 sm:gap-1">
          <motion.button
            type="button"
            onClick={() => setSearchOpen((v) => !v)}
            whileTap={{ scale: 0.94 }}
            className="h-11 w-11 inline-flex items-center justify-center hover:bg-secondary rounded-full transition-colors"
            aria-label="Rechercher"
          >
            <Search className="w-[18px] h-[18px]" strokeWidth={1.75} />
          </motion.button>

          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <motion.button
                  type="button"
                  whileTap={{ scale: 0.94 }}
                  className="h-11 w-11 inline-flex items-center justify-center hover:bg-secondary rounded-full transition-colors"
                  aria-label="Mon compte"
                >
                  <User className="w-[18px] h-[18px]" strokeWidth={1.75} />
                </motion.button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52 rounded-xl">
                <div className="px-2 py-1.5 text-xs text-muted-foreground truncate">
                  {user.email}
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut} className="rounded-md">
                  Se déconnecter
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Link
              to="/connexion"
              className="h-11 w-11 inline-flex items-center justify-center hover:bg-secondary rounded-full transition-colors"
              aria-label="Connexion"
            >
              <User className="w-[18px] h-[18px]" strokeWidth={1.75} />
            </Link>
          )}

          <Link
            to="/panier"
            className="h-11 w-11 inline-flex items-center justify-center hover:bg-secondary rounded-full transition-colors relative"
            aria-label={`Panier (${totalItems} article${totalItems > 1 ? "s" : ""})`}
          >
            <ShoppingBag className="w-[18px] h-[18px]" strokeWidth={1.75} />
            <AnimatePresence>
              {totalItems > 0 && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0 }}
                  transition={{ type: "spring", stiffness: 500, damping: 25 }}
                  className="absolute top-1.5 right-1.5 bg-accent text-accent-foreground text-[10px] font-semibold rounded-full min-w-[18px] h-[18px] px-1 flex items-center justify-center tabular-nums"
                >
                  {totalItems}
                </motion.span>
              )}
            </AnimatePresence>
          </Link>
        </div>
      </div>

      <AnimatePresence>
        {searchOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className="border-b border-border overflow-hidden"
          >
            <form
              onSubmit={handleSearch}
              className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-3"
            >
              <Input
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Rechercher un produit..."
                className="border-0 border-b rounded-none focus-visible:ring-0 focus-visible:border-foreground px-0"
              />
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};
