"use client";

import Link from "next/link";
import { motion } from "framer-motion";

const EASE = [0.22, 1, 0.36, 1] as [number, number, number, number];
const DURATION = 0.6;

function fadeUp(delay: number) {
  return {
    initial: { opacity: 0, y: 24 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: DURATION, ease: EASE, delay },
  };
}

const FALLBACK = {
  image: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1600&q=80",
  mobile_image: null as string | null,
  badge_text: "Season 2026",
  heading: "New Collection",
  subheading: "Discover the latest styles crafted for you",
  button_text: "Shop Now",
  button_link: "/shop",
};

type HeroData = typeof FALLBACK;

interface Props {
  data?: (Omit<HeroData, 'image'> & { image?: string | null }) | null;
}

export function Hero({ data: dataProp }: Props) {
  const data = { ...FALLBACK, ...dataProp };
  const loading = !dataProp;

  return (
    <section className="relative w-full h-[380px] md:h-[540px] overflow-hidden">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={data.image ?? FALLBACK.image}
        alt={data.heading}
        className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-500 ${loading ? "opacity-0" : "opacity-100"}`}
      />

      {loading && <div className="absolute inset-0 bg-gray-200 animate-pulse" />}

      <div className="absolute inset-0 bg-black/40" />

      <div className="relative h-full flex flex-col items-center justify-center px-4 text-center">
        <motion.p
          {...fadeUp(0)}
          className="text-xs font-bold uppercase tracking-[0.4em] text-white mb-4"
        >
          {data.badge_text}
        </motion.p>

        <motion.h1
          {...fadeUp(0.12)}
          className="text-6xl md:text-8xl font-black tracking-tighter leading-none text-white uppercase"
        >
          {data.heading}
        </motion.h1>

        <motion.p
          {...fadeUp(0.22)}
          className="text-sm text-white/80 mt-4"
        >
          {data.subheading}
        </motion.p>

        <motion.div {...fadeUp(0.32)} className="mt-8">
          <Link
            href={data.button_link}
            className="inline-block bg-white text-black font-bold uppercase text-xs tracking-widest px-8 py-3 hover:bg-gray-100 transition-colors"
          >
            {data.button_text}
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
