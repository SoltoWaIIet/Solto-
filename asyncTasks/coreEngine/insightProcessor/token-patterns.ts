import { Connection, PublicKey } from "@solana/web3.js"

export async function detectTokenPatterns(
  connection: Connection,
  mint: string
): Promise<string[]> {
  const sigs = await connection.getSignaturesForAddress(new PublicKey(mint), { limit: 100 })

  const intervals = []
  for (let i = 1; i < sigs.length; i++) {
    const t1 = new Date(sigs[i - 1].blockTime! * 1000).getTime()
    const t2 = new Date(sigs[i].blockTime! * 1000).getTime()
    intervals.push(t2 - t1)
  }

  const rapidBursts = intervals.filter(gap => gap < 10000).length
  const pattern = []

  if (rapidBursts > 20) pattern.push("⚡ Rapid transfer bursts")
  if (sigs.length > 80) pattern.push("🧪 High transaction frequency")
  if (intervals.every(gap => gap < 20000)) pattern.push("🤖 Automated behavior suspected")

  return pattern
}
