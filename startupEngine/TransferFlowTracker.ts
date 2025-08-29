import { Connection, PublicKey, Commitment } from "@solana/web3.js"
import { z } from "zod"

/* --------------------------- schema & types --------------------------- */

const trackParamsSchema = z.object({
  mint: z.string().refine((s) => {
    try {
      new PublicKey(s)
      return true
    } catch {
      return false
    }
  }, { message: "Invalid mint address" }),

  /** How many recent slots to scan from the current tip (default: 50) */
  maxSlots: z.number().int().nonnegative().default(50),

  /** RPC commitment for all calls (default: "confirmed") */
  commitment: z.custom<Commitment>().optional().default("confirmed"),

  /** Scan inner instructions (default: true) */
  includeInner: z.boolean().optional().default(true),

  /** Also detect Token-2022 transfers (default: true) */
  includeToken2022: z.boolean().optional().default(true),

  /** Concurrency for getBlock calls (default: 5) */
  concurrency: z.number().int().positive().max(20).optional().default(5),

  /** Normalize token amount by mint decimals (default: true) */
  normalizeByDecimals: z.boolean().optional().default(true),

  /** Suspicious threshold (applies to normalized amount when normalizeByDecimals=true) */
  suspiciousAmount: z.number().nonnegative().optional().default(1_000_000),

  /** Optionally start from a specific slot (inclusive). If provided, maxSlots is ignored. */
  fromSlot: z.number().int().nonnegative().optional(),
  /** Optionally end at a specific slot (inclusive). If omitted, uses current slot */
  toSlot: z.number().int().nonnegative().optional(),
})

interface FlowSummary {
  token: string
  amountUnit: "ui" | "raw"
  decimals: number | null
  scanned: { fromSlot: number; toSlot: number; slots: number }
  totalTransfers: number           // sum of transferred amount across all txs (kept for backwards-compat; now "amount sum")
  transferCount: number            // number of transfer instructions observed
  topSenders: string[]
  topReceivers: string[]
  suspiciousFlows: string[]        // formatted "source→destination@amount"
}

/* ------------------------------ constants ----------------------------- */

const TOKEN_PROGRAM = new PublicKey("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA")
const TOKEN_2022_PROGRAM = new PublicKey("TokenzQdBJF9zvXh8Mn1fN2R1VhZrxTT3zB1k2XfG1h")

/* ------------------------------ utilities ----------------------------- */

function mapLimit<T, R>(
  items: readonly T[],
  limit: number,
  fn: (item: T, index: number) => Promise<R>
): Promise<R[]> {
  const out: R[] = new Array(items.length)
  let i = 0
  let active = 0

  return new Promise((resolve, reject) => {
    const next = () => {
      if (i >= items.length && active === 0) return resolve(out)
      while (active < limit && i < items.length) {
        const idx = i++
        active++
        fn(items[idx]!, idx)
          .then((r) => {
            out[idx] = r
            active--
            next()
          })
          .catch(reject)
      }
    }
    next()
  })
}

function safeNumber(x: unknown): number {
  const n = typeof x === "number" ? x : typeof x === "string" ? Number(x) : NaN
  return Number.isFinite(n) ? n : 0
}

/* ------------------------------- main fn ------------------------------ */

/**
 * Scan recent slots for SPL token transfers of a specific mint and return a JSON summary string.
 *
 * Improvements over the original:
 * - Concurrency & batching for getBlock
 * - Optional support for Token-2022 program
 * - Counts both top-level and inner instructions
 * - Optional normalization by mint decimals
 * - Returns both amount sum ("totalTransfers") and instruction count ("transferCount")
 * - Safer parsing & error handling
 */
