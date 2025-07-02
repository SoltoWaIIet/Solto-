export interface ScanPayload {
  walletAddress: string
  includeTokenData?: boolean
  scanDepth: number
  riskThreshold?: number
}

export const defaultPayload: ScanPayload = {
  walletAddress: "",
  includeTokenData: true,
  scanDepth: 50,
  riskThreshold: 70
}
