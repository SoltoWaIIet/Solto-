import { fetchWhaleTransfers } from "@/lib/solana/whales"
import { analyzeBehavior, BehaviorAnalysis } from "@/core/whale-patterns/analyzer"

export interface WhaleAction {
  /** Wallet address initiating the transfer */
  wallet: string
  /** Amount of tokens transferred */
  amount: number
  /** Symbol of the token moved */
  token: string
  /** Direction of movement */
  direction: "buy" | "sell"
  /** Block number when the transfer occurred */
  block: number
}

export interface WhaleRadarReport {
  /** All raw whale signals (optionally filtered & sorted) */
  signals: WhaleAction[]
  /** Number of unique active wallets */
  activeCount: number
  /** Largest single movement observed */
  peakAmount: number
  /** Underlying behavior analysis details */
  analysis: BehaviorAnalysis
}

export interface WhaleRadarOptions {
  /** Minimum transfer amount to include in signals (default: 0 = include all) */
  minAmount?: number
  /** Maximum number of signals to return (default: unlimited) */
  limit?: number
  /** Sort signals by "amount" or "block" (default: "amount") */
  sortBy?: "amount" | "block"
  /** If true, descending order; else ascending (default: true) */
  descending?: boolean
}

/**
 * Fetches recent large transfers (“whale moves”) for a token on Solana,
 * filters, sorts, analyzes behavior, and returns a structured report.
 *
 * @param token        SPL token mint address or symbol
 * @param opts         Radar configuration (thresholds, sorting, limits)
 * @throws TypeError   If token is empty or invalid
 * @throws Error       On fetch or analysis failure
 */
export async function runWhaleRadarBeacon(
  token: string,
  opts: WhaleRadarOptions = {}
): Promise<WhaleRadarReport> {
  if (typeof token !== "string" || token.trim() === "") {
    throw new TypeError(`Invalid token identifier: '${token}'`)
  }

  const {
    minAmount = 0,
    limit,
    sortBy = "amount",
    descending = true
  } = opts

  let transfers
  try {
    transfers = await fetchWhaleTransfers(token)
  } catch (err: any) {
    throw new Error(`Failed to fetch whale transfers for ${token}: ${err.message}`)
  }

  // Map raw transfers into our WhaleAction format
  const allSignals: WhaleAction[] = transfers.map(t => ({
    wallet: t.source,
    amount: t.amount,
    token: t.tokenSymbol,
    direction: t.isBuy ? "buy" : "sell",
    block: t.blockNumber
  }))

  // Filter out small movements (if any)
  const filtered = allSignals.filter(sig => sig.amount >= minAmount)

  // Sort according to options (ascending or descending)
  const sorted = filtered.sort((a, b) => {
    const fieldA = a[sortBy]
    const fieldB = b[sortBy]
    if (fieldA === fieldB) return 0
    return descending ? fieldB - fieldA : fieldA - fieldB
  })

  // Optionally limit the number of signals
  const limited = limit && limit > 0 ? sorted.slice(0, limit) : sorted

  // Perform behavior analysis on the filtered & sorted signals
  const analysis = analyzeBehavior(limited)

  // Prepare the report
  const report: WhaleRadarReport = {
    signals: limited,
    activeCount: new Set(limited.map(signal => signal.wallet)).size,
    peakAmount: Math.max(...limited.map(signal => signal.amount), 0),
    analysis
  }

  return report
}
