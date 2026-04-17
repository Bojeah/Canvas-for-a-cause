import { useMemo, useState } from "react";

import type { ArtworkImage } from "../types";
import {
  buildArtworkImageUrl,
  buildArtworkThumbnailUrl,
} from "../utils/cloudinary";

interface ArtworkImageCarouselProps {
  images: ArtworkImage[];
  title: string;
}

export default function ArtworkImageCarousel({
  images,
  title,
}: ArtworkImageCarouselProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isZoomed, setIsZoomed] = useState(false);

  const safeImages = useMemo(() => images.slice(0, 10), [images]);

  if (!safeImages.length) {
    return (
      <div className="flex aspect-16/10 items-center justify-center rounded-xl border border-neutral-200 bg-neutral-100 text-sm text-neutral-500 dark:border-neutral-800 dark:bg-neutral-800 dark:text-neutral-400">
        No images available
      </div>
    );
  }

  const activeImage = safeImages[activeIndex] ?? safeImages[0];
  const fullImageUrl = buildArtworkImageUrl(activeImage.url);

  const goToPrevious = () => {
    setActiveIndex(
      (current) => (current - 1 + safeImages.length) % safeImages.length,
    );
  };

  const goToNext = () => {
    setActiveIndex((current) => (current + 1) % safeImages.length);
  };

  return (
    <>
      <figure className="overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
        <div className="relative aspect-16/10 bg-neutral-100 dark:bg-neutral-800">
          <button
            type="button"
            onClick={() => setIsZoomed(true)}
            className="group block h-full w-full"
            aria-label={`Open full image view for ${title}`}
          >
            <img
              src={fullImageUrl}
              alt={`${title} image ${activeIndex + 1}`}
              loading="eager"
              decoding="async"
              className="h-full w-full object-contain bg-neutral-100 transition group-hover:scale-[1.01] dark:bg-neutral-800"
            />
          </button>

          {safeImages.length > 1 ? (
            <>
              <button
                type="button"
                onClick={goToPrevious}
                className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full border border-neutral-200 bg-white/90 px-3 py-2 text-sm font-semibold text-neutral-900 shadow-sm backdrop-blur hover:bg-white dark:border-neutral-700 dark:bg-neutral-900/90 dark:text-neutral-100"
              >
                Prev
              </button>
              <button
                type="button"
                onClick={goToNext}
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full border border-neutral-200 bg-white/90 px-3 py-2 text-sm font-semibold text-neutral-900 shadow-sm backdrop-blur hover:bg-white dark:border-neutral-700 dark:bg-neutral-900/90 dark:text-neutral-100"
              >
                Next
              </button>
            </>
          ) : null}
        </div>

        {safeImages.length > 1 ? (
          <div className="flex gap-2 overflow-x-auto border-t border-neutral-200 p-3 dark:border-neutral-800">
            {safeImages.map((image, index) => {
              const isActive = index === activeIndex;
              const thumbnailUrl =
                image.thumbnail_url ?? buildArtworkThumbnailUrl(image.url);
              return (
                <button
                  key={`${image.url}-${index}`}
                  type="button"
                  onClick={() => setActiveIndex(index)}
                  className={`h-16 w-16 flex-none overflow-hidden rounded-md border-2 transition ${
                    isActive
                      ? "border-navy-700"
                      : "border-transparent hover:border-neutral-300 dark:hover:border-neutral-600"
                  }`}
                  aria-label={`View image ${index + 1}`}
                >
                  <img
                    src={thumbnailUrl}
                    alt={`${title} thumbnail ${index + 1}`}
                    loading="lazy"
                    decoding="async"
                    className="h-full w-full object-cover"
                  />
                </button>
              );
            })}
          </div>
        ) : null}
      </figure>

      {isZoomed ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 px-4 py-6"
          role="dialog"
          aria-modal="true"
          aria-label={`${title} full image view`}
          onClick={() => setIsZoomed(false)}
        >
          <div
            className="relative max-h-[90vh] max-w-5xl overflow-hidden rounded-xl bg-black shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setIsZoomed(false)}
              className="absolute right-3 top-3 z-10 rounded-full bg-white/90 px-3 py-1 text-sm font-semibold text-neutral-900 shadow-sm hover:bg-white"
            >
              Close
            </button>
            <img
              src={fullImageUrl}
              alt={`${title} full view`}
              className="max-h-[90vh] w-full object-contain"
            />
          </div>
        </div>
      ) : null}
    </>
  );
}
