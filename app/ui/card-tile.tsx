import { cardImage } from "../lib/tcgdex";
import type { CatalogCard } from "../lib/types";
import { TiltCard } from "./tilt-card";

export function TrashIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-5 sm:size-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6M10 11v6M14 11v6" />
    </svg>
  );
}

export function CardTile({
  card,
  holo,
  onRemove,
  onPreview,
}: {
  card: CatalogCard;
  holo: boolean;
  onRemove: () => void;
  onPreview: () => void;
}) {
  return (
    <article className="relative">
      <TiltCard holo={holo} onClick={onPreview} label={`Ver ${card.name}`} className="ring-1 ring-white/10">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={cardImage(card)} alt={card.name} loading="lazy" className="size-full object-cover" />
      </TiltCard>

      <div className="mt-2 flex items-center justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-sm font-medium">{card.name}</p>
          <p className="text-xs text-muted">#{card.localId}</p>
        </div>
        <button
          onClick={onRemove}
          aria-label={`Eliminar ${card.name} de mi colección`}
          className="-mr-1 shrink-0 rounded-full p-2.5 sm:p-2 text-muted active:bg-red-500/15 active:text-red-400 transition hover:bg-red-500/15 hover:text-red-400"
        >
          <TrashIcon />
        </button>
      </div>
    </article>
  );
}
