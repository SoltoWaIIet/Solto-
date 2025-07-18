import React from "react"
import { ArrowUpRight, ArrowDownRight, Minus } from "lucide-react"

interface SentimentInsightProps {
  score: number   // -100 to 100
  trend: "bullish" | "bearish" | "neutral"
}

const getTrendIcon = (trend: SentimentInsightProps["trend"]) => {
  if (trend === "bullish") return <ArrowUpRight className="inline-block w-6 h-6 text-green-400 animate-pulse" />
  if (trend === "bearish") return <ArrowDownRight className="inline-block w-6 h-6 text-red-400 animate-pulse" />
  return <Minus className="inline-block w-6 h-6 text-gray-400" />
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
    <div className="bg-gradient-to-br from-zinc-900 to-zinc-800 p-8 rounded-2xl shadow-2xl flex flex-col gap-4 transform hover:scale-105 transition-transform duration-300">
      <h3 className="text-white text-2xl font-semibold">Market Sentiment</h3>

      <div className={`text-6xl font-mono ${getColorClass(trend)} drop-shadow-lg`}>  
        {score > 0 ? "+" : ""}{score}
      </div>

      <div className="flex items-center gap-3 text-base uppercase font-medium">
        {getTrendIcon(trend)}
        <span className={getColorClass(trend)}>{trend}</span>
      </div>

      <p className="text-sm text-gray-400 italic">{sentimentLabel}</p>
    </div>
  )
}
