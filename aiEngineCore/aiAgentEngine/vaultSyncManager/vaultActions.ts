// vaultActions.ts
// Token + wallet signal analyzers for Solto AI Vault agent

export interface TokenInsight {
  liquidityChange: number
  mintRecencyHours: number
  volatility: number
}

export interface WalletSignal {
  txBurstScore: number
  smartWalletCount: number
}

export function analyzeToken(input: TokenInsight): string {
  if (input.volatility > 90) return "Extreme volatility"
  if (input.liquidityChange < -50) return "Liquidity exit detected"
  if (input.mintRecencyHours < 12) return "Fresh mint warning"
  return "Stable behavior"
}

export function scanWallet(input: WalletSignal): string {
  if (input.txBurstScore > 90) return "Likely bot wallet"
  if (input.smartWalletCount === 0) return "No smart wallet trust"
  return "Normal wallet"
}
