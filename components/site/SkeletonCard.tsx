/**
 * SkeletonCard — placeholder shown while product data is loading.
 * Uses the .skeleton CSS class (globals.css shimmer animation).
 */
export function SkeletonCard() {
  return (
    <div className="border border-gray-100 rounded-2xl overflow-hidden bg-white">
      <div className="skeleton aspect-[4/5] w-full" />
      <div className="p-3 flex flex-col items-center gap-2">
        <div className="skeleton h-3 w-3/4" />
        <div className="skeleton h-3 w-1/2" />
        <div className="skeleton h-4 w-1/3" />
        <div className="flex w-full gap-1 mt-1">
          <div className="skeleton flex-1 h-7 rounded-sm" />
          <div className="skeleton flex-1 h-7 rounded-sm" />
        </div>
      </div>
    </div>
  );
}

export default SkeletonCard;
