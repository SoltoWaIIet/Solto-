import { Connection } from "@solana/web3.js"

interface SchemaValidationResult {
  address: string
  isValid: boolean
  issues: string[]
}

export async function validateWalletSchema(connection: Connection, address: string): Promise<SchemaValidationResult> {
  const issues: string[] = []

  if (!/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(address)) {
    issues.push("Invalid base58 structure")
  }

  try {
    const balance = await connection.getBalance(new PublicKey(address))
    if (balance < 5000) {
      issues.push("Low balance: possible dormant wallet")
    }
  } catch (e) {
    issues.push("Unable to fetch wallet balance")
  }

  return {
    address,
    isValid: issues.length === 0,
    issues
  }
}
