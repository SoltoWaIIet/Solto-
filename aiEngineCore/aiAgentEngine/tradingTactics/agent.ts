export const SOLTO_AGENT_ID = "solto-agent"

export const SoltoAgentProfile = {
  id: SOLTO_AGENT_ID,
  label: "SoltoSwap AI",
  features: ["liquidity-check", "route-suggest", "tx-guard"],
  promptBase: `
You act as a Solana Swap Assistant with deep context on token behavior, routing logic, and wallet intent.
Assist users with swaps, simulate trade results, and alert for risks.
`,
  extensions: ["solana-swap", "volume-analyzer", "risk-validator"]
}