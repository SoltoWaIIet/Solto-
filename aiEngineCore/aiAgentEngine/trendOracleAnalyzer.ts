// Trend Oracle Module — analyzes price patterns and detects upward or downward trends

export interface TrendSignal {
  trendDirection: "up" | "down" | "neutral"
  momentumScore: number
  anomalyDetected: boolean
}

export function analyzeTrend(prices: number[]): TrendSignal {
  if (prices.length < 5) {
    return { trendDirection: "neutral", momentumScore: 0, anomalyDetected: false }
  }

  const deltas = prices.slice(1).map((p, i) => p - prices[i])
  const avgChange = deltas.reduce((a, b) => a + b, 0) / deltas.length
  const stdDev = Math.sqrt(deltas.map(d => (d - avgChange) ** 2).reduce((a, b) => a + b) / deltas.length)

  const direction = avgChange > 0.01 ? "up" : avgChange < -0.01 ? "down" : "neutral"
  const momentum = Math.min(Math.abs(avgChange * 100), 100)
  const anomaly = stdDev > 2.5

  return {
    trendDirection: direction,
    momentumScore: parseFloat(momentum.toFixed(2)),
    anomalyDetected: anomaly
  }
}
