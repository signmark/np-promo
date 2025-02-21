import { z } from "zod";
import { pgTable, text, uuid, timestamp } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";

// Tables
export const userCampaigns = pgTable('user_campaigns', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull(),
  name: text('name').notNull(),
  description: text('description'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const userKeywords = pgTable('user_keywords', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull(),
  campaignId: uuid('campaign_id').array(),
  keyword: text('keyword').notNull(),
  trendScore: text('trend_score'),
  mentionsCount: text('mentions_count'),
  lastChecked: timestamp('last_checked').defaultNow(),
});

// Relations
export const userCampaignsRelations = relations(userCampaigns, ({ many }) => ({
  keywords: many(userKeywords),
}));

export const userKeywordsRelations = relations(userKeywords, ({ many }) => ({
  campaigns: many(userCampaigns),
}));

// Zod schemas for validation
export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6)
});

export const campaignSchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  user_id: z.string(),
  description: z.string().optional(),
});

export const keywordSchema = z.object({
  id: z.string(),
  campaign_id: z.array(z.string()),
  keyword: z.string().min(1),
  user_id: z.string(),
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

// Export types
export type LoginCredentials = z.infer<typeof loginSchema>;
export type Campaign = typeof userCampaigns.$inferSelect;
export type InsertCampaign = typeof userCampaigns.$inferInsert;
export type Keyword = typeof userKeywords.$inferSelect;
export type InsertKeyword = typeof userKeywords.$inferInsert;
export type WordstatResponse = z.infer<typeof wordstatResponseSchema>;
export type SearchSettings = z.infer<typeof searchSettingsSchema>;
export type KeywordTrend = z.infer<typeof keywordTrendSchema>;
export type KeywordWithTrend = z.infer<typeof keywordWithTrendSchema>;