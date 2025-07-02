import React from "react"

interface TokenPulseProps {
  symbol: string
  volume24h: number
  liquidity: number
  volatilityScore: number
}

export function TokenPulseCard({ symbol, volume24h, liquidity, volatilityScore }: TokenPulseProps) {
  return (
    <div className="p-4 bg-black border border-zinc-700 rounded-lg">
      <h4 className="text-white text-lg font-semibold">{symbol} Overview</h4>
      <div className="mt-2 text-sm text-gray-300">
        <p>24h Volume: ${volume24h.toLocaleString()}</p>
        <p>Liquidity: ${liquidity.toLocaleString()}</p>
        <p>Volatility Score: {volatilityScore.toFixed(2)}</p>
      </div>
    </div>
  )
}
