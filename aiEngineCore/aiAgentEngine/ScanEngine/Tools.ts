// Tools.ts — Solto AI: Utility Functions for Token Metrics

import axios from "axios"

const DEXSCREENER_ENDPOINT = "https://api.dexscreener.com/latest/dex/pairs/solana"

export interface SolanaTokenMetrics {
  volatility24h: number
  liquidityChange24h: number
  smartWalletHits: number
}

// Fetches token metrics using DexScreener public API
export async function getTokenStats(mint: string): Promise<SolanaTokenMetrics> {
  try {
    const { data } = await axios.get(\`\${DEXSCREENER_ENDPOINT}/\${mint}\`)

    const priceData = data.pair

    return {
      volatility24h: priceData.priceChange.h24 || 0,
      liquidityChange24h: priceData.liquidityChange || -100,
      smartWalletHits: priceData.smartMoneyCount || 0
    }
  } catch (e) {
    console.error("Failed to fetch token stats:", e)
    return {
      volatility24h: 0,
      liquidityChange24h: 0,
      smartWalletHits: 0
    }
  }
}