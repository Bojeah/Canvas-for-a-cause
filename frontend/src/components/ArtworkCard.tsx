import { Link } from "react-router-dom";

import type { AuctionWindow, Artwork } from "../types";
import { formatNaira } from "../utils/currency";
import { buildArtworkThumbnailUrl } from "../utils/cloudinary";

interface ArtworkCardProps {
  artwork: Artwork;
  auctionPhase?: AuctionWindow["phase"];
}

export default function ArtworkCard({ artwork, auctionPhase }: ArtworkCardProps) {
  const primaryImage = artwork.images[0];
  const thumbnailSource = primaryImage
    ? primaryImage.thumbnail_url ?? buildArtworkThumbnailUrl(primaryImage.url)
    : null;
  const biddingClosed = auctionPhase ? auctionPhase !== "live" : artwork.status === "closed";

  return (
    <article className="group overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:border-neutral-800 dark:bg-neutral-900">
      <div className="relative aspect-4/3 overflow-hidden bg-neutral-100 dark:bg-neutral-800">
        {thumbnailSource ? (
          <img
            src={thumbnailSource}
            alt={`${artwork.title} by ${artwork.artist_name}`}
            loading="lazy"
            decoding="async"
            onError={(event) => {
              event.currentTarget.src =
                "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='800' height='600'%3E%3Crect width='100%25' height='100%25' fill='%23e5e7eb'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' fill='%236b7280' font-family='Arial' font-size='18'%3EImage unavailable%3C/text%3E%3C/svg%3E";
            }}
            className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.02]"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-neutral-500 dark:text-neutral-400">
            No image available
          </div>
        )}
      </div>

      <div className="space-y-3 p-4">
        <div>
          <h3 className="font-display text-xl text-neutral-900 dark:text-neutral-100">
            <Link
              to={`/artworks/${artwork.id}`}
              className="text-link focus:outline-none focus:ring-2 focus:ring-navy-700 focus:ring-offset-2"
            >
              {artwork.title}
            </Link>
          </h3>
          <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-300">
            {artwork.artist_name}
          </p>
        </div>

        <dl className="space-y-2 text-sm">
          <div className="flex items-center justify-between">
            <dt className="text-neutral-500 dark:text-neutral-400">
              Highest bid
            </dt>
            <dd className="font-semibold text-neutral-900 dark:text-neutral-100">
              {formatNaira(artwork.current_highest_bid)}
            </dd>
          </div>
          <div className="flex items-center justify-between">
            <dt className="text-neutral-500 dark:text-neutral-400">Bidding</dt>
            <dd className="font-medium text-neutral-800 dark:text-neutral-200">
              {biddingClosed ? "Closed" : "Open"}
            </dd>
          </div>
        </dl>

        <Link
          to={`/artworks/${artwork.id}`}
          tabIndex={-1}
          aria-hidden="true"
          className="btn btn-secondary btn-md"
        >
          View details
        </Link>
      </div>
    </article>
  );
}
