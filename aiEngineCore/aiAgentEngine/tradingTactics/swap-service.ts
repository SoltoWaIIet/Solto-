import { fetchMarketData } from "@/api/dexscreener"

export const SoltoSwapService = {
  async getSwapData(fromMint, toMint, amount) {
    const market = await fetchMarketData(fromMint)
    if (!market || !market.pairs[toMint]) return { error: "Market not available" }

    const pair = market.pairs[toMint]
    const outputAmount = amount * pair.rate
    return {
      estimatedOut: outputAmount.toFixed(3),
      route: pair.route,
      slippageWarning: pair.slippage > 5
    }
  }
}