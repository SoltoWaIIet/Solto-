import { Connection } from "@solana/web3.js"
import { getTokenAccountsByOwner } from "./commonUtils"

export async function detectTokenClusters(conn: Connection, mint: string): Promise<string[][]> {
  const holders = await getTokenAccountsByOwner(conn, mint)

  const clusters: Map<string, string[]> = new Map()

  for (const holder of holders) {
    const prefix = holder.slice(0, 4)
    if (!clusters.has(prefix)) clusters.set(prefix, [])
    clusters.get(prefix)?.push(holder)
  }

  return Array.from(clusters.values()).filter((g) => g.length > 3)
}
