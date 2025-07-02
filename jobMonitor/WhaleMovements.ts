import { Connection, PublicKey, ParsedConfirmedTransaction } from "@solana/web3.js"

export class WhaleTracker {
  private connection: Connection
  private whaleThreshold: number

  constructor(rpcUrl: string, threshold: number = 50000) {
    this.connection = new Connection(rpcUrl, "confirmed")
    this.whaleThreshold = threshold
  }

  async track(addresses: string[]): Promise<string[]> {
    const flagged: string[] = []

    for (const addr of addresses) {
      const publicKey = new PublicKey(addr)
      const txs = await this.connection.getSignaturesForAddress(publicKey, { limit: 5 })

      for (const sig of txs) {
        const tx = await this.connection.getParsedTransaction(sig.signature)
        const volume = this.extractTokenVolume(tx)
        if (volume > this.whaleThreshold) {
          flagged.push(`${addr}:${volume}`)
        }
      }
    }

    return flagged
  }

  private extractTokenVolume(tx: ParsedConfirmedTransaction | null): number {
    if (!tx || !tx.meta) return 0
    const pre = tx.meta.preBalances.reduce((a, b) => a + b, 0)
    const post = tx.meta.postBalances.reduce((a, b) => a + b, 0)
    return Math.abs(post - pre) / 1e9 // Convert lamports to SOL
  }
}
