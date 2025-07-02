import { Connection, PublicKey } from "@solana/web3.js"

interface SpreadResult {
  tokenMint: string
  spreadRatio: number
  totalAccounts: number
  lowValueHolders: number
}

export async function analyzeTokenSpread(conn: Connection, mint: string): Promise<SpreadResult> {
  const pubkey = new PublicKey(mint)
  const accounts = await conn.getTokenLargestAccounts(pubkey)
  const values = accounts.value.map(x => parseInt(x.amount))
  const total = values.length
  const lowHolders = values.filter(v => v < 1_000_000).length
  const spreadRatio = +(lowHolders / total).toFixed(3)

  return {
    tokenMint: mint,
    spreadRatio,
    totalAccounts: total,
    lowValueHolders: lowHolders
  }
}
