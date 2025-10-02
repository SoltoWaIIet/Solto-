import { fetchTokenStats, fetchWalletBehavior } from "@/solto/services/solanaAnalytics"
import { z } from "zod"

export const AnalyticsSchema = z.object({
  tokenMint: z.string().min(32, "Invalid mint address").max(44, "Invalid mint address"),
  timeframe: z.enum(["24h", "7d", "30d"]).default("24h"),
})

export type AnalyticsPayload = z.infer<typeof AnalyticsSchema>

export interface TokenAnalyticsReport {
  volumeUSD: number
  activeWallets: number
  topBuyers: string[]
  volatilityScore: number
  concentrationIndex: number
  insights: string[]
  timestamp: number
}

/**
 * Analyze token activity with stats + wallet behavior
 * Adds structured insights and validation
 */
export async function analyzeTokenAnalytics(payload: AnalyticsPayload): Promise<TokenAnalyticsReport> {
  const { tokenMint, timeframe } = AnalyticsSchema.parse(payload)

  try {
    const [stats, walletData] = await Promise.all([
      fetchTokenStats(tokenMint, timeframe),
      fetchWalletBehavior(tokenMint, timeframe),
    ])

    const insights: string[] = []

    if (stats.volatility > 75) {
      insights.push("⚠️ High volatility")
    } else if (stats.volatility < 25) {
      insights.push("🟢 Very stable")
    } else {
      insights.push("✔️ Moderate volatility")
    }

    if (walletData.activeCount < 10) {
      insights.push("🟡 Low wallet activity")
    } else if (walletData.activeCount > 1000) {
      insights.push("🔥 Strong wallet engagement")
    } else {
      insights.push("🟢 Healthy activity")
    }

    if (stats.holdersTop10 > 50) {
      insights.push("⚠️ High top-10 concentration")
    } else if (stats.holdersTop10 < 20) {
      insights.push("✅ Good decentralization")
    }

    return {
      volumeUSD: stats.volume,
      activeWallets: walletData.activeCount,
      topBuyers: walletData.topBuyers.slice(0, 5),
      volatilityScore: stats.volatility,
      concentrationIndex: stats.holdersTop10,
      insights,
      timestamp: Date.now(),
    }
  } catch (err: any) {
    throw new Error(`Failed to analyze token ${payload.tokenMint}: ${err?.message ?? String(err)}`)
  }
}

/*
filename suggestions
- token_analytics_service.ts
- token_analytics_reporter.ts
- token_analytics_insights.ts
*/
