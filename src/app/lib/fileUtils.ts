// src/lib/fileUtils.ts
// Small shared helpers for handling arbitrary (non-image-only) file attachments.

const IMAGE_EXTENSIONS = ["png", "jpg", "jpeg", "gif", "webp", "svg", "bmp", "avif"];
const OFFICE_EXTENSIONS = ["doc", "docx", "xls", "xlsx", "ppt", "pptx", "odt", "ods", "odp", "rtf", "txt", "csv"];

export const getFileExtension = (nameOrUrl: string): string => {
  try {
    const clean = nameOrUrl.split("?")[0].split("#")[0];
    const parts = clean.split(".");
    return parts.length > 1 ? parts[parts.length - 1].toLowerCase() : "";
  } catch {
    return "";
  }
};

export const isImageFile = (nameOrUrl: string): boolean =>
  IMAGE_EXTENSIONS.includes(getFileExtension(nameOrUrl));

export const isImageMimeType = (mimeType: string): boolean => mimeType.startsWith("image/");

// Classifies a file (by name or URL) into a preview strategy:
// - "image": render directly
// - "pdf": browsers can render PDFs natively in an <iframe>/<embed>
// - "office": Word/Excel/PowerPoint/text/csv — no native browser preview, so
//   these get routed through Google's public document viewer
// - "other": no reliable inline preview (zip, unknown types, etc.) — offer a
//   direct download/open link instead
export type FileKind = "image" | "pdf" | "office" | "other";

export const getFileKind = (nameOrUrl: string): FileKind => {
  const ext = getFileExtension(nameOrUrl);
  if (IMAGE_EXTENSIONS.includes(ext)) return "image";
  if (ext === "pdf") return "pdf";
  if (OFFICE_EXTENSIONS.includes(ext)) return "office";
  return "other";
};

// The accepted policy for campaign document attachments (ID, proof of need,
// barangay certificate, solicitation permit): images, PDFs, and common
// office documents only — no zips or arbitrary binaries.
const ACCEPTED_DOCUMENT_EXTENSIONS = [...IMAGE_EXTENSIONS, "heic", "heif", "pdf", ...OFFICE_EXTENSIONS];

// Used as the <input accept="..."> hint so the OS file picker filters to
// these types by default.
export const ACCEPTED_DOCUMENT_ACCEPT = [
  "image/*",
  "application/pdf",
  ".pdf",
  ".doc", ".docx", "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ".xls", ".xlsx", "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  ".ppt", ".pptx", "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  ".odt", ".ods", ".odp", ".rtf", ".txt", ".csv",
].join(",");

// Real validation (not just the UI hint above) — a user can switch their
// file picker to "All Files" and select anything, so this is what actually
// enforces the image/PDF/office-doc-only policy.
export const isAcceptedDocumentFile = (file: File): boolean =>
  ACCEPTED_DOCUMENT_EXTENSIONS.includes(getFileExtension(file.name));

export const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

// Derives a reasonably friendly display name from a Cloudinary (or any) URL
// when we don't otherwise have the original filename on hand.
export const getFileNameFromUrl = (url: string): string => {
  try {
    const clean = url.split("?")[0].split("#")[0];
    const segments = clean.split("/");
    return decodeURIComponent(segments[segments.length - 1] || url);
  } catch {
    return url;
  }
};
