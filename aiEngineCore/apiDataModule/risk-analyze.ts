import axios from "axios"

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

export async function fetchDexTokenData(mintAddress: string): Promise<RiskProfile | null> {
  try {
    const response = await axios.get(`https://api.dexscreener.com/latest/dex/pairs/solana/${mintAddress}`)
    const data = response.data.pairs?.[0]

    if (!data) return null

    const liquidityUSD = parseFloat(data.liquidity?.usd || "0")
    const volumeUSD = parseFloat(data.volume?.h24 || "0")
    const buyersCount = parseInt(data.txns?.h24?.buys || "0")
    const priceChangePct = parseFloat(data.priceChange?.h24 || "0")

    let risk: "Low" | "Moderate" | "High" = "Low"
    let reason = ""

    if (liquidityUSD < 10000) {
      risk = "High"
      reason = "Very low liquidity"
    } else if (volumeUSD < 5000) {
      risk = "Moderate"
      reason = "Low volume detected"
    } else if (priceChangePct < -50) {
      risk = "High"
      reason = "Sudden price dump"
    } else if (buyersCount < 10) {
      risk = "Moderate"
      reason = "Low trader interest"
    }

    const confidence = Math.max(0.5, 1 - Math.abs(priceChangePct) / 100)

    return {
      liquidityUSD,
      volume24hUSD: volumeUSD,
      priceChangePct,
      buyersCount,
      confidence: parseFloat(confidence.toFixed(2)),
      riskLevel: risk,
      reason
    }
  } catch (error) {
    console.error("DexScreener fetch failed:", error)
    return null
  }
}
