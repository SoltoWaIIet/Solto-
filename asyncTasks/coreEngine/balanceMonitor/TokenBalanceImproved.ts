import { Connection, PublicKey } from "@solana/web3.js"

/**
 * Fetches the total SPL token balance for a given wallet and token mint
 * @param connection Solana RPC connection
 * @param account Wallet address (base58)
 * @param mint Token mint address (base58)
 * @returns Total token balance as number
 */
export async function getTokenBalance(
  connection: Connection,
  account: string,
  mint: string
): Promise<number> {
  try {
    if (!account || !mint) throw new Error("Account and mint addresses are required")

    const owner = new PublicKey(account)
    const mintAddress = new PublicKey(mint)

    const response = await connection.getParsedTokenAccountsByOwner(owner, { mint: mintAddress })

    if (!response.value.length) return 0

    const total = response.value.reduce((sum, acc) => {
      const amount = acc.account.data.parsed.info.tokenAmount
      return sum + parseFloat(amount.uiAmountString || "0")
    }, 0)

    return total
  } catch (err) {
    console.error("Error fetching token balance:", err)
    return 0
  }
}
