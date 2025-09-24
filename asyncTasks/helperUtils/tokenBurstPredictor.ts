export interface BurstAnalysis {
  isBurst: boolean
  avgInterval: number
  medianInterval: number
  fastTxs: number
  totalIntervals: number
}

export function detectBurstPattern(
  txTimes: number[],
  opts: { fastFactor?: number; threshold?: number } = {}
): BurstAnalysis {
  const { fastFactor = 0.5, threshold = 0.6 } = opts

  if (txTimes.length < 2) {
    return {
      isBurst: false,
      avgInterval: 0,
      medianInterval: 0,
      fastTxs: 0,
      totalIntervals: 0,
    }
  }

  const intervals: number[] = []
  for (let i = 1; i < txTimes.length; i++) {
    intervals.push(txTimes[i] - txTimes[i - 1])
  }

  const avgInterval =
    intervals.reduce((a, b) => a + b, 0) / intervals.length

  const sorted = [...intervals].sort((a, b) => a - b)
  const medianInterval =
    sorted.length % 2 === 0
      ? (sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2
      : sorted[Math.floor(sorted.length / 2)]

  const fastTxs = intervals.filter(i => i < avgInterval * fastFactor).length
  const ratio = fastTxs / intervals.length

  return {
    isBurst: ratio > threshold,
    avgInterval,
    medianInterval,
    fastTxs,
    totalIntervals: intervals.length,
  }
}
