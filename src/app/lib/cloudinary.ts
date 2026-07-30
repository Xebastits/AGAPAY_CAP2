// src/lib/cloudinary.ts

const CLOUD_NAME = "dhc2nduyf";
const UPLOAD_PRESET = "vkcgsvte";

// Uploads a single file of ANY type (image, PDF, doc, etc.) using Cloudinary's
// "auto" resource type, which detects whether the file is an image, video, or
// raw document and routes it accordingly.
export const uploadToCloudinary = async (file: File): Promise<string> => {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", UPLOAD_PRESET);

  try {
    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/auto/upload`,
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