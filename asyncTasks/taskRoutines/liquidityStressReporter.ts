interface LiquidityState {
  timestamp: number
  liquidity: number
}

export class LiquidityStressReporter {
  private history: LiquidityState[] = []
  private windowSize: number

  constructor(minutesWindow = 30) {
    this.windowSize = minutesWindow * 60
  }

  logLiquidity(state: LiquidityState) {
    this.history.push(state)
    const cutoff = Date.now() / 1000 - this.windowSize
    this.history = this.history.filter(s => s.timestamp >= cutoff)
  }

  calculateStressLevel(): string {
    if (this.history.length < 2) return "Insufficient Data"

    const sorted = [...this.history].sort((a, b) => a.timestamp - b.timestamp)
    const first = sorted[0].liquidity
    const last = sorted[sorted.length - 1].liquidity
    const change = last - first
    const ratio = change / (first || 1)

    if (ratio < -0.6) return "Critical Liquidity Drain"
    if (ratio < -0.3) return "Moderate Outflow"
    if (ratio > 0.4) return "High Inflow"
    return "Stable"
  }
}
