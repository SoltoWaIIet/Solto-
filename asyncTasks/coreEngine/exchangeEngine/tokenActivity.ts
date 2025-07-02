import { Connection, PublicKey } from "@solana/web3.js"

export async function getTokenActivitySummary(
  connection: Connection,
  mint: string
): Promise<{ totalTransfers: number; uniqueWallets: number }> {
  const mintKey = new PublicKey(mint)
  const signatures = await connection.getSignaturesForAddress(mintKey, { limit: 100 })
  const unique = new Set<string>()

  for (const sig of signatures) {
    const tx = await connection.getParsedTransaction(sig.signature)
    tx?.transaction.message.accountKeys.forEach(k => unique.add(k.pubkey.toBase58()))
  }

  return {
    totalTransfers: signatures.length,
    uniqueWallets: unique.size
  }
}
