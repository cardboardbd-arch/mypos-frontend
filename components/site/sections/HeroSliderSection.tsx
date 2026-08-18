"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { resolveMediaUrl } from "@/lib/media";
import type { RawHomepageSection } from "./types";

// Visual design ported verbatim from the original static Hero (components/site/Hero.tsx):
// same section height, overlay opacity, badge/heading/subheading/button classes and
// fade-up entrance timing. Only the slide-navigation mechanics (autoplay, crossfade,
// dot indicators) are new — the static Hero never had more than one slide to navigate.
const EASE = [0.22, 1, 0.36, 1] as [number, number, number, number];
const DURATION = 0.6;

function fadeUp(delay: number) {
  return {
    initial: { opacity: 0, y: 24 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: DURATION, ease: EASE, delay },
  };
}

interface Slide {
  image: string | null;
  heading: string | null;
  subheading: string | null;
  badge_text?: string | null;
  button_text: string | null;
  button_url: string | null;
}

interface Props {
  section: RawHomepageSection;
}

/**
 * A slide with no image AND no heading AND no subheading renders literally
 * nothing (no <img>, no text, just the plain gradient fallback) — keeping
 * it in the rotation just means autoplay periodically shows a blank
 * section, which is exactly the bug this filters out. A slide missing only
 * SOME of these (e.g. image but no heading) is still real content and
 * must not be dropped.
 */
function isBlankSlide(slide: Slide): boolean {
  return (
    !slide.image &&
    !(slide.heading && slide.heading.trim()) &&
    !(slide.subheading && slide.subheading.trim())
  );
}

export function HeroSliderSection({ section }: Props) {
  // section.config is typed Record<string, any> | any[] (an empty PHP
  // associative array serializes to JSON as [] rather than {}) — normalize
  // the array case to {} first so property access below type-checks.
  const config = Array.isArray(section.config) ? {} : (section.config ?? {});
  const rawSlides: Slide[] = Array.isArray(config.slides) ? config.slides : [];
  const slides = rawSlides.filter((slide) => !isBlankSlide(slide));
  const autoplay = config.autoplay !== false;
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
    // Full-bleed: breaks out of the page's max-w-[1400px]/px-* content column
    // regardless of that column's padding, via the standard viewport-width
    // technique (left-1/2 + -translate-x-1/2 centers a w-screen element on
    // the viewport). <main> keeps overflow-x-hidden, so this never causes a
    // page-level horizontal scrollbar.
    <section className="relative left-1/2 w-screen -translate-x-1/2 h-[380px] md:h-[540px] overflow-hidden">
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
            <img src={image} alt={slide.heading ?? ""} className="absolute inset-0 w-full h-full object-cover" />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-gray-800 to-gray-950" />
          )}
        </motion.div>
      </AnimatePresence>

      {/* Content stays readable on ultra-wide screens even though the section
          itself is full-bleed — background image spans the viewport,
          text/CTA are capped at the site's normal content width. */}
      <div className="relative h-full max-w-[1400px] mx-auto flex flex-col items-center justify-center px-6 lg:px-10 text-center">
        {slide.badge_text && (
          <motion.p
            key={`badge-${index}`}
            {...fadeUp(0)}
            className="text-xs font-bold uppercase tracking-[0.4em] text-white mb-4"
          >
            {slide.badge_text}
          </motion.p>
        )}

        {slide.heading && (
          <motion.h1
            key={`heading-${index}`}
            {...fadeUp(0.12)}
            className="text-6xl md:text-8xl font-black tracking-tighter leading-none text-white uppercase"
          >
            {slide.heading}
          </motion.h1>
        )}

        {slide.subheading && (
          <motion.p key={`sub-${index}`} {...fadeUp(0.22)} className="text-sm text-white/80 mt-4">
            {slide.subheading}
          </motion.p>
        )}

        {slide.button_text && slide.button_url && (
          <motion.div key={`cta-${index}`} {...fadeUp(0.32)} className="mt-8">
            <Link
              href={slide.button_url}
              className="inline-block bg-white text-black font-bold uppercase text-xs tracking-widest px-8 py-3 hover:bg-gray-100 transition-colors"
            >
              {slide.button_text}
            </Link>
          </motion.div>
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
