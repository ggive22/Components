import { useEffect, useState } from "react";
import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import { LogOut, MessageSquare, Package, Settings, ShoppingCart, Tags } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { useStoreSettings } from "@/hooks/use-store-settings";

export const AdminLayout = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState<string>("");
  const { data: settings } = useStoreSettings();
  const storeName = settings?.store_name ?? "Audy Shop";

  useEffect(() => {
    void supabase.auth.getUser().then(({ data }) => setEmail(data.user?.email ?? ""));
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/admin/connexion");
  };

  const navItem = (to: string, label: string, Icon: typeof Package) => (
    <NavLink
      to={to}
      end
      className={({ isActive }) =>
        cn(
          "flex items-center gap-2 px-3 py-2 text-sm rounded-md transition-all",
          isActive
            ? "bg-foreground text-background"
            : "text-muted-foreground hover:bg-muted hover:text-foreground",
        )
      }
    >
      <Icon className="w-4 h-4" />
      {label}
    </NavLink>
  );

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="border-b border-border sticky top-0 bg-background/80 backdrop-blur-xl z-30">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/admin" className="font-medium text-sm">
              {storeName} <span className="text-muted-foreground">/ Admin</span>
            </Link>
          </div>
          <div className="flex items-center gap-3">
            <Link
              to="/"
              className="text-xs text-muted-foreground hover:text-foreground hidden sm:inline transition-colors"
            >
              Voir la boutique
            </Link>
            <button
              type="button"
              onClick={handleLogout}
              className="p-2 hover:bg-muted rounded-md transition-colors"
              aria-label="Se déconnecter"
              title={email}
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
        <nav className="mx-auto max-w-6xl px-4 sm:px-6 pb-2 flex gap-1 overflow-x-auto">
          {navItem("/admin", "Commandes", ShoppingCart)}
          {navItem("/admin/produits", "Produits", Package)}
          {navItem("/admin/categories", "Catégories", Tags)}
          {navItem("/admin/avis", "Avis", MessageSquare)}
          {navItem("/admin/reglages", "Réglages", Settings)}
        </nav>
      </header>
      <main className="flex-1 mx-auto max-w-6xl w-full px-4 sm:px-6 py-6">
        <Outlet />
      </main>
    </div>
  );
};
