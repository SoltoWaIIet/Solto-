import { EventEmitter } from "events"
import { z } from "zod"

/* -------------------------------- Schemas -------------------------------- */

const metricsSchema = z.object({
  timestamp: z.number().int().nonnegative(),
  solBalance: z.number().nonnegative(),
  tokenCount: z.number().int().nonnegative(),
})
export type Metrics = z.infer<typeof metricsSchema>

/* ------------------------------- Result Types ------------------------------ */

export interface MetricsSummary {
  totalRecords: number
  from: number | null
  to: number | null
  avgSol: number
  avgTokens: number
  minSol: number | null
  maxSol: number | null
  minTokens: number | null
  maxTokens: number | null
  medianSol: number | null
  medianTokens: number | null
  p90Sol: number | null
  p90Tokens: number | null
  stdSol: number
  stdTokens: number
}

/* --------------------------------- Options -------------------------------- */

export interface MetricsCoreOptions {
  /** Cap number of records; older ones are dropped (LRU). null = unlimited. Default null */
  maxHistoryLength?: number | null
  /** Auto-prune records older than this many ms on each write; 0/undefined disables */
  maxAgeMs?: number
  /** When true, invalid records throw; otherwise they are skipped. Default true */
  strict?: boolean
}

/* --------------------------------- Events --------------------------------- */

export type MetricsCoreEvents = {
  recorded: (entry: Metrics) => void
  recordedMany: (count: number) => void
  cleared: () => void
  pruned: (removed: number) => void
}

/* --------------------------------- Helpers -------------------------------- */

function quantile(sorted: number[], q: number): number | null {
  const n = sorted.length
  if (!n) return null
  if (n === 1) return sorted[0]
  const idx = (n - 1) * q
  const lo = Math.floor(idx)
  const hi = Math.ceil(idx)
  const h = idx - lo
  return sorted[lo] * (1 - h) + sorted[hi] * h
}

function variance(arr: number[], mean: number): number {
  if (arr.length <= 1) return 0
  let s = 0
  for (let i = 0; i < arr.length; i++) {
    const d = arr[i] - mean
    s += d * d
  }
  return s / (arr.length - 1) // sample variance
}

/* --------------------------------- Core ----------------------------------- */

export class MetricsCore extends EventEmitter {
  private history: Metrics[] = []
  private maxHistoryLength: number | null
  private readonly maxAgeMs?: number
  private readonly strict: boolean

  constructor(opts: MetricsCoreOptions = {}) {
    super()
    this.maxHistoryLength = opts.maxHistoryLength ?? null
    this.maxAgeMs = opts.maxAgeMs
    this.strict = opts.strict ?? true
  }

  /* ----------------------------- Write methods ---------------------------- */

  /** Record a new metrics entry. Emits 'recorded' and optional 'pruned'. */
  public record(m: Metrics): void {
    const parsed = this.parse(m)
    this.history.push(parsed)
    const removed = this.enforcePolicies()
    if (removed) this.emit("pruned", removed)
    this.emit("recorded", parsed)
  }

  /** Record many entries efficiently (assumed roughly chronological). */
  public recordMany(items: Metrics[]): void {
    let added = 0
    for (const m of items) {
      const parsed = this.parse(m, true)
      if (!parsed) continue
      this.history.push(parsed)
      added++
    }
    const removed = this.enforcePolicies()
    if (removed) this.emit("pruned", removed)
    if (added) this.emit("recordedMany", added)
  }

  /** Drop all history. Emits 'cleared'. */
  public clear(): void {
    this.history = []
    this.emit("cleared")
  }

  /** Remove records older than `ageMs` relative to now. Emits 'pruned' if any. */
  public pruneOlderThan(ageMs: number): number {
    const cutoff = Date.now() - Math.max(0, ageMs)
    const before = this.history.length
    this.history = this.history.filter(e => e.timestamp >= cutoff)
    const removed = before - this.history.length
    if (removed) this.emit("pruned", removed)
    return removed
  }

  /** Set/replace max history length at runtime and enforce immediately. */
  public setMaxHistoryLength(n: number | null): void {
    this.maxHistoryLength = n === null ? null : Math.max(1, Math.floor(n))
    const removed = this.enforceCap()
    if (removed) this.emit("pruned", removed)
  }

  /* ----------------------------- Read methods ----------------------------- */

  /** Get the most recent metrics entry, or null if none. */
  public latest(): Metrics | null {
    return this.history.length ? this.history[this.history.length - 1] : null
  }

  /** Get a shallow copy of full history. */
  public getHistory(): Metrics[] {
    return [...this.history]
  }

