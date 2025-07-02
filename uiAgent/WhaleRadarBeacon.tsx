import React from "react"

interface WhaleSignal {
  wallet: string
  action: "buy" | "sell"
  amount: number
  token: string
}

interface WhaleRadarBeaconProps {
  signals: WhaleSignal[]
}

export function WhaleRadarBeacon({ signals }: WhaleRadarBeaconProps) {
  return (
    <div className="bg-zinc-800 p-4 rounded-lg">
      <h3 className="text-white font-semibold text-lg">🐋 Whale Signals</h3>
      <ul className="mt-2 space-y-2 text-sm text-gray-300">
        {signals.map((sig, idx) => (
          <li key={idx} className="flex justify-between border-b border-zinc-700 pb-1">
            <span>{sig.wallet.slice(0, 6)}... → {sig.action}</span>
            <span className="font-mono">{sig.amount} {sig.token}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
