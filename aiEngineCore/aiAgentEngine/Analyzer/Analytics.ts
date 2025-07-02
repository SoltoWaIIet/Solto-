import { fetchTokenStats, fetchWalletBehavior } from "@/solto/services/solanaAnalytics"
import { z } from "zod"

export const AnalyticsSchema = z.object({
  tokenMint: z.string(),
  timeframe: z.enum(["24h", "7d", "30d"]).default("24h")
})

export type AnalyticsPayload = z.infer<typeof AnalyticsSchema>

export async function analyzeTokenAnalytics(payload: AnalyticsPayload) {
  const { tokenMint, timeframe } = payload

  const stats = await fetchTokenStats(tokenMint, timeframe)
  const walletData = await fetchWalletBehavior(tokenMint, timeframe)

  return {
    volumeUSD: stats.volume,
    activeWallets: walletData.activeCount,
    topBuyers: walletData.topBuyers.slice(0, 5),
    volatilityScore: stats.volatility,
    concentrationIndex: stats.holdersTop10,
    insights: [
      stats.volatility > 75 ? "⚠️ High volatility" : "✔️ Stable movement",
      walletData.activeCount < 10 ? "🟡 Low activity" : "🟢 Good engagement"
    ]
  }
}
