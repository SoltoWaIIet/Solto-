interface WalletProbeResult {
  wallet: string
  txCount: number
  avgTxnValue: number
  lastActive: number
  suspicious: boolean
}

export class WalletProbeTask {
  async probe(wallet: string): Promise<WalletProbeResult> {
    const txCount = await this.GetTxCount(wallet)
    const avgTxnValue = await this.GetAvgValue(wallet)
    const lastActive = await this.GetLastActivity(wallet)
    const suspicious = txCount > 100 && avgTxnValue > 5000

    return {
      wallet,
      txCount,
      avgTxnValue,
      lastActive,
      suspicious
    }
  }

  private async GetTxCount(wallet: string): Promise<number> {
    return 42 
  }

  private async GetAvgValue(wallet: string): Promise<number> {
    return 6700
  }

  private async GetLastActivity(wallet: string): Promise<number> {
    return Date.now() - 1000 * 60 * 60 * 5
  }
}
