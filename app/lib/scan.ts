// Reads the collector number ("125/197") printed on a card using OCR (tesseract.js, loaded on demand).

export type Scanned = { num: number; total: number };

const MAX_WIDTH = 1600;

export function drawToCanvas(source: HTMLVideoElement | ImageBitmap) {
  const w = source instanceof HTMLVideoElement ? source.videoWidth : source.width;
  const h = source instanceof HTMLVideoElement ? source.videoHeight : source.height;
  const scale = Math.min(1, MAX_WIDTH / w);
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(w * scale);
  canvas.height = Math.round(h * scale);
  const ctx = canvas.getContext("2d")!;
  ctx.filter = "grayscale(1) contrast(1.4)"; // helps OCR; ignored by browsers without canvas filters
  ctx.drawImage(source, 0, 0, canvas.width, canvas.height);
  return canvas;
}

export async function readCardNumber(canvas: HTMLCanvasElement): Promise<Scanned[]> {
  const { createWorker } = await import("tesseract.js");
  const worker = await createWorker("eng");
  try {
    const { data } = await worker.recognize(canvas);
    const found: Scanned[] = [];
    for (const m of data.text.matchAll(/(\d{1,3})\s*\/\s*(\d{1,3})/g)) {
      const num = Number(m[1]);
      const total = Number(m[2]);
      if (num > 0 && total > 0 && !found.some((f) => f.num === num && f.total === total)) found.push({ num, total });
    }
    return found;
  } finally {
    await worker.terminate();
  }
}
