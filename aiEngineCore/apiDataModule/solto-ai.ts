// solto-ai.ts

import axios from "axios"

interface TokenMetrics {
  mint: string
  volume24h: number
  liquidityUSD: number
  buys: number
  sells: number
  priceUSD: number
}

interface TokenAIInsights {
  volatilityScore: number
  trendSignal: "bullish" | "bearish" | "neutral"
  alert: string | null
}

/**
 * Fetches live data from DexScreener for a Solana token
 */
export async function fetchDexScreenerData(mint: string): Promise<TokenMetrics | null> {
  try {
    const url = `https://api.dexscreener.com/latest/dex/pairs/solana/${mint}`
    const response = await axios.get(url)

    if (!response.data?.pair) return null

    const p = response.data.pair
    return {
      mint,
      volume24h: parseFloat(p.volume.h24),
      liquidityUSD: parseFloat(p.liquidity.usd),
      buys: parseInt(p.txns.h24.buys),
      sells: parseInt(p.txns.h24.sells),
      priceUSD: parseFloat(p.priceUsd)
    }
  } catch (e) {
    console.error("DexScreener API error:", e)
    return null
  }
}

/**
 * Naive pattern recognition — simulates a lightweight AI signal engine
 */
export function analyzeTokenBehavior(metrics: TokenMetrics): TokenAIInsights {
  const priceVolatility = Math.abs(metrics.buys - metrics.sells) / (metrics.buys + metrics.sells + 1)
  const liquidityRatio = metrics.volume24h / (metrics.liquidityUSD + 1)

  const volatilityScore = Math.min(100, Math.round((priceVolatility + liquidityRatio) * 50))

  let trendSignal: "bullish" | "bearish" | "neutral" = "neutral"
  if (metrics.buys > metrics.sells * 1.5) trendSignal = "bullish"
  else if (metrics.sells > metrics.buys * 1.5) trendSignal = "bearish"

  let alert: string | null = null
  if (volatilityScore > 80) alert = "⚠️ High volatility detected"
  else if (liquidityRatio < 0.1) alert = "⚠️ Low liquidity-to-volume ratio"

  return {
    volatilityScore,
    trendSignal,
    alert
  }
}

/**
 * Full analysis pipeline for Solto AI
 */
export async function runSoltoAnalysis(mintAddress: string) {
  const metrics = await fetchDexScreenerData(mintAddress)
  if (!metrics) {
    console.log("Token data not found.")
    return
  }

  const insights = analyzeTokenBehavior(metrics)

  console.log(`--- Solto AI Report for ${mintAddress} ---`)
  console.log(`Price: $${metrics.priceUSD.toFixed(4)}`)
  console.log(`Volatility Score: ${insights.volatilityScore}`)
  console.log(`Trend Signal: ${insights.trendSignal}`)
  if (insights.alert) console.log(`ALERT: ${insights.alert}`)
}
