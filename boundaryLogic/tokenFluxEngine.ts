export function calculateFlux(volumeSeries: number[]): number {
  if (volumeSeries.length < 2) return 0
  const deltas = volumeSeries.slice(1).map((v, i) => Math.abs(v - volumeSeries[i]))
  const averageDelta = deltas.reduce((a, b) => a + b, 0) / deltas.length
  return averageDelta
}
