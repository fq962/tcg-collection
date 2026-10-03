import { langOf } from "./share";
import { fetchPrice } from "./tcgdex";
import type { CatalogCard } from "./types";

// Prices are cached in localStorage for a day and fetched a few at a time.
const KEY = "tcg-collection:prices:v1";
const TTL = 24 * 60 * 60 * 1000;
const MAX_PARALLEL = 4;

type Entry = { p: number | null; t: number };

let cache: Record<string, Entry> | undefined;
const inflight = new Map<string, Promise<number | null>>();
const queue: (() => void)[] = [];
let running = 0;

function load() {
  if (!cache) {
    try {
      cache = JSON.parse(localStorage.getItem(KEY) ?? "{}");
    } catch {
      cache = {};
    }
  }
  return cache!;
}

export function cachedPrice(id: string): number | null | undefined {
  const entry = load()[id];
  return entry && Date.now() - entry.t < TTL ? entry.p : undefined;
}

function schedule<T>(task: () => Promise<T>) {
  return new Promise<T>((resolve, reject) => {
    const start = () => {
      running++;
      task()
        .then(resolve, reject)
        .finally(() => {
          running--;
          queue.shift()?.();
        });
    };
    if (running < MAX_PARALLEL) start();
    else queue.push(start);
  });
}

export function getPrice(card: CatalogCard): Promise<number | null> {
  const hit = cachedPrice(card.id);
  if (hit !== undefined) return Promise.resolve(hit);

  let request = inflight.get(card.id);
  if (!request) {
    request = schedule(() => fetchPrice(langOf(card), card.id))
      .then((p) => {
        const store = load();
        store[card.id] = { p, t: Date.now() };
        localStorage.setItem(KEY, JSON.stringify(store));
        return p;
      })
      .finally(() => inflight.delete(card.id));
    inflight.set(card.id, request);
  }
  return request;
}
