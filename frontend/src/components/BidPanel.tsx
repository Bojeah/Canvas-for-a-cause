import { useMemo, useState, type FormEvent } from "react";

import { useNetworkStatus } from "../hooks/useNetworkStatus";
import { formatNaira } from "../utils/currency";

interface BidPanelProps {
  currentHighestBid: number;
  minBidIncrement: number;
  canBid: boolean;
  auctionPhase: "upcoming" | "live" | "ended" | "closed";
  submitting: boolean;
  onSubmit: (amount: number) => Promise<void>;
}

const QUICK_INCREMENTS = [10000, 20000, 50000];

export default function BidPanel({
  currentHighestBid,
  minBidIncrement,
  canBid,
  auctionPhase,
  submitting,
  onSubmit,
}: BidPanelProps) {
  const { isOnline } = useNetworkStatus();
  const [amount, setAmount] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [pendingAmount, setPendingAmount] = useState<number | null>(null);

  const minValidBid = useMemo(
    () => currentHighestBid + minBidIncrement,
    [currentHighestBid, minBidIncrement],
  );

  const validateAmount = (value: number): string | null => {
    if (!isOnline) {
      return "You are offline. Reconnect before placing a bid.";
    }

    if (!Number.isFinite(value) || value <= 0) {
      return "Enter a valid bid amount.";
    }

    if (value < minValidBid) {
      return `Bid must be at least ${formatNaira(minValidBid)}.`;
    }

    return null;
  };

  const requestSubmit = (value: number) => {
    const validationError = validateAmount(value);
    if (validationError) {
      setError(validationError);
      return;
    }
    setError("");
    setPendingAmount(value);
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    requestSubmit(Number(amount));
  };

  const confirmSubmit = async () => {
    if (pendingAmount === null) {
      return;
    }

    await onSubmit(pendingAmount);
    setAmount("");
    setPendingAmount(null);
  };

  if (!canBid) {
    const message =
      auctionPhase === "upcoming"
        ? "Bidding has not opened yet. The global bidding window will unlock when the portal goes live."
        : "Bidding is closed for the global auction window.";

    return (
      <section className="rounded-xl border border-neutral-200 bg-neutral-50 p-5 text-sm text-neutral-700 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-300">
        {message}
      </section>
    );
  }

  return (
    <>
      <form
        onSubmit={handleSubmit}
        className="space-y-4 rounded-xl border border-neutral-200 bg-white p-5 shadow-sm dark:border-neutral-800 dark:bg-neutral-900"
      >
        <div>
          <h3 className="font-display text-xl text-neutral-900 dark:text-neutral-100">
            Place a Bid
          </h3>
          <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
            Minimum allowed: {formatNaira(minValidBid)}
          </p>
        </div>

        <label className="block text-sm text-neutral-700 dark:text-neutral-300">
          Amount (NGN)
          <input
            type="number"
            min={minValidBid}
            step="0.01"
            value={amount}
            onChange={(event) => setAmount(event.target.value)}
            className="input-field mt-2"
            placeholder="Enter your bid"
            aria-invalid={error ? "true" : "false"}
          />
        </label>

        <div className="flex flex-wrap gap-2">
          {QUICK_INCREMENTS.map((increment) => {
            const nextAmount = currentHighestBid + increment;
            return (
              <button
                key={increment}
                type="button"
                onClick={() => requestSubmit(nextAmount)}
                className="btn btn-secondary btn-md text-xs"
              >
                +{formatNaira(increment)}
              </button>
            );
          })}
        </div>

        {error ? <p className="text-sm text-red-600">{error}</p> : null}

        <button
          type="submit"
          disabled={submitting || !isOnline}
          className="btn btn-primary btn-md w-full"
        >
          {submitting ? "Submitting..." : "Review bid"}
        </button>
      </form>

      {pendingAmount !== null ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="confirm-bid-title"
        >
          <div className="w-full max-w-md rounded-xl border border-neutral-200 bg-white p-6 shadow-lg dark:border-neutral-800 dark:bg-neutral-900">
            <h4
              id="confirm-bid-title"
              className="font-display text-xl text-neutral-900 dark:text-neutral-100"
            >
              Confirm Bid
            </h4>
            <p className="mt-3 text-sm text-neutral-600 dark:text-neutral-300">
              Submit a bid of <strong>{formatNaira(pendingAmount)}</strong> for
              this artwork?
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setPendingAmount(null)}
                className="btn btn-secondary btn-md"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void confirmSubmit()}
                disabled={submitting}
                className="btn btn-primary btn-md"
              >
                {submitting ? "Submitting..." : "Confirm"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
