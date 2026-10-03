export type CatalogCard = {
  id: string;
  name: string;
  localId: string;
  image: string;
};

export type Owned = Record<string, { card: CatalogCard }>;

export type Lang = "es" | "en";
