import { motion } from "framer-motion";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface StarRatingProps {
  value: number;
  onChange?: (v: number) => void;
  size?: "sm" | "md" | "lg";
  readonly?: boolean;
}

export const StarRating = ({
  value,
  onChange,
  size = "md",
  readonly = false,
}: StarRatingProps) => {
  const sizes = { sm: "w-3 h-3", md: "w-4 h-4", lg: "w-5 h-5" };

  return (
    <div className="inline-flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => {
        const filled = n <= value;
        const interactive = !readonly && onChange;
        return (
          <motion.button
            key={n}
            type="button"
            disabled={readonly}
            onClick={() => interactive && onChange?.(n)}
            whileHover={interactive ? { scale: 1.15 } : undefined}
            whileTap={interactive ? { scale: 0.9 } : undefined}
            className={cn(
              "p-0.5",
              interactive ? "cursor-pointer" : "cursor-default",
            )}
            aria-label={`${n} étoile${n > 1 ? "s" : ""}`}
          >
            <Star
              className={cn(
                sizes[size],
                "transition-colors",
                filled ? "fill-foreground text-foreground" : "text-muted-foreground/40",
              )}
              strokeWidth={1.5}
            />
          </motion.button>
        );
      })}
    </div>
  );
};
