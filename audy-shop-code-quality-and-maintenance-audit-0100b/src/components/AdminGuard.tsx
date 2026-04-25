import { useEffect, useState, type ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import type { Session } from "@supabase/supabase-js";

interface AdminGuardProps {
  children: ReactNode;
}

export const AdminGuard = ({ children }: AdminGuardProps) => {
  const [session, setSession] = useState<Session | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const location = useLocation();

  useEffect(() => {
    const { data: subscription } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
      if (s) {
        // Defer role check to avoid deadlocks inside the listener
        setTimeout(() => void checkAdmin(s.user.id), 0);
      } else {
        setIsAdmin(false);
        setLoading(false);
      }
    });

    void supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      if (data.session) {
        void checkAdmin(data.session.user.id);
      } else {
        setLoading(false);
      }
    });

    return () => subscription.subscription.unsubscribe();
  }, []);

  const checkAdmin = async (userId: string) => {
    const { data } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .eq("role", "admin")
      .maybeSingle();
    setIsAdmin(!!data);
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-sm text-muted-foreground">Chargement…</div>
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/admin/connexion" state={{ from: location }} replace />;
  }

  if (!isAdmin) {
    return <Navigate to="/admin/connexion?notadmin=1" replace />;
  }

  return <>{children}</>;
};
