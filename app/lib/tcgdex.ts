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

// One request returns every set name for a language (~150 sets), so cards never need individual lookups.
export async function fetchSetNames(lang: Lang, signal?: AbortSignal) {
  const res = await fetch(`${API}/${lang}/sets`, { signal });
  if (!res.ok) throw new Error(`TCGdex ${res.status}`);
  const raw = (await res.json()) as { id: string; name: string }[];
  return new Map(raw.map((s) => [s.id, s.name]));
}

// Card ids are "<setId>-<localId>" (e.g. "sv03-125").
export function setIdOf(card: CatalogCard) {
  return card.id.slice(0, Math.max(0, card.id.length - card.localId.length - 1));
}

type TcgPlayerPrice = { marketPrice?: number | null; midPrice?: number | null };

// USD price from TCGplayer (via TCGdex), or null when the card has no listed price.
export async function fetchPrice(lang: Lang, id: string, signal?: AbortSignal) {
  const res = await fetch(`${API}/${lang}/cards/${encodeURIComponent(id)}`, { signal });
  if (!res.ok) throw new Error(`TCGdex ${res.status}`);
  const tcgplayer = ((await res.json()) as { pricing?: { tcgplayer?: Record<string, unknown> } }).pricing?.tcgplayer;
  if (!tcgplayer) return null;

  const variants = Object.entries(tcgplayer).filter(([, v]) => v && typeof v === "object") as [string, TcgPlayerPrice][];
  // Cheapest base printing first: normal, then holofoil, then reverse, then anything else.
  const order = ["normal", "holofoil", "reverse-holofoil"];
  variants.sort(([a], [b]) => (order.indexOf(a) + 1 || 99) - (order.indexOf(b) + 1 || 99));
  const [, best] = variants[0] ?? [];
  return best?.marketPrice ?? best?.midPrice ?? null;
}
