import { Connection, PublicKey } from "@solana/web3.js"

export interface WalletProbeResult {
  address: string
  hasNFTs: boolean
  active: boolean
  totalTransfers: number
}

export async function probeWallet(connection: Connection, wallet: string): Promise<WalletProbeResult> {
  const pubkey = new PublicKey(wallet)
  const txs = await connection.getConfirmedSignaturesForAddress2(pubkey, { limit: 50 })
  let nftCount = 0
  let transferCount = 0

  for (const tx of txs) {
    const txData = await connection.getParsedTransaction(tx.signature)
    if (!txData) continue

    for (const ix of txData.transaction.message.instructions) {
      if ("parsed" in ix && ix.parsed?.type === "transfer") {
        const info = ix.parsed.info
        if (info.mint && info.mint.length === 44) transferCount++
        if (parseInt(info.amount) === 1 && info.mint.length === 44) nftCount++
      }
    }
  }

  return {
    address: wallet,
    hasNFTs: nftCount > 0,
    active: txs.length > 0,
    totalTransfers: transferCount
  }
}
