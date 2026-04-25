import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Trash2 } from "lucide-react";
import { Link } from "react-router-dom";
import { deleteReview, fetchAllReviews } from "@/services/reviews";
import { StarRating } from "@/components/StarRating";
import { toast } from "@/hooks/use-toast";

const AdminReviews = () => {
  const queryClient = useQueryClient();
  const { data: reviews = [], isLoading } = useQuery({
    queryKey: ["admin-reviews"],
    queryFn: fetchAllReviews,
  });

  const deleteMutation = useMutation({
    mutationFn: deleteReview,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-reviews"] });
      toast({ title: "Avis supprimé" });
    },
  });

  return (
    <div>
      <h1 className="text-xl font-medium mb-6 tracking-tight">Avis clients</h1>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Chargement…</p>
      ) : reviews.length === 0 ? (
        <div className="border border-border p-12 text-center text-sm text-muted-foreground">
          Aucun avis pour l'instant.
        </div>
      ) : (
        <div className="border border-border divide-y divide-border">
          <AnimatePresence initial={false}>
            {reviews.map((r) => (
              <motion.div
                key={r.id}
                layout
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0, height: 0 }}
                className="p-4 flex items-start gap-4"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-1">
                    <span className="text-sm font-medium">
                      {r.profile?.display_name ?? "Client"}
                    </span>
                    <StarRating value={r.rating} readonly size="sm" />
                    <span className="text-xs text-muted-foreground">
                      {new Date(r.created_at).toLocaleDateString("fr-FR")}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mb-2">
                    Sur :{" "}
                    <Link
                      to={`/admin/produits`}
                      className="hover:text-foreground transition-colors"
                    >
                      {r.product_name}
                    </Link>
                  </p>
                  {r.comment && (
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {r.comment}
                    </p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => {
                    if (confirm("Supprimer cet avis ?")) deleteMutation.mutate(r.id);
                  }}
                  className="p-2 hover:bg-muted rounded text-destructive transition-colors"
                  aria-label="Supprimer"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
};

export default AdminReviews;
