/**
 * Client-side image resize + compression.
 * Resizes so the longest side ≤ maxLongSide (default 1200px, preserving aspect ratio).
 * Converts to WebP if the browser supports it, otherwise JPEG. Quality 0.8.
 * Returns the processed Blob (for upload) and a preview ObjectURL.
 */
export async function processImage(
  file: File,
  maxLongSide: number = 1200,
  quality: number = 0.8,
): Promise<{ blob: Blob; previewUrl: string }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("FileReader failed"));
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      const img = new Image();
      img.onerror = () => reject(new Error("Image load failed"));
      img.onload = () => {
        const { w, h } = scaledDimensions(img.width, img.height, maxLongSide);
        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        const ctx2d = canvas.getContext("2d");
        if (!ctx2d) return reject(new Error("No 2d context"));
        ctx2d.drawImage(img, 0, 0, w, h);

        const mime = webpSupported() ? "image/webp" : "image/jpeg";
        canvas.toBlob(
          (blob) => {
            if (!blob) return reject(new Error("toBlob returned null"));
            resolve({ blob, previewUrl: URL.createObjectURL(blob) });
          },
          mime,
          quality,
        );
      };
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
  });
}

function scaledDimensions(
  origW: number,
  origH: number,
  max: number,
): { w: number; h: number } {
  const longSide = Math.max(origW, origH);
  if (longSide <= max) return { w: origW, h: origH };
  const scale = max / longSide;
  return { w: Math.round(origW * scale), h: Math.round(origH * scale) };
}

let _webpCache: boolean | null = null;
function webpSupported(): boolean {
  if (_webpCache !== null) return _webpCache;
  try {
    _webpCache = document
      .createElement("canvas")
      .toDataURL("image/webp")
      .startsWith("data:image/webp");
  } catch {
    _webpCache = false;
  }
  return _webpCache;
}
