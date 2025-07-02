import { BaseAction } from "./baseActionCore"
import { pushAlert } from "./alertServiceModule"

export class CoreAIFrame {
  private actions: Map<string, BaseAction<any, any>> = new Map()

  register<T, R>(action: BaseAction<T, R>) {
    if (this.actions.has(action.id)) {
      throw new Error(`Duplicate action ID: ${action.id}`)
    }
    this.actions.set(action.id, action)
  }

  async run<T, R>(actionId: string, payload: T): Promise<R> {
    const action = this.actions.get(actionId)
    if (!action) throw new Error(`Action ${actionId} not registered`)
    const parsed = action.schema.parse(payload)
    const result = await action.execute(parsed)

    if (result && (result.riskLevel === "high" || result.riskScore > 80)) {
      pushAlert({
        level: "critical",
        title: `High Risk Action: ${actionId}`,
        message: `Score ${result.riskScore}`,
      })
    }

    return result
  }

  listActions(): string[] {
    return [...this.actions.keys()]
  }
}
