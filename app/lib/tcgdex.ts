import type { CatalogCard, Lang } from "./types";

// TCGdex: free, no API key, CORS enabled. https://tcgdex.dev
const API = "https://api.tcgdex.net/v2";

type Raw = { id: string; localId: string; name: string; image?: string };

export function cardImage(card: CatalogCard, quality: "low" | "high" = "low") {
  return `${card.image}/${quality}.webp`;
}

export type SearchQuery = { name?: string; num?: number; total?: number };

// Accepts "125/197", "125", "pikachu", "pikachu 25" or "pikachu 25/102".
export function parseSearch(input: string): SearchQuery {
  const m = input.match(/(\d+)\s*(?:\/\s*(\d+))?/);
  const name = input.replace(m?.[0] ?? "", "").trim();
  return {
    name: name || undefined,
    num: m ? Number(m[1]) : undefined,
    total: m?.[2] ? Number(m[2]) : undefined,
  };
}

export async function searchCards(lang: Lang, q: SearchQuery, signal?: AbortSignal) {
  if (!q.name && q.num === undefined) return [];
  const params = new URLSearchParams({ "image": "neq:null", "pagination:itemsPerPage": "120" });
  if (q.name) params.set("name", q.name);
  if (q.num !== undefined) params.set("localId", String(q.num));
  if (q.total) params.set("set.cardCount.official", String(q.total));

  const res = await fetch(`${API}/${lang}/cards?${params}`, { signal });
  if (!res.ok) throw new Error(`TCGdex ${res.status}`);
  const raw = (await res.json()) as Raw[];

  return raw
    // the API matches localId as a substring ("25" also returns "125"), so keep exact numbers only
    .filter((c) => c.image && (q.num === undefined || Number(c.localId) === q.num))
    .map((c): CatalogCard => ({ id: c.id, name: c.name, localId: c.localId, image: c.image! }));
}

// IDs of every card with a holo variant (~60 KB per language), used to decide which cards get the holo effect.
export async function fetchHoloIds(lang: Lang, signal: AbortSignal) {
  const params = new URLSearchParams({
    "variants.holo": "true",
    "image": "neq:null",
    "pagination:itemsPerPage": "100000",
  });
  const res = await fetch(`${API}/${lang}/cards?${params}`, { signal });
  if (!res.ok) throw new Error(`TCGdex ${res.status}`);
  const raw = (await res.json()) as Raw[];
  return new Set(raw.map((c) => c.id));
}
