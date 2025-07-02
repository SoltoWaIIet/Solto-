import { Connection, PublicKey } from "@solana/web3.js"

export async function getNewTokenAccounts(
  connection: Connection,
  mint: string,
  sinceSlot: number
): Promise<string[]> {
  const mintKey = new PublicKey(mint)
  const accounts = await connection.getProgramAccounts(
    new PublicKey("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"),
    {
      filters: [
        { dataSize: 165 },
        { memcmp: { offset: 0, bytes: mintKey.toBase58() } }
      ]
    }
  )

  const newAccounts = []
  for (const acc of accounts) {
    if (acc.slot > sinceSlot) newAccounts.push(acc.pubkey.toBase58())
  }

  return newAccounts
}
