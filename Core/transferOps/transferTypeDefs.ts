export interface TransferPayload {
  source: string
  destination?: string
  delegate?: string
  token: string
  amount: number
}

export interface TransferSchema {
  name: string
  validate: (payload: TransferPayload) => boolean
}
