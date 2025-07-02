export function computeVolatility(prices: number[]): number {
  const avg = prices.reduce((a, b) => a + b, 0) / prices.length
  const variance = prices.reduce((acc, p) => acc + Math.pow(p - avg, 2), 0) / prices.length
  return Math.sqrt(variance)
}
