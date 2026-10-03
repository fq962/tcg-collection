"use client";

import { useEffect, useMemo, useState } from "react";
import { useSetName } from "../lib/use-set-name";
import { useHolo } from "../lib/use-holo";
import { useCollection } from "../lib/use-collection";
import { cardImage } from "../lib/tcgdex";
import type { CatalogCard } from "../lib/types";
import { AddDialog } from "./add-dialog";
import { CardTile, TrashIcon } from "./card-tile";
import { ShareIcon, useShare } from "./share-button";
import { DataMenu } from "./data-menu";
import { useToast } from "./toast";
import { TiltCard } from "./tilt-card";

const field =
  "rounded-xl border border-white/10 bg-surface px-4 py-3 text-base outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/30 sm:py-2 sm:text-sm";

export function Collection() {
  const { owned, total, add, addMany, remove } = useCollection();
  const [query, setQuery] = useState("");
  const [adding, setAdding] = useState(false);
  const [preview, setPreview] = useState<CatalogCard | null>(null);
  const { show, toast } = useToast();
  const share = useShare(show);

  // Cards may have been saved from either language catalog, so check both holo lists.
  const holoEs = useHolo("es");
  const holoEn = useHolo("en");
  const setName = useSetName();
  const isHolo = (id: string) => holoEs.has(id) || holoEn.has(id);

  const cards = useMemo(() => {
    const q = query.trim().toLowerCase();
    return Object.values(owned)
      .map((o) => o.card)
      .filter((c) => !q || `${c.name} ${c.localId} ${c.id}`.toLowerCase().includes(q));
  }, [owned, query]);

  return (
    <div className="mx-auto w-full max-w-7xl flex-1 px-4 pb-[max(2rem,env(safe-area-inset-bottom))] pt-[max(0.5rem,env(safe-area-inset-top))] sm:px-6">
      <div className="grid grid-cols-[1fr_auto] items-center gap-3 py-4 sm:flex sm:py-6">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar en mi colección…"
          className={`${field} col-span-2 w-full sm:flex-1`}
        />
        <p className="text-sm font-bold sm:rounded-full sm:border sm:border-white/15 sm:px-4 sm:py-2">
          Total de cartas: <span className="tabular-nums text-accent">{total}</span>
        </p>
        <div className="flex gap-2">
          <button
            onClick={() => share(Object.values(owned).map((o) => o.card), "Mi colección Pokémon TCG")}
            disabled={total === 0}
            className="flex min-h-11 items-center gap-2 rounded-xl border border-white/15 px-4 text-sm transition hover:bg-white/5 active:scale-95 disabled:opacity-40"
          >
            <ShareIcon /> Compartir
          </button>
          <button onClick={() => setAdding(true)} className="min-h-11 rounded-xl bg-accent px-5 text-sm font-semibold text-black transition hover:brightness-110 active:scale-95 sm:rounded-lg sm:px-4">
            + Añadir carta
          </button>
          <DataMenu cards={Object.values(owned).map((o) => o.card)} onImport={addMany} notify={show} />
        </div>
      </div>

      {total === 0 ? (
        <div className="mt-6 flex flex-col items-center gap-4 rounded-3xl border border-dashed border-white/15 px-6 py-16 sm:mt-16 sm:py-20 text-center">
          <span className="text-5xl">🃏</span>
          <h2 className="text-xl font-semibold">Tu colección está vacía</h2>
          <p className="max-w-sm text-sm text-muted">Escanea una carta con la cámara o búscala por su número para añadirla.</p>
          <button onClick={() => setAdding(true)} className="mt-2 min-h-11 rounded-xl bg-accent px-5 text-sm font-semibold text-black transition hover:brightness-110 active:scale-95">
            + Añadir primera carta
          </button>
        </div>
      ) : cards.length === 0 ? (
        <p className="mt-12 text-center text-muted">Ninguna carta coincide con tu búsqueda.</p>
      ) : (
        <div className="mt-2 grid grid-cols-2 gap-x-3 gap-y-5 sm:mt-4 sm:gap-x-4 sm:gap-y-6 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
          {cards.map((card) => (
            <CardTile
              key={card.id}
              card={card}
              holo={isHolo(card.id)}
              setName={setName(card)}
              onPreview={() => setPreview(card)}
            />
          ))}
        </div>
      )}

      {toast}
      {adding && <AddDialog owned={owned} onAdd={add} onClose={() => setAdding(false)} />}
      {preview && (
        <Preview
          card={preview}
          holo={isHolo(preview.id)}
          onShare={() => share([preview], preview.name)}
          onRemove={() => {
            remove(preview.id);
            setPreview(null);
          }}
          onClose={() => setPreview(null)}
        />
      )}
    </div>
  );
}

function Preview({
  card,
  holo,
  onShare,
  onRemove,
  onClose,
}: {
  card: CatalogCard;
  holo: boolean;
  onShare: () => void;
  onRemove: () => void;
  onClose: () => void;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div role="dialog" aria-modal="true" aria-label={card.name} onClick={onClose} className="fixed inset-0 z-20 flex flex-col items-center justify-center gap-4 bg-black/80 p-4 pb-[max(1rem,env(safe-area-inset-bottom))] backdrop-blur-sm">
      <div onClick={(e) => e.stopPropagation()} className="aspect-[5/7] w-[min(90vw,calc(72dvh*5/7))]">
        <TiltCard holo={holo} max={10} touch label={card.name} className="shadow-2xl shadow-black">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={cardImage(card, "high")} alt={card.name} className="size-full object-cover" />
        </TiltCard>
      </div>
      <div onClick={(e) => e.stopPropagation()} className="flex gap-2">
        <button onClick={onShare} className="flex min-h-11 items-center gap-2 rounded-full bg-white/10 px-5 text-sm transition hover:bg-white/20">
          <ShareIcon /> Compartir
        </button>
        <button onClick={onRemove} className="flex min-h-11 items-center gap-2 rounded-full bg-white/10 px-5 text-sm transition hover:bg-red-500/20 hover:text-red-400">
          <TrashIcon /> Eliminar
        </button>
      </div>
    </div>
  );
}
