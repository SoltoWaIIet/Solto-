import { z } from "zod"

export type BaseAction<T, R> = {
  id: string
  schema: z.ZodType<T>
  execute: (input: T) => Promise<R>
  description?: string
}

export function createBaseAction<T, R>(
  id: string,
  schema: z.ZodType<T>,
  executor: (input: T) => Promise<R>,
  description?: string
): BaseAction<T, R> {
  return { id, schema, execute: executor, description }
}
