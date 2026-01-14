import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import fetch from "node-fetch";
import { wordstatResponseSchema } from "@shared/schema";
import { asyncHandler, ApiError } from "./middleware/error-handler";

const WORDSTAT_API_URL = process.env.WORDSTAT_API_URL || "http://xmlriver.com/wordstat/json";
const WORDSTAT_USER = process.env.WORDSTAT_USER;
const WORDSTAT_KEY = process.env.WORDSTAT_KEY;

if (!WORDSTAT_USER || !WORDSTAT_KEY) {
  console.error('ERROR: WORDSTAT_USER and WORDSTAT_KEY environment variables are required');
  throw new Error('Missing required WordStat API credentials. Please check your .env file');
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Endpoint для получения данных из WordStat
  app.get('/api/wordstat', asyncHandler(async (req, res) => {
    const keyword = req.query.keyword as string;
    if (!keyword) {
      throw new ApiError('Keyword parameter is required', 400, 'MISSING_KEYWORD');
    }

    console.log('Fetching WordStat data for keyword:', keyword);

    const params = new URLSearchParams({
      user: WORDSTAT_USER || '',
      key: WORDSTAT_KEY || '',
      query: keyword
    } as Record<string, string>);

    const apiUrl = `${WORDSTAT_API_URL}?${params.toString()}`;
    console.log('Making request to:', apiUrl);

    const response = await fetch(apiUrl);

    if (!response.ok) {
      throw new ApiError(
        `WordStat API returned status ${response.status}`,
        502,
        'WORDSTAT_API_ERROR'
      );
    }

    const data = await response.json() as any;
    console.log('WordStat API response:', JSON.stringify(data, null, 2));

    // Обработка данных из WordStat
    const inputData = (data.content?.includingPhrases?.items as any[]) || [];

    if (inputData.length === 0) {
      return res.json({
        response: {
          data: {
            shows: [],
            sources: []
          }
        },
        content: {
          includingPhrases: {
            items: []
          }
        }
      });
    }

    // Преобразуем данные в нужный формат
    const processedData = inputData.map((item: any) => ({
      phrase: item.phrase,
      shows: parseInt(item.number.replace(/\s/g, ''), 10)
    }));

    // Формируем ответ в нужном формате
    const formattedResponse = {
      response: {
        data: {
          shows: processedData.map((item: any) => ({ shows: item.shows })),
          sources: processedData.map((item: any) => ({ count: item.shows }))
        }
      },
      content: data.content // Передаем оригинальные данные для отображения в интерфейсе
    };

    res.json(formattedResponse);
  }));

  const httpServer = createServer(app);
  return httpServer;
}