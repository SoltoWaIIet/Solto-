interface InspectionEntry {
  wallet: string
  reason: string
  level: "low" | "medium" | "high"
  detectedAt: number
}

export class InspectionRegistry {
  private entries: InspectionEntry[] = []

  register(wallet: string, reason: string, level: InspectionEntry["level"]) {
    this.entries.push({
      wallet,
      reason,
      level,
      detectedAt: Date.now()
    })
  }

  getAll(): InspectionEntry[] {
    return this.entries
  }

  getByWallet(wallet: string): InspectionEntry[] {
    return this.entries.filter((entry) => entry.wallet === wallet)
  }

  removeWallet(wallet: string): void {
    this.entries = this.entries.filter((entry) => entry.wallet !== wallet)
  }

  stats(): Record<string, number> {
    return {
      low: this.entries.filter(e => e.level === "low").length,
      medium: this.entries.filter(e => e.level === "medium").length,
      high: this.entries.filter(e => e.level === "high").length,
    }
  }
}
