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

export const keywordTrendSchema = z.object({
  trend_direction: z.enum(['up', 'down', 'stable']),
  growth_potential: z.number().min(0).max(100),
  confidence_score: z.number().min(0).max(1),
  seasonality: z.array(z.string()),
  prediction_date: z.string(),
});

export const keywordWithTrendSchema = keywordSchema.extend({
  trend_prediction: keywordTrendSchema.optional(),
});

export const searchSettingsSchema = z.object({
  user_id: z.string(),
  social_networks: z.array(z.enum([
    'vkontakte',
    'telegram',
    'youtube',
    'rutube'
  ])),
  search_engines: z.array(z.enum([
    'google',
    'yandex',
    'bing'
  ])),
  content_types: z.array(z.enum([
    'posts',
    'comments',
    'articles',
    'videos'
  ])),
  date_range: z.enum([
    'day',
    'week',
    'month',
    'year'
  ]).default('month'),
});

export const wordstatResponseSchema = z.object({
  response: z.object({
    data: z.object({
      shows: z.array(z.object({
        shows: z.number()
      })),
      sources: z.array(z.object({
        count: z.number()
      })).optional()
    })
  })
});

export type LoginCredentials = z.infer<typeof loginSchema>;
export type Keyword = z.infer<typeof keywordSchema>;
export type WordstatResponse = z.infer<typeof wordstatResponseSchema>;
export type SearchSettings = z.infer<typeof searchSettingsSchema>;
export type KeywordTrend = z.infer<typeof keywordTrendSchema>;
export type KeywordWithTrend = z.infer<typeof keywordWithTrendSchema>;