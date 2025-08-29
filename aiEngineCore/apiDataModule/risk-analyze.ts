import axios, { AxiosError } from "axios"

interface TokenInsight {
  symbol: string
  address: string
  baseToken: string
  chainId: string
}

interface RiskProfile {
  liquidityUSD: number
  volume24hUSD: number
  priceChangePct: number
  buyersCount: number
  confidence: number
  riskLevel: "Low" | "Moderate" | "High"
  reason: string
}

type DexPair = {
  chainId?: string
  pairAddress?: string
  baseToken?: { address?: string; symbol?: string }
  quoteToken?: { address?: string; symbol?: string }
  liquidity?: { usd?: number | string }
  volume?: { h24?: number | string }
  txns?: { h24?: { buys?: number | string } }
  priceChange?: { h24?: number | string }
}

/** Optional knobs for fetching & scoring */
export interface FetchDexTokenOptions {
  timeoutMs?: number         // default 6000
  retries?: number           // default 2 (total attempts = retries + 1)
  backoffMs?: number         // default 300 (quadratic backoff)
  chainId?: string           // default "solana"
  minLiquidityUSD?: number   // default 10_000
  minVolumeUSD?: number      // default 5_000
  minBuyers?: number         // default 10
  dumpThresholdPct?: number  // default -50
  userAgent?: string
}

/** Utility sleep */
const sleep = (ms: number) => new Promise(r => setTimeout(r, ms))

/** Parse a possibly-string numeric field safely */
function asNum(v: unknown, fallback = 0): number {
  const n =
    typeof v === "number" ? v :
    typeof v === "string" ? Number(v) :
    NaN
  return Number.isFinite(n) ? n : fallback
}

/** Pick the "best" pair for the mint: prefer same chainId, highest liquidity, then volume */
function selectBestPair(pairs: DexPair[], mint: string, chainId = "solana"): DexPair | null {
  const filtered = pairs
    .filter(p =>
      (p.chainId ?? chainId) === chainId &&
      (p.baseToken?.address === mint || p.pairAddress === mint || p.baseToken?.symbol)
    )
  if (filtered.length === 0) return null
  return filtered
    .sort((a, b) => {
      const la = asNum(a.liquidity?.usd)
      const lb = asNum(b.liquidity?.usd)
      if (lb !== la) return lb - la
      const va = asNum(a.volume?.h24)
      const vb = asNum(b.volume?.h24)
      return vb - va
    })[0]!
}

/** Compute risk level + reason list using simple rules */
function assessRisk(
  liquidityUSD: number,
  volumeUSD: number,
  buyersCount: number,
  priceChangePct: number,
  {
    minLiquidityUSD = 10_000,
    minVolumeUSD = 5_000,
    minBuyers = 10,
    dumpThresholdPct = -50,
  }: FetchDexTokenOptions
): { level: RiskProfile["riskLevel"]; reason: string } {
  const reasons: string[] = []
  let level: RiskProfile["riskLevel"] = "Low"

  if (liquidityUSD < minLiquidityUSD) {
    reasons.push("Very low liquidity")
    level = "High"
  }

  if (priceChangePct <= dumpThresholdPct) {
    reasons.push("Sudden price dump")
    level = "High"
  }

  if (volumeUSD < minVolumeUSD) {
    reasons.push("Low volume")
    if (level !== "High") level = "Moderate"
  }

  if (buyersCount < minBuyers) {
    reasons.push("Low buyer count")
    if (level !== "High") level = "Moderate"
  }

  if (reasons.length === 0) reasons.push("No obvious red flags")
  return { level, reason: reasons.join("; ") }
}

/** Confidence blends liquidity/volume/buyers/stability into [0,1] */
function computeConfidence(
  liquidityUSD: number,
  volumeUSD: number,
  buyersCount: number,
  priceChangePct: number,
  {
    minLiquidityUSD = 10_000,
    minVolumeUSD = 5_000,
    minBuyers = 10,
  }: FetchDexTokenOptions
): number {
  const clamp = (x: number, a = 0, b = 1) => Math.min(Math.max(x, a), b)

  const wL = 0.35
  const wV = 0.25
  const wB = 0.20
  const wS = 0.20

  const cL = clamp(liquidityUSD / (minLiquidityUSD * 2))
  const cV = clamp(volumeUSD / (minVolumeUSD * 2))
  const cB = clamp(buyersCount / (minBuyers * 2))
  const cS = clamp(1 - Math.abs(priceChangePct) / 100)

  const score = wL * cL + wV * cV + wB * cB + wS * cS
  return Math.round(score * 100) / 100
}

/**
 * Fetch token data from Dexscreener and compute a RiskProfile.
 * - Robust parsing
 * - Simple retry with quadratic backoff
 * - Tunable thresholds & timeouts
 */
export async function fetchDexTokenData(
  mintAddress: string,
  opts: FetchDexTokenOptions = {}
): Promise<RiskProfile | null> {
  const {
    timeoutMs = 6000,
    retries = 2,
    backoffMs = 300,
    chainId = "solana",
    minLiquidityUSD = 10_000,
    minVolumeUSD = 5_000,
    minBuyers = 10,
    dumpThresholdPct = -50,
    userAgent = "dex-risk-fetcher/1.0",
  } = opts

  const url = `https://api.dexscreener.com/latest/dex/pairs/${encodeURIComponent(chainId)}/${encodeURIComponent(
    mintAddress
  )}`

  let lastErr: any
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await axios.get<{ pairs?: DexPair[] }>(url, {
        timeout: timeoutMs,
        headers: { "User-Agent": userAgent },
        validateStatus: () => true, // handle non-2xx below
      })

      if (res.status === 404) return null
      if (res.status < 200 || res.status >= 300) {
        throw new Error(`HTTP ${res.status}`)
      }

      const pairs = Array.isArray(res.data?.pairs) ? res.data!.pairs! : []
      if (pairs.length === 0) return null

      const best = selectBestPair(pairs, mintAddress, chainId)
      if (!best) return null

      const liquidityUSD = asNum(best.liquidity?.usd)
      const volumeUSD = asNum(best.volume?.h24)
      const buyersCount = asNum(best.txns?.h24?.buys)
      const priceChangePct = asNum(best.priceChange?.h24)

      const { level, reason } = assessRisk(liquidityUSD, volumeUSD, buyersCount, priceChangePct, {
        minLiquidityUSD,
        minVolumeUSD,
        minBuyers,
        dumpThresholdPct,
      })

      const confidence = computeConfidence(liquidityUSD, volumeUSD, buyersCount, priceChangePct, {
        minLiquidityUSD,
        minVolumeUSD,
        minBuyers,
      })

      return {
        liquidityUSD,
        volume24hUSD: volumeUSD,
        priceChangePct,
        buyersCount,
        confidence,
        riskLevel: level,
        reason,
      }
    } catch (err) {
      lastErr = err
      const ax = err as AxiosError
      const status = ax.response?.status ?? 0
      const retriable =
        attempt < retries &&
        (ax.code === "ECONNABORTED" ||
          ax.code === "ECONNRESET" ||
          ax.code === "ENOTFOUND" ||
          status === 408 ||
          status === 429 ||
          (status >= 500 && status <= 599))

      if (!retriable) {
        console.error("DexScreener fetch failed:", ax.message || err)
        break
      }
      const delay = Math.min(backoffMs * (attempt + 1) * (attempt + 1), 10_000) + Math.floor(Math.random() * 150)
      await sleep(delay)
    }
  }

  console.error("DexScreener fetch failed:", lastErr?.message ?? lastErr)
  return null
}
