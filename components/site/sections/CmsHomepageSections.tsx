"use client";

import type { ComponentType } from "react";
import type { RawHomepageSection } from "./types";
import { AnnouncementBarSection } from "./AnnouncementBarSection";
import { ProductCarouselSection } from "./ProductCarouselSection";
import { CategoryGridSection } from "./CategoryGridSection";
import { CategoryShowcaseSection } from "./CategoryShowcaseSection";
import { PromotionBannerSection } from "./PromotionBannerSection";
import { FlashSaleSection } from "./FlashSaleSection";
import { CollectionGridSection } from "./CollectionGridSection";
import { BrandGridSection } from "./BrandGridSection";
import { AboutSection } from "./AboutSection";
import { BlogTeaserSection } from "./BlogTeaserSection";
import { NewsletterSection } from "./NewsletterSection";
import { SeoContentSection } from "./SeoContentSection";

// "designer_grid" is rendered separately by <DesignerGrid> (its own batched
// banner-tile + shared-product-pool layout), and "hero_slider" is rendered
// explicitly at the top of the page (replacing the old static Hero banner —
// a hero belongs above the fold regardless of its sort_order among the other
// sections). Every other CMS section type that this theme knows how to
// render is registered here. Anything not in this map (a type added in the
// CMS with no matching component yet) is skipped silently rather than
// showing an empty row.
const COMPONENTS: Record<string, ComponentType<{ section: RawHomepageSection }>> = {
  announcement_bar: AnnouncementBarSection,
  featured_products: ProductCarouselSection,
  new_arrival: ProductCarouselSection,
  best_seller: ProductCarouselSection,
  trending_products: ProductCarouselSection,
  signature_products: ProductCarouselSection,
  showcase_products: ProductCarouselSection,
  categories: CategoryGridSection,
  featured_categories: CategoryGridSection,
  category_showcase: CategoryShowcaseSection,
  promotion_banner: PromotionBannerSection,
  flash_sale: FlashSaleSection,
  featured_collections: CollectionGridSection,
  featured_brands: BrandGridSection,
  about: AboutSection,
  blog: BlogTeaserSection,
  newsletter: NewsletterSection,
  seo_content: SeoContentSection,
};

interface Props {
  sections?: RawHomepageSection[];
}

export function CmsHomepageSections({ sections = [] }: Props) {
  const renderable = sections.filter(
    (s) => s.type !== "designer_grid" && s.type !== "hero_slider" && COMPONENTS[s.type]
  );

  if (renderable.length === 0) return null;

  return (
    <div className="w-full flex flex-col gap-10">
      {renderable.map((section) => {
        const Component = COMPONENTS[section.type];
        return <Component key={section.id} section={section} />;
      })}
    </div>
  );
}

export default CmsHomepageSections;
