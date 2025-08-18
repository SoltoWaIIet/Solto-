import { z, ZodTypeAny } from "zod"

export type LogLevel = "none" | "debug" | "error"

export interface BaseAction<T, R> {
  id: string
  schema: z.ZodType<T>
  description?: string
  version?: string
  tags?: string[]
  execute(input: T): Promise<R>
}

export interface BaseActionOptions<T, R> {
  description?: string
  version?: string
  tags?: string[]
  logLevel?: LogLevel
  before?: (input: T) => void | Promise<void>
  after?: (result: R) => void | Promise<void>
  onError?: (err: unknown) => void | Promise<void>
}

/**
 * Create a fully-typed BaseAction with lifecycle hooks, logging, and schema safety.
 */
export function createBaseAction<T, R>(
  id: string,
  schema: z.ZodType<T>,
  executor: (input: T) => Promise<R>,
  options: BaseActionOptions<T, R> = {}
): BaseAction<T, R> {
  const {
    description,
    version = "1.0.0",
    tags = [],
    logLevel = "none",
    before,
    after,
    onError,
  } = options

  return {
    id,
    schema,
    description,
    version,
    tags,
    async execute(raw: T): Promise<R> {
      const parsed = schema.safeParse(raw)
      if (!parsed.success) {
        const errMsg = `❌ [${id}] Validation failed: ${parsed.error}`
        if (logLevel !== "none") console.error(errMsg)
        throw parsed.error
      }

      const input = parsed.data

      try {
        if (logLevel === "debug") {
          console.debug(`▶️ [${id}] Executing with:`, input)
        }

        await before?.(input)
        const result = await executor(input)
        await after?.(result)

        if (logLevel === "debug") {
          console.debug(`✅ [${id}] Output:`, result)
        }

        return result
      } catch (err) {
        if (logLevel !== "none") {
          console.error(`🔥 [${id}] Execution failed:`, err)
        }
        await onError?.(err)
        throw err
      }
    }
  }
}
