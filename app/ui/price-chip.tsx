"use client";

import { useEffect, useRef, useState } from "react";
import { cachedPrice, getPrice } from "../lib/prices";
import type { CatalogCard } from "../lib/types";

type Price = number | null | undefined; // undefined = loading, null = no price listed

export function PriceChip({ card }: { card: CatalogCard }) {
  const ref = useRef<HTMLSpanElement>(null);
  const [price, setPrice] = useState<Price>(() => (typeof window === "undefined" ? undefined : cachedPrice(card.id)));
  const [failed, setFailed] = useState(false);

  // Only fetch once the chip is near the viewport, so long lists don't fire hundreds of requests.
  useEffect(() => {
    const el = ref.current;
    if (!el || price !== undefined || failed) return;
    let cancelled = false;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        observer.disconnect();
        getPrice(card)
          .then((p) => !cancelled && setPrice(p))
          .catch(() => !cancelled && setFailed(true));
      },
      { rootMargin: "300px" },
    );
    observer.observe(el);
    return () => {
      cancelled = true;
      observer.disconnect();
    };
  }, [card, price, failed]);

  if (price === undefined) {
    return <span ref={ref} className={`inline-block h-5 w-12 rounded-full bg-white/5 ${failed ? "" : "animate-pulse"}`} />;
  }
  return (
    <span
      title={price === null ? "Sin precio en TCGplayer" : "Precio de mercado (TCGplayer, USD)"}
      className={`inline-block rounded-full px-2.5 py-0.5 text-[11px] font-semibold tabular-nums ${
        price === null ? "bg-white/5 text-muted" : "bg-accent/15 text-accent"
      }`}
    >
      {price === null ? "N/A" : `$${price.toFixed(2)}`}
    </span>
  );
}
