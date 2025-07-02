import { fetchSentimentScore } from "@/lib/market/sentiment"
import { calculateTrendDirection } from "@/core/analysis/trend"

export interface SentimentSnapshot {
  score: number
  trend: "bullish" | "bearish" | "neutral"
  updatedAt: string
}

export async function getSentimentInsightFrame(token: string): Promise<SentimentSnapshot> {
  const rawScore = await fetchSentimentScore(token)
  const trend = calculateTrendDirection(rawScore)

  return {
    score: rawScore,
    trend,
    updatedAt: new Date().toISOString()
  }
}
