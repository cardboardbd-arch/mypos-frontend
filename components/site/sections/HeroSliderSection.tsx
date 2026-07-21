"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { resolveMediaUrl } from "@/lib/media";
import type { RawHomepageSection } from "./types";

interface Slide {
  image: string | null;
  heading: string | null;
  subheading: string | null;
  button_text: string | null;
  button_url: string | null;
}

interface Props {
  section: RawHomepageSection;
}

export function HeroSliderSection({ section }: Props) {
  const slides: Slide[] = Array.isArray(section.config?.slides) ? section.config.slides : [];
  const autoplay = section.config?.autoplay !== false;
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (!autoplay || slides.length < 2) return;
    const timer = setInterval(() => setIndex((i) => (i + 1) % slides.length), 5000);
    return () => clearInterval(timer);
  }, [autoplay, slides.length]);

  if (slides.length === 0) return null;

  const slide = slides[index];
  const image = resolveMediaUrl(slide.image);

  return (
    <section className="relative w-full h-[320px] md:h-[440px] overflow-hidden rounded-2xl">
      <AnimatePresence mode="wait">
        <motion.div
          key={index}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.6 }}
          className="absolute inset-0"
        >
          {image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={image} alt={slide.heading ?? ""} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-gray-800 to-gray-950" />
          )}
          <div className="absolute inset-0 bg-black/35" />
        </motion.div>
      </AnimatePresence>

      <div className="relative h-full flex flex-col items-center justify-center px-4 text-center">
        {slide.heading && (
          <h2 className="text-4xl md:text-6xl font-black tracking-tighter leading-none text-white uppercase text-balance">
            {slide.heading}
          </h2>
        )}
        {slide.subheading && (
          <p className="text-sm md:text-base text-white/85 mt-3">{slide.subheading}</p>
        )}
        {slide.button_text && slide.button_url && (
          <Link
            href={slide.button_url}
            className="inline-block mt-6 bg-white text-black font-bold uppercase text-xs tracking-widest px-8 py-3 hover:bg-gray-100 transition-colors"
          >
            {slide.button_text}
          </Link>
        )}
      </div>

      {slides.length > 1 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => setIndex(i)}
              aria-label={`Go to slide ${i + 1}`}
              className={`h-1.5 rounded-full transition-all ${
                i === index ? "w-6 bg-white" : "w-1.5 bg-white/50"
              }`}
            />
          ))}
        </div>
      )}
    </section>
  );
}

export default HeroSliderSection;