  /**
   * Summary over all history, or a time range [fromMs, toMs] (inclusive).
   * Passing only `fromMs` summarizes from that point to latest.
   */
  public summary(fromMs?: number, toMs?: number): MetricsSummary {
    const data = this.range(fromMs, toMs)
    const total = data.length
    if (!total) {
      return {
        totalRecords: 0,
        from: null,
        to: null,
        avgSol: 0,
        avgTokens: 0,
        minSol: null,
        maxSol: null,
        minTokens: null,
        maxTokens: null,
        medianSol: null,
        medianTokens: null,
        p90Sol: null,
        p90Tokens: null,
        stdSol: 0,
        stdTokens: 0,
      }
    }

    const sol = data.map(d => d.solBalance)
    const tok = data.map(d => d.tokenCount)

    const sumSol = sol.reduce((a, b) => a + b, 0)
    const sumTok = tok.reduce((a, b) => a + b, 0)

    const sortedSol = [...sol].sort((a, b) => a - b)
    const sortedTok = [...tok].sort((a, b) => a - b)

    const avgSol = sumSol / total
    const avgTok = sumTok / total

    return {
      totalRecords: total,
      from: data[0].timestamp ?? null,
      to: data[data.length - 1].timestamp ?? null,
      avgSol,
      avgTokens: avgTok,
      minSol: sortedSol[0] ?? null,
      maxSol: sortedSol[sortedSol.length - 1] ?? null,
      minTokens: sortedTok[0] ?? null,
      maxTokens: sortedTok[sortedTok.length - 1] ?? null,
      medianSol: quantile(sortedSol, 0.5),
      medianTokens: quantile(sortedTok, 0.5),
      p90Sol: quantile(sortedSol, 0.9),
      p90Tokens: quantile(sortedTok, 0.9),
      stdSol: Math.sqrt(variance(sol, avgSol)),
      stdTokens: Math.sqrt(variance(tok, avgTok)),
    }
  }

  /** Rolling average of the last N records (clamped to available size). */
  public rollingAverage(n: number): { sol: number; tokens: number } {
    const k = Math.min(this.history.length, Math.max(1, Math.floor(n)))
    if (!k) return { sol: 0, tokens: 0 }
    let sol = 0
    let tok = 0
    for (let i = this.history.length - k; i < this.history.length; i++) {
      sol += this.history[i].solBalance
      tok += this.history[i].tokenCount
    }
    return { sol: sol / k, tokens: tok / k }
  }

  /** Export as JSON-safe array (deep copy). */
  public export(): Metrics[] {
    return this.getHistory()
  }

  /** Replace current history with provided entries (validated & sorted by time). */
  public import(entries: Metrics[], { keepExisting = false }: { keepExisting?: boolean } = {}): void {
    const valid: Metrics[] = []
    for (const e of entries) {
      const p = this.parse(e, true)
      if (p) valid.push(p)
    }
    valid.sort((a, b) => a.timestamp - b.timestamp)
    this.history = keepExisting ? mergeSorted(this.history, valid) : valid
    const removed = this.enforcePolicies()
    if (removed) this.emit("pruned", removed)
  }

  /* ---------------------------- Event Typings ---------------------------- */

  public override on<K extends keyof MetricsCoreEvents>(event: K, listener: MetricsCoreEvents[K]): this {
    // @ts-expect-error EventEmitter generic bridge
    return super.on(event, listener)
  }
  public override once<K extends keyof MetricsCoreEvents>(event: K, listener: MetricsCoreEvents[K]): this {
    // @ts-expect-error EventEmitter generic bridge
    return super.once(event, listener)
  }
  public override off<K extends keyof MetricsCoreEvents>(event: K, listener: MetricsCoreEvents[K]): this {
    // @ts-expect-error EventEmitter generic bridge
    return super.off(event, listener)
  }

  /* ------------------------------ Internals ------------------------------ */

  private parse(m: Metrics, lenient = false): Metrics | undefined {
    try {
      return metricsSchema.parse(m)
    } catch (e) {
      if (this.strict && !lenient) throw e
      return undefined
    }
  }

  private enforcePolicies(): number {
    let removed = 0
    // time pruning
    if (this.maxAgeMs && this.maxAgeMs > 0) {
      const cutoff = Date.now() - this.maxAgeMs
      const before = this.history.length
      this.history = this.history.filter(e => e.timestamp >= cutoff)
      removed += before - this.history.length
    }
    // size cap
    removed += this.enforceCap()
    return removed
  }

  private enforceCap(): number {
    if (this.maxHistoryLength === null) return 0
    let removed = 0
    while (this.history.length > this.maxHistoryLength) {
      this.history.shift()
      removed++
    }
    return removed
  }

  private range(fromMs?: number, toMs?: number): Metrics[] {
    if (this.history.length === 0) return []
    const from = fromMs ?? this.history[0].timestamp
    const to = toMs ?? this.history[this.history.length - 1].timestamp
    if (from <= this.history[0].timestamp && to >= this.history[this.history.length - 1].timestamp) {
      return this.history
    }
    return this.history.filter(e => e.timestamp >= from && e.timestamp <= to)
  }
}

/* ------------------------------- Utilities ------------------------------- */

function mergeSorted(a: Metrics[], b: Metrics[]): Metrics[] {
  const out: Metrics[] = []
  let i = 0,
    j = 0
  while (i < a.length && j < b.length) {
    if (a[i].timestamp <= b[j].timestamp) out.push(a[i++])
    else out.push(b[j++])
  }
  while (i < a.length) out.push(a[i++])
  while (j < b.length) out.push(b[j++])
  return out
}
