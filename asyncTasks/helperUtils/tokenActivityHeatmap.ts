interface ActivityPoint {
  hour: number
  txCount: number
}

export function generateActivityHeatmap(transactions: { timestamp: number }[]): ActivityPoint[] {
  const heatmap: Record<number, number> = {}
  for (let i = 0; i < 24; i++) heatmap[i] = 0

  for (const tx of transactions) {
    const date = new Date(tx.timestamp)
    const hour = date.getUTCHours()
    heatmap[hour] += 1
  }

  return Object.entries(heatmap).map(([hour, txCount]) => ({
    hour: parseInt(hour),
    txCount,
  }))
}
