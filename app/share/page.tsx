import type { Metadata } from "next";
import { SharedView } from "../ui/shared-view";

export const metadata: Metadata = { title: "Colección compartida · Pokémon TCG" };

export default function SharePage() {
  return <SharedView />;
}
