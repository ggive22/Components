import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Image as ImageIcon, Upload } from "lucide-react";
import { fetchStoreSettings, updateStoreSettings, uploadStoreLogo } from "@/services/store-settings";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";

const AdminSettings = () => {
  const queryClient = useQueryClient();
  const { data: settings, isLoading } = useQuery({
    queryKey: ["store-settings"],
    queryFn: fetchStoreSettings,
  });

  const [storeName, setStoreName] = useState("");
  const [pendingLogo, setPendingLogo] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (settings && !storeName) setStoreName(settings.store_name);
  }, [settings, storeName]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!settings) return;
      let logoUrl: string | null | undefined = undefined;
      if (pendingLogo) {
        logoUrl = await uploadStoreLogo(pendingLogo);
      }
      await updateStoreSettings(settings.id, {
        store_name: storeName.trim() || "Audy Shop",
        ...(logoUrl !== undefined ? { logo_url: logoUrl } : {}),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["store-settings"] });
      setPendingLogo(null);
      setPreview(null);
      toast({ title: "Réglages enregistrés" });
    },
    onError: (err) => {
      toast({
        title: "Erreur",
        description: err instanceof Error ? err.message : "",
        variant: "destructive",
      });
    },
  });

  const removeLogoMutation = useMutation({
    mutationFn: async () => {
      if (!settings) return;
      await updateStoreSettings(settings.id, { logo_url: null });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["store-settings"] });
      toast({ title: "Logo retiré" });
    },
  });

  if (isLoading || !settings) {
    return <div className="text-sm text-muted-foreground">Chargement…</div>;
  }

  const currentName = storeName || settings.store_name;
  const displayedLogo = preview ?? settings.logo_url;

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "Image trop lourde (max 5 Mo)", variant: "destructive" });
      return;
    }
    setPendingLogo(file);
    setPreview(URL.createObjectURL(file));
  };

  return (
    <div className="max-w-xl">
      <h1 className="text-xl font-medium mb-6 tracking-tight">Réglages de la boutique</h1>

      <div className="space-y-8">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="space-y-3"
        >
          <Label>Nom de la boutique</Label>
          <Input
            value={currentName}
            onChange={(e) => setStoreName(e.target.value)}
            maxLength={60}
            placeholder="Audy Shop"
          />
          <p className="text-xs text-muted-foreground">
            Affiché dans le header (si pas de logo) et dans le pied de page.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.05 }}
          className="space-y-3"
        >
          <Label>Logo</Label>
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 border border-border bg-muted flex items-center justify-center overflow-hidden">
              {displayedLogo ? (
                <img
                  src={displayedLogo}
                  alt="Logo"
                  className="w-full h-full object-contain"
                />
              ) : (
                <ImageIcon className="w-6 h-6 text-muted-foreground" />
              )}
            </div>
            <div className="flex-1 space-y-2">
              <label className="inline-flex items-center gap-2 text-sm cursor-pointer hover:text-muted-foreground transition-colors">
                <Upload className="w-4 h-4" />
                <span>Choisir un fichier</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFile}
                  className="hidden"
                />
              </label>
              <p className="text-xs text-muted-foreground">
                PNG/SVG transparent recommandé, max 5 Mo. Hauteur affichée : 32px.
              </p>
              {settings.logo_url && (
                <button
                  type="button"
                  onClick={() => removeLogoMutation.mutate()}
                  className="text-xs text-destructive hover:underline"
                >
                  Retirer le logo
                </button>
              )}
            </div>
          </div>
        </motion.div>

        <Button
          onClick={() => saveMutation.mutate()}
          disabled={saveMutation.isPending}
          className="rounded-none h-11 min-w-[160px]"
        >
          {saveMutation.isPending ? "…" : "Enregistrer"}
        </Button>
      </div>
    </div>
  );
};

export default AdminSettings;
