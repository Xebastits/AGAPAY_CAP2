"use client";

import { useState } from "react";
import Image from "next/image";
import { isImageFile } from "@/app/lib/fileUtils";

// Shows a grid of thumbnails for a document category that can hold one or
// MULTIPLE files, and lets the admin click through them in a lightbox.
// Non-image files (PDFs, docs, etc.) show a simple file tile instead of a
// broken thumbnail and open in a new tab.
export function DocumentImageGallery({
  title,
  files,
}: {
  title: string;
  files: string[];
}) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  if (!files || files.length === 0) return null;

  const activeSrc = lightboxIndex !== null ? files[lightboxIndex] : null;
  const activeIsImage = activeSrc ? isImageFile(activeSrc) : false;

  const goPrev = () =>
    setLightboxIndex((i) => (i === null ? null : (i - 1 + files.length) % files.length));
  const goNext = () =>
    setLightboxIndex((i) => (i === null ? null : (i + 1) % files.length));

  return (
    <div className="rounded-lg overflow-hidden border border-slate-200 bg-slate-50">
      <div className="flex items-center justify-between px-3 pt-3">
        <p className="font-bold text-sm text-slate-700">{title}</p>
        <span className="text-xs text-slate-400">
          {files.length} file{files.length > 1 ? "s" : ""}
        </span>
      </div>

      <div className="grid grid-cols-3 gap-2 p-3">
        {files.map((src, i) => {
          const isImg = isImageFile(src);
          return (
            <button
              key={`${src}-${i}`}
              type="button"
              onClick={() => setLightboxIndex(i)}
              className="relative block w-full h-24 rounded overflow-hidden border border-slate-200 bg-white cursor-zoom-in"
            >
              {isImg ? (
                <Image src={src} alt={`${title} ${i + 1}`} fill className="object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-[10px] font-bold text-slate-500 bg-slate-100">
                  FILE
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Lightbox */}
      {activeSrc && (
        <div
          className="fixed inset-0 z-[10000] bg-black/80 flex items-center justify-center p-6"
          onClick={() => setLightboxIndex(null)}
        >
          <div
            className="relative max-w-3xl w-full max-h-[85vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setLightboxIndex(null)}
              className="absolute -top-10 right-0 text-white text-sm font-bold"
            >
              ✕ Close
            </button>

            <div className="relative w-full h-[65vh] bg-black rounded-lg overflow-hidden flex items-center justify-center">
              {activeIsImage ? (
                <Image src={activeSrc} alt={title} fill className="object-contain" />
              ) : (
                <p className="text-white text-sm">
                  This file can&apos;t be previewed here — open it to view.
                </p>
              )}
            </div>

            <div className="flex items-center justify-between mt-3">
              <button
                onClick={goPrev}
                disabled={files.length < 2}
                className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded disabled:opacity-30"
              >
                ← Prev
              </button>
              <div className="flex items-center gap-3">
                <span className="text-white text-xs">
                  {(lightboxIndex ?? 0) + 1} / {files.length}
                </span>
                <a
                  href={activeSrc}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-white text-xs underline"
                >
                  Open full size
                </a>
              </div>
              <button
                onClick={goNext}
                disabled={files.length < 2}
                className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded disabled:opacity-30"
              >
                Next →
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
