import { z } from "zod"
import { getOrderBookSnapshot } from "@/solto/integrations/dexScreener"

export const OrderBookSchema = z.object({
  tokenMint: z.string()
})

export type OrderBookPayload = z.infer<typeof OrderBookSchema>

export async function getTokenOrderBook(payload: OrderBookPayload) {
  const { tokenMint } = payload
  const orderBook = await getOrderBookSnapshot(tokenMint)

  const askDepth = orderBook.asks.slice(0, 10).map(level => ({
    price: level.price,
    quantity: level.size
  }))

  const bidDepth = orderBook.bids.slice(0, 10).map(level => ({
    price: level.price,
    quantity: level.size
  }))

  return {
    spread: Math.abs(bidDepth[0].price - askDepth[0].price),
    askDepth,
    bidDepth,
    topAsk: askDepth[0],
    topBid: bidDepth[0]
  }
}
