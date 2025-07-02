import { Connection, PublicKey } from "@solana/web3.js"

interface TransferEvent {
  signature: string
  source: string
  destination: string
  token: string
  amount: number
  timestamp: number
}

interface FlowSummary {
  token: string
  totalTransfers: number
  topSenders: string[]
  topReceivers: string[]
  suspiciousFlows: string[]
}

export async function trackTransferFlow(
  connection: Connection,
  mint: string,
  maxSlots = 50
): Promise<FlowSummary> {
  const tokenKey = new PublicKey(mint)
  const programId = new PublicKey("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA")
  const currentSlot = await connection.getSlot()
  const senderMap: Record<string, number> = {}
  const receiverMap: Record<string, number> = {}
  const suspicious: Set<string> = new Set()

  for (let i = 0; i < maxSlots; i++) {
    const slot = currentSlot - i
    const block = await connection.getBlock(slot, { maxSupportedTransactionVersion: 0 }).catch(() => null)
    if (!block) continue

    for (const tx of block.transactions) {
      for (const ix of tx.transaction.message.instructions) {
        if ("parsed" in ix && ix.programId.equals(programId) && ix.parsed?.type === "transfer") {
          const data = ix.parsed.info
          if (data.mint !== tokenKey.toBase58()) continue

          const sender = data.source
          const receiver = data.destination
          const amt = parseInt(data.amount)

          senderMap[sender] = (senderMap[sender] || 0) + amt
          receiverMap[receiver] = (receiverMap[receiver] || 0) + amt

          if (amt > 1_000_000) suspicious.add(`${sender} ➜ ${receiver}`)
        }
      }
    }
  }

  const sortedSenders = Object.entries(senderMap).sort((a, b) => b[1] - a[1]).slice(0, 5).map(x => x[0])
  const sortedReceivers = Object.entries(receiverMap).sort((a, b) => b[1] - a[1]).slice(0, 5).map(x => x[0])

  return {
    token: tokenKey.toBase58(),
    totalTransfers: Object.keys(senderMap).length,
    topSenders: sortedSenders,
    topReceivers: sortedReceivers,
    suspiciousFlows: Array.from(suspicious)
  }
}
