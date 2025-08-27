import {
  Connection,
  PublicKey,
  ParsedInstruction,
  ParsedTransactionWithMeta,
  Commitment,
} from "@solana/web3.js"

const DEFAULT_RPC = "https://api.mainnet-beta.solana.com"
const TOKEN_PROGRAM_ID = new PublicKey("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA")

export interface NewTokenOptions {
  /** Custom connection (default: mainnet-beta) */
  connection?: Connection
  /** Commitment for RPC calls (default: "confirmed") */
  commitment?: Commitment
  /** Consider “new” if created within this many days (default: 3) */
  withinDays?: number
  /** Max signatures to scan before giving up (default: 2000) */
  maxSignatures?: number
}

/**
 * Heuristic: a token mint is “new” if we can find an InitializeMint{,2}
 * transaction whose blockTime is within `withinDays`.
 *
 * Notes:
 * - Solana accounts don’t store creation timestamps. We approximate the mint
 *   creation time by scanning the transaction history of the mint address and
 *   looking for the initialize instruction (or, failing that, oldest tx time).
 * - This uses pagination via `before` to walk back in time up to `maxSignatures`.
 */
export async function isNewToken(mint: string, opts: NewTokenOptions = {}): Promise<boolean> {
  const connection =
    opts.connection ?? new Connection(DEFAULT_RPC, { commitment: opts.commitment ?? "confirmed" })
  const withinDays = opts.withinDays ?? 3
  const maxSignatures = Math.max(100, Math.floor(opts.maxSignatures ?? 2000))

  const mintKey = new PublicKey(mint)
  const nowSec = Math.floor(Date.now() / 1000)
  const thresholdSec = withinDays * 24 * 60 * 60

  // Try to find the initializeMint tx and use its blockTime
  const createdAt = await findMintCreationTimeSec(connection, mintKey, maxSignatures)
  if (createdAt !== undefined && createdAt > 0) {
    return nowSec - createdAt <= thresholdSec
  }

  // Fallback: use the oldest observed tx time for this address (approximation)
  const oldest = await oldestSignatureTimeSec(connection, mintKey, maxSignatures)
  if (oldest !== undefined && oldest > 0) {
    return nowSec - oldest <= thresholdSec
  }

  // If we couldn't find any history, treat as not-new (or choose to treat as new).
  return false
}

/* ----------------------------- helpers ----------------------------- */

async function findMintCreationTimeSec(
  connection: Connection,
  mintKey: PublicKey,
  maxSignatures: number
): Promise<number | undefined> {
  let before: string | undefined = undefined
  let scanned = 0

  while (scanned < maxSignatures) {
    const sigs = await connection.getSignaturesForAddress(mintKey, { before, limit: 100 })
    if (sigs.length === 0) break
    scanned += sigs.length
    // Scan this page (newest → oldest). We want earliest initializeMint,
    // so iterate from oldest to newest in the page to short-circuit earlier.
    for (let i = sigs.length - 1; i >= 0; i--) {
      const sig = sigs[i]
      const tx = await connection.getParsedTransaction(sig.signature, { commitment: "confirmed" })
      const t = parseInitializeMintTime(tx, mintKey)
      if (t !== undefined) return t
    }
    before = sigs[sigs.length - 1].signature
  }

  return undefined
}

function parseInitializeMintTime(
  tx: ParsedTransactionWithMeta | null,
  mintKey: PublicKey
): number | undefined {
  if (!tx) return undefined
  const blockTime = tx.blockTime ?? undefined
  const ixs = (tx.transaction.message.instructions ?? []) as ParsedInstruction[]

  for (const ix of ixs) {
    // Only consider SPL Token Program
    const programId = (ix as any).programId
    if (programId && programId.toBase58 && programId.toBase58() !== TOKEN_PROGRAM_ID.toBase58()) continue
    const parsed: any = (ix as any).parsed
    if (!parsed) continue
    const type = parsed.type
    if (type === "initializeMint" || type === "initializeMint2") {
      const info = parsed.info || {}
      const mintStr: string | undefined = info.mint
      if (mintStr && mintStr === mintKey.toBase58()) {
        return blockTime
      }
    }
  }

  return undefined
}

async function oldestSignatureTimeSec(
  connection: Connection,
  key: PublicKey,
  maxSignatures: number
): Promise<number | undefined> {
  let before: string | undefined = undefined
  let oldest: number | undefined = undefined
  let scanned = 0

  while (scanned < maxSignatures) {
    const sigs = await connection.getSignaturesForAddress(key, { before, limit: 100 })
    if (sigs.length === 0) break
    scanned += sigs.length
    // last element is oldest in this page
    const last = sigs[sigs.length - 1]
    if (last.blockTime && (oldest === undefined || last.blockTime < oldest)) {
      oldest = last.blockTime
    }
    before = last.signature
  }
  return oldest
}
