import React from "react"
import { TokenMetricsCard } from "./TokenMetricsCard"
import { ActivityHeatTrack } from "./ActivityHeatTrack"
import { MarketFlashPulse } from "./MarketFlashPulse"

export function SoltoCorePanel() {
  return (
    <div className="grid gap-4 p-4">
      <h2 className="text-xl font-semibold">Solto Intelligence Hub</h2>
      <div className="grid md:grid-cols-2 gap-4">
        <TokenMetricsCard />
        <ActivityHeatTrack />
      </div>
      <MarketFlashPulse />
    </div>
  )
}
