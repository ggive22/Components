import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster } from "sonner";
import { Toaster as ToastToaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { StoreLayout } from "./layouts/StoreLayout";
import { AdminLayout } from "./layouts/AdminLayout";
import { AdminGuard } from "./components/AdminGuard";
import Index from "./pages/Index";
import ProductPage from "./pages/ProductPage";
import CartPage from "./pages/CartPage";
import CheckoutPage from "./pages/CheckoutPage";
import ThankYouPage from "./pages/ThankYouPage";
import AuthPage from "./pages/AuthPage";
import AdminLogin from "./pages/admin/AdminLogin";
import AdminOrders from "./pages/admin/AdminOrders";
import AdminProducts from "./pages/admin/AdminProducts";
import AdminCategories from "./pages/admin/AdminCategories";
import AdminReviews from "./pages/admin/AdminReviews";
import AdminSettings from "./pages/admin/AdminSettings";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <ToastToaster />
      <Toaster />
      <BrowserRouter>
        <Routes>
          <Route element={<StoreLayout />}>
            <Route path="/" element={<Index />} />
            <Route path="/produit/:slug" element={<ProductPage />} />
            <Route path="/panier" element={<CartPage />} />
            <Route path="/commander" element={<CheckoutPage />} />
            <Route path="/commande/merci" element={<ThankYouPage />} />
            <Route path="/connexion" element={<AuthPage />} />
          </Route>

          <Route path="/admin/connexion" element={<AdminLogin />} />
          <Route
            element={
              <AdminGuard>
                <AdminLayout />
              </AdminGuard>
            }
          >
            <Route path="/admin" element={<AdminOrders />} />
            <Route path="/admin/produits" element={<AdminProducts />} />
            <Route path="/admin/categories" element={<AdminCategories />} />
            <Route path="/admin/avis" element={<AdminReviews />} />
            <Route path="/admin/reglages" element={<AdminSettings />} />
          </Route>

          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
