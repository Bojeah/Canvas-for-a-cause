import { useRef, useState } from "react";
import toast from "react-hot-toast";

import type { ArtworkImage } from "../types";
import { uploadArtworkImage } from "../utils/cloudinary";

interface AdminArtworkImageUploaderProps {
  value: ArtworkImage[];
  onChange: (images: ArtworkImage[]) => void;
  disabled?: boolean;
}

const MAX_ARTWORK_IMAGES = 10;

export default function AdminArtworkImageUploader({
  value,
  onChange,
  disabled = false,
}: AdminArtworkImageUploaderProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [uploading, setUploading] = useState(false);

  const handleFiles = async (files: FileList | null) => {
    const selectedFiles = Array.from(files ?? []);
    if (!selectedFiles.length) {
      return;
    }

    if (value.length + selectedFiles.length > MAX_ARTWORK_IMAGES) {
      toast.error(
        `You can upload up to ${MAX_ARTWORK_IMAGES} images per artwork.`,
      );
      if (inputRef.current) {
        inputRef.current.value = "";
      }
      return;
    }

    setUploading(true);
    try {
      const uploadedImages = await Promise.all(
        selectedFiles.map(uploadArtworkImage),
      );
      onChange([...value, ...uploadedImages]);
      toast.success("Artwork images uploaded.");
    } catch (error) {
      console.error(error);
      toast.error("Unable to upload one or more images.");
    } finally {
      setUploading(false);
      if (inputRef.current) {
        inputRef.current.value = "";
      }
    }
  };

  const removeImage = (index: number) => {
    onChange(value.filter((_, currentIndex) => currentIndex !== index));
  };

  return (
    <section className="space-y-3 rounded-xl border border-neutral-200 bg-neutral-50 p-4 dark:border-neutral-800 dark:bg-neutral-950">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 className="font-semibold text-neutral-900 dark:text-neutral-100">
            Artwork images
          </h3>
          <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
            Upload directly to Cloudinary. Grid views use thumbnails only.
          </p>
        </div>
        <p className="text-xs uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
          {value.length}/{MAX_ARTWORK_IMAGES}
        </p>
      </div>

      <label className="block">
        <span className="sr-only">Upload artwork images</span>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          disabled={disabled || uploading || value.length >= MAX_ARTWORK_IMAGES}
          onChange={(event) => void handleFiles(event.target.files)}
          className="block w-full text-sm text-neutral-700 file:mr-4 file:rounded-md file:border-0 file:bg-navy-700 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-navy-800 dark:text-neutral-300"
        />
      </label>

      {value.length ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {value.map((image, index) => (
            <article
              key={`${image.url}-${index}`}
              className="overflow-hidden rounded-lg border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900"
            >
              <div className="aspect-square bg-neutral-100 dark:bg-neutral-800">
                <img
                  src={image.thumbnail_url ?? image.url}
                  alt={`Artwork image ${index + 1}`}
                  loading="lazy"
                  decoding="async"
                  className="h-full w-full object-cover"
                />
              </div>
              <div className="flex items-center justify-between gap-2 p-2">
                <p className="truncate text-xs text-neutral-600 dark:text-neutral-300">
                  Image {index + 1}
                </p>
                <button
                  type="button"
                  onClick={() => removeImage(index)}
                  className="text-xs font-semibold text-red-600 hover:text-red-700"
                >
                  Remove
                </button>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <p className="text-sm text-neutral-600 dark:text-neutral-400">
          No images uploaded yet.
        </p>
      )}

      {uploading ? (
        <p className="text-sm text-neutral-600 dark:text-neutral-400">
          Uploading images...
        </p>
      ) : null}
    </section>
  );
}
