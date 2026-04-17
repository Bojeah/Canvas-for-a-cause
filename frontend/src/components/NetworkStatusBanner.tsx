import { useNetworkStatus } from "../hooks/useNetworkStatus";

export default function NetworkStatusBanner() {
  const { isOnline } = useNetworkStatus();

  if (isOnline) {
    return null;
  }

  return (
    <div
      className="sticky top-0 z-50 border-b border-neutral-300 bg-neutral-100 px-4 py-2 text-center text-sm text-neutral-800 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100"
      role="status"
      aria-live="polite"
    >
      You are offline. Some actions are disabled until connection returns.
    </div>
  );
}
