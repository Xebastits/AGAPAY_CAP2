// src/lib/fileUtils.ts
// Small shared helpers for handling arbitrary (non-image-only) file attachments.

const IMAGE_EXTENSIONS = ["png", "jpg", "jpeg", "gif", "webp", "svg", "bmp", "avif"];

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