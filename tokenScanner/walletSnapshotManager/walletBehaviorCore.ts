import { Connection, PublicKey } from "@solana/web3.js"

interface WalletBehavior {
  wallet: string
  txCount: number
  uniqueTokens: number
  inflowOutflowRatio: number
}

export async function getWalletBehavior(connection: Connection, address: string): Promise<WalletBehavior> {
  const pubkey = new PublicKey(address)
  const txs = await connection.getConfirmedSignaturesForAddress2(pubkey, { limit: 100 })
  const tokens = new Set<string>()
  let inflow = 0
  let outflow = 0

  for (const tx of txs) {
    const txData = await connection.getParsedTransaction(tx.signature)
    if (!txData) continue

    for (const ix of txData.transaction.message.instructions) {
      if ("parsed" in ix && ix.parsed?.type === "transfer") {
        const info = ix.parsed.info
        tokens.add(info.mint)
        if (info.destination === address) inflow += parseInt(info.amount)
        if (info.source === address) outflow += parseInt(info.amount)
      }
    }
  }

  return {
    wallet: address,
    txCount: txs.length,
    uniqueTokens: tokens.size,
    inflowOutflowRatio: inflow ? +(outflow / inflow).toFixed(2) : 0
  }
}
