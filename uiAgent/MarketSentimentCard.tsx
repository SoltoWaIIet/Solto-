import React from "react"

interface SentimentInsightProps {
  score: number   // -100 to 100
  trend: "bullish" | "bearish" | "neutral"
}

export function SentimentInsightFrame({ score, trend }: SentimentInsightProps) {
  const getColor = () => {
    if (trend === "bullish") return "text-green-500"
    if (trend === "bearish") return "text-red-500"
    return "text-gray-500"
  }

  return (
    <div className="bg-zinc-900 p-4 rounded-xl shadow-md">
      <h3 className="text-lg font-bold text-white">Market Sentiment</h3>
      <p className={`text-3xl mt-2 font-mono ${getColor()}`}>
        {score > 0 ? "+" : ""}{score}
      </p>
      <p className="text-sm mt-1 uppercase text-gray-400">{trend}</p>
    </div>
  )
}
