"use client";

import { useState } from "react";
import type { RawHomepageSection } from "./types";

interface Props {
  section: RawHomepageSection;
}

export function NewsletterSection({ section }: Props) {
  const content = (section.content ?? {}) as {
    heading?: string;
    description?: string;
    input_placeholder?: string;
    button_text?: string;
    success_message?: string;
  };

  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  if (!content.heading) return null;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setSubmitted(true);
  }

  return (
    <section className="w-full">
      <div className="rounded-2xl bg-gray-900 px-8 py-10 md:py-14 text-center flex flex-col items-center gap-3">
        <h2 className="text-2xl md:text-3xl font-black uppercase tracking-tight text-white">
          {content.heading}
        </h2>
        {content.description && (
          <p className="text-sm text-white/70 max-w-md">{content.description}</p>
        )}

        {submitted ? (
          <p className="mt-4 text-sm font-bold text-white">
            {content.success_message || "Thank you for subscribing!"}
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="mt-4 flex w-full max-w-md gap-2">
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={content.input_placeholder || "Enter your email address"}
              className="flex-1 px-4 py-3 rounded-sm bg-white/10 border border-white/20 text-white placeholder:text-white/40 text-sm focus:outline-none focus:border-white/60"
            />
            <button
              type="submit"
              className="bg-white text-black font-bold uppercase text-xs tracking-widest px-6 py-3 rounded-sm hover:bg-gray-100 transition-colors shrink-0"
            >
              {content.button_text || "Subscribe"}
            </button>
          </form>
        )}
      </div>
    </section>
  );
}

export default NewsletterSection;
