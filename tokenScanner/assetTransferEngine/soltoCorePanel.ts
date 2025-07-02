import { fetchTokenActivity, fetchMarketFlash } from "@/lib/solana/feeds"
import { analyzeTokenMetrics } from "@/core/analyzer/metrics"
import { logInsight } from "@/utils/logger"

export async function runSoltoCorePanel(symbol: string) {
  try {
    const activityData = await fetchTokenActivity(symbol)
    const metrics = analyzeTokenMetrics(activityData)

    logInsight("SoltoCorePanel", {
      symbol,
      ...metrics
    })

    const flashSignals = await fetchMarketFlash(symbol)
    const merged = {
      metrics,
      flash: flashSignals
    }

    return merged
  } catch (err) {
    console.error(`[SoltoCorePanel] error on ${symbol}`, err)
    return null
  }
}
