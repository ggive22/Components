import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";

const schema = z.object({
  email: z.string().trim().email("Email invalide").max(255),
  password: z.string().min(6, "Au moins 6 caractères").max(72),
  displayName: z.string().trim().min(1, "Nom requis").max(60).optional(),
});

const AuthPage = () => {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    document.title = mode === "signin" ? "Connexion — Audy Shop" : "Inscription — Audy Shop";
    void supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate("/");
    });
  }, [mode, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = schema.safeParse({
      email,
      password,
      displayName: mode === "signup" ? displayName : undefined,
    });
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
        const { error } = await supabase.auth.signUp({
          email: parsed.data.email,
          password: parsed.data.password,
          options: {
            emailRedirectTo: `${window.location.origin}/`,
            data: { display_name: parsed.data.displayName },
          },
        });
        if (error) throw error;
        toast({ title: "Compte créé", description: "Bienvenue !" });
        navigate("/");
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email: parsed.data.email,
          password: parsed.data.password,
        });
        if (error) throw error;
        navigate("/");
      }
    } catch (err) {
      toast({
        title: "Erreur",
        description: err instanceof Error ? err.message : "Réessayez",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-sm"
      >
        <Link
          to="/"
          className="text-xs text-muted-foreground block text-center mb-8 hover:text-foreground transition-colors"
        >
          ← Retour à la boutique
        </Link>
        <h1 className="text-2xl font-medium mb-1 text-center tracking-tight">
          {mode === "signin" ? "Bon retour" : "Créer un compte"}
        </h1>
        <p className="text-sm text-muted-foreground text-center mb-8">
          {mode === "signin"
            ? "Connectez-vous pour laisser des avis"
            : "Pour suivre vos commandes et donner votre avis"}
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === "signup" && (
            <div className="space-y-2">
              <Label htmlFor="name">Nom</Label>
              <Input
                id="name"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                autoComplete="name"
                required
              />
            </div>
          )}
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
          className="w-full text-xs text-muted-foreground hover:text-foreground mt-6 transition-colors"
        >
          {mode === "signin"
            ? "Pas encore de compte ? Inscrivez-vous"
            : "J'ai déjà un compte"}
        </button>
      </motion.div>
    </div>
  );
};

export default AuthPage;
