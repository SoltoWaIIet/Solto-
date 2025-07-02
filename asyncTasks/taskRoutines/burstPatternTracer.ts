interface TokenVolumeWindow {
  timestamp: number
  volume: number
}

export class BurstPatternTracer {
  private window: TokenVolumeWindow[] = []
  private threshold: number
  private span: number

  constructor(spanMinutes = 15, volumeMultiplier = 2) {
    this.span = spanMinutes * 60
    this.threshold = volumeMultiplier
  }

  addDataPoint(data: TokenVolumeWindow) {
    this.window.push(data)
    const cutoff = Date.now() / 1000 - this.span
    this.window = this.window.filter(dp => dp.timestamp >= cutoff)
  }

  detectBurst(): boolean {
    if (this.window.length < 3) return false
    const sorted = [...this.window].sort((a, b) => a.timestamp - b.timestamp)
    const avgVolume = sorted.slice(0, -1).reduce((sum, d) => sum + d.volume, 0) / (sorted.length - 1)
    const latest = sorted[sorted.length - 1].volume
    return latest > avgVolume * this.threshold
  }

  getStatus(): string {
    return this.detectBurst() ? "Volume Burst Detected" : "Normal Activity"
  }
}
