/**
 * coreLogicMap.ts
 * Maps core operations to their handler functions.
 */

import type { TransferOptions } from "./vaultCoreEngine"
import { VaultTasksHandler } from "./vaultTasksHandler"

export type CoreOperation = "initialize" | "deposit" | "withdraw" | "transfer"

export interface LogicHandlerMap {
  [op: string]: (...args: any[]) => Promise<any>
}

const vaultHandler = new VaultTasksHandler({
  vaultAddress: /* PublicKey */ null as any,
  authority: /* PublicKey */ null as any,
  networkRpcUrl: "https://api.mainnet-beta.solana.com",
  feePayer: /* PublicKey */ null as any,
})

export const coreLogicMap: LogicHandlerMap = {
  initialize: () => vaultHandler.initializeVault(),
  deposit: (amount: number) => vaultHandler.deposit(amount),
  withdraw: (amount: number) => vaultHandler.withdraw(amount),
  transfer: (opts: TransferOptions) => vaultHandler.transfer(opts),
}
