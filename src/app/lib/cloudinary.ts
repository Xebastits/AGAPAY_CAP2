// src/lib/cloudinary.ts

const CLOUD_NAME = "dhc2nduyf";
const UPLOAD_PRESET = "vkcgsvte";

// Uploads a single file of ANY type (image, PDF, doc, etc.).
//
// IMPORTANT: images go through Cloudinary's "image" resource type as before,
// but everything else (PDFs, Word/Excel/PowerPoint docs, zips, etc.) is
// uploaded as "raw". This matters because, since 2023, Cloudinary blocks
// direct delivery of PDF/ZIP files through the "image" delivery type by
// default (a security measure against old Ghostscript exploits) — those
// URLs 401 unless "Allow delivery of PDF and ZIP files" is manually enabled
// in the Cloudinary console. Uploading non-images as "raw" instead serves
// the file's bytes as-is (no image processing involved), so it isn't
// subject to that restriction and works out of the box.
export const uploadToCloudinary = async (file: File): Promise<string> => {
  const resourceType = file.type.startsWith("image/") ? "auto" : "raw";

  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", UPLOAD_PRESET);

  try {
    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/${resourceType}/upload`,
      { method: "POST", body: formData }
    );

    const data = await response.json();
    if (!response.ok) throw new Error(data.error?.message || "Upload failed");

    return data.secure_url; // Returns the HTTPS link (e.g., res.cloudinary.com/...)
  } catch (error) {
    console.error("Cloudinary Upload Error:", error);
    throw error;
  }
};

// Uploads multiple files (any type) in parallel and returns their URLs in order.
export const uploadManyToCloudinary = async (files: File[]): Promise<string[]> => {
  if (!files.length) return [];
  return Promise.all(files.map((file) => uploadToCloudinary(file)));
};