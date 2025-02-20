import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import fetch from "node-fetch";

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

      const params = new URLSearchParams({
        user: WORDSTAT_USER,
        key: WORDSTAT_KEY,
        query: keyword
      });

      const response = await fetch(`${WORDSTAT_API_URL}?${params.toString()}`);
      const data = await response.json();

      res.json(data);
    } catch (error) {
      console.error('WordStat API error:', error);
      res.status(500).json({ error: 'Failed to fetch data from WordStat' });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}