export async function trackTransferFlowRaw(
  connection: Connection,
  params: unknown
): Promise<string> {
  const {
    mint,
    maxSlots,
    commitment,
    includeInner,
    includeToken2022,
    concurrency,
    normalizeByDecimals,
    suspiciousAmount,
    fromSlot,
    toSlot,
  } = trackParamsSchema.parse(params)

  const tokenMint = new PublicKey(mint)

  // Resolve scan window
  const tip = toSlot ?? (await connection.getSlot(commitment))
  const start = fromSlot ?? Math.max(0, tip - maxSlots + 1)
  const slotsToScan = tip >= start ? tip - start + 1 : 0
  if (slotsToScan === 0) {
    return JSON.stringify({
      token: tokenMint.toBase58(),
      amountUnit: normalizeByDecimals ? "ui" : "raw",
      decimals: null,
      scanned: { fromSlot: start, toSlot: tip, slots: 0 },
      totalTransfers: 0,
      transferCount: 0,
      topSenders: [],
      topReceivers: [],
      suspiciousFlows: [],
    } as FlowSummary)
  }

  // Fetch decimals (optional)
  let decimals: number | null = null
  if (normalizeByDecimals) {
    try {
      const acc = await connection.getParsedAccountInfo(tokenMint, commitment)
      const d = (acc.value as any)?.data?.parsed?.info?.decimals
      if (Number.isFinite(d)) decimals = Number(d)
    } catch {
      // ignore; keep as null -> amounts will fall back to raw units
      decimals = null
    }
  }

  const denom = normalizeByDecimals && decimals !== null ? 10 ** decimals : 1
  const amountUnit: FlowSummary["amountUnit"] = normalizeByDecimals && decimals !== null ? "ui" : "raw"

  // Aggregation maps
  const senderMap = new Map<string, number>()
  const receiverMap = new Map<string, number>()
  const suspicious = new Set<string>()

  let amountSum = 0
  let transferCount = 0

  // Build slot list (newest -> oldest for faster short-circuit in future changes)
  const slots: number[] = []
  for (let s = tip; s >= start; s--) slots.push(s)

  await mapLimit(slots, concurrency, async (slot) => {
    let block: Awaited<ReturnType<Connection["getBlock"]>> | null = null
    try {
      block = await connection.getBlock(slot, {
        commitment,
        maxSupportedTransactionVersion: 0,
      })
    } catch {
      return
    }
    if (!block) return

    for (const tx of block.transactions) {
      const sig = tx.transaction.signatures[0]
      if (!sig) continue

      // gather candidate instruction arrays
      const topLevel = tx.transaction.message.instructions ?? []
      const innerGroups = includeInner ? tx.meta?.innerInstructions ?? [] : []
      const inner = includeInner
        ? innerGroups.flatMap((g) => (g.instructions as any[] | undefined) ?? [])
        : []

      const allInstrs = [...topLevel, ...inner]

      for (const ix of allInstrs) {
        if (!("parsed" in ix)) continue

        const isTokenProgram =
          ix.programId?.equals?.(TOKEN_PROGRAM) ||
          (includeToken2022 && ix.programId?.equals?.(TOKEN_2022_PROGRAM))

        if (!isTokenProgram) continue

        const p: any = (ix as any).parsed
        const t = p?.type
        if (t !== "transfer" && t !== "transferChecked") continue

        const info: any = p?.info ?? {}
        const thisMint = info.mint ?? info?.token ?? info?.tokenMint
        if (thisMint !== tokenMint.toBase58()) continue

        const source = String(info.source ?? "")
        const destination = String(info.destination ?? "")
        if (!source || !destination) continue

        // amount extraction: prefer tokenAmount.amount for transferChecked
        const rawAmount =
          safeNumber(info.amount) ||
          safeNumber(info?.tokenAmount?.amount) ||
          0

        // normalize if we know decimals
        const amt = denom !== 1 ? rawAmount / denom : rawAmount

        // update aggregates
        amountSum += amt
        transferCount += 1
        senderMap.set(source, (senderMap.get(source) ?? 0) + amt)
        receiverMap.set(destination, (receiverMap.get(destination) ?? 0) + amt)

        if (amt >= suspiciousAmount) {
          suspicious.add(`${source}→${destination}@${amt}`)
        }
      }
    }
  })

  const topSenders = [...senderMap.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([addr]) => addr)

  const topReceivers = [...receiverMap.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([addr]) => addr)

  const summary: FlowSummary = {
    token: tokenMint.toBase58(),
    amountUnit,
    decimals,
    scanned: { fromSlot: start, toSlot: tip, slots: slotsToScan },
    totalTransfers: amountSum,    // kept name for backward-compat (represents amount sum)
    transferCount,                // new: number of transfer instructions
    topSenders,
    topReceivers,
    suspiciousFlows: Array.from(suspicious),
  }

  return JSON.stringify(summary)
}
