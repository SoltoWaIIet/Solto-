type TaskType = "rebalance" | "alert" | "distribution"

interface VaultTask {
  id: string
  type: TaskType
  vaultId: string
  payload: Record<string, any>
  createdAt: number
}

export class VaultTasksEngine {
  private taskQueue: VaultTask[] = []

  scheduleTask(task: VaultTask): void {
    this.taskQueue.push(task)
  }

  getPendingTasks(): VaultTask[] {
    return [...this.taskQueue]
  }

  executeNext(): VaultTask | null {
    const next = this.taskQueue.shift()
    if (next) {
      console.log(`Executing ${next.type} for vault ${next.vaultId}`)
      // Placeholder logic
    }
    return next || null
  }

  purgeTasks(vaultId: string): void {
    this.taskQueue = this.taskQueue.filter((task) => task.vaultId !== vaultId)
  }

  countByType(): Record<TaskType, number> {
    const map: Record<TaskType, number> = { rebalance: 0, alert: 0, distribution: 0 }
    for (const task of this.taskQueue) {
      map[task.type]++
    }
    return map
  }
}
