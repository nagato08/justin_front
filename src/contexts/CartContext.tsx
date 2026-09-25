import { createContext, useContext, useMemo, useState } from "react";
import type { CartLine, Product } from "../lib/types";

interface CartContextValue { lines: CartLine[]; count: number; total: number; add(product: Product): void; setQuantity(id: string, quantity: number): void; clear(): void }
const CartContext = createContext<CartContextValue | null>(null);
const KEY = "ma-cuisine-cart";
export function CartProvider({ children }: { children: React.ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>(() => { try { return JSON.parse(localStorage.getItem(KEY) || "[]"); } catch { return []; } });
  const update = (next: CartLine[]) => { setLines(next); localStorage.setItem(KEY, JSON.stringify(next)); };
  const value = useMemo<CartContextValue>(() => ({
    lines,
    count: lines.reduce((sum, line) => sum + line.quantity, 0),
    total: lines.reduce((sum, line) => sum + Number(line.product.price) * line.quantity, 0),
    add: (product) => { const found = lines.find((line) => line.product.id === product.id); update(found ? lines.map((line) => line.product.id === product.id ? { ...line, quantity: line.quantity + 1 } : line) : [...lines, { product, quantity: 1 }]); },
    setQuantity: (id, quantity) => update(quantity <= 0 ? lines.filter((line) => line.product.id !== id) : lines.map((line) => line.product.id === id ? { ...line, quantity } : line)),
    clear: () => update([]),
  }), [lines]);
  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}
export function useCart() { const value = useContext(CartContext); if (!value) throw new Error("CartProvider manquant"); return value; }
