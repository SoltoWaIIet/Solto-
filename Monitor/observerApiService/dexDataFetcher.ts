import axios from "axios"

const BASE_URL = "https://api.dexscreener.com/latest/dex/pairs/solana"

export async function fetchTopDexData(limit = 10) {
  try {
    const { data } = await axios.get(`${BASE_URL}?limit=${limit}`)
    if (!data.pairs) throw new Error("No pair data returned")
    
    return data.pairs.map((pair: any) => ({
      name: pair.baseToken.symbol + "/" + pair.quoteToken.symbol,
      priceUsd: parseFloat(pair.priceUsd),
      volume24h: parseFloat(pair.volume.h24),
      liquidityUsd: parseFloat(pair.liquidity.usd),
      pairAddress: pair.pairAddress,
    }))
  } catch (err) {
    console.error("Dex Fetch Error:", err)
    return []
  }
}
