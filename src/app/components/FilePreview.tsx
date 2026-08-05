"use client";

import Image from "next/image";
import { getFileKind, FileKind } from "@/app/lib/fileUtils";

// Small square tile used in grids/lists — shows an actual image thumbnail,
// or a color-coded badge (PDF / DOC / FILE) for non-image files.
export function FileThumbnail({ src, alt, kind }: { src: string; alt?: string; kind?: FileKind }) {
  const resolvedKind = kind ?? getFileKind(src);

  if (resolvedKind === "image") {
    return <Image src={src} alt={alt || "preview"} fill className="object-cover" unoptimized={src.startsWith("blob:")} />;
  }

  const badge = resolvedKind === "pdf" ? "PDF" : resolvedKind === "office" ? "DOC" : "FILE";
  const colors =
    resolvedKind === "pdf"
      ? "bg-red-50 text-red-600"
      : resolvedKind === "office"
      ? "bg-blue-50 text-blue-600"
      : "bg-slate-100 text-slate-500";

  return (
    <div className={`w-full h-full flex items-center justify-center text-[10px] font-bold ${colors}`}>
      {badge}
    </div>
  );
}

// Full-size preview: images render directly, PDFs render natively in an
// <iframe> (browsers do this out of the box), office/text docs are routed
// through Google's public document viewer, and anything else falls back to
// an "open file" link since it truly can't be embedded.
// `kind` can be passed explicitly for local blob: URLs (e.g. a freshly picked
// file before upload), since those have no file extension to sniff from.
export function FileViewer({ src, title, kind }: { src: string; title?: string; kind?: FileKind }) {
  const resolvedKind = kind ?? getFileKind(src);

  if (resolvedKind === "image") {
    return <Image src={src} alt={title || "preview"} fill className="object-contain" unoptimized={src.startsWith("blob:")} />;
  }

  if (resolvedKind === "pdf") {
    return (
      <iframe
        src={src}
        title={title || "PDF preview"}
        className="w-full h-full border-0 bg-white"
      />
    );
  }

  if (resolvedKind === "office") {
    // Google's viewer needs a publicly reachable URL — it can't reach a
    // local blob: URL, so locally-picked office files fall back to "other".
    if (src.startsWith("blob:")) {
      return (
        <div className="w-full h-full flex flex-col items-center justify-center gap-2 text-slate-500 text-sm p-4 text-center">
          <p>This file type previews once it&apos;s uploaded — you can still open it locally.</p>
          <a href={src} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline text-xs font-bold">
            Open file
          </a>
        </div>
      );
    }
    const viewerUrl = `https://docs.google.com/viewer?url=${encodeURIComponent(src)}&embedded=true`;
    return (
      <iframe
        src={viewerUrl}
        title={title || "Document preview"}
        className="w-full h-full border-0 bg-white"
      />
    );
  }

  return (
    <div className="w-full h-full flex flex-col items-center justify-center gap-2 text-slate-500 text-sm p-4 text-center">
      <p>This file type can&apos;t be previewed inline.</p>
      <a
        href={src}
        target="_blank"
        rel="noopener noreferrer"
        className="text-blue-600 underline text-xs font-bold"
      >
        Open file in a new tab
      </a>
    </div>
  );
}

