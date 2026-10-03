"use client";

import { useEffect, useState } from "react";
import { fetchHoloIds } from "./tcgdex";
import type { Lang } from "./types";

const EMPTY = new Set<string>();

export function useHolo(lang: Lang) {
  const [state, setState] = useState<{ lang: Lang; ids: Set<string> } | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    fetchHoloIds(lang, controller.signal)
      .then((ids) => setState({ lang, ids }))
      .catch((e) => !controller.signal.aborted && console.error(e));
    return () => controller.abort();
  }, [lang]);

  // Holo is cosmetic: until the list arrives (or if it fails) cards simply render without it.
  return state?.lang === lang ? state.ids : EMPTY;
}
