import { Connection, PublicKey } from "@solana/web3.js"

export async function getTokenBalance(
  connection: Connection,
  account: string,
  mint: string
): Promise<number> {
  const tokenAccounts = await connection.getParsedTokenAccountsByOwner(
    new PublicKey(account),
    { mint: new PublicKey(mint) }
  )

  if (!tokenAccounts.value.length) return 0

  const tokenAmount = tokenAccounts.value[0].account.data.parsed.info.tokenAmount
  return parseFloat(tokenAmount.uiAmountString || "0")
}
