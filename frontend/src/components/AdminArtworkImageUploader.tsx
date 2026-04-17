import { useId, useRef, useState, type DragEvent } from "react";
import toast from "react-hot-toast";

import type { ArtworkImage } from "../types";
import { uploadArtworkImage } from "../utils/cloudinary";

interface AdminArtworkImageUploaderProps {
  value: ArtworkImage[];
  onChange: (images: ArtworkImage[]) => void;
  disabled?: boolean;
}

const MAX_ARTWORK_IMAGES = 10;

interface UploadEntry {
  id: string;
  fileName: string;
  progress: number;
}

const createUploadId = (file: File, index: number): string =>
  `${file.name}-${file.size}-${file.lastModified}-${index}`;

const isImageFile = (file: File): boolean => file.type.startsWith("image/");

export default function AdminArtworkImageUploader({
  value,
  onChange,
  disabled = false,
}: AdminArtworkImageUploaderProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const inputId = useId();
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [uploadEntries, setUploadEntries] = useState<UploadEntry[]>([]);

  const isDisabled =
    disabled || uploading || value.length >= MAX_ARTWORK_IMAGES;

  const resetInput = () => {
    if (inputRef.current) {
      inputRef.current.value = "";
    }
  };

  const updateUploadEntry = (
    id: string,
    updater: (entry: UploadEntry) => UploadEntry,
  ) => {
    setUploadEntries((currentEntries) =>
      currentEntries.map((entry) => (entry.id === id ? updater(entry) : entry)),
    );
  };

  const handleFiles = async (files: FileList | null) => {
    const selectedFiles = Array.from(files ?? []);
    if (!selectedFiles.length) {
      return;
    }

    if (!selectedFiles.every(isImageFile)) {
      toast.error("Only image files can be uploaded.");
      resetInput();
      return;
    }

    if (value.length + selectedFiles.length > MAX_ARTWORK_IMAGES) {
      toast.error(
        `You can upload up to ${MAX_ARTWORK_IMAGES} images per artwork.`,
      );
      resetInput();
      return;
    }

    const baseImages = [...value];
    const entries = selectedFiles.map((file, index) => ({
      id: createUploadId(file, index),
      fileName: file.name,
      progress: 0,
    }));

    setUploadEntries(entries);
    setUploading(true);
    try {
      const uploadedImages = await Promise.allSettled(
        selectedFiles.map((file, index) => {
          const uploadId = entries[index]?.id;
          return uploadArtworkImage(file, (progress) => {
            if (!uploadId) {
              return;
            }

            updateUploadEntry(uploadId, (entry) => ({
              ...entry,
              progress,
            }));
          }).then((uploadedImage) => {
            if (uploadId) {
              updateUploadEntry(uploadId, (entry) => ({
                ...entry,
                progress: 100,
              }));
            }

            return uploadedImage;
          });
        }),
      );

      const successfulUploads = uploadedImages
        .filter(
          (result): result is PromiseFulfilledResult<ArtworkImage> =>
            result.status === "fulfilled",
        )
        .map((result) => result.value);

      if (successfulUploads.length) {
        onChange([...baseImages, ...successfulUploads]);
      }

      const failedCount = uploadedImages.length - successfulUploads.length;
      if (failedCount === 0) {
        toast.success("Artwork images uploaded.");
      } else if (successfulUploads.length) {
        toast.error(
          `Uploaded ${successfulUploads.length} image(s); ${failedCount} failed.`,
        );
      } else {
        toast.error("Unable to upload one or more images.");
      }
    } catch (error) {
      console.error(error);
      toast.error("Unable to upload one or more images.");
    } finally {
      setUploading(false);
      setUploadEntries([]);
      setDragActive(false);
      resetInput();
    }
  };

  const handleDragEnter = () => {
    if (!isDisabled) {
      setDragActive(true);
    }
  };

  const handleDragOver = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    if (!isDisabled) {
      setDragActive(true);
    }
  };

  const handleDragLeave = () => {
    setDragActive(false);
  };

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragActive(false);
    if (isDisabled) {
      return;
    }

    void handleFiles(event.dataTransfer.files);
  };

  const removeImage = (index: number) => {
    onChange(value.filter((_, currentIndex) => currentIndex !== index));
  };

  const totalProgress = uploadEntries.length
    ? Math.round(
        uploadEntries.reduce((sum, entry) => sum + entry.progress, 0) /
          uploadEntries.length,
      )
    : 0;

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

      <div
        onDragEnter={handleDragEnter}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`rounded-xl border-2 border-dashed p-4 transition-colors ${
          dragActive
            ? "border-navy-700 bg-navy-50 dark:border-navy-400 dark:bg-navy-950/60"
            : "border-neutral-300 bg-white dark:border-neutral-700 dark:bg-neutral-900"
        } ${isDisabled ? "opacity-70" : ""}`}
      >
        <input
          id={inputId}
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          disabled={isDisabled}
          onChange={(event) => void handleFiles(event.target.files)}
          className="sr-only"
        />

        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <label
              htmlFor={inputId}
              className="block cursor-pointer text-sm font-semibold text-neutral-900 dark:text-neutral-100"
            >
              Drop images here or browse files
            </label>
            <p className="text-sm text-neutral-600 dark:text-neutral-400">
              PNG, JPG, WEBP, and other image formats are supported.
            </p>
          </div>

          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={isDisabled}
            className="btn btn-secondary btn-md"
          >
            Choose files
          </button>
        </div>

        {uploadEntries.length ? (
          <div className="mt-4 space-y-3 rounded-lg border border-neutral-200 bg-neutral-50 p-3 dark:border-neutral-800 dark:bg-neutral-950">
            <div className="flex items-center justify-between gap-3 text-xs uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
              <span>Uploading {uploadEntries.length} image(s)</span>
              <span>{totalProgress}%</span>
            </div>

            <div className="h-2 overflow-hidden rounded-full bg-neutral-200 dark:bg-neutral-800">
              <div
                className="h-full rounded-full bg-navy-700 transition-[width] duration-200"
                style={{ width: `${totalProgress}%` }}
              />
            </div>

            <div className="grid gap-2 sm:grid-cols-2">
              {uploadEntries.map((entry) => (
                <div
                  key={entry.id}
                  className="rounded-md border border-neutral-200 bg-white px-3 py-2 text-xs dark:border-neutral-800 dark:bg-neutral-900"
                >
                  <div className="flex items-center justify-between gap-2 text-neutral-700 dark:text-neutral-300">
                    <span className="truncate">{entry.fileName}</span>
                    <span>{entry.progress}%</span>
                  </div>
                  <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-neutral-200 dark:bg-neutral-800">
                    <div
                      className="h-full rounded-full bg-emerald-600 transition-[width] duration-200"
                      style={{ width: `${entry.progress}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </div>

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
    </section>
  );
}
