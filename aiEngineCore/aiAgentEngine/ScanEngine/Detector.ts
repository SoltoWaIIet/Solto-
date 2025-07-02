// Detector.ts — Solto AI: Real-Time Token Anomaly Detector

import { analyzeTokenBehavior } from "./Analysis"

export async function detectAnomaliesForToken(token: string): Promise<void> {
  const result = await analyzeTokenBehavior(token)

  console.log(`[Detector] Token: ${token}`)
  console.log(`Threat Level: ${result.threatLevel}`)
  console.log("Details:", result.details)

  if (result.threatLevel === "High") {
    // Trigger alert mechanism (hook can be added here)
    console.warn(`[ALERT] High-risk token detected: ${token}`)
  }
}