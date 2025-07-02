// Analysis.ts
// Core agent logic to synthesize token + wallet data and produce risk verdicts

import { TokenInsight, WalletSignal } from "./vaultActions"

interface CombinedInput {
  token: TokenInsight
  wallet: WalletSignal
}

export function synthesizeVerdict(input: CombinedInput): string {
  let score = 0

  if (input.token.volatility > 70) score += 1
  if (input.token.mintRecencyHours < 24) score += 1
  if (input.token.liquidityChange < -30) score += 1
  if (input.wallet.txBurstScore > 85) score += 1
  if (input.wallet.smartWalletCount === 0) score += 1

  if (score >= 4) return "🚨 High Risk"
  if (score >= 2) return "⚠️ Medium Risk"
  return "✅ Low Risk"
}
