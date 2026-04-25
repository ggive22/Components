import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";

const schema = z.object({
  email: z.string().trim().email("Email invalide").max(255),
  password: z.string().min(6, "Au moins 6 caractères").max(72),
});

const AdminLogin = () => {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    document.title = "Admin — Audy Shop";
    void supabase.auth.getSession().then(({ data }) => {
      if (data.session && !params.get("notadmin")) navigate("/admin");
    });
  }, [navigate, params]);

  const claimAdminIfFirst = async (userId: string) => {
    // Try to insert admin role; RLS allows it only if no admin exists yet OR user is already admin
    await supabase.from("user_roles").insert({ user_id: userId, role: "admin" });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = schema.safeParse({ email, password });
    if (!parsed.success) {
      toast({
        title: "Vérifiez vos informations",
        description: parsed.error.errors[0]?.message,
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email: parsed.data.email,
          password: parsed.data.password,
          options: { emailRedirectTo: `${window.location.origin}/admin` },
        });
        if (error) throw error;
        if (data.user) {
          await claimAdminIfFirst(data.user.id);
        }
        toast({
          title: "Compte créé",
          description: "Vous êtes maintenant administrateur.",
        });
        navigate("/admin");
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: parsed.data.email,
          password: parsed.data.password,
        });
        if (error) throw error;
        if (data.user) {
          // Attempt to claim admin in case account was created before any admin existed
          await claimAdminIfFirst(data.user.id);
        }
        navigate("/admin");
      }
    } catch (err) {
      toast({
        title: "Connexion impossible",
        description: err instanceof Error ? err.message : "Réessayez",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-background">
      <div className="w-full max-w-sm">
        <Link to="/" className="text-sm text-muted-foreground block text-center mb-8">
          ← Retour à la boutique
        </Link>
        <h1 className="text-2xl font-medium mb-1 text-center">Audy Shop · Admin</h1>
        <p className="text-sm text-muted-foreground text-center mb-8">
          {mode === "signin" ? "Connectez-vous" : "Créer le compte administrateur"}
        </p>

        {params.get("notadmin") && (
          <div className="text-xs border border-destructive/30 bg-destructive/5 text-destructive p-3 rounded mb-4">
            Ce compte n'a pas les droits administrateur.
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Mot de passe</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete={mode === "signin" ? "current-password" : "new-password"}
              required
            />
          </div>
          <Button type="submit" disabled={loading} className="w-full rounded-none h-11">
            {loading ? "…" : mode === "signin" ? "Se connecter" : "Créer le compte"}
          </Button>
        </form>

        <button
          type="button"
          onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
          className="w-full text-xs text-muted-foreground hover:text-foreground mt-6"
        >
          {mode === "signin"
            ? "Première connexion ? Créer le compte administrateur"
            : "J'ai déjà un compte"}
        </button>
      </div>
    </div>
  );
};

export default AdminLogin;
