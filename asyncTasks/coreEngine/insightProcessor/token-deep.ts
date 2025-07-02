import { Connection, PublicKey } from "@solana/web3.js"

export async function analyzeTokenDepth(
  connection: Connection,
  mint: string
): Promise<{ largestHolders: string[]; top5Sum: number }> {
  const largestAccounts = await connection.getTokenLargestAccounts(new PublicKey(mint))
  const holderInfos = await Promise.all(
    largestAccounts.value.slice(0, 5).map(async acc =>
      connection.getTokenAccountBalance(acc.address)
    )
  )

  const top5Sum = holderInfos.reduce((sum, acc) => sum + parseFloat(acc.value.amount), 0)
  const top5 = largestAccounts.value.slice(0, 5).map(acc => acc.address.toBase58())

  return {
    largestHolders: top5,
    top5Sum
  }
}
