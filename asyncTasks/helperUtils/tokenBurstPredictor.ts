export function detectBurstPattern(txTimes: number[]): boolean {
  const intervals = []
  for (let i = 1; i < txTimes.length; i++) {
    intervals.push(txTimes[i] - txTimes[i - 1])
  }
  const avg = intervals.reduce((a, b) => a + b, 0) / intervals.length
  const fastTxs = intervals.filter(i => i < avg * 0.5).length
  return fastTxs > intervals.length * 0.6
}
