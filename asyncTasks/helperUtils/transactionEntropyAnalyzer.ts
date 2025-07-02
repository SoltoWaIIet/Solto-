export function calculateEntropy(data: string[]): number {
  const freq: Record<string, number> = {}
  data.forEach(value => {
    freq[value] = (freq[value] || 0) + 1
  })

  const total = data.length
  return -Object.values(freq)
    .map(f => f / total)
    .reduce((sum, p) => sum + p * Math.log2(p), 0)
}
