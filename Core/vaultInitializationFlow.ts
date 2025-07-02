import { PublicKey } from "@solana/web3.js"

interface VaultInitConfig {
  owner: string
  allowedTokens: string[]
  strategy: "conservative" | "moderate" | "aggressive"
}

export class VaultInitializationFlow {
  private initializedVaults: Map<string, VaultInitConfig> = new Map()

  createVault(config: VaultInitConfig): string {
    const vaultId = this.generateVaultId(config.owner)
    this.initializedVaults.set(vaultId, config)
    return vaultId
  }

  getVaultConfig(vaultId: string): VaultInitConfig | undefined {
    return this.initializedVaults.get(vaultId)
  }

  validateToken(vaultId: string, token: string): boolean {
    const config = this.initializedVaults.get(vaultId)
    if (!config) return false
    return config.allowedTokens.includes(token)
  }

  private generateVaultId(owner: string): string {
    return `vault-${owner.slice(0, 5)}-${Date.now()}`
  }
}
