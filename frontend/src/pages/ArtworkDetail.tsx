import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import toast from "react-hot-toast";

import BidPanel from "../components/BidPanel";
import ArtworkImageCarousel from "../components/ArtworkImageCarousel";
import LoadingSkeleton from "../components/LoadingSkeleton";
import { useAuth } from "../context/AuthContext";
import { useAuctionWindow } from "../hooks/useAuctionWindow";
import { useNetworkStatus } from "../hooks/useNetworkStatus";
import { artworksApi, bidsApi, getApiErrorMessage } from "../services/api";
import type { Artwork } from "../types";
import { formatNaira } from "../utils/currency";
import { formatAuctionDate } from "../utils/date";

export default function ArtworkDetail() {
  const { id } = useParams();
  const artworkId = Number(id);
  const { userId } = useAuth();
  const { auctionWindow } = useAuctionWindow();
  const { isOnline } = useNetworkStatus();

  const [state, setState] = useState<{
    artwork: Artwork | null;
    isLoading: boolean;
    isSubmitting: boolean;
    error: string | null;
  }>({
    artwork: null,
    isLoading: true,
    isSubmitting: false,
    error: null,
  });

  const [showFullDescription, setShowFullDescription] = useState(false);

  useEffect(() => {
    if (!Number.isFinite(artworkId)) {
      setState((prev) => ({ ...prev, isLoading: false }));
      return;
    }

    const controller = new AbortController();

    const loadArtworkData = async (quiet = false) => {
      if (!quiet) {
        setState((prev) => ({ ...prev, isLoading: true, error: null }));
      }

      try {
        const data = await artworksApi.getById(artworkId, controller.signal);
        setState((prev) => ({
          ...prev,
          artwork: data,
          isLoading: false,
          error: null,
        }));
      } catch (error) {
        if (!controller.signal.aborted) {
          const message = getApiErrorMessage(error, "Unable to fetch artwork.");
          if (!quiet) {
            setState((prev) => ({ ...prev, isLoading: false, error: message }));
            toast.error(message);
          } else {
            console.warn("Polling update failed:", message);
          }
        }
      }
    };

    void loadArtworkData();

    // Polling interval (5 seconds)
    const intervalId = window.setInterval(() => {
      // Smart Polling: only fetch if window is visible and online
      if (document.visibilityState === "visible" && isOnline) {
        void loadArtworkData(true);
      }
    }, 5000);

    return () => {
      controller.abort();
      window.clearInterval(intervalId);
    };
  }, [artworkId, isOnline]);

  const handlePlaceBid = async (amount: number) => {
    if (!isOnline) {
      toast.error("You are offline. Reconnect before placing a bid.");
      return;
    }

    setState((prev) => ({ ...prev, isSubmitting: true }));
    try {
      await bidsApi.place(artworkId, amount);
      const updatedArtwork = await artworksApi.getById(artworkId);
      setState((prev) => ({
        ...prev,
        artwork: updatedArtwork,
        isSubmitting: false,
      }));
      toast.success("Bid submitted successfully.");
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Unable to place bid."));
      setState((prev) => ({ ...prev, isSubmitting: false }));
    }
  };

  const isOutbid = useMemo(() => {
    if (!state.artwork || !userId) {
      return false;
    }

    return Boolean(
      state.artwork.current_highest_bidder_id &&
        state.artwork.current_highest_bidder_id !== userId,
    );
  }, [state.artwork, userId]);

  const auctionPhase = auctionWindow?.phase ?? "upcoming";
  const canBid = auctionPhase === "live";

  if (!Number.isFinite(artworkId)) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-8">
        <p className="text-red-600">Invalid artwork identifier.</p>
        <Link
          to="/artworks"
          className="text-link mt-3 inline-flex"
        >
          Back to artworks
        </Link>
      </div>
    );
  }

  if (state.isLoading) {
    return (
      <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-4">
          <LoadingSkeleton className="h-4 w-32" />
        </div>
        <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
          <div className="space-y-4">
            <LoadingSkeleton className="aspect-16/10 w-full" />
            <div className="space-y-3 p-5">
              <LoadingSkeleton className="h-10 w-3/4" />
              <LoadingSkeleton className="h-4 w-1/4" />
              <LoadingSkeleton className="h-24 w-full" />
            </div>
          </div>
          <div className="space-y-4">
            <LoadingSkeleton className="h-48 w-full" />
            <LoadingSkeleton className="h-64 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (state.error || !state.artwork) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-8">
        <p className="text-neutral-700 dark:text-neutral-300">
          {state.error || "Artwork not available."}
        </p>
        <Link
          to="/artworks"
          className="text-link mt-3 inline-flex"
        >
          Back to artworks
        </Link>
      </div>
    );
  }

  const artwork = state.artwork!; // Safe to use ! here as we checked null above
  const summaryDescription = artwork.description ?? "No description available.";
  const shouldCollapse = summaryDescription.length > 280;
  const description =
    shouldCollapse && !showFullDescription
      ? `${summaryDescription.slice(0, 280)}...`
      : summaryDescription;

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-4">
        <Link
          to="/artworks"
          className="text-link text-sm"
        >
          Back to all artworks
        </Link>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
        <section className="space-y-5">
          <ArtworkImageCarousel images={artwork.images} title={artwork.title} />

          <article className="overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
            <div className="space-y-3 p-5">
              <h1 className="font-display text-3xl text-neutral-900 dark:text-neutral-100">
                {artwork.title}
              </h1>
              <p className="text-sm uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
                {artwork.artist_name}
              </p>
              <p className="text-base leading-relaxed text-neutral-700 dark:text-neutral-300">
                {description}
              </p>
              {shouldCollapse ? (
                <button
                  type="button"
                  onClick={() => setShowFullDescription((prev) => !prev)}
                  className="text-link text-sm"
                >
                  {showFullDescription ? "Show less" : "Read more"}
                </button>
              ) : null}
            </div>
          </article>
        </section>

        <aside className="space-y-4">
          <section className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
            <h2 className="font-display text-xl text-neutral-900 dark:text-neutral-100">
              Auction Status
            </h2>
            <dl className="mt-4 space-y-3 text-sm">
              <div className="flex items-center justify-between gap-4">
                <dt className="text-neutral-500 dark:text-neutral-400">
                  Current highest bid
                </dt>
                <dd className="font-semibold text-neutral-900 dark:text-neutral-100">
                  {formatNaira(artwork.current_highest_bid)}
                </dd>
              </div>
              <div className="flex items-center justify-between gap-4">
                <dt className="text-neutral-500 dark:text-neutral-400">
                  Highest bidder
                </dt>
                <dd className="font-medium text-neutral-900 dark:text-neutral-100">
                  {artwork.current_highest_bidder_id
                    ? "A bidder is leading"
                    : "No bids yet"}
                </dd>
              </div>
              <div className="flex items-center justify-between gap-4">
                <dt className="text-neutral-500 dark:text-neutral-400">Global close</dt>
                <dd className="font-medium text-neutral-900 dark:text-neutral-100">
                  {auctionWindow
                    ? formatAuctionDate(auctionWindow.bidding_ends_at)
                    : "Loading..."}
                </dd>
              </div>
              <div className="flex items-center justify-between gap-4">
                <dt className="text-neutral-500 dark:text-neutral-400">
                  Status
                </dt>
                <dd>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide ${
                      canBid
                        ? "bg-navy-700 text-white"
                        : "bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900"
                    }`}
                  >
                    {canBid ? "live" : auctionPhase}
                  </span>
                </dd>
              </div>
            </dl>
          </section>

          {isOutbid ? (
            <div className="rounded-xl border border-red-300 bg-red-50 p-4 text-sm font-medium text-red-700">
              You have been outbid. Place a stronger bid to lead again.
            </div>
          ) : null}

          <BidPanel
            currentHighestBid={artwork.current_highest_bid}
            minBidIncrement={10000}
            canBid={canBid}
            auctionPhase={auctionPhase}
            submitting={state.isSubmitting}
            onSubmit={handlePlaceBid}
          />
        </aside>
      </div>
    </div>
  );
}
