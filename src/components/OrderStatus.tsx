import { Check } from "lucide-react";
const steps=["PENDING","CONFIRMED","PREPARING","READY","OUT_FOR_DELIVERY","DELIVERED"];
const labels:Record<string,string>={PENDING:"Reçue",CONFIRMED:"Confirmée",PREPARING:"En préparation",READY:"Prête",OUT_FOR_DELIVERY:"En livraison",DELIVERED:"Livrée",CANCELLED:"Annulée"};
export function OrderStatus({status}:{status:string}) { if(status==="CANCELLED") return <div className="cancelled-banner">Cette commande a été annulée.</div>; const current=steps.indexOf(status); return <div className="order-progress">{steps.map((step,index)=><div className={index<=current?"done":""} key={step}><span>{index<current?<Check/>:index+1}</span><small>{labels[step]}</small></div>)}</div> }
export const statusLabel=(status:string)=>labels[status]||status;
