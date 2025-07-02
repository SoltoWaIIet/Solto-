import { TransferSchema } from "./transferTypeDefs"

export const TRANSFER_SCHEMAS: Record<string, TransferSchema> = {
  basic: {
    name: "BasicTransfer",
    validate: (payload) =>
      !!payload.source && !!payload.destination && payload.amount > 0
  },
  delegated: {
    name: "DelegatedTransfer",
    validate: (payload) =>
      !!payload.source && !!payload.delegate && payload.amount > 0
  }
}
