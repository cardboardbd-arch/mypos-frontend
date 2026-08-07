"use client";

interface SizeSelectorProps {
  /** e.g. "Size", or another non-color attribute name (Material, ...). */
  attributeName: string;
  values: string[];
  selectedValue: string | undefined;
  isValueAvailable: (value: string) => boolean;
  onSelect: (value: string) => void;
}

/**
 * Local-state-only selector (WP6 requirement #5): changing a value here
 * never navigates — it's the same product page, just resolving a
 * different variant of the CURRENT color. Extracted from the PDP's
 * pre-WP6 attribute-button row, generalized to any non-color attribute
 * (Color itself is handled entirely by ColorSelector + cross-page nav —
 * see ProductDetailClient's attributeGroups filter).
 */
export function SizeSelector({
  attributeName,
  values,
  selectedValue,
  isValueAvailable,
  onSelect,
}: SizeSelectorProps) {
  if (values.length === 0) return null;

  return (
    <div>
      <p className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">
        {attributeName}: <span className="text-black">{selectedValue}</span>
      </p>
      <div className="flex flex-wrap gap-2">
        {values.map((value) => {
          const available = isValueAvailable(value);
          const isSelected = selectedValue === value;
          return (
            <button
              key={value}
              type="button"
              onClick={() => onSelect(value)}
              disabled={!available}
              className={`min-w-12 h-12 px-3 text-xs font-bold border rounded-lg transition
                ${isSelected ? "bg-black text-white border-black" : "border-gray-200 hover:border-black"}
                ${!available ? "opacity-30 cursor-not-allowed line-through" : ""}`}
            >
              {value}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default SizeSelector;
