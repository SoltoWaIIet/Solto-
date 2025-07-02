import { Connection, PublicKey } from "@solana/web3.js"
import type { BalanceQuery } from "./defineBalanceQuerySchema"

/**
 * Fetches SOL and SPL token balances per a given query
 */
export async function retrieveTokenBalances(
  connection: Connection,
  query: BalanceQuery
): Promise<Record<string, number>> {
  const { walletAddress } = query
  const addressKey = new PublicKey(walletAddress)

  const result: Record<string, number> = {}

  // SOL balance
  const lamports = await connection.getBalance(addressKey)
  result.SOL = lamports

  // SPL balances
  const resp = await connection.getParsedTokenAccountsByOwner(addressKey, {
    programId: new PublicKey("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"),
  })
  for (const { account } of resp.value) {
    const info = (account.data.parsed.info as any)
    const mint = info.mint as string
    const amount = Number(info.tokenAmount.uiAmount || 0)
    result[mint] = amount
  }

  return result
}
