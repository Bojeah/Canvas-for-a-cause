import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";

import LoadingSkeleton from "../components/LoadingSkeleton";
import { adminApi, artworksApi, getApiErrorMessage } from "../services/api";
import type { AdminBid, Artwork, AuctionWindow } from "../types";
import { formatNaira } from "../utils/currency";
import { formatAuctionDate } from "../utils/date";

export default function AdminDashboard() {
  const [artworks, setArtworks] = useState<Artwork[]>([]);
  const [bids, setBids] = useState<AdminBid[]>([]);
  const [auctionWindow, setAuctionWindow] = useState<AuctionWindow | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [windowSaving, setWindowSaving] = useState(false);
  const [windowForm, setWindowForm] = useState({
    title: "",
    vip_exhibition_at: "",
    bidding_starts_at: "",
    bidding_ends_at: "",
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const [artworksData, bidsData, auctionWindowData] = await Promise.all([
        artworksApi.list(),
        adminApi.listBids(),
        adminApi.getAuctionWindow(),
      ]);
      setArtworks(artworksData);
      setBids(bidsData);
      setAuctionWindow(auctionWindowData);
      setWindowForm({
        title: auctionWindowData.title,
        vip_exhibition_at: auctionWindowData.vip_exhibition_at.slice(0, 16),
        bidding_starts_at: auctionWindowData.bidding_starts_at.slice(0, 16),
        bidding_ends_at: auctionWindowData.bidding_ends_at.slice(0, 16),
      });
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Failed to load admin dashboard."));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, []);

  const sortedArtworks = useMemo(
    () => [...artworks].sort((a, b) => a.id - b.id),
    [artworks],
  );

  const handleDelete = async (id: number) => {
    try {
      await adminApi.deleteArtwork(id);
      toast.success("Artwork deleted.");
      await loadData();
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Unable to delete artwork."));
    }
  };

  const handleCloseAuction = async (id: number) => {
    try {
      await adminApi.closeAuction(id);
      toast.success("Auction closed.");
      await loadData();
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Unable to close auction."));
    }
  };

  const handleSaveWindow = async () => {
    setWindowSaving(true);
    try {
      const updated = await adminApi.updateAuctionWindow({
        title: windowForm.title,
        vip_exhibition_at: new Date(windowForm.vip_exhibition_at).toISOString(),
        bidding_starts_at: new Date(windowForm.bidding_starts_at).toISOString(),
        bidding_ends_at: new Date(windowForm.bidding_ends_at).toISOString(),
      });
      setAuctionWindow(updated);
      toast.success("Global bidding window updated.");
      await loadData();
    } catch (error) {
      toast.error(
        getApiErrorMessage(error, "Unable to update global bidding window."),
      );
    } finally {
      setWindowSaving(false);
    }
  };

  const handleCloseWindow = async () => {
    try {
      await adminApi.closeAuctionWindow();
      toast.success("Global bidding window closed.");
      await loadData();
    } catch (error) {
      toast.error(
        getApiErrorMessage(error, "Unable to close global bidding window."),
      );
    }
  };

  return (
    <div className="mx-auto w-full max-w-7xl space-y-8 px-4 py-8 sm:px-6 lg:px-8">
      <header className="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
        <h1 className="font-display text-4xl text-neutral-900 dark:text-neutral-100">
          Admin Control Room
        </h1>
        <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-300">
          Manage artworks and the single global bidding window.
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <Link to="/admin/artworks/new" className="btn btn-primary btn-md">
            Create artwork
          </Link>
          <button
            type="button"
            onClick={() => void loadData()}
            className="btn btn-secondary btn-md"
          >
            Refresh
          </button>
        </div>
      </header>

      <section className="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
        <h2 className="font-display text-2xl text-neutral-900 dark:text-neutral-100">
          Global bidding window
        </h2>
        <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-300">
          Control the portal open and close time for every artwork from one
          place.
        </p>

        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
          <label className="text-sm text-neutral-700 dark:text-neutral-300 md:col-span-2">
            Event title
            <input
              value={windowForm.title}
              onChange={(event) =>
                setWindowForm((prev) => ({
                  ...prev,
                  title: event.target.value,
                }))
              }
              className="input-field mt-2"
            />
          </label>

          <label className="text-sm text-neutral-700 dark:text-neutral-300">
            VIP exhibition time
            <input
              type="datetime-local"
              value={windowForm.vip_exhibition_at}
              onChange={(event) =>
                setWindowForm((prev) => ({
                  ...prev,
                  vip_exhibition_at: event.target.value,
                }))
              }
              className="input-field mt-2"
            />
          </label>

          <label className="text-sm text-neutral-700 dark:text-neutral-300">
            Bidding start time
            <input
              type="datetime-local"
              value={windowForm.bidding_starts_at}
              onChange={(event) =>
                setWindowForm((prev) => ({
                  ...prev,
                  bidding_starts_at: event.target.value,
                }))
              }
              className="input-field mt-2"
            />
          </label>

          <label className="text-sm text-neutral-700 dark:text-neutral-300 md:col-span-2">
            Bidding end time
            <input
              type="datetime-local"
              value={windowForm.bidding_ends_at}
              onChange={(event) =>
                setWindowForm((prev) => ({
                  ...prev,
                  bidding_ends_at: event.target.value,
                }))
              }
              className="input-field mt-2"
            />
          </label>
        </div>

        <div className="mt-4 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => void handleSaveWindow()}
            disabled={windowSaving}
            className="btn btn-primary btn-md"
          >
            {windowSaving ? "Saving..." : "Save window"}
          </button>
          <button
            type="button"
            onClick={() => void handleCloseWindow()}
            className="btn btn-danger btn-md"
          >
            Close now
          </button>
        </div>

        {auctionWindow ? (
          <div className="mt-4 rounded-lg border border-neutral-200 bg-neutral-50 p-4 text-sm text-neutral-700 dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-300">
            <p className="font-semibold text-neutral-900 dark:text-neutral-100">
              Current phase: {auctionWindow.phase}
            </p>
            <p className="mt-1">
              VIP exhibition:{" "}
              {formatAuctionDate(auctionWindow.vip_exhibition_at)}
            </p>
            <p className="mt-1">
              Bidding opens:{" "}
              {formatAuctionDate(auctionWindow.bidding_starts_at)}
            </p>
            <p className="mt-1">
              Bidding closes: {formatAuctionDate(auctionWindow.bidding_ends_at)}
            </p>
          </div>
        ) : null}
      </section>

      <section className="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
        <h2 className="font-display text-2xl text-neutral-900 dark:text-neutral-100">
          Artworks
        </h2>

        {loading ? (
          <div className="mt-4 space-y-3">
            <LoadingSkeleton className="h-16" />
            <LoadingSkeleton className="h-16" />
          </div>
        ) : sortedArtworks.length ? (
          <div className="mt-4 space-y-3">
            {sortedArtworks.map((artwork) => (
              <article
                key={artwork.id}
                className="rounded-lg border border-neutral-200 p-4 dark:border-neutral-800"
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                      {artwork.title}
                    </h3>
                    <p className="text-sm text-neutral-600 dark:text-neutral-300">
                      {artwork.artist_name} •{" "}
                      {formatNaira(artwork.current_highest_bid)}
                    </p>
                    <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
                      Uses global bidding window
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Link
                      to={`/admin/artworks/${artwork.id}/edit`}
                      className="btn btn-secondary btn-md"
                    >
                      Edit
                    </Link>
                    <button
                      type="button"
                      onClick={() => void handleCloseAuction(artwork.id)}
                      className="btn btn-primary btn-md"
                    >
                      Close auction
                    </button>
                    <button
                      type="button"
                      onClick={() => void handleDelete(artwork.id)}
                      className="btn btn-danger btn-md"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <p className="mt-4 text-sm text-neutral-600 dark:text-neutral-300">
            No artworks available.
          </p>
        )}
      </section>

      <section className="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
        <h2 className="font-display text-2xl text-neutral-900 dark:text-neutral-100">
          All Bids
        </h2>

        {!bids.length ? (
          <p className="mt-4 text-sm text-neutral-600 dark:text-neutral-300">
            No bids yet.
          </p>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="min-w-full divide-y divide-neutral-200 text-sm dark:divide-neutral-800">
              <thead className="bg-neutral-50 text-left text-neutral-600 dark:bg-neutral-850 dark:text-neutral-300">
                <tr>
                  <th className="px-3 py-2 font-medium">Artwork</th>
                  <th className="px-3 py-2 font-medium">Bidder</th>
                  <th className="px-3 py-2 font-medium">Amount</th>
                  <th className="px-3 py-2 font-medium">Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                {bids.map((bid) => (
                  <tr key={bid.id}>
                    <td className="px-3 py-2">
                      {bid.artwork_title || `Artwork #${bid.artwork_id}`}
                    </td>
                    <td className="px-3 py-2">
                      {bid.user_full_name ||
                        bid.user_email ||
                        `User #${bid.user_id}`}
                    </td>
                    <td className="px-3 py-2 font-semibold">
                      {formatNaira(bid.amount)}
                    </td>
                    <td className="px-3 py-2">
                      {formatAuctionDate(bid.timestamp)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
