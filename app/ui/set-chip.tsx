import type { CatalogCard } from "../lib/types";
import { PriceChip } from "./price-chip";

// Footer row under a card: set (pack) name + USD price.
export function CardChips({ card, setName }: { card: CatalogCard; setName?: string }) {
  return (
    <div className="mt-1.5 flex min-h-5 flex-wrap items-center gap-1.5">
      {setName && (
        <span className="max-w-full truncate rounded-full bg-white/10 px-2.5 py-0.5 text-[11px] font-medium text-muted" title={setName}>
          {setName}
        </span>
      )}
      <PriceChip card={card} />
    </div>
  );
}
