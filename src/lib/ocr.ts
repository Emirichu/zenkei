/* Screenshot import: on-device OCR via Tesseract.js. The library is
 * ~2MB of WASM, so it's loaded from a CDN only when the user actually
 * uploads a screenshot. It never touches the main bundle. */

declare global {
  interface Window {
    __zkLoaded?: Record<string, 1>;
    Tesseract?: {
      recognize: (
        image: File,
        lang: string,
        opts: { logger: (m: { status: string; progress: number }) => void }
      ) => Promise<{ data: { text: string } }>;
    };
  }
}

export function loadScript(src: string): Promise<void> {
  return new Promise((res, rej) => {
    window.__zkLoaded = window.__zkLoaded || {};
    if (window.__zkLoaded[src]) return res();
    const s = document.createElement("script");
    s.src = src;
    s.onload = () => {
      window.__zkLoaded![src] = 1;
      res();
    };
    s.onerror = () => rej(new Error("Couldn't load the image reader (this step needs internet)."));
    document.head.appendChild(s);
  });
}

export function fileToDataURL(file: File): Promise<string> {
  return new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = () => res(r.result as string);
    r.onerror = rej;
    r.readAsDataURL(file);
  });
}

export async function ocrImage(file: File, onProgress?: (p: number) => void): Promise<string> {
  await loadScript("https://cdn.jsdelivr.net/npm/tesseract.js@5.1.1/dist/tesseract.min.js");
  const { data } = await window.Tesseract!.recognize(file, "eng", {
    logger: (m) => {
      if (m.status === "recognizing text" && onProgress) onProgress(m.progress);
    },
  });
  return data.text;
}
