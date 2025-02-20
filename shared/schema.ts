import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6)
});

export const keywordSchema = z.object({
  id: z.string(),
  keyword: z.string().min(1),
  user_created: z.string()
});

export type LoginCredentials = z.infer<typeof loginSchema>;
export type Keyword = z.infer<typeof keywordSchema>;
