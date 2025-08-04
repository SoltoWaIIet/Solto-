import { BaseAction } from "./baseActionCore"
import { pushAlert, AlertPayload } from "./alertServiceModule"

export interface CoreAIFrameOptions {
  /** Minimum riskScore to fire a critical alert */
  riskThreshold?: number
  /** Function to send alerts (defaults to pushAlert) */
  alertFn?: (alert: AlertPayload) => void
}

export class CoreAIFrame {
  private actions = new Map<string, BaseAction<any, any>>()
  private riskThreshold: number
  private alertFn: (alert: AlertPayload) => void

  constructor(options: CoreAIFrameOptions = {}) {
    this.riskThreshold = options.riskThreshold ?? 80
    this.alertFn = options.alertFn ?? pushAlert
  }

  /**
   * Register a new action. Throws if id already exists.
   */
  register<T, R>(action: BaseAction<T, R>): void {
    if (this.actions.has(action.id)) {
      throw new Error(`Duplicate action ID: ${action.id}`)
    }
    this.actions.set(action.id, action)
  }

  /**
   * Unregister an existing action by its ID.
   * Returns true if removed, false if not found.
   */
  unregister(actionId: string): boolean {
    return this.actions.delete(actionId)
  }

  /**
   * Execute a registered action by ID with the given payload.
   * Validates payload via action.schema before execution.
   * Emits a critical alert if riskLevel is "high" or riskScore >= threshold.
   */
  async run<T, R>(actionId: string, payload: unknown): Promise<R> {
    const action = this.actions.get(actionId)
    if (!action) {
      throw new Error(`Action "${actionId}" is not registered`)
    }

    let parsed: T
    try {
      parsed = action.schema.parse(payload)
    } catch (err: any) {
      // invalid payload
      this.alertFn({
        level: "warning",
        title: `Validation failed for action "${actionId}"`,
        message: err.message || "Invalid input schema",
      })
      throw err
    }

    let result: R
    try {
      result = await action.execute(parsed)
    } catch (err: any) {
      // action execution error
      this.alertFn({
        level: "error",
        title: `Execution failed for action "${actionId}"`,
        message: err.message || "Unexpected error",
      })
      throw err
    }

    // check risk and alert if needed
    const riskLevel = (result as any).riskLevel
    const riskScore = (result as any).riskScore as number | undefined

    if (riskLevel === "high" || (typeof riskScore === "number" && riskScore >= this.riskThreshold)) {
      this.alertFn({
        level: "critical",
        title: `High Risk Action: ${actionId}`,
        message: `Risk level=${riskLevel}${riskScore != null ? `, score=${riskScore}` : ""}`,
      })
    }

    return result
  }

  /** List all registered action IDs */
  listActions(): string[] {
    return Array.from(this.actions.keys())
  }

  /**
   * Get metadata for registered actions.
   * Returns array of { id, description } if action provides a description property.
   */
  listActionDetails(): { id: string; description?: string }[] {
    return Array.from(this.actions.values()).map(a => ({
      id: a.id,
      // @ts-expect-error — some actions may have a description field
      description: (a as any).description,
    }))
  }
}
