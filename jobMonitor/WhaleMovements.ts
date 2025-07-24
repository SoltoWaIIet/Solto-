import { EventEmitter } from "events"
import { z } from "zod"

// Schema to validate Metrics
const metricsSchema = z.object({
  timestamp: z.number().int().nonnegative(),
  solBalance: z.number().nonnegative(),
  tokenCount: z.number().int().nonnegative(),
})

export interface Metrics {
  timestamp: number
  solBalance: number
  tokenCount: number
}

// Summary result type
export interface MetricsSummary {
  totalRecords: number
  avgSol: number
  avgTokens: number
  minSol: number | null
  maxSol: number | null
  minTokens: number | null
  maxTokens: number | null
}

/**
 * MetricsCore records time-series metrics and provides summaries
 */
export class MetricsCore extends EventEmitter {
  private history: Metrics[] = []
  private maxHistoryLength: number | null

  /**
   * @param maxHistoryLength Optional cap on stored history; null for unlimited
   */
  constructor(maxHistoryLength: number | null = null) {
    super()
    this.maxHistoryLength = maxHistoryLength
  }

  /**
   * Record a new metrics entry. Emits 'recorded'.
   */
  public record(m: Metrics): void {
    const parsed = metricsSchema.parse(m)
    this.history.push(parsed)
    // enforce max length
    if (
      this.maxHistoryLength !== null &&
      this.history.length > this.maxHistoryLength
    ) {
      this.history.shift()
    }
    this.emit("recorded", parsed)
  }

  /**
   * Get the most recent metrics entry, or null if none
   */
  public latest(): Metrics | null {
    return this.history.length
      ? this.history[this.history.length - 1]
      : null
  }

  /**
   * Compute summary statistics over recorded history
   */
  public summary(): MetricsSummary {
    const data = this.history
    const total = data.length
    if (total === 0) {
      return {
        totalRecords: 0,
        avgSol: 0,
        avgTokens: 0,
        minSol: null,
        maxSol: null,
        minTokens: null,
        maxTokens: null,
      }
    }
    let sumSol = 0
    let sumTokens = 0
    let minSol = Infinity
    let maxSol = -Infinity
    let minTokens = Infinity
    let maxTokens = -Infinity

    for (const { solBalance, tokenCount } of data) {
      sumSol += solBalance
      sumTokens += tokenCount
      if (solBalance < minSol) minSol = solBalance
      if (solBalance > maxSol) maxSol = solBalance
      if (tokenCount < minTokens) minTokens = tokenCount
      if (tokenCount > maxTokens) maxTokens = tokenCount
    }

    return {
      totalRecords: total,
      avgSol: sumSol / total,
      avgTokens: sumTokens / total,
      minSol,
      maxSol,
      minTokens,
      maxTokens,
    }
  }

  /**
   * Clears recorded history. Emits 'cleared'.
   */
  public clear(): void {
    this.history = []
    this.emit("cleared")
  }

  /**
   * Get a deep copy of history
   */
  public getHistory(): Metrics[] {
    return [...this.history]
  }
}
