import type { UserRole } from "./types";

export type Tone = "neutral" | "info" | "warning" | "accent" | "success" | "danger";

const ORDER_STATUS: Record<string, { label: string; tone: Tone; hint: string }> = {
  PENDING: { label: "Reçue", tone: "warning", hint: "Votre commande attend la confirmation de la cuisine." },
  CONFIRMED: { label: "Confirmée", tone: "info", hint: "La cuisine a validé votre commande." },
  PREPARING: { label: "En préparation", tone: "accent", hint: "Votre repas est en train d’être préparé." },
  READY: { label: "Prête", tone: "info", hint: "Votre repas est prêt." },
  OUT_FOR_DELIVERY: { label: "En livraison", tone: "accent", hint: "Le livreur est en route vers vous." },
  DELIVERED: { label: "Livrée", tone: "success", hint: "Bon appétit !" },
  CANCELLED: { label: "Annulée", tone: "danger", hint: "Cette commande a été annulée." },
};

export const ORDER_STEPS = ["PENDING", "CONFIRMED", "PREPARING", "READY", "OUT_FOR_DELIVERY", "DELIVERED"] as const;
export const ACTIVE_ORDER_STATUSES = ["PENDING", "CONFIRMED", "PREPARING", "READY", "OUT_FOR_DELIVERY"];

export const orderStatusLabel = (status: string) => ORDER_STATUS[status]?.label ?? status;
export const orderStatusTone = (status: string): Tone => ORDER_STATUS[status]?.tone ?? "neutral";
export const orderStatusHint = (status: string) => ORDER_STATUS[status]?.hint ?? "";

const PAYMENT_STATUS: Record<string, { label: string; tone: Tone }> = {
  PENDING: { label: "À régler", tone: "warning" },
  PROCESSING: { label: "En cours de validation", tone: "info" },
  SUCCEEDED: { label: "Payé", tone: "success" },
  FAILED: { label: "Échec du paiement", tone: "danger" },
  CANCELLED: { label: "Annulé", tone: "neutral" },
  REFUNDED: { label: "Remboursé", tone: "neutral" },
};
export const paymentStatusLabel = (status: string) => PAYMENT_STATUS[status]?.label ?? status;
export const paymentStatusTone = (status: string): Tone => PAYMENT_STATUS[status]?.tone ?? "neutral";
export const paymentMethodLabel = (method: string) => (method === "MOBILE_MONEY" ? "Mobile Money" : "Espèces");

const ASSIGNMENT_STATUS: Record<string, { label: string; tone: Tone }> = {
  PLANNED: { label: "Planifiée", tone: "info" },
  IN_PROGRESS: { label: "En cours", tone: "accent" },
  COMPLETED: { label: "Terminée", tone: "success" },
  CANCELLED: { label: "Annulée", tone: "danger" },
};
export const assignmentStatusLabel = (status: string) => ASSIGNMENT_STATUS[status]?.label ?? status;
export const assignmentStatusTone = (status: string): Tone => ASSIGNMENT_STATUS[status]?.tone ?? "neutral";

const STOP_STATUS: Record<string, { label: string; tone: Tone }> = {
  PENDING: { label: "À livrer", tone: "neutral" },
  ARRIVED: { label: "Sur place", tone: "info" },
  DELIVERED: { label: "Livré", tone: "success" },
  SKIPPED: { label: "Reporté", tone: "warning" },
};
export const stopStatusLabel = (status: string) => STOP_STATUS[status]?.label ?? status;
export const stopStatusTone = (status: string): Tone => STOP_STATUS[status]?.tone ?? "neutral";

const PRODUCT_STATUS: Record<string, { label: string; tone: Tone }> = {
  ACTIVE: { label: "En ligne", tone: "success" },
  UNAVAILABLE: { label: "Indisponible", tone: "warning" },
  DRAFT: { label: "Brouillon", tone: "neutral" },
  ARCHIVED: { label: "Archivé", tone: "neutral" },
};
export const productStatusLabel = (status: string) => PRODUCT_STATUS[status]?.label ?? status;
export const productStatusTone = (status: string): Tone => PRODUCT_STATUS[status]?.tone ?? "neutral";

export const ROLE_LABELS: Record<UserRole, string> = {
  ADMIN: "Administratrice",
  DELIVERER: "Livreur",
  CUSTOMER: "Client",
};

/** Action principale proposée à la cuisine pour faire avancer une commande. */
export function nextOrderAction(status: string, fulfillment: string): { status: string; label: string } | null {
  switch (status) {
    case "PENDING": return { status: "CONFIRMED", label: "Confirmer" };
    case "CONFIRMED": return { status: "PREPARING", label: "Lancer la préparation" };
    case "PREPARING": return { status: "READY", label: "Marquer prête" };
    case "READY": return fulfillment === "DELIVERY"
      ? { status: "OUT_FOR_DELIVERY", label: "Partie en livraison" }
      : { status: "DELIVERED", label: "Remise au client" };
    case "OUT_FOR_DELIVERY": return { status: "DELIVERED", label: "Marquer livrée" };
    default: return null;
  }
}

export const canCancelOrder = (status: string) => ACTIVE_ORDER_STATUSES.includes(status);
