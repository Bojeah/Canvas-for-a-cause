interface LoadingSkeletonProps {
  className?: string;
}

export default function LoadingSkeleton({
  className = "",
}: LoadingSkeletonProps) {
  return (
    <div
      className={`relative overflow-hidden rounded-md bg-neutral-200 dark:bg-neutral-800 ${className}`}
    >
      <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-neutral-100/50 to-transparent dark:via-neutral-700/50" />
    </div>
  );
}
