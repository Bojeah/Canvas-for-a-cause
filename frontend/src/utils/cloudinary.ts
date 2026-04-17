export interface ArtworkImageUploadResult {
  url: string;
  thumbnail_url: string;
}

type CloudinaryUploadProgressCallback = (progress: number) => void;

interface CloudinaryUploadResponse {
  secure_url: string;
  public_id: string;
}

const CLOUDINARY_CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
const CLOUDINARY_UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;
const CLOUDINARY_HOSTNAME = "res.cloudinary.com";
const CLOUDINARY_UPLOAD_URL_PATTERN = /^\/([^/]+)\/image\/upload\/(.+)$/;

const isVersionSegment = (segment: string): boolean => /^v\d+$/.test(segment);

const parseCloudinaryUploadUrl = (sourceUrl: string): URL | null => {
  try {
    const parsedUrl = new URL(sourceUrl);
    if (parsedUrl.protocol !== "https:") {
      return null;
    }

    if (parsedUrl.hostname !== CLOUDINARY_HOSTNAME) {
      return null;
    }

    return CLOUDINARY_UPLOAD_URL_PATTERN.test(parsedUrl.pathname)
      ? parsedUrl
      : null;
  } catch {
    return null;
  }
};

const buildCloudinaryDeliveryUrl = (
  sourceUrl: string,
  transformation: string,
): string => {
  const parsedUrl = parseCloudinaryUploadUrl(sourceUrl);
  if (!parsedUrl) {
    return sourceUrl;
  }

  const pathSegments = parsedUrl.pathname.split("/");
  const uploadIndex = pathSegments.indexOf("upload");
  const nextSegment = pathSegments[uploadIndex + 1];

  if (!nextSegment || !isVersionSegment(nextSegment)) {
    return sourceUrl;
  }

  pathSegments.splice(uploadIndex + 1, 0, transformation);
  parsedUrl.pathname = pathSegments.join("/");
  return parsedUrl.toString();
};

export const isCloudinaryDeliveryUrl = (sourceUrl: string): boolean =>
  parseCloudinaryUploadUrl(sourceUrl) !== null;

export const buildArtworkImageUrl = (sourceUrl: string): string =>
  buildCloudinaryDeliveryUrl(sourceUrl, "f_auto,q_auto,c_limit,w_1200");

export const buildArtworkThumbnailUrl = (sourceUrl: string): string =>
  buildCloudinaryDeliveryUrl(
    sourceUrl,
    "f_auto,q_auto,c_fill,g_auto,w_400,h_400",
  );

export const uploadArtworkImage = async (
  file: File,
  onProgress?: CloudinaryUploadProgressCallback,
): Promise<ArtworkImageUploadResult> => {
  if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_UPLOAD_PRESET) {
    throw new Error("Cloudinary upload is not configured.");
  }

  const response = await new Promise<CloudinaryUploadResponse>(
    (resolve, reject) => {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);

      const xhr = new XMLHttpRequest();
      xhr.open(
        "POST",
        `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
      );
      xhr.responseType = "json";

      xhr.upload.onprogress = (event) => {
        if (!event.lengthComputable) {
          return;
        }

        const progress = Math.round((event.loaded / event.total) * 100);
        onProgress?.(progress);
      };

      xhr.onerror = () => {
        reject(new Error("Unable to upload image to Cloudinary."));
      };

      xhr.onabort = () => {
        reject(new Error("Image upload was cancelled."));
      };

      xhr.onload = () => {
        if (xhr.status < 200 || xhr.status >= 300) {
          reject(new Error("Unable to upload image to Cloudinary."));
          return;
        }

        const responseBody = xhr.response as CloudinaryUploadResponse | null;
        if (
          !responseBody?.secure_url ||
          !isCloudinaryDeliveryUrl(responseBody.secure_url)
        ) {
          reject(new Error("Cloudinary returned an invalid image URL."));
          return;
        }

        resolve(responseBody);
      };

      onProgress?.(0);
      xhr.send(formData);
    },
  );

  return {
    url: buildArtworkImageUrl(response.secure_url),
    thumbnail_url: buildArtworkThumbnailUrl(response.secure_url),
  };
};
