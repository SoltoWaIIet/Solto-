import { Connection, PublicKey } from "@solana/web3.js"

const connection = new Connection("https://api.mainnet-beta.solana.com")

export async function isNewToken(mint: string): Promise<boolean> {
  const tokenAccount = await connection.getAccountInfo(new PublicKey(mint))
  if (!tokenAccount) return false

  const createdAt = tokenAccount.lamports > 0 ? tokenAccount.lamports : 0
  const now = Date.now() / 1000
  const ageInDays = (now - createdAt) / 86400
  return ageInDays < 3
}
