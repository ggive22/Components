import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { fetchCategories } from "@/services/products";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import { slugify } from "@/lib/format";

interface CategoryForm {
  id: string | null;
  name: string;
  slug: string;
}

const empty: CategoryForm = { id: null, name: "", slug: "" };

const AdminCategories = () => {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<CategoryForm>(empty);

  const { data: categories = [] } = useQuery({
    queryKey: ["categories"],
    queryFn: fetchCategories,
  });

  const saveMutation = useMutation({
    mutationFn: async (f: CategoryForm) => {
      const payload = {
        name: f.name.trim(),
        slug: (f.slug.trim() || slugify(f.name)),
      };
      if (f.id) {
        const { error } = await supabase
          .from("categories")
          .update(payload)
          .eq("id", f.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("categories").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      toast({ title: "Enregistré" });
      setOpen(false);
    },
    onError: (e) =>
      toast({
        title: "Erreur",
        description: e instanceof Error ? e.message : "",
        variant: "destructive",
      }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("categories").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      toast({ title: "Catégorie supprimée" });
    },
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-medium">Catégories</h1>
        <Button
          onClick={() => {
            setForm(empty);
            setOpen(true);
          }}
          size="sm"
          className="rounded-none"
        >
          <Plus className="w-4 h-4" /> Nouvelle
        </Button>
      </div>

      <div className="border border-border divide-y divide-border">
        {categories.map((c) => (
          <div key={c.id} className="p-3 flex items-center gap-3">
            <div className="flex-1">
              <p className="text-sm font-medium">{c.name}</p>
              <p className="text-xs text-muted-foreground">/{c.slug}</p>
            </div>
            <button
              type="button"
              onClick={() => {
                setForm({ id: c.id, name: c.name, slug: c.slug });
                setOpen(true);
              }}
              className="p-2 hover:bg-muted rounded"
            >
              <Pencil className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => {
                if (confirm(`Supprimer "${c.name}" ?`)) deleteMutation.mutate(c.id);
              }}
              className="p-2 hover:bg-muted rounded text-destructive"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {form.id ? "Modifier la catégorie" : "Nouvelle catégorie"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Nom</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Slug (optionnel)</Label>
              <Input
                value={form.slug}
                onChange={(e) => setForm({ ...form, slug: e.target.value })}
                placeholder={form.name ? slugify(form.name) : ""}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setOpen(false)}
              className="rounded-none"
            >
              Annuler
            </Button>
            <Button
              onClick={() => saveMutation.mutate(form)}
              disabled={!form.name.trim() || saveMutation.isPending}
              className="rounded-none"
            >
              Enregistrer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminCategories;
