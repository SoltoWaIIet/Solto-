import { Connection, PublicKey } from "@solana/web3.js"

export async function detectSuspiciousActivity(
  connection: Connection,
  mint: string
): Promise<string[]> {
  const mintKey = new PublicKey(mint)
  const signatures = await connection.getSignaturesForAddress(mintKey, { limit: 200 })
  const bursts = []
  let previousTime = 0

  for (const sig of signatures) {
    if (!sig.blockTime) continue
    const current = sig.blockTime
    if (previousTime && current - previousTime < 10) bursts.push(current)
    previousTime = current
  }

  const alerts = []
  if (bursts.length > 20) alerts.push("⚠️ Detected potential script-driven bursts")
  if (signatures.length > 150) alerts.push("📈 Unusual transfer frequency")

  return alerts
}
