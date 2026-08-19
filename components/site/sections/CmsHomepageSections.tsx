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
import { DesignerGridSection } from "./DesignerGridSection";
import { CategoryBannerStripSection } from "./CategoryBannerStripSection";
import { TrustBarSection } from "./TrustBarSection";
import { FindUsSection } from "./FindUsSection";

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
  designer_grid: DesignerGridSection,
  category_banner: CategoryBannerStripSection,
  trust_bar: TrustBarSection,
  find_us: FindUsSection,
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
    (s) => s.type !== "hero_slider" && COMPONENTS[s.type]
  );

  if (renderable.length === 0) return null;

  return (
    <div className="w-full flex flex-col gap-8">
      {renderable.map((section) => {
        const Component = COMPONENTS[section.type];
        return <Component key={section.id} section={section} />;
      })}
    </div>
  );
}

export default CmsHomepageSections;
