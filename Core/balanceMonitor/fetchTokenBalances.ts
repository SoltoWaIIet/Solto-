import { Connection, PublicKey, Commitment } from "@solana/web3.js"
import { TokenBalance } from "./dataModels"

// Default RPC (can be overridden via options)
const RPC_ENDPOINT = "https://api.mainnet-beta.solana.com"

// SPL Token Program IDs
const TOKEN_PROGRAM_ID = new PublicKey("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA")
const TOKEN_2022_PROGRAM_ID = new PublicKey("TokenzQdBNbLqP5VEh9bWDAbT2y1NRtq6xhZzLZf2Fr")

const defaultConnection = new Connection(RPC_ENDPOINT, "confirmed")

type FetchOpts = {
  endpoint?: string
  commitment?: Commitment
  /** include zero-balance mints (default: false) */
  includeZeroBalances?: boolean
  /** include Token-2022 balances (default: true) */
  includeToken2022?: boolean
}

/**
 * Fetch SPL (and optionally Token-2022) balances for a wallet.
 * - Aggregates across multiple token accounts per mint
 * - Uses uiAmountString when available, falls back to raw amount/decimals
 * - Returns balances sorted by amount desc
 */
export async function fetchTokenBalances(
  walletAddress: string,
  opts: FetchOpts = {}
): Promise<TokenBalance[]> {
  const {
    endpoint = RPC_ENDPOINT,
    commitment = "confirmed",
    includeZeroBalances = false,
    includeToken2022 = true,
  } = opts

  let owner: PublicKey
  try {
    owner = new PublicKey(walletAddress)
  } catch {
    throw new Error("Invalid wallet address (not a valid base58 PublicKey)")
  }

  const conn =
    endpoint === RPC_ENDPOINT && commitment === "confirmed"
      ? defaultConnection
      : new Connection(endpoint, commitment)

  const programs = [TOKEN_PROGRAM_ID, ...(includeToken2022 ? [TOKEN_2022_PROGRAM_ID] : [])]

  // Fetch parsed token accounts for each program id
  const resultArrays = await Promise.all(
    programs.map((programId) =>
      conn.getParsedTokenAccountsByOwner(
        owner,
        { programId },
        { commitment }
      )
    )
  )

  // Aggregate by mint
  const byMint = new Map<
    string,
    { amount: number; decimals: number }
  >()

  for (const res of resultArrays) {
    for (const { account } of res.value) {
      const parsed = (account.data as any)?.parsed?.info
      if (!parsed) continue

      const mint: string = parsed.mint
      const tokenAmount = parsed.tokenAmount
      const decimals: number = Number(tokenAmount?.decimals ?? 0)

      // Prefer uiAmountString when present and finite
      const uiStr = tokenAmount?.uiAmountString
      let amt = Number.isFinite(Number(uiStr))
        ? parseFloat(uiStr)
        : Number(tokenAmount?.amount) / Math.pow(10, decimals)

      if (!Number.isFinite(amt)) amt = 0

      const prev = byMint.get(mint)
      if (prev) {
        prev.amount += amt
        // decimals should be consistent per mint; keep existing
      } else {
        byMint.set(mint, { amount: amt, decimals })
      }
    }
  }

  // Build output
  let balances: TokenBalance[] = Array.from(byMint.entries())
    .map(([tokenMint, v]) => ({
      tokenMint,
      amount: v.amount,
      decimals: v.decimals,
      owner: walletAddress,
    }))

  if (!includeZeroBalances) {
    balances = balances.filter((b) => Math.abs(b.amount) > 0)
  }

  // Sort by amount desc, then mint address
  balances.sort(
    (a, b) => b.amount - a.amount || a.tokenMint.localeCompare(b.tokenMint)
  )

  return balances
}
