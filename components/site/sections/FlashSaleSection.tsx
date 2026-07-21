"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { RawHomepageSection } from "./types";

interface Props {
  section: RawHomepageSection;
}

function timeParts(msRemaining: number) {
  const totalSeconds = Math.max(0, Math.floor(msRemaining / 1000));
  return {
    days: Math.floor(totalSeconds / 86400),
    hours: Math.floor((totalSeconds % 86400) / 3600),
    minutes: Math.floor((totalSeconds % 3600) / 60),
    seconds: totalSeconds % 60,
  };
}

function Digit({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex flex-col items-center">
      <div className="bg-black text-white font-black text-xl md:text-2xl rounded-lg w-14 h-14 md:w-16 md:h-16 flex items-center justify-center tabular-nums">
        {String(value).padStart(2, "0")}
      </div>
      <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500 mt-1.5">
        {label}
      </span>
    </div>
  );
}

export function FlashSaleSection({ section }: Props) {
  const config = (section.config ?? {}) as {
    end_date?: string;
    countdown_enabled?: boolean;
  };

  const endDate = config.end_date ? new Date(`${config.end_date}T23:59:59`) : null;
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  if (!config.countdown_enabled || !endDate || !now) return null;

  const remaining = endDate.getTime() - now.getTime();
  if (remaining <= 0) return null;

  const t = timeParts(remaining);
  const link = section.view_all_link || "/shop";

  return (
    <section className="w-full">
      <div className="rounded-2xl bg-gradient-to-r from-red-600 to-orange-500 px-6 md:px-10 py-7 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="text-center md:text-left">
          <p className="text-2xl md:text-3xl font-black uppercase tracking-tight text-white">
            {section.title}
          </p>
          {section.subtitle && (
            <p className="text-sm text-white/85 mt-1">{section.subtitle}</p>
          )}
        </div>

        <div className="flex items-center gap-3">
          <Digit value={t.days} label="Days" />
          <Digit value={t.hours} label="Hrs" />
          <Digit value={t.minutes} label="Min" />
          <Digit value={t.seconds} label="Sec" />
        </div>

        <Link
          href={link}
          className="bg-black text-white px-7 py-3 text-sm font-black uppercase tracking-widest rounded-sm hover:bg-gray-900 transition shrink-0"
        >
          Shop Now
        </Link>
      </div>
    </section>
  );
}

export default FlashSaleSection;
