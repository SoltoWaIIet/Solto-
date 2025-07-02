import { Connection, PublicKey } from "@solana/web3.js"
import { TokenBalance } from "./dataModels"

const RPC_ENDPOINT = "https://api.mainnet-beta.solana.com"
const connection = new Connection(RPC_ENDPOINT, "confirmed")

export async function fetchTokenBalances(walletAddress: string): Promise<TokenBalance[]> {
  const publicKey = new PublicKey(walletAddress)
  const tokenAccounts = await connection.getParsedTokenAccountsByOwner(publicKey, {
    programId: new PublicKey()
  })

  return tokenAccounts.value.map((account) => {
    const parsed = account.account.data.parsed.info
    const amount = parseFloat(parsed.tokenAmount.uiAmountString)
    return {
      tokenMint: parsed.mint,
      amount,
      decimals: parsed.tokenAmount.decimals,
      owner: walletAddress
    }
  })
}
