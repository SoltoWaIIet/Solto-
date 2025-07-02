// agent-description.ts
// Defines metadata and behavioral roles for Solto AI agent

export const soltoAgentProfile = {
  id: "solto-vault-001",
  label: "Vault Sentinel",
  purpose: "Analyze token behavior, flag risk vectors, monitor account movements",
  aiPersona: {
    tone: "calm",
    specialty: "on-chain risk analysis",
    avatar: "🧠🔍"
  },
  capabilities: [
    "detect-liquidity-anomalies",
    "track-token-creation",
    "flag-sybil-patterns",
    "evaluate wallet burst activity"
  ],
  inputs: {
    expected: ["tokenStats", "walletTxs", "mintData"],
    format: "JSON"
  },
  constraints: {
    contextRetention: "short-term memory",
    executionLimit: 2_000,
    errorPolicy: "fallback-silent"
  },
  version: "1.2"
}
