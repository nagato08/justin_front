import { ImageOff } from "lucide-react";
import { useState } from "react";
import type { Product } from "../lib/types";
import { productImageUrls } from "../lib/products";

export function ProductGallery({ product }: { product: Product }) {
  const images = productImageUrls(product);
  const [selected, setSelected] = useState(0);
  const active = Math.min(selected, Math.max(images.length - 1, 0));

  if (images.length === 0) {
    return (
      <div className="gallery-empty">
        <ImageOff aria-hidden="true" />
        <span>Photos à venir</span>
      </div>
    );
  }

  return (
    <div className="gallery">
      <div className="gallery-main">
        <img src={images[active]} alt={product.name} />
        {images.length > 1 && <span className="gallery-counter">{active + 1} / {images.length}</span>}
      </div>
      {images.length > 1 && (
        <div className="gallery-thumbs" role="group" aria-label="Photos du plat">
          {images.map((url, index) => (
            <button
              type="button"
              className={active === index ? "active" : ""}
              onClick={() => setSelected(index)}
              aria-label={`Afficher la photo ${index + 1}`}
              aria-pressed={active === index}
              key={url}
            >
              <img src={url} alt="" loading="lazy" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
