import { Connection, PublicKey } from "@solana/web3.js"

export async function fetchTokenActivity(
  connection: Connection,
  mint: string
): Promise<{ transfers: number; holders: number }> {
  const mintPubkey = new PublicKey(mint)

  const signatures = await connection.getSignaturesForAddress(mintPubkey, { limit: 100 })
  const uniqueSigners = new Set<string>()

  for (const sig of signatures) {
    const tx = await connection.getParsedTransaction(sig.signature)
    tx?.transaction.message.accountKeys.forEach(acc => uniqueSigners.add(acc.pubkey.toBase58()))
  }

  return {
    transfers: signatures.length,
    holders: uniqueSigners.size
  }
}
