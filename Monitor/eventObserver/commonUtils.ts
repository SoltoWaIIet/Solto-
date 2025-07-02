import { Connection, PublicKey } from "@solana/web3.js"

export async function getTokenAccountsByOwner(conn: Connection, mintStr: string): Promise<string[]> {
  const mint = new PublicKey(mintStr)
  const { value } = await conn.getParsedTokenAccountsByMint(mint)
  return value.map(({ pubkey }) => pubkey.toBase58())
}

export function chunkArray<T>(arr: T[], size: number): T[][] {
  const result: T[][] = []
  for (let i = 0; i < arr.length; i += size) {
    result.push(arr.slice(i, i + size))
  }
  return result
}
