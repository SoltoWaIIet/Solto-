import { getSolanaTokenAccounts, getRecentTransfers } from "@/core/solana"
import type { PublicKey } from "@solana/web3.js"

interface SignalMetrics {
  wallet: string
  token: string
  avgHoldDuration: number
  signalWeight: number
  transferStreak: number
}

export async function generatePortfolioSignals(wallets: string[]): Promise<SignalMetrics[]> {
  const results: SignalMetrics[] = []

  for (const wallet of wallets) {
    const tokenAccounts = await getSolanaTokenAccounts(wallet)

    for (const token of tokenAccounts) {
      const txs = await getRecentTransfers(token.address)
      const avgDuration = computeAvgDuration(txs)
      const streak = detectTransferStreak(txs)
      const signal = weightSignal(avgDuration, streak, txs.length)

      results.push({
        wallet,
        token: token.mint,
        avgHoldDuration: avgDuration,
        transferStreak: streak,
        signalWeight: signal
      })
    }
  }

  return results
}

function computeAvgDuration(transfers: any[]): number {
  if (!transfers.length) return 0
  const timestamps = transfers.map(t => t.timestamp).sort()
  const diffs = timestamps.slice(1).map((t, i) => t - timestamps[i])
  const avg = diffs.reduce((a, b) => a + b, 0) / diffs.length
  return Math.round(avg / 60)
}

function detectTransferStreak(transfers: any[]): number {
  let streak = 0
  let lastTime = 0
  for (const tx of transfers) {
    if (lastTime && tx.timestamp - lastTime > 600) break
    streak++
    lastTime = tx.timestamp
  }
  return streak
}

function weightSignal(duration: number, streak: number, txCount: number): number {
  const durationScore = duration < 120 ? 1.5 : 1
  const streakScore = streak > 3 ? 1.3 : 1
  return +(durationScore * streakScore * txCount).toFixed(2)
}
