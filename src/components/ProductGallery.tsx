import { Images } from "lucide-react";
import { useState } from "react";
import type { Product } from "../lib/types";
import { productImageUrls } from "../lib/products";

interface ProductGalleryProps {
  product: Product;
}

export function ProductGallery({ product }: ProductGalleryProps) {
  const images = productImageUrls(product);
  const [selected, setSelected] = useState(0);
  const active = Math.min(selected, Math.max(images.length - 1, 0));

  if (images.length === 0) {
    return (
      <div className="product-gallery-empty">
        <Images />
        <span>Photos à venir</span>
      </div>
    );
  }

  return (
    <div className="product-gallery">
      <div className="product-gallery-main">
        <img src={images[active]} alt={product.name} />
        {images.length > 1 && <span>{active + 1} / {images.length}</span>}
      </div>
      {images.length > 1 && (
        <div className="product-gallery-thumbs" aria-label="Photos du produit">
          {images.map((url, index) => (
            <button
              type="button"
              className={active === index ? "active" : ""}
              onClick={() => setSelected(index)}
              aria-label={`Afficher la photo ${index + 1}`}
              key={url}
            >
              <img src={url} alt="" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
