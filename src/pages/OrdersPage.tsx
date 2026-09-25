import { ArrowRight, PackageOpen } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Header } from "../components/Header";
import { statusLabel } from "../components/OrderStatus";
import { useAuth } from "../contexts/AuthContext";
import { api, dateTime, money } from "../lib/api";
import type { Order } from "../lib/types";
export function OrdersPage(){const{token}=useAuth();const[orders,setOrders]=useState<Order[]>([]);const[loading,setLoading]=useState(true);useEffect(()=>{api<Order[]>("/orders/me",{},token).then(setOrders).finally(()=>setLoading(false))},[token]);return <><Header/><main className="page container"><div className="page-title"><span className="eyebrow">Votre historique</span><h1>Mes commandes</h1><p>Retrouvez leur progression et les détails de chaque achat.</p></div>{loading?<div className="screen-loader inline"><span/></div>:!orders.length?<div className="empty-state large"><PackageOpen/><h2>Aucune commande pour le moment</h2><p>Votre prochain bon repas n’est qu’à quelques clics.</p><Link className="button primary" to="/">Découvrir le menu</Link></div>:<div className="orders-list">{orders.map(order=><Link to={`/orders/${order.reference}`} className="order-row" key={order.id}><div className="order-row-main"><span className={`order-badge ${order.status.toLowerCase()}`}>{statusLabel(order.status)}</span><h3>{order.reference}</h3><p>{dateTime(order.createdAt)} · {order.items.map(i=>`${i.quantity}× ${i.productName}`).join(", ")}</p></div><strong>{money(order.total)}</strong><ArrowRight/></Link>)}</div>}</main></>}
