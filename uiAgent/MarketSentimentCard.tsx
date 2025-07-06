import React from "react"
import { ArrowUpRight, ArrowDownRight, Minus } from "lucide-react"

interface SentimentInsightProps {
  score: number   // -100 to 100
  trend: "bullish" | "bearish" | "neutral"
}

const getTrendIcon = (trend: SentimentInsightProps["trend"]) => {
  if (trend === "bullish") return <ArrowUpRight className="inline-block w-4 h-4 text-green-400" />
  if (trend === "bearish") return <ArrowDownRight className="inline-block w-4 h-4 text-red-400" />
  return <Minus className="inline-block w-4 h-4 text-gray-400" />
}

const getSentimentLabel = (score: number) => {
  if (score >= 75) return "Extreme Greed"
  if (score >= 25) return "Greed"
  if (score <= -75) return "Extreme Fear"
  if (score <= -25) return "Fear"
  return "Neutral"
}

const getColorClass = (trend: SentimentInsightProps["trend"]) => {
  if (trend === "bullish") return "text-green-400"
  if (trend === "bearish") return "text-red-400"
  return "text-gray-400"
}

export function SentimentInsightFrame({ score, trend }: SentimentInsightProps) {
  const sentimentLabel = getSentimentLabel(score)

  return (
    <div className="bg-zinc-900 p-5 rounded-2xl shadow-lg flex flex-col gap-2">
      <h3 className="text-white text-lg font-semibold">Market Sentiment</h3>

      <div className={`text-4xl font-mono ${getColorClass(trend)}`}>
        {score > 0 ? "+" : ""}{score}
      </div>

      <div className="flex items-center gap-2 text-sm uppercase text-gray-400">
        {getTrendIcon(trend)}
        <span>{trend}</span>
      </div>

      <p className="text-xs text-gray-500 italic">{sentimentLabel}</p>
    </div>
  )
}
