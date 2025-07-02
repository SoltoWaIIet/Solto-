// soltoAIEngine.ts — Core AI logic for Solto risk analysis engine

import { pushMetric, getRecentMetrics } from "./metricsCacheLogic"
import { pushAlert } from "./alertServiceModule"

// Input structure for token analysis
interface TokenInsightInput {
  mint: string
  txCount24h: number
  liquidityUSD: number
  volatilityScore: number
  sybilScore: number
}

// Risk assessment output structure
interface RiskAssessment {
  riskScore: number
  riskLevel: "low" | "moderate" | "high"
  advisory: string
}

// Main risk evaluation logic
export function assessTokenRisk(input: TokenInsightInput): RiskAssessment {
  // Weighted risk formula based on activity and trust indicators
  const score =
    input.txCount24h * 0.1 +
    input.volatilityScore * 0.4 +
    input.sybilScore * 0.3 -
    Math.min(input.liquidityUSD, 10000) * 0.0005

  const boundedScore = Math.min(Math.max(score, 0), 100)

  // Determine risk level based on final score
  let riskLevel: RiskAssessment["riskLevel"] = "low"
  let advisory = "No major risk detected"

  if (boundedScore > 75) {
    riskLevel = "high"
    advisory = "Flagged for potential manipulation or coordinated behavior"
  } else if (boundedScore > 45) {
    riskLevel = "moderate"
    advisory = "Some elevated risk signals — monitor closely"
  }

  return {
    riskScore: Math.round(boundedScore),
    riskLevel,
    advisory
  }
}

// Trigger full analysis + cache + alert if necessary
export function processTokenAnalysis(input: TokenInsightInput) {
  // Log metrics to memory cache for tracking
  pushMetric(input.mint, {
    txCount: input.txCount24h,
    liquidity: input.liquidityUSD,
    volatility: input.volatilityScore
  })

  const risk = assessTokenRisk(input)

  // If high risk, generate an alert for the system
  if (risk.riskLevel === "high") {
    pushAlert({
      level: "critical",
      title: `⚠️ High Risk Token`,
      message: `Token ${input.mint} scored ${risk.riskScore} — investigate`,
      token: input.mint
    })
  }

  return risk
}

// Return a simplified recent history snapshot for a token
export function summarizeRecent(token: string) {
  const history = getRecentMetrics(token)

  return history.map(entry => ({
    time: entry.timestamp,
    txs: entry.txCount,
    liq: entry.liquidity,
    vol: entry.volatility
  }))
}
