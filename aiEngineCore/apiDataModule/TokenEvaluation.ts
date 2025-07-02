import { fetchDexTokenData } from "./risk-analyze"

interface TokenEvaluation {
  mintAddress: string
  aiScore: number
  riskLevel: string
  advisory: string
  metadata: Record<string, any>
}

function sigmoid(x: number): number {
  return 1 / (1 + Math.exp(-x))
}

function computeAIScore(profile: {
  liquidityUSD: number
  volume24hUSD: number
  priceChangePct: number
  buyersCount: number
  confidence: number
}): number {
  const liquidityFactor = sigmoid(profile.liquidityUSD / 10000 - 1)
  const volumeFactor = sigmoid(profile.volume24hUSD / 10000 - 1)
  const priceDropFactor = 1 - sigmoid(Math.abs(profile.priceChangePct) / 20)
  const buyerEngagement = sigmoid(profile.buyersCount / 10)
  const confidenceWeight = profile.confidence

  const score =
    0.25 * liquidityFactor +
    0.25 * volumeFactor +
    0.2 * priceDropFactor +
    0.2 * buyerEngagement +
    0.1 * confidenceWeight

  return parseFloat((score * 100).toFixed(2))
}

export async function evaluateTokenWithSolto(mint: string): Promise<TokenEvaluation | null> {
  const profile = await fetchDexTokenData(mint)

  if (!profile) return null

  const aiScore = computeAIScore(profile)

  let riskLevel = "Low"
  let advisory = "Token appears safe"

  if (aiScore < 40) {
    riskLevel = "High"
    advisory = "Avoid trading. Risk too elevated"
  } else if (aiScore < 70) {
    riskLevel = "Moderate"
    advisory = "Caution advised. Proceed only with good research"
  }

  return {
    mintAddress: mint,
    aiScore,
    riskLevel,
    advisory,
    metadata: profile
  }
}
