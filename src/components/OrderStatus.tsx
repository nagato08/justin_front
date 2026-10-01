import { Check, XCircle } from "lucide-react";
import { ORDER_STEPS, orderStatusHint, orderStatusLabel } from "../lib/labels";

/** Frise de progression : verticale sur mobile, horizontale à partir de la tablette. */
export function OrderStatus({ status, fulfillment = "DELIVERY" }: { status: string; fulfillment?: string }) {
  if (status === "CANCELLED") {
    return (
      <div className="order-cancelled">
        <XCircle aria-hidden="true" />
        <div>
          <strong>Commande annulée</strong>
          <p>{orderStatusHint(status)}</p>
        </div>
      </div>
    );
  }
  const steps = ORDER_STEPS.filter((step) => fulfillment === "DELIVERY" || step !== "OUT_FOR_DELIVERY");
  const current = steps.indexOf(status as (typeof steps)[number]);
  return (
    <ol className="timeline" aria-label="Progression de la commande">
      {steps.map((step, index) => {
        const state = index < current ? "done" : index === current ? "current" : "todo";
        const label = step === "DELIVERED" && fulfillment === "PICKUP" ? "Récupérée" : orderStatusLabel(step);
        return (
          <li key={step} className={`timeline-step ${state}`} aria-current={state === "current" ? "step" : undefined}>
            <span className="timeline-dot">{state === "done" ? <Check aria-hidden="true" /> : index + 1}</span>
            <span className="timeline-label">{label}</span>
          </li>
        );
      })}
    </ol>
  );
}
