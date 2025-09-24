export interface EntropyResult {
  entropy: number        // Shannon entropy
  normalized: number     // entropy / maxEntropy, in [0,1]
  counts: Record<string, number>
}

export function calculateEntropy(data: string[]): EntropyResult {
  if (data.length === 0) {
    return { entropy: 0, normalized: 0, counts: {} }
  }

  const counts: Record<string, number> = {}
  for (const value of data) {
    counts[value] = (counts[value] || 0) + 1
  }

  const total = data.length
  let entropy = 0
  for (const count of Object.values(counts)) {
    const p = count / total
    entropy += -p * Math.log2(p)
  }

  const maxEntropy = Math.log2(Object.keys(counts).length)
  const normalized = maxEntropy > 0 ? entropy / maxEntropy : 0

  return { entropy, normalized, counts }
}
