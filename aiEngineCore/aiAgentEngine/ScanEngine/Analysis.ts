// Analysis.ts — Solto AI: Token Behavior Analysis Engine

import { getTokenStats } from "./Tools"
import { SolanaTokenMetrics } from "./types"

/**
 * analyzeTokenBehavior evaluates token anomalies, volatility, and liquidity patterns.
 * It returns a threat level classification with context.
 */
export async function analyzeTokenBehavior(tokenAddress: string): Promise<{
  threatLevel: "Low" | "Medium" | "High"
  details: Record<string, any>
}> {
  const stats: SolanaTokenMetrics = await getTokenStats(tokenAddress)

  const volatilityScore = stats.volatility24h
  const liquidityDelta = stats.liquidityChange24h
  const smartWallets = stats.smartWalletHits

  let threatLevel: "Low" | "Medium" | "High" = "Low"

  if (volatilityScore > 80 || liquidityDelta < -50 || smartWallets === 0) {
    threatLevel = "High"
  } else if (volatilityScore > 50 || liquidityDelta < -20) {
    threatLevel = "Medium"
  }

  return {
    threatLevel,
    details: {
      volatility: volatilityScore,
      liquidityChange: liquidityDelta,
      smartWallets,
      flagged: threatLevel !== "Low"
    }
  }
}
