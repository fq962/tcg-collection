"use client";

import { useEffect, useRef, useState } from "react";
import type { CatalogCard } from "../lib/types";

const FILE_NAME = "coleccion-pokemon-tcg.json";

function isCard(c: unknown): c is CatalogCard {
  const card = c as Record<string, unknown> | null;
  return (
    !!card &&
    ["id", "name", "localId", "image"].every((k) => typeof card[k] === "string") &&
    (card.image as string).startsWith("https://assets.tcgdex.net/")
  );
}

// Accepts the exported file ({ cards: [...] }) or a bare array of cards.
function parseCards(text: string): CatalogCard[] | null {
  try {
    const data = JSON.parse(text);
    const list: unknown = Array.isArray(data) ? data : data?.cards;
    return Array.isArray(list) && list.length > 0 && list.every(isCard) ? list : null;
  } catch {
    return null;
  }
}

export function DataMenu({
  cards,
  onImport,
  notify,
}: {
  cards: CatalogCard[];
  onImport: (cards: CatalogCard[]) => number;
  notify: (text: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const file = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (e: Event) => {
      if (e instanceof KeyboardEvent ? e.key === "Escape" : !root.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", close);
    document.addEventListener("keydown", close);
    return () => {
      document.removeEventListener("pointerdown", close);
      document.removeEventListener("keydown", close);
    };
  }, [open]);

  function exportFile() {
    setOpen(false);
    const blob = new Blob([JSON.stringify({ version: 1, cards }, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = FILE_NAME;
    a.click();
    URL.revokeObjectURL(url);
    notify(`${cards.length} cartas exportadas`);
  }

  async function importFile(f: File) {
    const imported = parseCards(await f.text());
    if (!imported) return notify("Archivo no válido: no es una colección exportada");
    const added = onImport(imported);
    notify(added ? `${added} carta${added > 1 ? "s" : ""} importada${added > 1 ? "s" : ""}` : "Ya tenías todas esas cartas");
  }

  const item = "flex w-full items-center px-4 py-3 text-left text-sm transition hover:bg-white/5 disabled:opacity-40 disabled:hover:bg-transparent sm:py-2";

  return (
    <div ref={root} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label="Exportar o importar colección"
        aria-haspopup="menu"
        aria-expanded={open}
        className="flex size-11 items-center justify-center rounded-xl text-xl leading-none text-muted transition hover:bg-white/5 hover:text-foreground sm:size-10"
      >
        ⋯
      </button>
      {open && (
        <div role="menu" className="absolute right-0 top-full z-20 mt-1 w-44 overflow-hidden rounded-xl border border-white/10 bg-surface shadow-xl">
          <button role="menuitem" onClick={exportFile} disabled={cards.length === 0} className={item}>
            Exportar colección
          </button>
          <button
            role="menuitem"
            onClick={() => {
              setOpen(false);
              file.current?.click();
            }}
            className={item}
          >
            Importar colección
          </button>
        </div>
      )}
      <input
        ref={file}
        type="file"
        accept="application/json,.json"
        hidden
        onChange={(e) => {
          const f = e.target.files?.[0];
          e.target.value = "";
          if (f) importFile(f);
        }}
      />
    </div>
  );
}
