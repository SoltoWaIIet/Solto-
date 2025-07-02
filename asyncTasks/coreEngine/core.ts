import { Connection, Keypair, PublicKey, sendAndConfirmTransaction } from "@solana/web3.js"
import { z } from "zod"
import { SolAction, SolActionResult, SolActionSchemaAny } from "./actions/sol-action"

interface SolEngineOptions {
  rpcUrl?: string
  walletSecret?: Uint8Array
  label?: string
}

export class SolExecutionEngine {
  private connection: Connection
  private wallet: Keypair

  constructor(options: SolEngineOptions = {}) {
    const endpoint = options.rpcUrl || "https://api.mainnet-beta.solana.com"
    this.connection = new Connection(endpoint, "confirmed")
    this.wallet = options.walletSecret
      ? Keypair.fromSecretKey(options.walletSecret)
      : Keypair.generate()
  }

  async run<T extends SolActionSchemaAny, R>(
    action: SolAction<T, R>,
    payload: T
  ): Promise<SolActionResult<R>> {
    if (!action.func) {
      throw new Error(`Action ${action.name} is not executable`)
    }

    const requiresWallet = action.func.length > 1
    if (requiresWallet) {
      return await action.func(this.wallet, payload)
    }

    return await (action.func as (input: z.infer<T>) => Promise<SolActionResult<R>>)(payload)
  }

  getPublicKey(): PublicKey {
    return this.wallet.publicKey
  }

  exportWallet(): string {
    return JSON.stringify(Array.from(this.wallet.secretKey))
  }

  async signAndSend(transactionBuilder: (wallet: Keypair) => Promise<any>): Promise<string> {
    const tx = await transactionBuilder(this.wallet)
    return await sendAndConfirmTransaction(this.connection, tx, [this.wallet])
  }
}
