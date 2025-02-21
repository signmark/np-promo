
import type { KeywordTrend } from "@shared/schema";

interface HistoricalData {
  shows: Array<{ shows: number }>;
  sources?: Array<{ count: number }>;
}

export function predictKeywordTrend(keyword: string, historicalData: HistoricalData): KeywordTrend {
  const recentShows = historicalData.shows.slice(-6);
  const oldShows = historicalData.shows.slice(-12, -6);

  const recentAvg = recentShows.reduce((sum, item) => sum + item.shows, 0) / recentShows.length;
  const oldAvg = oldShows.reduce((sum, item) => sum + item.shows, 0) / oldShows.length;

  const percentChange = ((recentAvg - oldAvg) / oldAvg) * 100;

  return {
    trend_direction: percentChange > 10 ? 'up' : percentChange < -10 ? 'down' : 'stable',
    growth_potential: Math.min(100, Math.max(0, 50 + percentChange)),
    confidence_score: 0.7,
    seasonality: [],
    prediction_date: new Date().toISOString()
  };
}
