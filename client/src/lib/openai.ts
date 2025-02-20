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
    const messages = [
      {
        role: "system" as const,
        content: "You are an expert SEO analyst specializing in keyword trend prediction. Analyze the historical data and predict future trends."
      },
      {
        role: "user" as const,
        content: JSON.stringify({
          keyword,
          historicalData,
          request: "Please analyze this keyword's historical trend data and provide a prediction including trend_direction (up/down/stable), growth_potential (0-100), confidence_score (0-1), seasonality patterns, and prediction_date. Return in JSON format matching the KeywordTrend schema."
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

    const prediction = JSON.parse(content);

    // Ensure the prediction matches our schema
    const trend: KeywordTrend = {
      trend_direction: prediction.trend_direction,
      growth_potential: Math.min(100, Math.max(0, prediction.growth_potential)),
      confidence_score: Math.min(1, Math.max(0, prediction.confidence_score)),
      seasonality: prediction.seasonality || [],
      prediction_date: new Date().toISOString(),
    };

    return trend;
  } catch (error) {
    console.error('Error predicting keyword trend:', error);
    throw new Error('Failed to predict keyword trend');
  }
}