import { Connection } from "@solana/web3.js"
import { detectAnomalousWallet } from "./anomalous"
import { detectTokenClusters } from "./clusterByToken"

export async function runSoltoScanner(conn: Connection, token: string) {
  console.log("📡 Scanning Solana activity for token:", token)
  
  const clusters = await detectTokenClusters(conn, token)
  console.log(`🔍 Found ${clusters.length} suspicious wallet clusters`)

  for (const cluster of clusters) {
    console.log(`⚠️ Cluster of ${cluster.length} wallets:`)

    for (const addr of cluster) {
      const report = await detectAnomalousWallet(conn, addr)
      if (report.spikeDetected) {
        console.log(`🔥 Wallet ${report.address} shows anomaly — avgInterval=${report.avgInterval}s`)
      }
    }
  }
}
