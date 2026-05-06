import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";

import ArtworkCard from "../components/ArtworkCard";
import LoadingSkeleton from "../components/LoadingSkeleton";
import { useAuctionWindow } from "../hooks/useAuctionWindow";
import { artworksApi, getApiErrorMessage } from "../services/api";
import type { Artwork } from "../types";
import { storage } from "../utils/storage";

interface ArtworkFilters {
  search: string;
  artist: string;
}

const FILTERS_KEY = "pausc-artwork-filters";

const defaultFilters: ArtworkFilters = {
  search: "",
  artist: "",
};

export default function Artworks() {
  const [artworks, setArtworks] = useState<Artwork[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<ArtworkFilters>(() =>
    storage.get<ArtworkFilters>(FILTERS_KEY, defaultFilters),
  );
  const { auctionWindow } = useAuctionWindow();

  useEffect(() => {
    storage.set(FILTERS_KEY, filters);
  }, [filters]);

  const loadArtworks = async () => {
    setLoading(true);
    try {
      const data = await artworksApi.list();
      setArtworks(data);
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Unable to load artworks."));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadArtworks();
  }, []);

  const artists = useMemo(() => {
    return [...new Set(artworks.map((artwork) => artwork.artist_name))].sort(
      (a, b) => a.localeCompare(b),
    );
  }, [artworks]);

  const filteredArtworks = useMemo(() => {
    const search = filters.search.trim().toLowerCase();

    return artworks.filter((artwork) => {
      if (filters.artist && artwork.artist_name !== filters.artist) {
        return false;
      }
      if (!search) {
        return true;
      }

      return (
        artwork.title.toLowerCase().includes(search) ||
        artwork.artist_name.toLowerCase().includes(search)
      );
    });
  }, [artworks, filters]);

  return (
    <div className="mx-auto w-full max-w-7xl px-3 py-6 sm:px-6 sm:py-8 lg:px-8">
      <header className="mb-6 sm:mb-8">
        <h1 className="font-display text-3xl text-neutral-900 dark:text-neutral-100 sm:text-4xl">
          Auction Artworks
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-neutral-600 dark:text-neutral-300">
          Browse listed works and place bids.
        </p>
      </header>

      {auctionWindow ? (
        <section className="mb-5 rounded-xl border border-neutral-200 bg-white p-4 shadow-sm dark:border-neutral-800 dark:bg-neutral-900 sm:mb-6">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 sm:text-base">
                {auctionWindow.title}
              </p>
              <p className="mt-1 text-xs leading-relaxed text-neutral-600 dark:text-neutral-300 sm:text-sm">
                Bidding phase: live
              </p>
            </div>
          </div>
        </section>
      ) : null}

      <section className="mb-5 rounded-xl border border-neutral-200 bg-white p-4 shadow-sm dark:border-neutral-800 dark:bg-neutral-900 sm:mb-6 sm:p-5">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3">
          <label className="text-sm text-neutral-700 dark:text-neutral-300 sm:col-span-2 md:col-span-2">
            Search
            <input
              value={filters.search}
              onChange={(event) =>
                setFilters((prev) => ({ ...prev, search: event.target.value }))
              }
              placeholder="Search by artwork title or artist"
              className="input-field mt-2"
            />
          </label>

          <label className="text-sm text-neutral-700 dark:text-neutral-300 sm:col-span-1">
            Artist
            <select
              value={filters.artist}
              onChange={(event) =>
                setFilters((prev) => ({ ...prev, artist: event.target.value }))
              }
              className="input-field mt-2"
            >
              <option value="">All artists</option>
              {artists.map((artist) => (
                <option key={artist} value={artist}>
                  {artist}
                </option>
              ))}
            </select>
          </label>
        </div>
      </section>

      {loading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <LoadingSkeleton className="h-80" />
          <LoadingSkeleton className="h-80" />
          <LoadingSkeleton className="h-80" />
        </div>
      ) : filteredArtworks.length ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredArtworks.map((artwork) => (
            <ArtworkCard key={artwork.id} artwork={artwork} />
          ))}
        </div>
      ) : (
        <div className="rounded-xl border border-neutral-200 bg-white p-6 text-center dark:border-neutral-800 dark:bg-neutral-900 sm:p-8">
          <h2 className="text-base font-semibold text-neutral-900 dark:text-neutral-100 sm:text-lg">
            No artworks match your filters.
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-neutral-600 dark:text-neutral-300">
            Adjust the artist or search filters and try again.
          </p>
        </div>
      )}
    </div>
  );
}
