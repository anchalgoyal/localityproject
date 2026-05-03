export function formatPrice(price: number | null | undefined): string {
  if (!price) return "—";
  if (price >= 10000000) return `₹${(price / 10000000).toFixed(1)}Cr`;
  if (price >= 100000) return `₹${(price / 100000).toFixed(1)}L`;
  return `₹${price.toLocaleString("en-IN")}`;
}

export function formatNumber(n: number | null | undefined): string {
  if (n == null) return "—";
  return n.toLocaleString("en-IN");
}

export function formatNpGap(v: number | null | undefined): string {
  if (v == null) return "—";
  return v >= 0 ? `+${v}` : `${v}`;
}

export function formatNpGapColored(v: number | null | undefined): { text: string; className: string } {
  if (v == null) return { text: "—", className: "text-gray-400" };
  if (v > 0) return { text: `+${v}`, className: "text-green-400" };
  if (v < 0) return { text: `${v}`, className: "text-red-400" };
  return { text: "0", className: "text-gray-400" };
}

export function formatPricePerBhk(avg_price: number | null, avg_bhk: number | null): string {
  if (!avg_price || !avg_bhk || avg_bhk === 0) return "—";
  return formatPrice(Math.round(avg_price / avg_bhk));
}

export function parseConversionFloat(s: string | null | undefined): number | null {
  if (!s) return null;
  const n = parseFloat(s.replace("%", ""));
  return isNaN(n) ? null : n;
}
