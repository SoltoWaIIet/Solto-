import { scanVolatilePairs } from "./dexPairScanner"

interface HotTokenSignal {
  token: string
  activityLevel: number
  price: number
  pair: string
}

/** Clamp a number into [min, max] */
const clamp = (n: number, min: number, max: number) =>
  Math.min(max, Math.max(min, n))

/** Extract base token from a "BASE/QUOTE" pair name, fallback to the whole name */
function baseFromPairName(name: string): string {
  if (!name) return ""
  const [base] = String(name).split("/").map(s => s.trim()).filter(Boolean)
  return base || String(name).trim()
}

/** Normalize any score into a 0..100 integer bucket */
function normalizeActivity(score: unknown): number {
  const n = typeof score === "number" && Number.isFinite(score) ? score : 0
  // If upstream already gives 0..100 we clamp; if it's 0..1 this still works (very small).
  // If you want 0..1 -> 0..100 scaling, uncomment the line below and remove the clamp-only version.
  // const scaled = n <= 1 ? n * 100 : n
  const scaled = n
  return Math.round(clamp(scaled, 0, 100))
}

/** Format price with sensible precision based on magnitude */
function fmtUsd(p: number): string {
  const v = Number.isFinite(p) ? p : 0
  const fmt = (min: number, max: number) =>
    new Intl.NumberFormat(undefined, {
      style: "decimal",
      minimumFractionDigits: min,
      maximumFractionDigits: max,
    }).format(v)
  if (v >= 1000) return fmt(0, 0) + " USD"
  if (v >= 1) return fmt(2, 2) + " USD"
  if (v >= 0.01) return fmt(4, 4) + " USD"
  return fmt(6, 6) + " USD"
}

/** Choose an emoji by activity bucket */
function activityEmoji(a: number): string {
  if (a >= 90) return "🔥🔥"
  if (a >= 70) return "🔥"
  if (a >= 50) return "⚡"
  if (a >= 25) return "🌡️"
  return "🧭"
}

/**
 * Fetch, sanitize, and rank hot token signals.
 * - Dedupes by token (keeps highest activity; ties -> higher price)
 * - Sorts by activity desc, then price desc, then token asc
 */
export async function getHotTokenSignals(): Promise<HotTokenSignal[]> {
  const pairs = await scanVolatilePairs() as Array<{
    name: string
    score: number
    priceUsd?: number
  }>

  // Map -> dedupe by token
  const bestByToken = new Map<string, HotTokenSignal>()
  for (const p of pairs ?? []) {
    const token = baseFromPairName(p?.name)
    if (!token) continue
    const activityLevel = normalizeActivity(p?.score)
    const price = Number.isFinite(p?.priceUsd as number) ? (p!.priceUsd as number) : 0
    const signal: HotTokenSignal = {
      token,
      activityLevel,
      price,
      pair: String(p?.name ?? token),
    }
    const prev = bestByToken.get(token)
    if (!prev) {
      bestByToken.set(token, signal)
    } else {
      // keep better one (higher activity, then higher price)
      if (
        signal.activityLevel > prev.activityLevel ||
        (signal.activityLevel === prev.activityLevel && signal.price > prev.price)
      ) {
        bestByToken.set(token, signal)
      }
    }
  }

  // Sort & return
  return Array.from(bestByToken.values()).sort(
    (a, b) =>
      b.activityLevel - a.activityLevel ||
      b.price - a.price ||
      a.token.localeCompare(b.token)
  )
}

/**
 * Pretty-print a hot token feed.
 * Example:
 *   "🔥 SOL — 145.23 USD | activity: 87/100 | Pair: SOL/USDC"
 */
export function formatHotTokenFeed(signals: HotTokenSignal[]): string[] {
  // Show in descending activity order even if caller passed unsorted
  const sorted = [...signals].sort(
    (a, b) =>
      b.activityLevel - a.activityLevel ||
      b.price - a.price ||
      a.token.localeCompare(b.token)
  )
  return sorted.map((s, i) => {
    const emoji = activityEmoji(s.activityLevel)
    const priceStr = fmtUsd(s.price)
    // Keep original wording but with smarter formatting
    return `${emoji} ${s.token} — ${priceStr} | activity: ${s.activityLevel}/100 | #${i + 1} | Pair: ${s.pair}`
  })
}
