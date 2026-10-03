"use client";

import { buildLink, shareLink } from "../lib/share";
import type { CatalogCard } from "../lib/types";

export function ShareIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-5 sm:size-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M4 12v7a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-7M16 6l-4-4-4 4M12 2v14" />
    </svg>
  );
}

// Builds a link for the given cards and shares it (native sheet on mobile, clipboard otherwise).
export function useShare(show: (text: string) => void) {
  return async function share(cards: CatalogCard[], title: string) {
    const result = await shareLink(await buildLink(cards), title);
    const text = { shared: "", cancelled: "", copied: "Enlace copiado ✓", failed: "No se pudo compartir el enlace" }[result];
    if (text) show(text);
  };
}
