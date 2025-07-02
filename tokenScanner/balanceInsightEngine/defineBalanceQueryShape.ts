import { fetchWhaleTransfers } from "@/lib/solana/whales"
import { analyzeBehavior } from "@/core/whale-patterns/analyzer"

interface WhaleAction {
  wallet: string
  amount: number
  token: string
  direction: "buy" | "sell"
  block: number
}

export interface WhaleRadarReport {
  signals: WhaleAction[]
  activeCount: number
  peakAmount: number
}

export async function runWhaleRadarBeacon(token: string): Promise<WhaleRadarReport> {
  const transfers = await fetchWhaleTransfers(token)

  const signals = transfers.map(t => ({
    wallet: t.source,
    amount: t.amount,
    token: t.tokenSymbol,
    direction: t.isBuy ? "buy" : "sell",
    block: t.blockNumber
  }))

  const analysis = analyzeBehavior(signals)

  return {
    signals,
    activeCount: analysis.uniqueWallets,
    peakAmount: analysis.largestMovement
  }
}
