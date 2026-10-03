"use client";

import { useEffect, useState } from "react";
import { langOf } from "./share";
import { fetchSetNames, setIdOf } from "./tcgdex";
import type { CatalogCard, Lang } from "./types";

type Names = Map<string, string>;

// Shared across components so the set lists are fetched once per page load.
const requests: Partial<Record<Lang, Promise<Names>>> = {};
const load = (lang: Lang) => (requests[lang] ??= fetchSetNames(lang).catch(() => {
  delete requests[lang];
  return new Map();
}));

// Returns a lookup for the set ("pack") name of a card; undefined until the names arrive.
export function useSetName() {
  const [names, setNames] = useState<Record<Lang, Names> | null>(null);

  useEffect(() => {
    let cancelled = false;
    Promise.all([load("es"), load("en")]).then(([es, en]) => !cancelled && setNames({ es, en }));
    return () => {
      cancelled = true;
    };
  }, []);

  return (card: CatalogCard) => {
    if (!names) return undefined;
    const id = setIdOf(card);
    // Prefer the language the card was saved in, fall back to the other one.
    const lang = langOf(card);
    // If the set list is missing this id (or failed to load), show the raw set id rather than no chip at all.
    return names[lang].get(id) ?? names[lang === "es" ? "en" : "es"].get(id) ?? id.toUpperCase();
  };
}
