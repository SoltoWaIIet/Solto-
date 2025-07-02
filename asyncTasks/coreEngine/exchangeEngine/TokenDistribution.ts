import { Connection, PublicKey } from "@solana/web3.js"

export async function getTokenDistributionSummary(
  connection: Connection,
  mint: string
): Promise<{ topHolders: string[]; topSharePercent: number }> {
  const largest = await connection.getTokenLargestAccounts(new PublicKey(mint))
  const balances = await Promise.all(
    largest.value.slice(0, 5).map(async a => connection.getTokenAccountBalance(a.address))
  )

  const total = balances.reduce((sum, b) => sum + parseFloat(b.value.uiAmountString || "0"), 0)
  const top5 = largest.value.slice(0, 5).map(a => a.address.toBase58())

  return {
    topHolders: top5,
    topSharePercent: parseFloat((total * 100).toFixed(2))
  }
}
