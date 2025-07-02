export function calculateRiskScore(params: {
  entropy: number
  sybilLikelihood: number
  txCount: number
  smartWalletsInvolved: number
}): number {
  const base = params.entropy * 0.4 + params.sybilLikelihood * 0.3
  const txFactor = Math.min(params.txCount / 100, 1) * 0.2
  const walletPenalty = params.smartWalletsInvolved === 0 ? 0.1 : 0
  return Math.min(base + txFactor + walletPenalty, 1) * 100
}
