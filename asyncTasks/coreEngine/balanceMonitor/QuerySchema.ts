import { z } from "zod"

export const tokenQuerySchema = z.object({
  mint: z.string().length(44, "Invalid Solana mint address"),
  minBalance: z.number().optional(),
  activeOnly: z.boolean().default(true),
  since: z.date().optional()
})

export type TokenQuery = z.infer<typeof tokenQuerySchema>
