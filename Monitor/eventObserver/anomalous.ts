import {
  Connection,
  PublicKey,
  ConfirmedSignatureInfo,
  ParsedTransactionWithMeta,
} from "@solana/web3.js"

export interface AnomalyReport {
  address: string
  txCount: number
  spikeDetected: boolean
  avgInterval: number
  intervals: number[]
}

export interface DetectAnomalousWalletOptions {
  /** How many recent signatures to fetch (default: 20) */
  fetchLimit?: number
  /** Threshold in seconds below which activity is considered a spike (default: 12) */
  threshold?: number
  /**
   * If true, skips over individual tx parse errors;
   * if false, aborts on first parse failure (default: true)
   */
  skipOnError?: boolean
}

/**
 * Detects anomalous rapid-fire transaction activity for a Solana wallet.
 *
 * @param conn         Solana RPC connection
 * @param addressStr   Base58-encoded wallet address
 * @param opts         Optional settings to control fetch limit, threshold, and error handling
 * @returns            A report with avgInterval, raw intervals, and spikeDetected flag
 * @throws TypeError   On invalid addressStr
 * @throws Error       On RPC failures or (if skipOnError=false) parse errors
 */
export async function detectAnomalousWallet(
  conn: Connection,
  addressStr: string,
  opts: DetectAnomalousWalletOptions = {}
): Promise<AnomalyReport> {
  const {
    fetchLimit = 20,
    threshold = 12,
    skipOnError = true,
  } = opts

  // Validate and parse the address
  if (typeof addressStr !== "string" || !addressStr.trim()) {
    throw new TypeError(`Invalid address string: "${addressStr}"`)
  }
  let address: PublicKey
  try {
    address = new PublicKey(addressStr)
  } catch (err: any) {
    throw new TypeError(`Failed to parse PublicKey "${addressStr}": ${err.message}`)
  }

  // Fetch recent signatures
  let sigs: ConfirmedSignatureInfo[]
  try {
    sigs = await conn.getConfirmedSignaturesForAddress2(address, { limit: fetchLimit })
  } catch (err: any) {
    throw new Error(`RPC error fetching signatures: ${err.message}`)
  }

  // Retrieve blockTimes
  const timestamps: number[] = []
  for (const { signature } of sigs) {
    try {
      const parsed = await conn.getParsedTransaction(signature)
      const t = (parsed as ParsedTransactionWithMeta | null)?.blockTime
      if (t != null) timestamps.push(t)
    } catch (err: any) {
      if (!skipOnError) {
        throw new Error(`Failed to parse tx ${signature}: ${err.message}`)
      }
      // else, skip this transaction
    }
  }

  // Compute sorted intervals between consecutive timestamps
  const intervals = timestamps
    .sort((a, b) => b - a)
    .map((t, i, arr) => (i < arr.length - 1 ? arr[i] - arr[i + 1] : 0))
    .filter((dt) => dt > 0)

  // Calculate average interval
  const sum = intervals.reduce((acc, dt) => acc + dt, 0)
  const avgInterval = intervals.length > 0 ? sum / intervals.length : Infinity
  const spikeDetected = avgInterval < threshold

  return {
    address: addressStr,
    txCount: sigs.length,
    spikeDetected,
    avgInterval,
    intervals,
  }
}
