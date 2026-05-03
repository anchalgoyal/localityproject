// Lead Gradient: green ↔ amber ↔ red (pivot at net_score = 0)
export function netToColor(value: number, minVal: number, maxVal: number): string {
  if (value === 0) return "#fbbf24";
  if (value > 0) {
    const t = maxVal > 0 ? Math.min(value / maxVal, 1) : 0;
    const r = Math.round(251 + (34 - 251) * t);
    const g = Math.round(191 + (197 - 191) * t);
    const b = Math.round(36 + (94 - 36) * t);
    return `rgb(${r},${g},${b})`;
  } else {
    const t = minVal < 0 ? Math.min(value / minVal, 1) : 0;
    const r = Math.round(251 + (239 - 251) * t);
    const g = Math.round(191 + (68 - 191) * t);
    const b = Math.round(36 + (68 - 36) * t);
    return `rgb(${r},${g},${b})`;
  }
}

// NP Target: green ↔ white ↔ red (pivot at 0), ±0.5 dead-band → white
export function npTargetToColor(value: number, minVal: number, maxVal: number): string {
  if (Math.abs(value) < 0.5) return "#ffffff";
  if (value > 0) {
    const t = maxVal > 0.5 ? value / maxVal : 0;
    const r = Math.round(255 + (34 - 255) * t);
    const g = Math.round(255 + (197 - 255) * t);
    const b = Math.round(255 + (94 - 255) * t);
    return `rgb(${r},${g},${b})`;
  } else {
    const t = minVal < -0.5 ? value / minVal : 0;
    const r = Math.round(255 + (239 - 255) * t);
    const g = Math.round(255 + (68 - 255) * t);
    const b = Math.round(255 + (68 - 255) * t);
    return `rgb(${r},${g},${b})`;
  }
}
