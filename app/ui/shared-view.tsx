"use client";

import Link from "next/link";
import { useEffect, useState, useSyncExternalStore } from "react";
import { decodeLink, langOf } from "../lib/share";
import { cardImage } from "../lib/tcgdex";
import type { CatalogCard } from "../lib/types";
import { useCollection } from "../lib/use-collection";
import { useSetName } from "../lib/use-set-name";
import { useHolo } from "../lib/use-holo";
import { CardChips } from "./set-chip";
import { TiltCard } from "./tilt-card";

const subscribeHash = (cb: () => void) => {
  window.addEventListener("hashchange", cb);
  return () => window.removeEventListener("hashchange", cb);
};

export function SharedView() {
  const hash = useSyncExternalStore(subscribeHash, () => location.hash, () => "");
  const [decoded, setDecoded] = useState<{ hash: string; cards: CatalogCard[] | null } | null>(null);
  const [saved, setSaved] = useState(0);
  const { owned, add } = useCollection();
  const setName = useSetName();

  useEffect(() => {
    if (!hash) return;
    let cancelled = false;
    decodeLink(hash).then((cards) => !cancelled && setDecoded({ hash, cards }));
    return () => {
      cancelled = true;
    };
  }, [hash]);

  const loading = Boolean(hash) && decoded?.hash !== hash;
  const cards = decoded?.hash === hash ? decoded.cards : null;
  const holo = useHolo(langOf(cards?.[0]));
  const missing = cards?.filter((c) => !(c.id in owned)) ?? [];

  return (
    <div className="mx-auto w-full max-w-7xl flex-1 px-4 pb-[max(2rem,env(safe-area-inset-bottom))] pt-[max(1rem,env(safe-area-inset-top))] sm:px-6">
      <div className="flex flex-wrap items-center justify-between gap-3 py-4">
        <h1 className="text-lg font-bold sm:text-xl">
          {cards ? (cards.length === 1 ? "Carta compartida" : `Colección compartida · ${cards.length} cartas`) : "Colección compartida"}
        </h1>
        <div className="flex gap-2">
          <Link href="/" className="flex min-h-11 items-center rounded-xl border border-white/15 px-4 text-sm text-muted transition hover:text-foreground">
            Mi colección
          </Link>
          {cards && cards.length > 0 && (
            <button
              disabled={missing.length === 0}
              onClick={() => {
                missing.forEach(add);
                setSaved(missing.length);
              }}
              className="min-h-11 rounded-xl bg-accent px-4 text-sm font-semibold text-black transition hover:brightness-110 active:scale-95 disabled:bg-white/10 disabled:text-muted"
            >
              {missing.length === 0 ? (saved ? `✓ ${saved} guardada${saved > 1 ? "s" : ""}` : "Ya la(s) tienes") : `Guardar en mi colección (${missing.length})`}
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <p className="mt-12 text-center text-muted">Cargando…</p>
      ) : !cards || cards.length === 0 ? (
        <p className="mt-12 text-center text-muted">Este enlace no es válido o está incompleto.</p>
      ) : (
        <div className="grid grid-cols-2 gap-x-3 gap-y-5 sm:grid-cols-3 sm:gap-x-4 sm:gap-y-6 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
          {cards.map((card) => (
            <article key={card.id}>
              <TiltCard holo={holo.has(card.id)} label={card.name} className="ring-1 ring-white/10">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={cardImage(card)} alt={card.name} loading="lazy" className="size-full object-cover" />
              </TiltCard>
              <div className="mt-2 flex items-baseline gap-1.5">
                <p className="truncate text-sm font-medium">{card.name}</p>
                <span className="shrink-0 text-xs text-muted">#{card.localId}</span>
              </div>
              <CardChips card={card} setName={setName(card)} />
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
