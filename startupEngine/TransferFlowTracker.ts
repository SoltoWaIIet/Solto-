import { Connection, PublicKey, ParsedTransactionWithMeta } from "@solana/web3.js"
import { z } from "zod"

/** Zod schemas */
const trackParamsSchema = z.object({
  mint: z.string().refine(s => {
    try { new PublicKey(s); return true } catch { return false }
  }, { message: "Invalid mint address" }),
  maxSlots: z.number().int().nonnegative().default(50),
})

/** Transfer event */
interface TransferEvent {
  signature: string
  source: string
  destination: string
  token: string
  amount: number
  timestamp: number
}

/** Summary of flows */
interface FlowSummary {
  token: string
  totalTransfers: number
  topSenders: string[]
  topReceivers: string[]
  suspiciousFlows: string[]
}

/**
 * Scans recent blocks for SPL token transfers of a given mint,
 * then returns a JSON string of FlowSummary.
 */
export async function trackTransferFlowRaw(
  connection: Connection,
  params: unknown
): Promise<string> {
  const { mint, maxSlots } = trackParamsSchema.parse(params)
  const tokenMint = new PublicKey(mint)
  const PROGRAM_ID = new PublicKey("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA")

  const senderMap: Record<string, number> = {}
  const receiverMap: Record<string, number> = {}
  const suspicious = new Set<string>()

  const currentSlot = await connection.getSlot("confirmed")

  for (let i = 0; i < maxSlots; i++) {
    const slot = currentSlot - i
    const block = await connection.getBlock(slot, { maxSupportedTransactionVersion: 0 }).catch(() => null)
    if (!block) continue

    for (const tx of block.transactions) {
      const ts = block.blockTime ? block.blockTime * 1000 : Date.now()
      for (const ix of tx.transaction.message.instructions) {
        if (
          "parsed" in ix &&
          ix.programId.equals(PROGRAM_ID) &&
          ix.parsed?.type === "transfer"
        ) {
          const info = ix.parsed.info as any
          if (info.mint !== tokenMint.toBase58()) continue

          const sender = info.source as string
          const receiver = info.destination as string
          const amt = Number(info.amount)

          senderMap[sender] = (senderMap[sender] || 0) + amt
          receiverMap[receiver] = (receiverMap[receiver] || 0) + amt

          if (amt > 1_000_000) {
            suspicious.add(`${sender}→${receiver}@${amt}`)
          }
        }
      }
    }
  }

  const topSenders = Object.entries(senderMap)
    .sort(([,a],[,b]) => b - a).slice(0,5).map(([s]) => s)
  const topReceivers = Object.entries(receiverMap)
    .sort(([,a],[,b]) => b - a).slice(0,5).map(([r]) => r)

  const summary: FlowSummary = {
    token: tokenMint.toBase58(),
    totalTransfers: Object.values(senderMap).reduce((a,b) => a + b, 0),
    topSenders,
    topReceivers,
    suspiciousFlows: Array.from(suspicious),
  }

  return JSON.stringify(summary)
}
