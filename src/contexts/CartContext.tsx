import { createContext, useContext, useMemo, useState } from "react";
import type { CartLine, Product } from "../lib/types";

interface CartContextValue {
  lines: CartLine[];
  count: number;
  total: number;
  add(product: Product, quantity?: number): void;
  setQuantity(id: string, quantity: number): void;
  clear(): void;
}

const CartContext = createContext<CartContextValue | null>(null);
const KEY = "ma-cuisine-cart";

function readCart(): CartLine[] {
  try {
    return JSON.parse(localStorage.getItem(KEY) || "[]");
  } catch {
    return [];
  }
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>(readCart);

  const value = useMemo<CartContextValue>(() => {
    const update = (next: CartLine[]) => {
      setLines(next);
      try {
        localStorage.setItem(KEY, JSON.stringify(next));
      } catch {
        // Stockage indisponible (navigation privée) : le panier reste en mémoire.
      }
    };
    return {
      lines,
      count: lines.reduce((sum, line) => sum + line.quantity, 0),
      total: lines.reduce((sum, line) => sum + Number(line.product.price) * line.quantity, 0),
      add: (product, quantity = 1) => {
        const found = lines.some((line) => line.product.id === product.id);
        update(found
          ? lines.map((line) => (line.product.id === product.id ? { ...line, quantity: line.quantity + quantity } : line))
          : [...lines, { product, quantity }]);
      },
      setQuantity: (id, quantity) =>
        update(quantity <= 0 ? lines.filter((line) => line.product.id !== id) : lines.map((line) => (line.product.id === id ? { ...line, quantity } : line))),
      clear: () => update([]),
    };
  }, [lines]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const value = useContext(CartContext);
  if (!value) throw new Error("CartProvider manquant");
  return value;
}
