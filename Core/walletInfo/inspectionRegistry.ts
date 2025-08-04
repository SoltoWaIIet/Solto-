interface InspectionEntry {
  wallet: string
  reason: string
  level: "low" | "medium" | "high"
  detectedAt: number
}

export class InspectionRegistry {
  // use a Map for faster wallet lookups
  private registry = new Map<string, InspectionEntry[]>()

  /**
   * Register a new inspection entry.
   * @throws if level is invalid
   */
  register(
    wallet: string,
    reason: string,
    level: InspectionEntry["level"]
  ): void {
    if (!["low", "medium", "high"].includes(level)) {
      throw new Error(`Invalid level "${level}", must be "low" | "medium" | "high"`)
    }
    const entry: InspectionEntry = {
      wallet,
      reason,
      level,
      detectedAt: Date.now(),
    }
    const list = this.registry.get(wallet) ?? []
    list.push(entry)
    this.registry.set(wallet, list)
  }

  /** Get all entries (flat array). */
  getAll(): InspectionEntry[] {
    return Array.from(this.registry.values()).flat()
  }

  /** Get entries for a specific wallet (in insertion order). */
  getByWallet(wallet: string): InspectionEntry[] {
    return [...(this.registry.get(wallet) ?? [])]
  }

  /** Get entries filtered by level across all wallets. */
  getByLevel(level: InspectionEntry["level"]): InspectionEntry[] {
    return this.getAll().filter(e => e.level === level)
  }

  /** Remove all entries for a given wallet. */
  removeWallet(wallet: string): void {
    this.registry.delete(wallet)
  }

  /** Clear every entry in the registry. */
  clearAll(): void {
    this.registry.clear()
  }

  /**
   * Remove entries older than the given timestamp.
   * @param cutoffTimestamp keep entries with detectedAt >= this value
   */
  clearOlderThan(cutoffTimestamp: number): void {
    for (const [wallet, entries] of this.registry.entries()) {
      const filtered = entries.filter(e => e.detectedAt >= cutoffTimestamp)
      if (filtered.length) {
        this.registry.set(wallet, filtered)
      } else {
        this.registry.delete(wallet)
      }
    }
  }

  /** Summary counts by level. */
  stats(): Record<"low" | "medium" | "high", number> {
    const all = this.getAll()
    return {
      low: all.filter(e => e.level === "low").length,
      medium: all.filter(e => e.level === "medium").length,
      high: all.filter(e => e.level === "high").length,
    }
  }
}
