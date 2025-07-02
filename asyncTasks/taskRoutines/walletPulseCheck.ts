export class WalletPulseChecker {
  private timestamps: number[] = []

  logTransaction(ts: number) {
    this.timestamps.push(ts)
    const cutoff = Date.now() / 1000 - 1800
    this.timestamps = this.timestamps.filter(t => t >= cutoff)
  }

  pulseRate(): number {
    const now = Date.now() / 1000
    const recent = this.timestamps.filter(t => now - t < 1800)
    return recent.length
  }

  status(): string {
    const rate = this.pulseRate()
    if (rate >= 6) return "⚠️ High Wallet Activity"
    if (rate >= 3) return "⚡ Moderate Activity"
    return "🟢 Low Activity"
  }

  debugTimestamps(): number[] {
    return [...this.timestamps]
  }
}
