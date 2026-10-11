import type { Metadata } from "next";
import { getCategory } from "@/lib/api";
import { buildSeoMetadata } from "@/lib/seo-metadata";
import type { SeoBlock } from "@/lib/types/product";

interface CategorySeoDetail {
  name: string;
  description: string | null;
  image: string | null;
  seo: SeoBlock | null;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  try {
    const res = await getCategory(slug);
    const category = res?.data as CategorySeoDetail | null;
    if (!category) return {};
    return buildSeoMetadata({
      seo: category.seo,
      fallbackTitle: category.name,
      fallbackDescription: category.description,
      fallbackImage: category.image,
    });
  } catch {
    return {};
  }
}

export default function CategoryLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
