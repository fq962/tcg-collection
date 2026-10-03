"use client";

import { useState } from "react";
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
export function useShare() {
  const [message, setMessage] = useState("");

  async function share(cards: CatalogCard[], title: string) {
    const result = await shareLink(await buildLink(cards), title);
    const text = { shared: "", cancelled: "", copied: "Enlace copiado ✓", failed: "No se pudo compartir el enlace" }[result];
    if (text) {
      setMessage(text);
      setTimeout(() => setMessage(""), 2500);
    }
  }

  const toast = message ? (
    <div role="status" className="fixed inset-x-0 bottom-[max(1.5rem,env(safe-area-inset-bottom))] z-50 mx-auto w-fit rounded-full bg-foreground px-5 py-2.5 text-sm font-medium text-background shadow-xl">
      {message}
    </div>
  ) : null;

  return { share, toast };
}
