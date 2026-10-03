"use client";

import { useCallback, useSyncExternalStore } from "react";
import type { CatalogCard, Owned } from "./types";

const KEY = "tcg-collection:v2";
const EMPTY: Owned = {};

let cache: Owned = EMPTY;
let raw: string | null | undefined;
const listeners = new Set<() => void>();

function read(): Owned {
  const current = localStorage.getItem(KEY);
  if (current !== raw) {
    raw = current;
    try {
      cache = current ? (JSON.parse(current) as Owned) : EMPTY;
    } catch {
      cache = EMPTY;
    }
  }
  return cache;
}

function write(next: Owned) {
  localStorage.setItem(KEY, JSON.stringify(next));
  listeners.forEach((l) => l());
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  window.addEventListener("storage", cb);
  return () => {
    listeners.delete(cb);
    window.removeEventListener("storage", cb);
  };
}

export function useCollection() {
  const owned = useSyncExternalStore(subscribe, read, () => EMPTY);

  const add = useCallback((card: CatalogCard) => {
    const current = read();
    if (!current[card.id]) write({ ...current, [card.id]: { card } });
  }, []);

  const remove = useCallback((id: string) => {
    const next = { ...read() };
    delete next[id];
    write(next);
  }, []);

  // Merges cards into the collection; returns how many were new.
  const addMany = useCallback((cards: CatalogCard[]) => {
    const current = read();
    const next = { ...current };
    for (const card of cards) next[card.id] ??= { card };
    write(next);
    return Object.keys(next).length - Object.keys(current).length;
  }, []);

  const total = Object.keys(owned).length;

  return { owned, total, add, addMany, remove };
}
