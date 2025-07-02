import { scanVolatilePairs } from "./dexPairScanner"

interface HotTokenSignal {
  token: string
  activityLevel: number
  price: number
  pair: string
}

export async function getHotTokenSignals(): Promise<HotTokenSignal[]> {
  const pairs = await scanVolatilePairs()

  return pairs.map((p) => ({
    token: p.name.split("/")[0],
    activityLevel: Math.round(p.score),
    price: p.priceUsd,
    pair: p.name,
  }))
}

export function formatHotTokenFeed(signals: HotTokenSignal[]): string[] {
  return signals.map((s) =>
    `🔥 ${s.token} — ${s.price.toFixed(4)} USD | activity: ${s.activityLevel}/100 | Pair: ${s.pair}`
  )
}
