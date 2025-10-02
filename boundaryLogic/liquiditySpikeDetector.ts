/**
 * Detects whether a liquidity spike occurred
 * A "spike" means the current value exceeds the previous by a multiple threshold
 */
export function detectLiquiditySpike(
  prev: number,
  curr: number,
  options: { thresholdMultiplier?: number; minDelta?: number } = {}
): boolean {
  const threshold = options.thresholdMultiplier ?? 2.0 // default 2x
  const minDelta = options.minDelta ?? 0 // optional absolute delta requirement

  if (prev <= 0 || curr <= 0) return false

  const ratio = curr / prev
  const delta = curr - prev

  return ratio >= threshold && delta >= minDelta
}

/**
 * Calculate spike magnitude (ratio and delta) for reporting
 */
export function getLiquiditySpikeMagnitude(prev: number, curr: number): {
  ratio: number
  delta: number
  spiked: boolean
} {
  if (prev <= 0) {
    return { ratio: 0, delta: 0, spiked: false }
  }
  const ratio = curr / prev
  const delta = curr - prev
  return { ratio, delta, spiked: ratio >= 2.0 }
}

/*
filename suggestions
- liquidity_spike_detector.ts
- liquidity_spike_utils.ts
- liquidity_spike_analysis.ts
*/
