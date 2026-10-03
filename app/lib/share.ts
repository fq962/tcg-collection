import type { CatalogCard } from "./types";

// Share links carry the cards themselves in the URL fragment (never sent to a server):
// JSON -> deflate -> base64url. No backend or database needed.

const ASSETS = "https://assets.tcgdex.net/";
type Packed = [id: string, name: string, localId: string, imagePath: string];

async function pipe(data: Uint8Array<ArrayBuffer>, stream: CompressionStream | DecompressionStream) {
  const out = new Response(new Blob([data]).stream().pipeThrough(stream));
  return new Uint8Array(await out.arrayBuffer());
}

function toBase64Url(bytes: Uint8Array) {
  let bin = "";
  for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromBase64Url(text: string) {
  const bin = atob(text.replace(/-/g, "+").replace(/_/g, "/"));
  return Uint8Array.from(bin, (c) => c.charCodeAt(0));
}

export async function buildLink(cards: CatalogCard[]) {
  const packed: Packed[] = cards.map((c) => [c.id, c.name, c.localId, c.image.replace(ASSETS, "")]);
  const bytes = new TextEncoder().encode(JSON.stringify(packed));
  const compressed = await pipe(bytes, new CompressionStream("deflate-raw"));
  return `${location.origin}/share#${toBase64Url(compressed)}`;
}

export async function decodeLink(hash: string): Promise<CatalogCard[] | null> {
  try {
    const bytes = await pipe(fromBase64Url(hash.replace(/^#/, "")) as Uint8Array<ArrayBuffer>, new DecompressionStream("deflate-raw"));
    const packed = JSON.parse(new TextDecoder().decode(bytes)) as Packed[];
    if (!Array.isArray(packed)) return null;
    return packed.map(([id, name, localId, path]) => {
      if ([id, name, localId, path].some((v) => typeof v !== "string") || path.includes("..") || path.includes(":")) {
        throw new Error("invalid card");
      }
      return { id, name, localId, image: ASSETS + path };
    });
  } catch {
    return null;
  }
}

export function langOf(card: CatalogCard | undefined) {
  return card?.image.startsWith(`${ASSETS}en/`) ? "en" : "es";
}

export type ShareResult = "shared" | "copied" | "cancelled" | "failed";

export async function shareLink(url: string, title: string): Promise<ShareResult> {
  if (navigator.share) {
    try {
      await navigator.share({ title, url });
      return "shared";
    } catch (e) {
      if (e instanceof DOMException && e.name === "AbortError") return "cancelled";
    }
  }
  try {
    await navigator.clipboard.writeText(url);
    return "copied";
  } catch {
    return "failed";
  }
}
