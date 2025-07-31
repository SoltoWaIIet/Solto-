import { fetchTokenOverview } from "@/lib/solana/tokens"
import { computeVolatilityScore } from "@/core/indicators/volatility"

interface TokenPulseResult {
  symbol: string
  volumeUSD: number
  liquidityUSD: number
  volatility: number
  updatedAt: string
}

export async function getTokenPulseCard(symbol: string): Promise<TokenPulseResult> {
  try {
    const {
      volume24h: volumeUSD,
      liquidity: liquidityUSD,
      recentPrices,
      recentVolumes
    } = await fetchTokenOverview(symbol)

    const volatility = computeVolatilityScore(recentPrices, recentVolumes)

    return {
      symbol,
      volumeUSD,
      liquidityUSD,
      volatility,
      updatedAt: new Date().toISOString(),
    }

  } catch (error) {
    console.error(`Failed to load pulse for ${symbol}:`, error)
    return {
      symbol,
      volumeUSD: 0,
      liquidityUSD: 0,
      volatility: 0,
      updatedAt: new Date().toISOString(),
    }
  }
}
