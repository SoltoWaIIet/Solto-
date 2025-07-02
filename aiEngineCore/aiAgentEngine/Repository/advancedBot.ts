import { detectPatterns } from "./Knowledge"
import { generateInsight } from "./KnowledgeAgent"

export class AdvancedSoltoBot {
  private token: string

  constructor(tokenAddress: string) {
    this.token = tokenAddress
  }

  async analyze(): Promise<void> {
    const patterns = await detectPatterns(this.token)
    const insight = generateInsight(this.token, patterns)

    console.log(`[SoltoBot Insight] ${JSON.stringify(insight, null, 2)}`)
  }
}
