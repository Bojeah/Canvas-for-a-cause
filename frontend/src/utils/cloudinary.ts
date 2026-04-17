export interface ArtworkImageUploadResult {
  url: string;
  thumbnail_url: string;
}

interface CloudinaryUploadResponse {
  secure_url: string;
  public_id: string;
}

const CLOUDINARY_CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
const CLOUDINARY_UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

const buildCloudinaryDeliveryUrl = (
  sourceUrl: string,
  transformation: string,
): string => {
  if (
    !sourceUrl.includes("res.cloudinary.com") ||
    !sourceUrl.includes("/upload/")
  ) {
    return sourceUrl;
  }

  return sourceUrl.replace("/upload/", `/upload/${transformation}/`);
};

export const buildArtworkImageUrl = (sourceUrl: string): string =>
  buildCloudinaryDeliveryUrl(sourceUrl, "f_auto,q_auto,c_limit,w_1200");

export const buildArtworkThumbnailUrl = (sourceUrl: string): string =>
  buildCloudinaryDeliveryUrl(
    sourceUrl,
    "f_auto,q_auto,c_fill,g_auto,w_400,h_400",
  );

export const uploadArtworkImage = async (
  file: File,
): Promise<ArtworkImageUploadResult> => {
  if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_UPLOAD_PRESET) {
    throw new Error("Cloudinary upload is not configured.");
  }

  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
    {
      method: "POST",
      body: formData,
    },
  );

  if (!response.ok) {
    throw new Error("Unable to upload image to Cloudinary.");
  }

  const data = (await response.json()) as CloudinaryUploadResponse;
  return {
    url: buildArtworkImageUrl(data.secure_url),
    thumbnail_url: buildArtworkThumbnailUrl(data.secure_url),
  };
};
