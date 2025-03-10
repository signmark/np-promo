import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import fetch from "node-fetch";
import { wordstatResponseSchema } from "@shared/schema";

const WORDSTAT_API_URL = "http://xmlriver.com/wordstat/json";
const WORDSTAT_USER = "16797";
const WORDSTAT_KEY = "f7947eff83104621deb713275fe3260bfde4f001";

export async function registerRoutes(app: Express): Promise<Server> {
  // Endpoint для получения данных из WordStat
  app.get('/api/wordstat', async (req, res) => {
    try {
      const keyword = req.query.keyword as string;
      if (!keyword) {
        return res.status(400).json({ error: 'Keyword is required' });
      }

      console.log('Fetching WordStat data for keyword:', keyword);

      const params = new URLSearchParams({
        user: WORDSTAT_USER,
        key: WORDSTAT_KEY,
        query: keyword
      });

      const apiUrl = `${WORDSTAT_API_URL}?${params.toString()}`;
      console.log('Making request to:', apiUrl);

      const response = await fetch(apiUrl);
      const data = await response.json();

      console.log('WordStat API response:', JSON.stringify(data, null, 2));

      // Обработка данных из WordStat
      const inputData = data.content?.includingPhrases?.items || [];

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
      const processedData = inputData.map(item => ({
        phrase: item.phrase,
        shows: parseInt(item.number.replace(/\s/g, ''), 10)
      }));

      // Формируем ответ в нужном формате
      const formattedResponse = {
        response: {
          data: {
            shows: processedData.map(item => ({ shows: item.shows })),
            sources: processedData.map(item => ({ count: item.shows }))
          }
        },
        content: data.content // Передаем оригинальные данные для отображения в интерфейсе
      };

      res.json(formattedResponse);
    } catch (error) {
      console.error('WordStat API error:', error);
      res.status(500).json({ 
        error: 'Failed to fetch data from WordStat',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}