import { useState } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import {
  createReview,
  deleteReview,
  fetchReviewsForProduct,
} from "@/services/reviews";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { StarRating } from "@/components/StarRating";
import { toast } from "@/hooks/use-toast";
import { Trash2 } from "lucide-react";

interface ProductReviewsProps {
  productId: string;
}

export const ProductReviews = ({ productId }: ProductReviewsProps) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const { data: reviews = [] } = useQuery({
    queryKey: ["reviews", productId],
    queryFn: () => fetchReviewsForProduct(productId),
  });

  const { data: isAdmin } = useQuery({
    queryKey: ["is-admin", user?.id],
    enabled: !!user,
    queryFn: async () => {
      if (!user) return false;
      const { data } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .eq("role", "admin")
        .maybeSingle();
      return !!data;
    },
  });

  const myReview = reviews.find((r) => r.user_id === user?.id);
  const average =
    reviews.length > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
      : 0;

  const deleteMutation = useMutation({
    mutationFn: deleteReview,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reviews", productId] });
      toast({ title: "Avis supprimé" });
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (rating < 1) {
      toast({ title: "Sélectionnez une note", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    try {
      await createReview(productId, user.id, rating, comment);
      queryClient.invalidateQueries({ queryKey: ["reviews", productId] });
      setRating(0);
      setComment("");
      toast({ title: myReview ? "Avis mis à jour" : "Merci pour votre avis" });
    } catch (err) {
      toast({
        title: "Erreur",
        description: err instanceof Error ? err.message : "",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="mt-12 sm:mt-20 pt-8 sm:pt-12 border-t border-border">
      <div className="flex items-baseline justify-between mb-6 sm:mb-8 flex-wrap gap-2">
        <h2 className="text-lg sm:text-xl font-medium tracking-tight">Avis</h2>
        {reviews.length > 0 && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <StarRating value={Math.round(average)} readonly size="sm" />
            <span className="tabular-nums">
              {average.toFixed(1)} · {reviews.length} avis
            </span>
          </div>
        )}
      </div>

      {user ? (
        <form onSubmit={handleSubmit} className="mb-10 space-y-3 bg-card border border-border rounded-2xl p-4 sm:p-5">
          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-sm">Votre note</span>
            <StarRating value={rating || myReview?.rating || 0} onChange={setRating} />
          </div>
          <Textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder={myReview?.comment || "Partagez votre expérience…"}
            rows={3}
            maxLength={500}
            className="resize-none rounded-xl"
          />
          <Button
            type="submit"
            disabled={submitting}
            className="rounded-full h-10 px-6 w-full sm:w-auto"
          >
            {submitting ? "…" : myReview ? "Mettre à jour" : "Publier l'avis"}
          </Button>
        </form>
      ) : (
        <div className="mb-10 text-sm text-muted-foreground bg-card border border-border rounded-2xl p-4">
          <Link to="/connexion" className="underline hover:text-foreground">
            Connectez-vous
          </Link>{" "}
          pour laisser un avis.
        </div>
      )}

      {reviews.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Aucun avis pour l'instant. Soyez le premier !
        </p>
      ) : (
        <ul className="space-y-6">
          <AnimatePresence initial={false}>
            {reviews.map((r, i) => (
              <motion.li
                key={r.id}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3, delay: i * 0.04 }}
                className="border-b border-border pb-6 last:border-0"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium">
                      {r.profile?.display_name ?? "Client"}
                    </span>
                    <StarRating value={r.rating} readonly size="sm" />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">
                      {new Date(r.created_at).toLocaleDateString("fr-FR")}
                    </span>
                    {(isAdmin || r.user_id === user?.id) && (
                      <button
                        type="button"
                        onClick={() => {
                          if (confirm("Supprimer cet avis ?"))
                            deleteMutation.mutate(r.id);
                        }}
                        className="p-1 text-muted-foreground hover:text-destructive transition-colors"
                        aria-label="Supprimer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
                {r.comment && (
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {r.comment}
                  </p>
                )}
              </motion.li>
            ))}
          </AnimatePresence>
        </ul>
      )}
    </section>
  );
};
