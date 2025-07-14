import { TransferSchema, TransferPayload } from "./transferTypeDefs"

export interface ValidateResult {
  valid: boolean
  errors?: string[]
}

type ValidatorFn = (payload: TransferPayload) => ValidateResult

class SchemaManager {
  private schemas: Record<string, { name: string; validator: ValidatorFn }> = {}

  register(key: string, name: string, validator: ValidatorFn): void {
    if (this.schemas[key]) {
      throw new Error(`Schema with key '${key}' already registered`)
    }
    this.schemas[key] = { name, validator }
  }

  validate(key: string, payload: TransferPayload): ValidateResult {
    const schema = this.schemas[key]
    if (!schema) {
      return { valid: false, errors: [`Schema '${key}' not found`] }
    }
    return schema.validator(payload)
  }

  listSchemas(): string[] {
    return Object.keys(this.schemas)
  }
}

const manager = new SchemaManager()

// BasicTransfer: requires source, destination, positive amount
manager.register("basic", "BasicTransfer", (payload) => {
  const errors: string[] = []
  if (!payload.source) errors.push("source is required")
  if (!payload.destination) errors.push("destination is required")
  if (typeof payload.amount !== "number" || payload.amount <= 0) {
    errors.push("amount must be a positive number")
  }
  return { valid: errors.length === 0, errors: errors.length ? errors : undefined }
})

// DelegatedTransfer: requires source, delegate, positive amount
manager.register("delegated", "DelegatedTransfer", (payload) => {
  const errors: string[] = []
  if (!payload.source) errors.push("source is required")
  if (!payload.delegate) errors.push("delegate is required")
  if (typeof payload.amount !== "number" || payload.amount <= 0) {
    errors.push("amount must be a positive number")
  }
  return { valid: errors.length === 0, errors: errors.length ? errors : undefined }
})

// MultiPartyTransfer: requires source, at least two destinations, and totalAmount match
manager.register("multiParty", "MultiPartyTransfer", (payload) => {
  const errors: string[] = []
  const { source, destinations, totalAmount } = payload as any
  if (!source) errors.push("source is required")
  if (!Array.isArray(destinations) || destinations.length < 2) {
    errors.push("destinations must be an array of at least 2 entries")
  } else {
    const sum = destinations.reduce((acc: number, d: any) => acc + (d.amount || 0), 0)
    if (sum !== totalAmount) {
      errors.push("totalAmount must equal sum of destination amounts")
    }
  }
  return { valid: errors.length === 0, errors: errors.length ? errors : undefined }
})

export function validateTransfer(
  type: string,
  payload: TransferPayload
): ValidateResult {
  return manager.validate(type, payload)
}

export function availableSchemas(): string[] {
  return manager.listSchemas()
}

// Expose the manager for direct use if needed
export const TRANSFER_SCHEMAS = manager
