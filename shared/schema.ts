import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6)
});

export const keywordSchema = z.object({
  id: z.string(),
  keyword: z.string().min(1),
  user_created: z.string(),
  trend_score: z.number().optional(),
  mentions_count: z.number().optional(),
});

export const wordstatResponseSchema = z.object({
  response: z.object({
    status: z.string(),
    data: z.object({
      shows: z.array(z.object({
        year: z.number(),
        month: z.number(),
        shows: z.number()
      })),
      sources: z.array(z.object({
        source: z.string(),
        count: z.number()
      })).optional()
    })
  })
});

export type LoginCredentials = z.infer<typeof loginSchema>;
export type Keyword = z.infer<typeof keywordSchema>;
export type WordstatResponse = z.infer<typeof wordstatResponseSchema>;