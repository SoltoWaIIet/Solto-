import { SolanaSwapToolkit } from "@/tools/solana"
import { SOLTO_AGENT_ID } from "./agent"

export const swapExecutor = {
  id: SOLTO_AGENT_ID,
  label: "solto-swap-executor",
  tools: SolanaSwapToolkit,
  run(input) {
    const { fromToken, toToken, amount } = input
    const route = SolanaSwapToolkit.findRoute(fromToken, toToken)
    if (!route) return { error: "No route found" }
    return SolanaSwapToolkit.executeSwap(route, amount)
  }
}