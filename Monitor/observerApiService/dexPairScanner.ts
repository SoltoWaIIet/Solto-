import { fetchTopDexData } from "./dexDataFetcher"

export interface HotPair {
  name: string
  priceUsd: number
  volume24h: number
  liquidityUsd: number
  score: number
}

export async function scanVolatilePairs(): Promise<HotPair[]> {
  const pairs = await fetchTopDexData(30)

  return pairs
    .map((pair) => ({
      ...pair,
      score: calcSignalScore(pair.volume24h, pair.liquidityUsd),
    }))
    .filter((p) => p.score > 70)
    .sort((a, b) => b.score - a.score)
}

function calcSignalScore(volume: number, liquidity: number): number {
  const ratio = volume / (liquidity + 1)
  const capped = Math.min(ratio * 100, 100)
  return Math.round(capped)
}
