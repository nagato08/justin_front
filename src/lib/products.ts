import { assetUrl } from "./api";
import type { Product } from "./types";

export function productImageUrls(product: Product): string[] {
  const values = [
    ...(product.images ?? []).map((image) => image.url),
    ...(product.imageUrl ? [product.imageUrl] : []),
  ];
  return [...new Set(values)]
    .map((value) => assetUrl(value))
    .filter((value): value is string => Boolean(value));
}
