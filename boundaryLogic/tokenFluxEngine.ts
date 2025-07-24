import { z } from "zod"

// Validate input array of numbers
const volumeSeriesSchema = z
  .array(z.number())
  .refine(arr => arr.length >= 2, { message: "At least 2 data points required" })

/**
 * Calculate the average absolute delta ("flux") between consecutive volumes
 */
export function calculateFlux(volumeSeries: number[]): number {
  // Validate input
  volumeSeriesSchema.parse(volumeSeries)

  // Compute total absolute differences
  const totalDelta = volumeSeries.reduce((sum, current, idx, arr) => {
    if (idx === 0) return 0
    return sum + Math.abs(current - arr[idx - 1])
  }, 0)

  // Average over number of intervals (length - 1)
  return totalDelta / (volumeSeries.length - 1)
}
