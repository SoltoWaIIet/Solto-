import React from "react"
import classNames from "classnames"

interface WhaleSignal {
  wallet: string
  action: "buy" | "sell"
  amount: number
  token: string
  timestamp?: number
}

interface WhaleRadarBeaconProps {
  signals: WhaleSignal[]
}

export function WhaleRadarBeacon({ signals }: WhaleRadarBeaconProps) {
  if (!signals.length) {
    return (
      <div className="bg-zinc-800 p-4 rounded-lg text-gray-400 text-center">
        🐋 No whale signals at the moment
      </div>
    )
  }

  return (
    <div className="bg-zinc-800 p-4 rounded-lg">
      <h3 className="text-white font-semibold text-lg">🐋 Whale Signals</h3>
      <ul className="mt-2 space-y-2 text-sm text-gray-300">
        {signals.map((sig, idx) => {
          const timeLabel = sig.timestamp
            ? new Date(sig.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            : null
          return (
            <li
              key={`${sig.wallet}-${sig.timestamp ?? idx}`}
              className="flex justify-between items-center border-b border-zinc-700 pb-1"
            >
              <div className="flex items-baseline space-x-2">
                <span className="font-mono">{sig.wallet.slice(0, 6)}…</span>
                <span
                  className={classNames(
                    "font-semibold",
                    sig.action === "buy" ? "text-green-400" : "text-red-400"
                  )}
                >
                  {sig.action.toUpperCase()}
                </span>
                {timeLabel && (
                  <span className="text-xs text-gray-500 ml-2">{timeLabel}</span>
                )}
              </div>
              <span className="font-mono">
                {sig.amount.toLocaleString()} {sig.token}
              </span>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
