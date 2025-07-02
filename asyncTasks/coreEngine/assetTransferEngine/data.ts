export interface SolanaTokenData {
  mint: string
  symbol?: string
  decimals: number
  supply: number
  holders: number
  creationTimestamp?: string
}

export interface WalletSnapshot {
  address: string
  tokenCount: number
  activeSince: string
  txHistory: number[]
}

export const mockTokenData: SolanaTokenData = {
  mint: '',
  symbol: "SOL",
  decimals: 9,
  supply: 500_000_000,
  holders: 13200,
  creationTimestamp: "2020-03-20T00:00:00Z"
}
