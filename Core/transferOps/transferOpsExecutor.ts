import { TransferSchema, TransferPayload } from "./transferTypeDefs"
import { TRANSFER_SCHEMAS } from "./transferSchemaRegistry"

export class TransferOpsExecutor {
  executeTransfer(type: string, payload: TransferPayload): boolean {
    const schema = TRANSFER_SCHEMAS[type]
    if (!schema) throw new Error(`Unknown transfer type: ${type}`)

    if (!schema.validate(payload)) {
      console.warn("Invalid transfer payload")
      return false
    }

    console.log(`[Transfer] ${payload.source} -> ${payload.destination} (${payload.amount} ${payload.token})`)

    return true
  }
}
