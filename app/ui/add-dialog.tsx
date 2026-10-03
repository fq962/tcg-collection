"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { drawToCanvas, readCardNumber } from "../lib/scan";
import { cardImage, parseSearch, searchCards, type SearchQuery } from "../lib/tcgdex";
import type { CatalogCard, Lang, Owned } from "../lib/types";

const field =
  "rounded-xl border border-white/10 bg-black/30 px-3 py-2.5 text-base outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/30 sm:py-2 sm:text-sm";

type Mode = "search" | "scan";

export function AddDialog({
  owned,
  onAdd,
  onClose,
}: {
  owned: Owned;
  onAdd: (card: CatalogCard) => void;
  onClose: () => void;
}) {
  const [mode, setMode] = useState<Mode>("search");
  const [lang, setLang] = useState<Lang>("es");
  const [input, setInput] = useState("");
  const [results, setResults] = useState<CatalogCard[] | null>(null);
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);
  const requestId = useRef(0);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  // Runs a search, falling back to the other language when nothing matches.
  const run = useCallback(
    async (q: SearchQuery) => {
      const id = ++requestId.current;
      setBusy(true);
      setStatus("");
      try {
        let found = await searchCards(lang, q);
        if (!found.length) found = await searchCards(lang === "es" ? "en" : "es", q);
        if (id !== requestId.current) return;
        setResults(found);
        if (!found.length) setStatus("No encontré ninguna carta con ese dato.");
      } catch {
        if (id === requestId.current) setStatus("No se pudo consultar la API. Revisa tu conexión.");
      } finally {
        if (id === requestId.current) setBusy(false);
      }
    },
    [lang],
  );

  // Debounced live search as the user types.
  useEffect(() => {
    if (mode !== "search") return;
    const q = parseSearch(input);
    if (!q.name && q.num === undefined) {
      requestId.current++;
      const t = setTimeout(() => {
        setResults(null);
        setStatus("");
        setBusy(false);
      }, 0);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => run(q), 350);
    return () => clearTimeout(t);
  }, [input, mode, run]);

  async function onScanned(source: HTMLVideoElement | ImageBitmap) {
    setBusy(true);
    setResults(null);
    setStatus("Leyendo la carta…");
    try {
      const numbers = await readCardNumber(drawToCanvas(source));
      if (!numbers.length) {
        setBusy(false);
        setStatus("No pude leer el número. Acerca la carta, que el número (ej. 125/197) se vea nítido y con buena luz.");
        return;
      }
      const [first] = numbers;
      setStatus(`Detecté ${first.num}/${first.total}`);
      await run({ num: first.num, total: first.total });
    } catch {
      setBusy(false);
      setStatus("Falló el escaneo. Inténtalo de nuevo o usa la búsqueda manual.");
    }
  }

  return (
    <div role="dialog" aria-modal="true" aria-label="Añadir carta" onClick={onClose} className="fixed inset-0 z-30 flex items-end justify-center bg-black/75 backdrop-blur-sm sm:items-center sm:p-4">
      <div onClick={(e) => e.stopPropagation()} className="flex h-[92dvh] w-full sm:h-auto sm:max-h-[90dvh] max-w-3xl flex-col overflow-hidden rounded-t-3xl border border-white/10 bg-surface sm:rounded-3xl">
        <header className="flex items-center justify-between gap-3 border-b border-white/10 px-4 py-3 sm:px-5 sm:py-4">
          <h2 className="text-lg font-semibold">Añadir carta</h2>
          <div className="flex items-center gap-2">
            <select value={lang} onChange={(e) => setLang(e.target.value as Lang)} className={field} aria-label="Idioma de la carta">
              <option value="es">Español</option>
              <option value="en">English</option>
            </select>
            <button onClick={onClose} aria-label="Cerrar" className="flex size-10 items-center justify-center rounded-lg text-xl text-muted hover:text-foreground">
              ✕
            </button>
          </div>
        </header>

        <div className="flex gap-1 px-4 pt-3 text-sm sm:px-5 sm:pt-4">
          {([
            ["search", "🔎 Buscar"],
            ["scan", "📷 Escanear"],
          ] as const).map(([m, label]) => (
            <button
              key={m}
              onClick={() => {
                setMode(m);
                setResults(null);
                setStatus("");
              }}
              aria-pressed={mode === m}
              className={`min-h-10 flex-1 rounded-full px-3 transition sm:flex-none sm:px-4 ${mode === m ? "bg-accent font-semibold text-black" : "text-muted hover:text-foreground"}`}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="space-y-4 overflow-y-auto p-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:p-5">
          {mode === "search" ? (
            <>
              <input
                autoFocus
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ej: 125/197 · 25 · pikachu · pikachu 25"
                className={`${field} w-full`}
              />
              <p className="text-xs text-muted">
                El número está impreso abajo en la carta. Con el total (125/197) la búsqueda es casi exacta.
              </p>
            </>
          ) : (
            <Scanner onScanned={onScanned} busy={busy} />
          )}

          {busy && <p className="text-sm text-muted">{status || "Buscando…"}</p>}
          {!busy && status && <p className="text-sm text-muted">{status}</p>}

          {results && results.length > 0 && (
            <ul className="grid grid-cols-2 gap-3 sm:gap-4 sm:grid-cols-3 md:grid-cols-4">
              {results.map((card) => {
                const has = card.id in owned;
                return (
                  <li key={card.id} className="flex flex-col gap-2">
                    <div className="relative aspect-[5/7] overflow-hidden rounded-xl bg-black/30">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={cardImage(card)} alt={card.name} loading="lazy" className="size-full object-cover" />
                      {has && <span className="absolute left-2 top-2 rounded-full bg-accent px-2 py-0.5 text-xs font-bold text-black">✓</span>}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{card.name}</p>
                      <p className="truncate text-xs text-muted">{card.id}</p>
                    </div>
                    <button
                      onClick={() => onAdd(card)}
                      disabled={has}
                      className="min-h-10 rounded-xl bg-accent text-sm font-semibold text-black transition hover:brightness-110 active:scale-95 disabled:bg-white/10 disabled:text-muted"
                    >
                      {has ? "En tu colección" : "+ Añadir"}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

function Scanner({ onScanned, busy }: { onScanned: (source: HTMLVideoElement | ImageBitmap) => void; busy: boolean }) {
  const video = useRef<HTMLVideoElement>(null);
  const [cameraError, setCameraError] = useState(false);

  useEffect(() => {
    let stream: MediaStream | undefined;
    let cancelled = false;
    navigator.mediaDevices
      ?.getUserMedia({ video: { facingMode: "environment", width: { ideal: 1920 } } })
      .then((s) => {
        if (cancelled) return s.getTracks().forEach((t) => t.stop());
        stream = s;
        if (video.current) video.current.srcObject = s;
      })
      .catch(() => !cancelled && setCameraError(true));
    if (!navigator.mediaDevices) setTimeout(() => setCameraError(true), 0);
    return () => {
      cancelled = true;
      stream?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  return (
    <div className="space-y-3">
      {cameraError ? (
        <p className="rounded-xl border border-white/10 bg-black/30 p-4 text-sm text-muted">
          No pude acceder a la cámara (revisa el permiso del navegador). Puedes subir una foto de la carta.
        </p>
      ) : (
        <div className="relative overflow-hidden rounded-2xl bg-black">
          <video ref={video} autoPlay playsInline muted className="max-h-[50dvh] w-full object-contain" />
          <div className="pointer-events-none absolute inset-0 m-auto aspect-[5/7] h-[88%] rounded-xl border-2 border-dashed border-white/50" />
        </div>
      )}
      <div className="flex flex-wrap gap-2">
        {!cameraError && (
          <button
            disabled={busy}
            onClick={() => video.current && onScanned(video.current)}
            className="min-h-11 flex-1 rounded-xl bg-accent px-5 text-sm font-semibold text-black transition hover:brightness-110 disabled:opacity-50 sm:flex-none"
          >
            {busy ? "Procesando…" : "Capturar y detectar"}
          </button>
        )}
        <label className="flex min-h-11 flex-1 cursor-pointer items-center justify-center rounded-xl border border-white/15 px-4 text-sm sm:flex-none text-muted transition hover:text-foreground">
          Subir foto
          <input
            type="file"
            accept="image/*"
            capture="environment"
            hidden
            disabled={busy}
            onChange={async (e) => {
              const file = e.target.files?.[0];
              e.target.value = "";
              if (file) onScanned(await createImageBitmap(file));
            }}
          />
        </label>
      </div>
      <p className="text-xs text-muted">Encuadra la carta y asegúrate de que el número de abajo (ej. 125/197) se lea bien. Procesa todo en tu navegador.</p>
    </div>
  );
}
