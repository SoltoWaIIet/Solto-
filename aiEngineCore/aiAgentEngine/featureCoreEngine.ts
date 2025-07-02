// Core extractor for Solto AI model — transforms raw token data into ML features

export interface TokenFeatureInput {
  liquidity: number
  volume24h: number
  txCount: number
  uniqueBuyers: number
  volatilityScore: number
  sybilLikelihood: number
}

export interface NormalizedFeatures {
  liquidityFactor: number
  volumeFactor: number
  txDensity: number
  buyerSpread: number
  volatilityIndex: number
  sybilScoreNorm: number
}

export function extractFeatures(input: TokenFeatureInput): NormalizedFeatures {
  return {
    liquidityFactor: Math.log10(input.liquidity + 1) / 6,
    volumeFactor: Math.log10(input.volume24h + 1) / 6,
    txDensity: Math.min(input.txCount / 500, 1),
    buyerSpread: Math.min(input.uniqueBuyers / 100, 1),
    volatilityIndex: Math.min(input.volatilityScore / 100, 1),
    sybilScoreNorm: Math.min(input.sybilLikelihood / 100, 1)
  }
}
