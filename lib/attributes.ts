/**
 * Safe normalizer and formatter for cart/product attributes.
 * Handles:
 * - Array of { attribute_name, value } or { name, value }
 * - Object { Color: "Red", Size: "M" }
 * - Object with numeric keys { "0": { attribute_name: "Color", value: "Red" } }
 * - Array of strings ["Red", "M"]
 * - Stringified JSON
 */

export function normalizeItemAttributes(raw: unknown): Record<string, string> {
  if (!raw) return {};
  let data = raw;
  if (typeof data === "string") {
    try {
      data = JSON.parse(data);
    } catch {
      return { Option: data as string };
    }
  }

  const result: Record<string, string> = {};

  if (Array.isArray(data)) {
    data.forEach((item, index) => {
      if (typeof item === "object" && item !== null) {
        const itemObj = item as Record<string, unknown>;
        const key =
          (itemObj.attribute_name as string) ||
          (itemObj.name as string) ||
          (itemObj.key as string) ||
          (itemObj.label as string) ||
          `Option ${index + 1}`;
        const val = itemObj.value ?? itemObj.val ?? itemObj.title ?? "";
        if (val !== "" && val !== "Default") {
          result[key] = typeof val === "object" ? JSON.stringify(val) : String(val);
        }
      } else if (item != null && item !== "" && item !== "Default") {
        result[`Option ${index + 1}`] = String(item);
      }
    });
  } else if (typeof data === "object" && data !== null) {
    for (const [k, v] of Object.entries(data)) {
      if (typeof v === "object" && v !== null) {
        const itemObj = v as Record<string, unknown>;
        const key =
          (itemObj.attribute_name as string) ||
          (itemObj.name as string) ||
          (itemObj.key as string) ||
          (itemObj.label as string) ||
          (isNaN(Number(k)) ? k : `Option ${Number(k) + 1}`);
        const val = itemObj.value ?? itemObj.val ?? itemObj.title ?? "";
        if (val !== "" && val !== "Default") {
          result[key] = typeof val === "object" ? JSON.stringify(val) : String(val);
        }
      } else if (v != null && v !== "" && v !== "Default") {
        result[k] = String(v);
      }
    }
  }

  return result;
}

export function formatItemAttributes(raw: unknown): string {
  if (!raw) return "";
  const normalized = normalizeItemAttributes(raw);
  return Object.entries(normalized)
    .filter(([, v]) => v && v !== "Default")
    .map(([k, v]) => (k.startsWith("Option ") ? v : `${k}: ${v}`))
    .join(" • ");
}
