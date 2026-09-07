import { SkeletonCard } from "@/components/site/SkeletonCard";

/**
 * SkeletonSection — a shimmer product grid shown while homepage sections load.
 */
export function SkeletonSection({ cards = 5 }: { cards?: number }) {
  return (
    <section className="w-full">
      <div className="flex items-center justify-between mb-6 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
        <div className="flex flex-col gap-2">
          <div className="skeleton h-5 w-40 rounded" />
          <div className="skeleton h-3 w-24 rounded" />
        </div>
        <div className="skeleton h-4 w-16 rounded" />
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-[10px]">
        {Array.from({ length: cards }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    </section>
  );
}

export default SkeletonSection;
