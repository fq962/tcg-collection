"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { cardImage, parseSearch, searchCards, type SearchQuery } from "../lib/tcgdex";
import { useSetName } from "../lib/use-set-name";
import { CardChips } from "./set-chip";
import type { CatalogCard, Lang, Owned } from "../lib/types";

const field =
  "rounded-xl border border-white/10 bg-black/30 px-3 py-2.5 text-base outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/30 sm:py-2 sm:text-sm";

export function AddDialog({
  owned,
  onAdd,
  onClose,
}: {
  owned: Owned;
  onAdd: (card: CatalogCard) => void;
  onClose: () => void;
}) {
  const [lang, setLang] = useState<Lang>("en");
  const [input, setInput] = useState("");
  const [results, setResults] = useState<CatalogCard[] | null>(null);
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);
  const requestId = useRef(0);
  const setName = useSetName();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  // Runs a search, falling back to the other language when nothing matches.
  const run = useCallback(
    async (q: SearchQuery) => {
      const id = ++requestId.current;
      setBusy(true);
      setStatus("");
      try {
        let found = await searchCards(lang, q);
        if (!found.length) found = await searchCards(lang === "es" ? "en" : "es", q);
        if (id !== requestId.current) return;
        setResults(found);
        if (!found.length) setStatus("No encontré ninguna carta con ese dato.");
      } catch {
        if (id === requestId.current) setStatus("No se pudo consultar la API. Revisa tu conexión.");
      } finally {
        if (id === requestId.current) setBusy(false);
      }
    },
    [lang],
  );

  // Debounced live search as the user types.
  useEffect(() => {
    const q = parseSearch(input);
    if (!q.name && q.num === undefined) {
      requestId.current++;
      const t = setTimeout(() => {
        setResults(null);
        setStatus("");
        setBusy(false);
      }, 0);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => run(q), 350);
    return () => clearTimeout(t);
  }, [input, run]);

  return (
    <div role="dialog" aria-modal="true" aria-label="Buscar carta" onClick={onClose} className="fixed inset-0 z-30 flex items-end justify-center bg-black/75 backdrop-blur-sm sm:items-center sm:p-4">
      <div onClick={(e) => e.stopPropagation()} className="flex h-[92dvh] w-full sm:h-auto sm:max-h-[90dvh] max-w-3xl flex-col overflow-hidden rounded-t-3xl border border-white/10 bg-surface sm:rounded-3xl">
        <header className="flex items-center justify-between gap-3 border-b border-white/10 px-4 py-3 sm:px-5 sm:py-4">
          <h2 className="text-lg font-semibold">Añadir carta</h2>
          <div className="flex items-center gap-2">
            <select value={lang} onChange={(e) => setLang(e.target.value as Lang)} className={field} aria-label="Idioma de la carta">
              <option value="en">English</option>
              <option value="es">Español</option>
            </select>
            <button onClick={onClose} aria-label="Cerrar" className="flex size-10 items-center justify-center rounded-lg text-xl text-muted hover:text-foreground">
              ✕
            </button>
          </div>
        </header>

        <div className="space-y-4 overflow-y-auto p-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:p-5">
          <input
            autoFocus
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Número o nombre: 125/197 · 25 · pikachu"
            className={`${field} w-full`}
          />
          <p className="text-xs text-muted">
            El número está impreso abajo en la carta. Con el total (125/197) la búsqueda es casi exacta.
          </p>

          {busy && <p className="text-sm text-muted">Buscando…</p>}
          {!busy && status && <p className="text-sm text-muted">{status}</p>}

          {results && results.length > 0 && (
            <ul className="grid grid-cols-2 gap-3 sm:gap-4 sm:grid-cols-3 md:grid-cols-4">
              {results.map((card) => {
                const has = card.id in owned;
                return (
                  <li key={card.id} className="flex flex-col gap-2">
                    <div className="relative aspect-[5/7] overflow-hidden rounded-xl bg-black/30">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={cardImage(card)} alt={card.name} loading="lazy" className="size-full object-cover" />
                      {has && <span className="absolute left-2 top-2 rounded-full bg-accent px-2 py-0.5 text-xs font-bold text-black">✓</span>}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-baseline gap-1.5">
                        <p className="truncate text-sm font-medium">{card.name}</p>
                        <span className="shrink-0 text-xs text-muted">#{card.localId}</span>
                      </div>
                      <CardChips card={card} setName={setName(card)} />
                    </div>
                    <button
                      onClick={() => onAdd(card)}
                      disabled={has}
                      className="min-h-10 rounded-xl bg-accent text-sm font-semibold text-black transition hover:brightness-110 active:scale-95 disabled:bg-white/10 disabled:text-muted"
                    >
                      {has ? "En tu colección" : "+ Añadir"}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
