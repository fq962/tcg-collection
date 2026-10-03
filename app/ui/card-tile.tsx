import { cardImage } from "../lib/tcgdex";
import type { CatalogCard } from "../lib/types";
import { CardChips } from "./set-chip";
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
  setName,
  onPreview,
}: {
  card: CatalogCard;
  holo: boolean;
  setName?: string;
  onPreview: () => void;
}) {
  return (
    <article className="relative">
      <TiltCard holo={holo} onClick={onPreview} label={`Ver ${card.name}`} className="ring-1 ring-white/10">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={cardImage(card)} alt={card.name} loading="lazy" className="size-full object-cover" />
      </TiltCard>

      <div className="mt-2 flex items-baseline gap-1.5">
        <p className="truncate text-sm font-medium">{card.name}</p>
        <span className="shrink-0 text-xs text-muted">#{card.localId}</span>
      </div>
      <CardChips card={card} setName={setName} />
    </article>
  );
}
