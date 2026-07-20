"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

const FALLBACK = {
  is_active: true,
  heading: "BIG DEALS চলছে 🔥",
  subheading: "PRICES GONE EVEN HIGH →",
  button_text: "Shop Deals →",
  button_link: "/shop?sale=true",
  bg_color: "#f5a623",
};

type PromoData = typeof FALLBACK;

interface Props {
  data?: PromoData | null;
}

export function BigDealsBanner({ data: dataProp }: Props) {
  const [data, setData] = useState<PromoData | null>(null);

  useEffect(() => {
    if (dataProp) {
      setData(dataProp);
      return;
    }
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/v1/cms/promo-banner`, {
      headers: { Accept: "application/json" },
    })
      .then((r) => r.json())
      .then((res) => setData({ ...FALLBACK, ...res.data }))
      .catch(() => setData(FALLBACK));
  }, [dataProp]);

  if (!data || data.is_active === false) return null;

  return (
    <section className="w-full py-4">
      <Link href={data.button_link}>
        <div
          className="hover:opacity-95 transition rounded-2xl px-8 py-6 flex flex-col md:flex-row items-center justify-between gap-4 cursor-pointer"
          style={{ backgroundColor: data.bg_color }}
        >
          <div>
            <p className="text-2xl md:text-3xl font-black uppercase tracking-tight text-black">
              {data.heading}
            </p>
            <p className="text-sm font-bold text-black/70 mt-1">{data.subheading}</p>
          </div>
          <div className="bg-black text-white px-8 py-3 text-sm font-black uppercase tracking-widest rounded-sm hover:bg-gray-800 transition">
            {data.button_text}
          </div>
        </div>
      </Link>
    </section>
  );
}

export default BigDealsBanner;
