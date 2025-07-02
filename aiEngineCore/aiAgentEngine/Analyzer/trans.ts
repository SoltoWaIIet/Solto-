import { z } from "zod"
import { getRecentTransfers } from "@/solto/services/tokenTransfers"

export const TransferSchema = z.object({
  tokenMint: z.string(),
  limit: z.number().min(1).max(50).default(10)
})

export type TransferPayload = z.infer<typeof TransferSchema>

export async function getTransferEvents(payload: TransferPayload) {
  const { tokenMint, limit } = payload
  const transfers = await getRecentTransfers(tokenMint, limit)

  const formatted = transfers.map(tx => ({
    sender: tx.from,
    receiver: tx.to,
    amount: tx.amount,
    timestamp: new Date(tx.timestamp * 1000).toLocaleString(),
    isSmartWallet: tx.from.startsWith("Smart") || tx.to.startsWith("Smart")
  }))

  return {
    token: tokenMint,
    totalEvents: formatted.length,
    events: formatted
  }
}
