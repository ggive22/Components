import type { Category } from "@/lib/types";
import { cn } from "@/lib/utils";

interface CategoryFilterProps {
  categories: Category[];
  active: string;
  onChange: (slug: string) => void;
}

export const CategoryFilter = ({ categories, active, onChange }: CategoryFilterProps) => {
  const all = [{ slug: "tout", name: "Tout" }, ...categories];
  return (
    <nav
      className="flex gap-2 overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0 sm:flex-wrap pb-1 mb-6 sm:mb-8 scrollbar-hide"
      aria-label="Filtrer par catégorie"
    >
      {all.map((c) => (
        <button
          key={c.slug}
          type="button"
          onClick={() => onChange(c.slug)}
          className={cn(
            "shrink-0 text-sm px-4 h-9 inline-flex items-center rounded-full border transition-all duration-200 ease-smooth press",
            active === c.slug
              ? "bg-primary text-primary-foreground border-primary"
              : "bg-card text-muted-foreground border-border hover:text-foreground hover:border-foreground/30",
          )}
        >
          {c.name}
        </button>
      ))}
    </nav>
  );
};
