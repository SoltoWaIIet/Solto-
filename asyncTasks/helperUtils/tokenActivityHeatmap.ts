interface ActivityPoint {
  hour: number
  txCount: number
}

type TimeZoneMode = "UTC" | "LOCAL" | string

export interface HeatmapOptions<T extends { timestamp: number }> {
  /**
   * Which time zone to use for bucketing:
   * - "UTC" (default)
   * - "LOCAL" (use machine local time)
   * - IANA TZ string (e.g., "America/New_York")
   */
  timeZone?: TimeZoneMode
  /**
   * Optional weight per transaction (e.g., by amount).
   * Default = 1 per transaction.
   */
  getWeight?: (tx: T) => number
  /**
   * Apply circular smoothing (simple kernel) after counting.
   * Default: false
   */
  smooth?: boolean
  /**
   * Custom smoothing kernel; must sum to 1. Used only if `smooth` is true.
   * Default: [0.25, 0.5, 0.25]
   */
  kernel?: number[]
  /**
   * Return percentages instead of raw counts (0–100).
   * Default: false
   */
  asPercent?: boolean
  /**
   * Decimal places to round to (only applied when asPercent=true).
   * Default: 2
   */
  percentDigits?: number
}

/**
 * Generate a 24-hour heatmap of activity with options:
 * - Supports UTC, local time, or any IANA time zone
 * - Optional per-tx weighting (e.g., amount)
 * - Optional circular smoothing
 * - Optional percentage output
 */
export function generateActivityHeatmap<T extends { timestamp: number }>(
  transactions: T[],
  options: HeatmapOptions<T> = {}
): ActivityPoint[] {
  const {
    timeZone = "UTC",
    getWeight,
    smooth = false,
    kernel = [0.25, 0.5, 0.25],
    asPercent = false,
    percentDigits = 2,
  } = options

  // Pre-validate kernel if smoothing enabled
  if (smooth) {
    if (!Array.isArray(kernel) || kernel.length === 0)
      throw new Error("kernel must be a non-empty array when smooth=true")
    const sum = kernel.reduce((s, v) => s + v, 0)
    if (!isFinite(sum) || Math.abs(sum - 1) > 1e-9)
      throw new Error("smoothing kernel must sum to 1")
  }

  // Initialize counts for 24 hours
  const counts = new Array<number>(24).fill(0)

  for (const tx of transactions) {
    const ts = toMs(tx?.timestamp)
    if (!Number.isFinite(ts)) continue
    const d = new Date(ts)
    const hour = resolveHour(d, timeZone)
    if (hour < 0 || hour > 23) continue

    const w = getWeight ? safeNumber(getWeight(tx)) : 1
    counts[hour] += Number.isFinite(w) ? w : 0
  }

  // Optional smoothing (circular convolution across 24 hours)
  const series = smooth ? convolveCircular(counts, kernel) : counts

  // Optional percent conversion
  let out: number[] = series
  if (asPercent) {
    const total = series.reduce((s, v) => s + v, 0)
    out = total > 0 ? series.map(v => round((v / total) * 100, percentDigits)) : series.map(() => 0)
  }

  // Project to ActivityPoint[]
  return out.map((txCount, hour) => ({ hour, txCount }))
}

/* --------------------------------- utils --------------------------------- */

function toMs(ts: number): number {
  // Treat values < 1e12 as seconds
  if (!Number.isFinite(ts)) return NaN
  return ts < 1e12 ? ts * 1000 : ts
}

function resolveHour(date: Date, mode: TimeZoneMode): number {
  if (mode === "LOCAL") return date.getHours()
  if (mode === "UTC") return date.getUTCHours()

  // IANA TZ via Intl.DateTimeFormat
  try {
    const fmt = new Intl.DateTimeFormat("en-US", {
      timeZone: mode,
      hour: "numeric",
      hour12: false,
    })
    const s = fmt.format(date) // "0".."23"
    const h = Number(s)
    return Number.isFinite(h) ? h : date.getUTCHours()
  } catch {
    // Fallback to UTC if TZ invalid/unsupported
    return date.getUTCHours()
  }
}

function convolveCircular(x: number[], kernel: number[]): number[] {
  const n = x.length
  const m = kernel.length
  const half = Math.floor(m / 2)
  const out = new Array<number>(n).fill(0)
  for (let i = 0; i < n; i++) {
    let acc = 0
    for (let k = 0; k < m; k++) {
      // align kernel center at i
      const idx = mod(i + (k - half), n)
      acc += x[idx] * kernel[k]
    }
    out[i] = acc
  }
  return out
}

function mod(a: number, n: number): number {
  return ((a % n) + n) % n
}

function safeNumber(v: unknown): number {
  if (typeof v === "number") return v
  if (typeof v === "string") {
    const n = Number(v)
    return Number.isFinite(n) ? n : NaN
  }
  return NaN
}

function round(v: number, digits: number): number {
  const f = Math.pow(10, Math.max(0, digits | 0))
  return Math.round(v * f) / f
}
