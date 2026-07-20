"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { ProductCardSmall } from "./ProductCardSmall";

interface Product {
  id: number; name: string; slug: string; thumbnail?: string | null;
  product_type: string;
  variants?: { price: number; compare_price?: number }[];
}

interface Section {
  title: string;
  category_slug: string;
  image: string;
  view_all_link: string;
}

const FALLBACK_SECTIONS: Section[] = [
  {
    title: "Designer Polo",
    category_slug: "mens-fashion",
    image: "https://images.unsplash.com/photo-1618932260643-eee4a2f652a6?w=600&q=80",
    view_all_link: "/shop?category=mens-fashion",
  },
  {
    title: "Kurti, Tunic & Tops",
    category_slug: "womens-fashion",
    image: "https://images.unsplash.com/photo-1594938298603-c8148c4f8c4f?w=600&q=80",
    view_all_link: "/shop?category=womens-fashion",
  },
];

interface Props {
  sections?: Section[];
  products?: Product[];
}

export function DesignerGrid({ sections: sectionsProp, products: productsProp }: Props) {
  const [products, setProducts] = useState<Product[]>([]);
  const [sections, setSections] = useState<Section[]>(FALLBACK_SECTIONS);

  useEffect(() => {
    if (productsProp && productsProp.length > 0) {
      setProducts(productsProp);
      return;
    }
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/v1/products?per_page=20`, {
      headers: { Accept: "application/json" },
    })
      .then((r) => r.json())
      .then((d) => setProducts((d.data as Product[]) ?? []))
      .catch(() => {});
  }, [productsProp]);

  useEffect(() => {
    if (sectionsProp && sectionsProp.length > 0) {
      setSections(
        sectionsProp.map((s) => ({
          title: s.title,
          category_slug: s.category_slug,
          image: s.image ?? "",
          view_all_link: s.view_all_link ?? `/shop?category=${s.category_slug}`,
        }))
      );
      return;
    }
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/v1/cms/designer-sections`, {
      headers: { Accept: "application/json" },
    })
      .then((r) => r.json())
      .then((res) => {
        if (res.data?.length) {
          setSections(
            res.data.map((s: any) => ({
              title: s.title,
              category_slug: s.category_slug,
              image: s.image ?? "",
              view_all_link: s.view_all_link ?? `/shop?category=${s.category_slug}`,
            }))
          );
        }
      })
      .catch(() => {});
  }, [sectionsProp]);

  return (
    <section className="w-full space-y-6 py-4">
      {sections.map((section, si) => {
        const sectionProducts = products.slice(si * 8, si * 8 + 8);

        return (
          <div key={si} className="w-full">
            <div className="flex items-center justify-between mb-3 px-1">
              <h2 className="text-lg font-black uppercase tracking-tight text-gray-900">
                {section.title}
              </h2>
              <Link
                href={section.view_all_link}
                className="text-sm font-bold text-gray-500 hover:text-black transition"
              >
                View All →
              </Link>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-6 gap-[6px]">
              <Link
                href={section.view_all_link}
                className="hidden md:block group relative overflow-hidden rounded-xl bg-gray-200 md:col-span-2 md:row-span-2"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={section.image}
                  alt={section.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
                <div className="absolute bottom-5 left-4 right-4">
                  <p className="text-white font-black text-base uppercase tracking-wide leading-tight">
                    {section.title}
                  </p>
                  <span className="inline-block mt-2 text-[9px] font-black uppercase tracking-widest bg-white text-black px-3 py-1.5 rounded-sm">
                    Shop Now →
                  </span>
                </div>
              </Link>

              {sectionProducts.map((p, idx) => {
                const isLast = idx === 7;
                return (
                  <div key={p.id} className="relative">
                    <ProductCardSmall
                      id={p.id}
                      name={p.name}
                      slug={p.slug}
                      thumbnail={p.thumbnail}
                      price={p.variants?.[0]?.price ?? 0}
                      compare_price={p.variants?.[0]?.compare_price}
                    />
                    {isLast && (
                      <Link
                        href={section.view_all_link}
                        className="absolute inset-0 bg-black/65 rounded-xl flex flex-col items-center justify-center gap-1 hover:bg-black/75 transition"
                      >
                        <span className="text-white font-black text-base uppercase tracking-widest text-center leading-tight">
                          VIEW<br />MORE
                        </span>
                      </Link>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </section>
  );
}

export default DesignerGrid;
