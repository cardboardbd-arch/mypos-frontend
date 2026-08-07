"use client";

import type { ColorOption } from "@/lib/types/product";

interface ColorSelectorProps {
  colors: ColorOption[];
  selectedIndex: number;
  onSelect: (index: number) => void;
  /** Slightly larger swatches for the PDP; smaller for a listing card. */
  size?: "sm" | "md";
}

/**
 * Purely a controlled swatch row — it has no opinion on what selecting a
 * color DOES. On a grouped listing card, `onSelect` just flips local
 * state (in-place). On the PDP, `onSelect` navigates to that color's own
 * page (cross-page — see ProductDetailClient). Same component, two
 * different wiring choices by the caller.
 */
export function ColorSelector({ colors, selectedIndex, onSelect, size = "sm" }: ColorSelectorProps) {
  if (colors.length < 2) return null;

  const dimension = size === "sm" ? "h-5 w-5" : "h-8 w-8";

  return (
    <div className="flex flex-wrap items-center gap-1.5" role="radiogroup" aria-label="Color">
      {colors.map((color, index) => {
        const isSelected = index === selectedIndex;
        return (
          <button
            key={color.id}
            type="button"
            role="radio"
            aria-checked={isSelected}
            aria-label={color.name}
            title={color.name}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onSelect(index);
            }}
            className={`${dimension} rounded-full border-2 shrink-0 transition ${
              isSelected ? "border-black scale-110" : "border-gray-200 hover:border-gray-400"
            }`}
            style={{ backgroundColor: color.color_code ?? "#e5e7eb" }}
          />
        );
      })}
    </div>
  );
}

export default ColorSelector;
