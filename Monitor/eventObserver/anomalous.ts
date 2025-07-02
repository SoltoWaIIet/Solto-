import { Connection, PublicKey } from "@solana/web3.js"

export interface AnomalyReport {
  address: string
  txCount: number
  spikeDetected: boolean
  avgInterval: number
}

export async function detectAnomalousWallet(
  conn: Connection,
  addressStr: string,
  threshold = 12
): Promise<AnomalyReport> {
  const address = new PublicKey(addressStr)
  const txs = await conn.getConfirmedSignaturesForAddress2(address, { limit: 20 })
  const timestamps = []

  for (const tx of txs) {
    const details = await conn.getParsedTransaction(tx.signature)
    if (details?.blockTime) timestamps.push(details.blockTime)
  }

  const intervals = timestamps
    .sort((a, b) => b - a)
    .map((t, i, arr) => (i < arr.length - 1 ? t - arr[i + 1] : 0))
    .filter((x) => x > 0)

  const avgInterval = intervals.reduce((a, b) => a + b, 0) / (intervals.length || 1)
  const spike = avgInterval < threshold

  return {
    address: addressStr,
    txCount: txs.length,
    spikeDetected: spike,
    avgInterval
  }
}
