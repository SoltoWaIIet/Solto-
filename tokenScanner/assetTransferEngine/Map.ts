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
  const overview = await fetchTokenOverview(symbol)

  const volatility = computeVolatilityScore(
    overview.recentPrices,
    overview.recentVolumes
  )

  return {
    symbol,
    volumeUSD: overview.volume24h,
    liquidityUSD: overview.liquidity,
    volatility,
    updatedAt: new Date().toISOString()
  }
}
