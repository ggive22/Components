import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { GripVertical, Pencil, Play, Plus, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { fetchCategories, fetchProducts } from "@/services/products";
import { formatXof, slugify } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import type { MediaType, Product, ProductMedia, StockStatus } from "@/lib/types";

type ExistingMedia = {
  id: string;
  url: string;
  media_type: MediaType;
  poster_url: string | null;
  sort_order: number;
};

interface NewMediaFile {
  file: File;
  kind: MediaType;
  preview: string;
}

interface ProductFormState {
  id: string | null;
  name: string;
  slug: string;
  price: string;
  shortDescription: string;
  categoryId: string;
  stockStatus: StockStatus;
  newMedia: NewMediaFile[];
  existingMedia: ExistingMedia[];
}

const emptyForm: ProductFormState = {
  id: null,
  name: "",
  slug: "",
  price: "",
  shortDescription: "",
  categoryId: "",
  stockStatus: "en_stock",
  newMedia: [],
  existingMedia: [],
};

const MAX_VIDEO_SIZE = 50 * 1024 * 1024; // 50 MB

const AdminProducts = () => {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<ProductFormState>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [draggedId, setDraggedId] = useState<string | null>(null);

  const { data: products = [] } = useQuery({
    queryKey: ["admin-products"],
    queryFn: () => fetchProducts(),
  });
  const { data: categories = [] } = useQuery({
    queryKey: ["categories"],
    queryFn: fetchCategories,
  });

  const openNew = () => {
    setForm(emptyForm);
    setOpen(true);
  };

  const openEdit = (p: Product) => {
    setForm({
      id: p.id,
      name: p.name,
      slug: p.slug,
      price: String(p.price_xof),
      shortDescription: p.short_description,
      categoryId: p.category_id ?? "",
      stockStatus: p.stock_status,
      newMedia: [],
      existingMedia: [...p.product_media]
        .sort((a, b) => a.sort_order - b.sort_order)
        .map((m) => ({
          id: m.id,
          url: m.url,
          media_type: m.media_type,
          poster_url: m.poster_url,
          sort_order: m.sort_order,
        })),
    });
    setOpen(true);
  };

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("products").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-products"] });
      toast({ title: "Produit supprimé" });
    },
  });

  const handleFiles = (files: FileList | null) => {
    if (!files) return;
    const valid: NewMediaFile[] = [];
    Array.from(files).forEach((file) => {
      const isVideo = file.type.startsWith("video/");
      const isImage = file.type.startsWith("image/");
      if (!isImage && !isVideo) return;
      if (isVideo && file.size > MAX_VIDEO_SIZE) {
        toast({
          title: "Vidéo trop lourde",
          description: `${file.name} dépasse 50 Mo.`,
          variant: "destructive",
        });
        return;
      }
      valid.push({
        file,
        kind: isVideo ? "video" : "image",
        preview: URL.createObjectURL(file),
      });
    });
    setForm((f) => ({ ...f, newMedia: [...f.newMedia, ...valid] }));
  };

  const removeNewMedia = (idx: number) => {
    setForm((f) => {
      URL.revokeObjectURL(f.newMedia[idx].preview);
      return { ...f, newMedia: f.newMedia.filter((_, i) => i !== idx) };
    });
  };

  const removeExistingMedia = async (id: string) => {
    setForm((f) => ({
      ...f,
      existingMedia: f.existingMedia.filter((m) => m.id !== id),
    }));
    await supabase.from("product_media").delete().eq("id", id);
  };

  const reorderExisting = async (sourceId: string, targetId: string) => {
    if (sourceId === targetId) return;
    const items = [...form.existingMedia];
    const srcIdx = items.findIndex((m) => m.id === sourceId);
    const tgtIdx = items.findIndex((m) => m.id === targetId);
    if (srcIdx < 0 || tgtIdx < 0) return;
    const [moved] = items.splice(srcIdx, 1);
    items.splice(tgtIdx, 0, moved);
    const updated = items.map((m, i) => ({ ...m, sort_order: i }));
    setForm((f) => ({ ...f, existingMedia: updated }));
    await Promise.all(
      updated.map((m) =>
        supabase
          .from("product_media")
          .update({ sort_order: m.sort_order })
          .eq("id", m.id),
      ),
    );
  };

  const uploadMedia = async (productId: string, baseSortOrder: number) => {
    let order = baseSortOrder;
    for (const item of form.newMedia) {
      const ext = item.file.name.split(".").pop() ?? (item.kind === "video" ? "mp4" : "jpg");
      const path = `${productId}/${crypto.randomUUID()}.${ext}`;
      const bucket = item.kind === "video" ? "product-videos" : "product-images";
      const { error: upErr } = await supabase.storage
        .from(bucket)
        .upload(path, item.file, { upsert: false });
      if (upErr) throw upErr;
      const { data } = supabase.storage.from(bucket).getPublicUrl(path);
      const { error: insErr } = await supabase.from("product_media").insert({
        product_id: productId,
        media_type: item.kind,
        url: data.publicUrl,
        sort_order: order++,
      });
      if (insErr) throw insErr;
    }
  };

  const handleSave = async () => {
    if (!form.name.trim() || !form.price.trim()) {
      toast({ title: "Nom et prix requis", variant: "destructive" });
      return;
    }
    const price = parseInt(form.price, 10);
    if (isNaN(price) || price < 0) {
      toast({ title: "Prix invalide", variant: "destructive" });
      return;
    }

    setSaving(true);
    try {
      const slug = form.slug.trim() || slugify(form.name);
      const payload = {
        name: form.name.trim(),
        slug,
        price_xof: price,
        short_description: form.shortDescription.trim(),
        category_id: form.categoryId || null,
        stock_status: form.stockStatus,
      };

      let productId = form.id;
      if (productId) {
        const { error } = await supabase
          .from("products")
          .update(payload)
          .eq("id", productId);
        if (error) throw error;
      } else {
        const { data, error } = await supabase
          .from("products")
          .insert(payload)
          .select("id")
          .single();
        if (error) throw error;
        productId = data.id;
      }

      if (form.newMedia.length > 0 && productId) {
        await uploadMedia(productId, form.existingMedia.length);
      }

      queryClient.invalidateQueries({ queryKey: ["admin-products"] });
      toast({ title: form.id ? "Produit mis à jour" : "Produit créé" });
      form.newMedia.forEach((m) => URL.revokeObjectURL(m.preview));
      setOpen(false);
    } catch (err) {
      toast({
        title: "Erreur",
        description: err instanceof Error ? err.message : "",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const renderCover = (p: Product) => {
    const sorted = [...p.product_media].sort((a, b) => a.sort_order - b.sort_order);
    const firstImg = sorted.find((m) => m.media_type === "image");
    const firstVid = sorted.find((m) => m.media_type === "video");
    const url = firstImg?.url ?? firstVid?.poster_url;
    if (!url) return null;
    return <img src={url} alt="" className="w-full h-full object-cover" />;
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-medium tracking-tight">Produits</h1>
        <Button onClick={openNew} size="sm" className="rounded-none">
          <Plus className="w-4 h-4" />
          Nouveau produit
        </Button>
      </div>

      {products.length === 0 ? (
        <div className="border border-border p-12 text-center text-sm text-muted-foreground">
          Aucun produit. Cliquez sur « Nouveau produit » pour commencer.
        </div>
      ) : (
        <div className="border border-border divide-y divide-border">
          {products.map((p) => (
            <div key={p.id} className="p-3 flex items-center gap-3 hover:bg-muted/30 transition-colors">
              <div className="w-12 h-12 bg-muted flex-shrink-0 overflow-hidden">
                {renderCover(p)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{p.name}</p>
                <p className="text-xs text-muted-foreground tabular-nums">
                  {formatXof(p.price_xof)} ·{" "}
                  {p.stock_status === "en_stock" ? "En stock" : "Rupture"}
                  {" · "}
                  {p.product_media.length} média{p.product_media.length > 1 ? "s" : ""}
                </p>
              </div>
              <button
                type="button"
                onClick={() => openEdit(p)}
                className="p-2 hover:bg-muted rounded transition-colors"
                aria-label="Modifier"
              >
                <Pencil className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => {
                  if (confirm(`Supprimer "${p.name}" ?`)) deleteMutation.mutate(p.id);
                }}
                className="p-2 hover:bg-muted rounded text-destructive transition-colors"
                aria-label="Supprimer"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{form.id ? "Modifier le produit" : "Nouveau produit"}</DialogTitle>
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
              <Label>Slug (optionnel — généré du nom)</Label>
              <Input
                value={form.slug}
                onChange={(e) => setForm({ ...form, slug: e.target.value })}
                placeholder={form.name ? slugify(form.name) : ""}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Prix (CFA)</Label>
                <Input
                  type="number"
                  min={0}
                  value={form.price}
                  onChange={(e) => setForm({ ...form, price: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Stock</Label>
                <Select
                  value={form.stockStatus}
                  onValueChange={(v) =>
                    setForm({ ...form, stockStatus: v as StockStatus })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="en_stock">En stock</SelectItem>
                    <SelectItem value="rupture">Rupture</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Catégorie</Label>
              <Select
                value={form.categoryId}
                onValueChange={(v) => setForm({ ...form, categoryId: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choisir" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Description (1-2 lignes)</Label>
              <Textarea
                value={form.shortDescription}
                onChange={(e) =>
                  setForm({ ...form, shortDescription: e.target.value })
                }
                rows={2}
                maxLength={300}
              />
            </div>

            {form.existingMedia.length > 0 && (
              <div className="space-y-2">
                <Label>Médias existants (glisser pour réordonner)</Label>
                <div className="grid grid-cols-4 gap-2">
                  {form.existingMedia.map((m) => (
                    <div
                      key={m.id}
                      draggable
                      onDragStart={() => setDraggedId(m.id)}
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={() => {
                        if (draggedId) void reorderExisting(draggedId, m.id);
                        setDraggedId(null);
                      }}
                      className="relative aspect-square bg-muted cursor-move group"
                    >
                      {m.media_type === "image" ? (
                        <img src={m.url} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full relative">
                          {m.poster_url ? (
                            <img
                              src={m.poster_url}
                              alt=""
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <video
                              src={m.url}
                              className="w-full h-full object-cover"
                              muted
                              preload="metadata"
                            />
                          )}
                          <div className="absolute inset-0 flex items-center justify-center bg-foreground/20">
                            <Play
                              className="w-3 h-3 text-background"
                              fill="currentColor"
                            />
                          </div>
                        </div>
                      )}
                      <GripVertical className="absolute top-1 left-1 w-3 h-3 text-background opacity-0 group-hover:opacity-100 drop-shadow" />
                      <button
                        type="button"
                        onClick={() => removeExistingMedia(m.id)}
                        className="absolute top-1 right-1 bg-background/90 p-1 rounded"
                        aria-label="Retirer"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {form.newMedia.length > 0 && (
              <div className="space-y-2">
                <Label>À ajouter</Label>
                <div className="grid grid-cols-4 gap-2">
                  {form.newMedia.map((m, i) => (
                    <div key={i} className="relative aspect-square bg-muted">
                      {m.kind === "image" ? (
                        <img src={m.preview} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <video
                          src={m.preview}
                          className="w-full h-full object-cover"
                          muted
                        />
                      )}
                      <button
                        type="button"
                        onClick={() => removeNewMedia(i)}
                        className="absolute top-1 right-1 bg-background/90 p-1 rounded"
                        aria-label="Retirer"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label>Ajouter des médias (images ou vidéos, max 50 Mo/vidéo)</Label>
              <Input
                type="file"
                multiple
                accept="image/*,video/*"
                onChange={(e) => {
                  handleFiles(e.target.files);
                  e.target.value = "";
                }}
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
            <Button onClick={handleSave} disabled={saving} className="rounded-none">
              {saving ? "…" : "Enregistrer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminProducts;
