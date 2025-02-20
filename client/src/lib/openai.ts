import OpenAI from "openai";
import type { KeywordTrend } from "@shared/schema";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
if (!import.meta.env.VITE_OPENAI_API_KEY) {
  throw new Error("OpenAI API key is required. Please set VITE_OPENAI_API_KEY environment variable.");
}

const openai = new OpenAI({ 
  apiKey: import.meta.env.VITE_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true // Required for client-side usage
});

interface HistoricalData {
  shows: Array<{ shows: number }>;
  sources?: Array<{ count: number }>;
}

export async function predictKeywordTrend(keyword: string, historicalData: HistoricalData): Promise<KeywordTrend> {
  try {
    // Calculate averages and trends
    const recentShows = historicalData.shows.slice(-6);
    const oldShows = historicalData.shows.slice(-12, -6);

    const recentAvg = recentShows.reduce((sum, item) => sum + item.shows, 0) / recentShows.length;
    const oldAvg = oldShows.reduce((sum, item) => sum + item.shows, 0) / oldShows.length;

    const percentChange = ((recentAvg - oldAvg) / oldAvg) * 100;

    // Calculate monthly patterns for seasonality
    const monthlyTotals = historicalData.shows.reduce((acc, item, index) => {
      const monthIndex = index % 12;
      acc[monthIndex] = (acc[monthIndex] || 0) + item.shows;
      return acc;
    }, Array(12).fill(0));

    const messages = [
      {
        role: "system" as const,
        content: `You are an expert SEO analyst specializing in keyword trend prediction. Analyze the data with these guidelines:
- Look for clear directional changes in recent data
- Consider the magnitude and consistency of changes
- Factor in any seasonal patterns
- Assess the data quality and completeness
Return ONLY valid JSON that matches the KeywordTrend schema.`
      },
      {
        role: "user" as const,
        content: JSON.stringify({
          keyword,
          analysis: {
            totalDataPoints: historicalData.shows.length,
            recentAverage: recentAvg,
            historicalAverage: oldAvg,
            percentChange: percentChange,
            monthlyPatterns: monthlyTotals,
            sourceCount: historicalData.sources?.length || 0,
          },
          request: "Based on this historical data, provide a prediction including trend direction ('up'/'down'/'stable'), growth potential (0-100), confidence score (0-1), seasonality patterns, and today's date as prediction_date."
        })
      }
    ];

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages,
      temperature: 0.2,
      response_format: { type: "json_object" }
    });

    const content = response.choices[0].message.content;
    if (!content) {
      throw new Error('No content in OpenAI response');
    }

    console.log('OpenAI response:', content);

    const prediction = JSON.parse(content);

    // Validate and normalize the prediction data
    const trend: KeywordTrend = {
      trend_direction: prediction.trend_direction,
      growth_potential: Math.min(100, Math.max(0, prediction.growth_potential)),
      confidence_score: Math.min(1, Math.max(0, prediction.confidence_score)),
      seasonality: Array.isArray(prediction.seasonality) ? prediction.seasonality : [],
      prediction_date: prediction.prediction_date || new Date().toISOString(),
    };

    // Validate trend direction
    if (!['up', 'down', 'stable'].includes(trend.trend_direction)) {
      throw new Error('Invalid trend direction in OpenAI response');
    }

    // Lower confidence if data is sparse
    if (historicalData.shows.length < 12) {
      trend.confidence_score *= 0.7;
    }

    // Adjust growth potential based on historical volatility
    const volatility = calculateVolatility(historicalData.shows);
    if (volatility > 0.5) {
      trend.growth_potential = Math.min(trend.growth_potential, 50);
    }

    console.log('Processed trend prediction:', trend);
    return trend;
  } catch (error) {
    console.error('Error predicting keyword trend:', error);
    throw new Error('Failed to predict keyword trend');
  }
}

function calculateVolatility(shows: Array<{ shows: number }>): number {
  const values = shows.map(s => s.shows);
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const variance = values.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / values.length;
  return Math.sqrt(variance) / mean;
}