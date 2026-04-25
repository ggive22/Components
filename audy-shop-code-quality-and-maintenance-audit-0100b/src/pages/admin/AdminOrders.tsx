import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ChevronDown, MessageCircle } from "lucide-react";
import { fetchOrders, fetchOrderItems, updateOrderStatus } from "@/services/orders";
import { formatXof, normalizeTogoPhone } from "@/lib/format";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { ORDER_STATUS_LABELS, type OrderStatus } from "@/lib/types";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

const AdminOrders = () => {
  const queryClient = useQueryClient();
  const [expanded, setExpanded] = useState<string | null>(null);

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ["admin-orders"],
    queryFn: fetchOrders,
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: OrderStatus }) =>
      updateOrderStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-orders"] });
      toast({ title: "Statut mis à jour" });
    },
  });

  const buildWhatsAppLink = (phone: string, name: string, orderNumber: number) => {
    const normalized = normalizeTogoPhone(phone);
    const msg = encodeURIComponent(
      `Bonjour ${name}, c'est Audy Shop. Je vous contacte au sujet de votre commande #${orderNumber}. Pouvons-nous confirmer la livraison ?`,
    );
    return `https://wa.me/${normalized}?text=${msg}`;
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-medium">Commandes</h1>
        <span className="text-xs text-muted-foreground">
          {orders.length} commande{orders.length > 1 ? "s" : ""}
        </span>
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Chargement…</p>
      ) : orders.length === 0 ? (
        <div className="border border-border p-12 text-center text-sm text-muted-foreground">
          Aucune commande pour le moment.
        </div>
      ) : (
        <div className="border border-border divide-y divide-border">
          {orders.map((order) => (
            <div key={order.id}>
              <button
                type="button"
                onClick={() => setExpanded(expanded === order.id ? null : order.id)}
                className="w-full p-4 flex flex-wrap items-center gap-3 sm:gap-4 text-left hover:bg-muted/50 transition-colors"
              >
                <span className="text-xs text-muted-foreground tabular-nums w-16">
                  #{order.order_number}
                </span>
                <span className="font-medium text-sm flex-1 min-w-0 truncate">
                  {order.customer_name}
                </span>
                <span className="text-xs text-muted-foreground hidden sm:inline">
                  {order.neighborhood}
                </span>
                <span className="text-sm tabular-nums">{formatXof(order.total_xof)}</span>
                <StatusBadge status={order.status} />
                <ChevronDown
                  className={cn(
                    "w-4 h-4 transition-transform text-muted-foreground",
                    expanded === order.id && "rotate-180",
                  )}
                />
              </button>

              {expanded === order.id && (
                <OrderDetails
                  orderId={order.id}
                  orderNumber={order.order_number}
                  customerName={order.customer_name}
                  phone={order.whatsapp_phone}
                  neighborhood={order.neighborhood}
                  notes={order.notes}
                  status={order.status}
                  createdAt={order.created_at}
                  onStatusChange={(status) =>
                    statusMutation.mutate({ id: order.id, status })
                  }
                  whatsAppLink={buildWhatsAppLink(
                    order.whatsapp_phone,
                    order.customer_name,
                    order.order_number,
                  )}
                />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const StatusBadge = ({ status }: { status: OrderStatus }) => {
  const colors: Record<OrderStatus, string> = {
    nouvelle: "bg-accent text-accent-foreground",
    confirmee: "bg-foreground text-background",
    livree: "bg-muted text-foreground",
    annulee: "bg-muted text-muted-foreground line-through",
  };
  return (
    <span
      className={cn(
        "text-[10px] uppercase tracking-wide px-2 py-0.5 rounded",
        colors[status],
      )}
    >
      {ORDER_STATUS_LABELS[status]}
    </span>
  );
};

interface OrderDetailsProps {
  orderId: string;
  orderNumber: number;
  customerName: string;
  phone: string;
  neighborhood: string;
  notes: string | null;
  status: OrderStatus;
  createdAt: string;
  whatsAppLink: string;
  onStatusChange: (status: OrderStatus) => void;
}

const OrderDetails = ({
  orderId,
  phone,
  neighborhood,
  notes,
  status,
  createdAt,
  whatsAppLink,
  onStatusChange,
}: OrderDetailsProps) => {
  const { data: items = [], isLoading } = useQuery({
    queryKey: ["order-items", orderId],
    queryFn: () => fetchOrderItems(orderId),
  });

  return (
    <div className="bg-muted/30 p-4 sm:p-6 space-y-4 border-t border-border">
      <div className="grid sm:grid-cols-2 gap-4 text-sm">
        <div>
          <p className="text-xs text-muted-foreground mb-1">WhatsApp</p>
          <p className="font-mono">{phone}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground mb-1">Quartier</p>
          <p>{neighborhood}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground mb-1">Date</p>
          <p>{new Date(createdAt).toLocaleString("fr-FR")}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground mb-1">Statut</p>
          <Select value={status} onValueChange={(v) => onStatusChange(v as OrderStatus)}>
            <SelectTrigger className="h-9 w-full sm:w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {(Object.keys(ORDER_STATUS_LABELS) as OrderStatus[]).map((s) => (
                <SelectItem key={s} value={s}>
                  {ORDER_STATUS_LABELS[s]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {notes && (
        <div className="text-sm">
          <p className="text-xs text-muted-foreground mb-1">Notes</p>
          <p className="whitespace-pre-wrap">{notes}</p>
        </div>
      )}

      <div>
        <p className="text-xs text-muted-foreground mb-2">Produits</p>
        {isLoading ? (
          <p className="text-sm">…</p>
        ) : (
          <ul className="text-sm space-y-1">
            {items.map((it) => (
              <li key={it.id} className="flex justify-between">
                <span>
                  {it.product_name} <span className="text-muted-foreground">× {it.quantity}</span>
                </span>
                <span className="tabular-nums">
                  {formatXof(it.unit_price_xof * it.quantity)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="pt-2">
        <Button asChild size="sm" className="rounded-none">
          <a href={whatsAppLink} target="_blank" rel="noopener noreferrer">
            <MessageCircle className="w-4 h-4" />
            Contacter sur WhatsApp
          </a>
        </Button>
      </div>
    </div>
  );
};

export default AdminOrders;
