import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { z } from "zod";
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
import { useCart } from "@/store/cart";
import { formatXof, isValidTogoPhone, normalizeTogoPhone } from "@/lib/format";
import { LOME_NEIGHBORHOODS } from "@/lib/constants";
import { placeOrder } from "@/services/orders";
import { toast } from "@/hooks/use-toast";

const checkoutSchema = z.object({
  customerName: z.string().trim().min(2, "Nom trop court").max(100),
  whatsappPhone: z
    .string()
    .trim()
    .refine(isValidTogoPhone, "Numéro WhatsApp invalide (ex: 90 12 34 56)"),
  neighborhood: z.string().min(1, "Choisissez un quartier"),
  neighborhoodOther: z.string().trim().max(100).optional(),
  notes: z.string().trim().max(500).optional(),
});

const CheckoutPage = () => {
  const navigate = useNavigate();
  const items = useCart((s) => s.items);
  const total = useCart((s) => s.totalXof());
  const clear = useCart((s) => s.clear);

  const [form, setForm] = useState({
    customerName: "",
    whatsappPhone: "",
    neighborhood: "",
    neighborhoodOther: "",
    notes: "",
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    document.title = "Commander — Audy Shop";
  }, []);

  useEffect(() => {
    if (items.length === 0 && !submitting) navigate("/");
  }, [items.length, submitting, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = checkoutSchema.safeParse(form);
    if (!parsed.success) {
      toast({
        title: "Vérifiez vos informations",
        description: parsed.error.errors[0]?.message,
        variant: "destructive",
      });
      return;
    }

    const finalNeighborhood =
      parsed.data.neighborhood === "Autre quartier" && parsed.data.neighborhoodOther
        ? parsed.data.neighborhoodOther
        : parsed.data.neighborhood;

    setSubmitting(true);
    try {
      const result = await placeOrder({
        customerName: parsed.data.customerName,
        whatsappPhone: normalizeTogoPhone(parsed.data.whatsappPhone),
        neighborhood: finalNeighborhood,
        notes: parsed.data.notes,
        items,
      });
      clear();
      navigate(`/commande/merci?n=${result.orderNumber}`);
    } catch (err) {
      toast({
        title: "Une erreur est survenue",
        description: err instanceof Error ? err.message : "Réessayez dans un instant.",
        variant: "destructive",
      });
      setSubmitting(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className="mx-auto max-w-3xl px-4 sm:px-6 py-6 sm:py-12"
    >
      <h1 className="text-xl sm:text-2xl font-medium mb-6 sm:mb-8 tracking-tight">
        Commander
      </h1>

      <div className="grid lg:grid-cols-[1fr_320px] gap-8 lg:gap-12">
        {/* Mobile recap (collapsible top) */}
        <div className="lg:hidden bg-card border border-border rounded-2xl p-4 mb-2">
          <h2 className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-3">
            Récapitulatif
          </h2>
          <ul className="space-y-2 mb-3">
            {items.map((i) => (
              <li key={i.productId} className="flex justify-between gap-3 text-sm">
                <span className="min-w-0 truncate">
                  {i.name}{" "}
                  <span className="text-muted-foreground">× {i.quantity}</span>
                </span>
                <span className="tabular-nums whitespace-nowrap">
                  {formatXof(i.priceXof * i.quantity)}
                </span>
              </li>
            ))}
          </ul>
          <div className="flex justify-between text-sm pt-3 border-t border-border">
            <span>Total</span>
            <span className="font-medium tabular-nums">{formatXof(total)}</span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="name">Nom complet</Label>
            <Input
              id="name"
              value={form.customerName}
              onChange={(e) => setForm({ ...form, customerName: e.target.value })}
              required
              autoComplete="name"
              className="h-11 rounded-xl"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Numéro WhatsApp</Label>
            <Input
              id="phone"
              type="tel"
              inputMode="tel"
              placeholder="90 12 34 56"
              value={form.whatsappPhone}
              onChange={(e) => setForm({ ...form, whatsappPhone: e.target.value })}
              required
              autoComplete="tel"
              className="h-11 rounded-xl"
            />
            <p className="text-xs text-muted-foreground">
              Audy vous contactera sur ce numéro pour confirmer.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="neighborhood">Quartier de livraison à Lomé</Label>
            <Select
              value={form.neighborhood}
              onValueChange={(v) => setForm({ ...form, neighborhood: v })}
            >
              <SelectTrigger id="neighborhood" className="h-11 rounded-xl">
                <SelectValue placeholder="Sélectionnez un quartier" />
              </SelectTrigger>
              <SelectContent>
                {LOME_NEIGHBORHOODS.map((n) => (
                  <SelectItem key={n} value={n}>
                    {n}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {form.neighborhood === "Autre quartier" && (
              <Input
                placeholder="Précisez le quartier"
                value={form.neighborhoodOther}
                onChange={(e) =>
                  setForm({ ...form, neighborhoodOther: e.target.value })
                }
                className="mt-2 h-11 rounded-xl"
              />
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes de commande (optionnel)</Label>
            <Textarea
              id="notes"
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              rows={3}
              maxLength={500}
              className="rounded-xl resize-none"
            />
          </div>

          <div className="pt-2">
            <p className="text-sm mb-4">
              <span className="font-medium">Mode de paiement :</span>{" "}
              <span className="text-muted-foreground">
                Paiement à la livraison (espèces)
              </span>
            </p>
            <Button
              type="submit"
              disabled={submitting}
              size="lg"
              className="w-full rounded-full h-12"
            >
              {submitting ? "Envoi…" : `Confirmer · ${formatXof(total)}`}
            </Button>
          </div>
        </form>

        <aside className="hidden lg:block lg:sticky lg:top-24 lg:self-start">
          <div className="bg-card border border-border rounded-2xl p-5">
            <h2 className="text-sm font-medium mb-4">Récapitulatif</h2>
            <ul className="space-y-3 mb-4">
              {items.map((i) => (
                <li key={i.productId} className="flex justify-between gap-3 text-sm">
                  <span className="min-w-0">
                    <span className="block truncate">{i.name}</span>
                    <span className="text-xs text-muted-foreground">
                      × {i.quantity}
                    </span>
                  </span>
                  <span className="tabular-nums whitespace-nowrap">
                    {formatXof(i.priceXof * i.quantity)}
                  </span>
                </li>
              ))}
            </ul>
            <div className="flex justify-between text-sm pt-3 border-t border-border">
              <span>Total</span>
              <span className="font-medium tabular-nums">{formatXof(total)}</span>
            </div>
          </div>
        </aside>
      </div>
    </motion.div>
  );
};

export default CheckoutPage;
