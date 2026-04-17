import { useEffect, useState, type FormEvent } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";

import AdminArtworkImageUploader from "../components/AdminArtworkImageUploader";
import { adminApi, artworksApi, getApiErrorMessage } from "../services/api";
import type { ArtworkUpdateRequest } from "../types";

export default function AdminArtworkEdit() {
  const { id } = useParams();
  const artworkId = Number(id);
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState<ArtworkUpdateRequest>({
    title: "",
    artist_name: "",
    description: "",
    images: [],
    currency: "NGN",
    starting_price: 0,
  });

  useEffect(() => {
    const loadArtwork = async () => {
      setLoading(true);
      try {
        const artwork = await artworksApi.getById(artworkId);
        setForm({
          title: artwork.title,
          artist_name: artwork.artist_name,
          description: artwork.description,
          images: artwork.images,
          currency: artwork.currency,
          starting_price: artwork.starting_price,
        });
      } catch (error) {
        toast.error(getApiErrorMessage(error, "Unable to load artwork."));
      } finally {
        setLoading(false);
      }
    };

    if (Number.isFinite(artworkId)) {
      void loadArtwork();
    } else {
      setLoading(false);
    }
  }, [artworkId]);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);

    try {
      await adminApi.updateArtwork(artworkId, {
        ...form,
      });
      toast.success("Artwork updated.");
      navigate("/admin", { replace: true });
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Unable to update artwork."));
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl px-3 py-6 text-sm sm:px-4 sm:py-8 sm:text-base">
        Loading artwork...
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-4xl px-3 py-6 sm:px-6 sm:py-8 lg:px-8">
      <div className="mb-5 flex flex-col gap-3 sm:mb-6 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="font-display text-2xl text-neutral-900 dark:text-neutral-100 sm:text-3xl">
          Edit Artwork
        </h1>
        <Link to="/admin" className="btn btn-secondary btn-md">
          Back to dashboard
        </Link>
      </div>

      <form
        onSubmit={onSubmit}
        className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm dark:border-neutral-800 dark:bg-neutral-900 sm:p-6"
      >
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <label className="text-sm text-neutral-700 dark:text-neutral-300">
            Title
            <input
              value={form.title || ""}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, title: e.target.value }))
              }
              className="input-field mt-2"
            />
          </label>

          <label className="text-sm text-neutral-700 dark:text-neutral-300">
            Artist
            <input
              value={form.artist_name || ""}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, artist_name: e.target.value }))
              }
              className="input-field mt-2"
            />
          </label>

          <label className="text-sm text-neutral-700 dark:text-neutral-300 md:col-span-2">
            Description
            <textarea
              value={form.description || ""}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, description: e.target.value }))
              }
              rows={4}
              className="input-field mt-2"
            />
          </label>

          <div className="md:col-span-2">
            <AdminArtworkImageUploader
              value={form.images ?? []}
              onChange={(images) => setForm((prev) => ({ ...prev, images }))}
            />
          </div>

          <label className="text-sm text-neutral-700 dark:text-neutral-300">
            Currency
            <select
              value={form.currency ?? "NGN"}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  currency: e.target.value as "NGN" | "USD",
                }))
              }
              className="input-field mt-2"
            >
              <option value="NGN">NGN - Naira</option>
              <option value="USD">USD - Dollar</option>
            </select>
          </label>

          <label className="text-sm text-neutral-700 dark:text-neutral-300">
            Starting price ({form.currency ?? "NGN"})
            <input
              type="number"
              value={form.starting_price || 0}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  starting_price: Number(e.target.value),
                }))
              }
              min={0}
              step="1"
              className="input-field mt-2"
            />
          </label>
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="btn btn-primary btn-md mt-6"
        >
          {submitting ? "Saving..." : "Save changes"}
        </button>
      </form>
    </div>
  );
}
