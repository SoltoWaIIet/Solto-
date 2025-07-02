export interface TokenBalance {
  tokenMint: string
  amount: number
  decimals: number
  owner: string
}

export interface WalletInfo {
  address: string
  balances: TokenBalance[]
  updatedAt: string
}

export interface TokenMetadata {
  mint: string
  symbol: string
  name: string
  logoURI?: string
  tags?: string[]
  verified?: boolean
}

export interface AggregatedWalletStats {
  totalTokens: number
  totalValueUSD: number
  topHoldings: TokenBalance[]
}

export type WalletSnapshot = {
  info: WalletInfo
  stats: AggregatedWalletStats
  metadata: TokenMetadata[]
}
