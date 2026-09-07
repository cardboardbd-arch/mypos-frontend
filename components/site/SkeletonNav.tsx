/**
 * SkeletonNav — renders a static placeholder header while API data loads.
 * The real Nav fetches logo/links from /v1/home; this shows instantly so
 * the header space is never empty.
 */
export function SkeletonNav() {
  return (
    <header className="sticky top-0 z-50 bg-white border-b border-gray-100">
      <div className="h-20 flex items-center justify-between max-w-[1440px] mx-auto px-4">
        <div className="skeleton h-10 w-32 rounded" />
        <div className="hidden lg:block skeleton h-9 w-80 rounded-lg" />
        <div className="flex items-center gap-4">
          <div className="skeleton h-8 w-8 rounded-full" />
          <div className="skeleton h-8 w-8 rounded-full" />
          <div className="skeleton h-8 w-8 rounded-full" />
        </div>
      </div>
      <div className="hidden lg:flex border-t border-gray-100 h-12 items-center justify-center gap-10 px-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="skeleton h-3 w-16 rounded" />
        ))}
      </div>
    </header>
  );
}

export default SkeletonNav;
