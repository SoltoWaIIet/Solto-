import { fetchTopDexData } from "./dexDataFetcher"

export interface HotPair {
  name: string
  priceUsd: number
  volume24h: number
  liquidityUsd: number
  score: number
}

// —— Configuration —— 
const DEFAULT_FETCH_LIMIT = 30
const DEFAULT_MIN_SCORE   = 70

/**
 * Scans top DEX pairs for volatility signals.
 * @param fetchLimit How many pairs to fetch (default 30)
 * @param minScore   Minimum signal score to include (0–100, default 70)
 */
export async function scanVolatilePairs(
  fetchLimit: number = DEFAULT_FETCH_LIMIT,
  minScore: number = DEFAULT_MIN_SCORE
): Promise<HotPair[]> {
  try {
    const pairs = await fetchTopDexData(fetchLimit)

    return pairs
      .map(pair => ({
        ...pair,
        score: calcSignalScore(pair.volume24h, pair.liquidityUsd),
      }))
      .filter(p => p.score >= minScore)
      .sort((a, b) => b.score - a.score)

  } catch (err) {
    console.error("Failed to fetch or process DEX data:", err)
    return []
  }
}

/** 
 * Compute a 0–100 volatility signal score based on volume vs liquidity. 
 * @param volume    24h volume
 * @param liquidity available liquidity
 */
function calcSignalScore(volume: number, liquidity: number): number {
  const ratio  = volume / (liquidity + 1)
  const capped = Math.min(ratio * 100, 100)
  return Math.round(capped)
}
