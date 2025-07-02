type MetricSnapshot = {
  timestamp: string
  txCount: number
  liquidity: number
  volatility: number
  sentiment?: number
}

const METRIC_WINDOW = 20
const cache: Record<string, MetricSnapshot[]> = {}

export function pushMetric(token: string, snapshot: MetricSnapshot) {
  if (!cache[token]) cache[token] = []
  cache[token].push({ ...snapshot, timestamp: new Date().toISOString() })
  if (cache[token].length > METRIC_WINDOW) cache[token].shift()
}

export function getRecentMetrics(token: string): MetricSnapshot[] {
  return cache[token] || []
}
