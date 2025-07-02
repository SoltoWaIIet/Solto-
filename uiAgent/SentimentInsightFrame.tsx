import React from "react"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"

export interface MarketSentimentCardProps {
  score: number
  trend: "Bullish" | "Bearish" | "Neutral"
  dominantToken: string
  volume24h: number
}

function formatPercent(value: number): string {
  const sign = value >= 0 ? "+" : "−"
  return `${sign}${Math.abs(value).toFixed(2)}%`
}

export const MarketSentimentCard: React.FC<MarketSentimentCardProps> = ({
  score,
  trend,
  dominantToken,
  volume24h,
}) => {
  const colorClass =
    score >= 70 ? "bg-green-500" : score >= 40 ? "bg-orange-500" : "bg-red-500"

  return (
    <Card className="max-w-md mx-auto my-4">
      <CardHeader>
        <CardTitle className="text-lg font-semibold">Market Sentiment</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center space-x-4">
          <div
            className={`w-16 h-16 rounded-full flex items-center justify-center text-white text-xl ${colorClass}`}
          >
            {score}%
          </div>
          <ul className="space-y-1 text-sm text-gray-700">
            <li>
              <span className="font-medium">Trend:</span> {trend}
            </li>
            <li>
              <span className="font-medium">Dominant:</span> {dominantToken}
            </li>
            <li>
              <span className="font-medium">24h Volume:</span> ${volume24h.toLocaleString()}
            </li>
          </ul>
        </div>
      </CardContent>
    </Card>
  )
}
