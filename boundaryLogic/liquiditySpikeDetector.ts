export function detectLiquiditySpike(prev: number, curr: number): boolean {
  const threshold = 2.0 // 2x spike
  return curr > prev * threshold
}
