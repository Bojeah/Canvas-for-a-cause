import { Link } from "react-router-dom";

import { useAuctionWindow } from "../hooks/useAuctionWindow";
import { useCountdown } from "../hooks/useCountdown";
import { formatAuctionDate } from "../utils/date";

const FEATURED_TEASER = [
  {
    title: "Atlantic Horizon",
    artist: "A. Okoye",
    medium: "Oil on Canvas",
  },
  {
    title: "Still Air, Lagos",
    artist: "M. Danjuma",
    medium: "Mixed Media",
  },
  {
    title: "Monochrome Prayer",
    artist: "R. Adeyemi",
    medium: "Charcoal and Gesso",
  },
];

const DEFAULT_COUNTDOWN_TARGET = new Date(
  Date.now() + 14 * 24 * 60 * 60 * 1000,
).toISOString();

export default function Landing() {
  const { auctionWindow } = useAuctionWindow();
  const countdownTarget = auctionWindow?.countdown_target ?? DEFAULT_COUNTDOWN_TARGET;
  const countdown = useCountdown(countdownTarget);
  const phase = auctionWindow?.phase ?? "upcoming";

  const phaseLabel =
    phase === "live"
      ? "Bidding open"
      : phase === "upcoming"
        ? "Opening soon"
        : phase === "ended"
          ? "Bidding window ended"
          : "Closed";

  const countdownHeading =
    phase === "upcoming"
      ? "Countdown to bidding open"
      : phase === "live"
        ? "Countdown to close"
        : "Global window closed";

  return (
    <div className="relative isolate overflow-hidden">
      <div className="absolute inset-0 -z-20 bg-[radial-gradient(circle_at_20%_0%,rgba(13,71,161,0.18),transparent_50%),radial-gradient(circle_at_85%_10%,rgba(17,17,17,0.15),transparent_42%),linear-gradient(160deg,#ffffff_0%,#f7f7f7_60%,#f0f4f9_100%)] dark:bg-[radial-gradient(circle_at_20%_0%,rgba(13,71,161,0.26),transparent_50%),radial-gradient(circle_at_85%_10%,rgba(250,250,250,0.05),transparent_42%),linear-gradient(160deg,#121212_0%,#161616_60%,#1b2230_100%)]" />
      <div className="absolute inset-x-0 top-0 -z-10 h-24 bg-linear-to-b from-white/80 to-transparent dark:from-neutral-900/80" />

      <section className="mx-auto max-w-7xl px-4 pb-12 pt-16 sm:px-6 lg:px-8 lg:pt-24">
        <div className="grid gap-10 lg:grid-cols-[1.2fr_0.8fr] lg:items-end">
          <div>
            <p className="text-xs uppercase tracking-[0.28em] text-neutral-500 dark:text-neutral-400">
              Canvas for a Cause
            </p>
            <h1 className="mt-4 max-w-2xl font-display text-4xl leading-tight text-neutral-900 dark:text-neutral-100 sm:text-5xl lg:text-6xl">
              Bid in support of the cause
            </h1>
            <p className="mt-6 max-w-xl text-base leading-relaxed text-neutral-700 dark:text-neutral-300 sm:text-lg">
              Canvas for a Cause is an exclusive black-tie charity art auction
              hosted by the Pan-Atlantic University Student Council, bringing
              together collectors, artists, and distinguished guests for an
              intimate evening of art and impact. The event showcases a rare
              collaborative student artwork alongside curated pieces from
              emerging and established artists, with proceeds dedicated to
              supporting multiple charity initiatives.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/login" className="btn btn-primary btn-lg">
                Login
              </Link>
              <Link to="/register" className="btn btn-secondary btn-lg">
                Register
              </Link>
            </div>
          </div>

          <div className="rounded-xl border border-neutral-200 bg-white/80 p-6 shadow-sm backdrop-blur dark:border-neutral-800 dark:bg-neutral-900/70">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-display text-xl text-neutral-900 dark:text-neutral-100">
                {countdownHeading}
              </h2>
              <span className="text-xs uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
                {phaseLabel}
              </span>
            </div>
            <div className="grid grid-cols-4 gap-2 sm:gap-3">
              {[
                { label: "Days", value: countdown.days },
                { label: "Hours", value: countdown.hours },
                { label: "Minutes", value: countdown.minutes },
                { label: "Seconds", value: countdown.seconds },
              ].map((item) => (
                <div
                  key={item.label}
                  className="rounded-md border border-neutral-200 bg-neutral-50 px-2 py-3 text-center dark:border-neutral-700 dark:bg-neutral-850"
                >
                  <p className="text-xl font-semibold text-neutral-900 dark:text-neutral-100">
                    {String(item.value).padStart(2, "0")}
                  </p>
                  <p className="mt-1 text-[10px] uppercase tracking-wide text-neutral-500 dark:text-neutral-400 sm:text-xs">
                    {item.label}
                  </p>
                </div>
              ))}
            </div>
            <p className="mt-4 text-sm text-neutral-600 dark:text-neutral-300">
              {countdown.ended
                ? phase === "live"
                  ? "Bidding is live. Submit bids before the window closes."
                  : "The global bidding window is closed."
                : phase === "upcoming"
                  ? "The portal will open automatically at the scheduled start time."
                  : "The portal closes automatically when the timer reaches zero."}
            </p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-14 sm:px-6 lg:px-8">
        <h2 className="font-display text-2xl text-neutral-900 dark:text-neutral-100">
          Featured Teaser
        </h2>
        <p className="mt-2 max-w-2xl text-sm text-neutral-600 dark:text-neutral-300">
          Preview highlights from the evening collection. Full bidding data
          remains available after sign-in.
        </p>

        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURED_TEASER.map((item) => (
            <article
              key={item.title}
              className="group rounded-lg border border-neutral-200 bg-white p-5 transition hover:-translate-y-0.5 hover:shadow-md dark:border-neutral-800 dark:bg-neutral-900"
            >
              <div className="mb-5 h-28 rounded-md border border-neutral-200 bg-[linear-gradient(135deg,#f8fafc,#e5e7eb)] dark:border-neutral-700 dark:bg-[linear-gradient(135deg,#1f2937,#111827)]" />
              <h3 className="font-display text-lg text-neutral-900 dark:text-neutral-100">
                {item.title}
              </h3>
              <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-300">
                {item.artist}
              </p>
              <p className="mt-3 text-xs uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
                {item.medium}
              </p>
            </article>
          ))}
        </div>
      </section>

      <footer className="border-t border-neutral-200 bg-white/80 px-4 py-5 text-center text-xs text-neutral-600 dark:border-neutral-800 dark:bg-neutral-900/80 dark:text-neutral-400">
        Canvas for a Cause
      </footer>
    </div>
  );
}
