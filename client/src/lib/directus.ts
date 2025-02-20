import axios from "axios";
import type { LoginCredentials, Keyword } from "@shared/schema";

const API_URL = "https://directus.nplanner.ru";
const WORDSTAT_API_URL = "http://xmlriver.com/wordstat/json";
const WORDSTAT_USER = "16797";
const WORDSTAT_KEY = "f7947eff83104621deb713275fe3260bfde4f001";

const client = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

client.interceptors.request.use((config) => {
  const token = localStorage.getItem('directus_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

client.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error);
    if (error.response?.status === 401) {
      localStorage.removeItem('directus_token');
      return Promise.reject(new Error('Unauthorized'));
    }
    return Promise.reject(error);
  }
);

export async function login(credentials: LoginCredentials) {
  try {
    console.log('Attempting login with:', credentials.email);
    const response = await client.post('/auth/login', credentials);
    console.log('Login response:', response);

    if (response.data?.data?.access_token) {
      localStorage.setItem('directus_token', response.data.data.access_token);

      // После успешного логина получаем информацию о пользователе
      const userResponse = await client.get('/users/me');
      const userInfo = userResponse.data.data;
      console.log('User info received:', userInfo);

      if (userInfo.id) {
        localStorage.setItem('user_id', userInfo.id);
        console.log('Saved user_id:', userInfo.id);
      } else {
        console.error('No user id in response:', userInfo);
      }

      return response.data.data;
    } else {
      throw new Error('Invalid response format');
    }
  } catch (error) {
    console.error('Login error:', error);
    if (axios.isAxiosError(error)) {
      const message = error.response?.data?.errors?.[0]?.message || 'Failed to login';
      throw new Error(message);
    }
    throw error;
  }
}

export async function getUserInfo() {
  try {
    const response = await client.get('/users/me');
    return response.data.data;
  } catch (error) {
    console.error('Get user info error:', error);
    if (axios.isAxiosError(error)) {
      throw new Error(error.response?.data?.errors?.[0]?.message || 'Failed to get user info');
    }
    throw error;
  }
}

export async function getKeywords() {
  try {
    const { data } = await client.get<{ data: Keyword[] }>('/items/user_keywords');
    return data.data;
  } catch (error) {
    console.error('Get keywords error:', error);
    if (axios.isAxiosError(error)) {
      throw new Error(error.response?.data?.errors?.[0]?.message || 'Failed to fetch keywords');
    }
    throw error;
  }
}

interface WordstatResponse {
  response: {
    data: {
      shows: { shows: number }[];
      sources?: { count: number }[];
    };
  };
}


export async function getWordstatData(keyword: string): Promise<WordstatResponse> {
  try {
    const response = await fetch(`/api/wordstat?keyword=${encodeURIComponent(keyword)}`);
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.details || 'Failed to fetch wordstat data');
    }

    const data = await response.json();
    console.log('WordStat data received:', data);
    return data;
  } catch (error) {
    console.error('Wordstat API error:', error);
    throw error;
  }
}

export async function addKeyword(keyword: string) {
  try {
    const userId = localStorage.getItem('user_id');
    console.log('Adding keyword with user_id:', userId);

    if (!userId) {
      throw new Error('User ID not found. Please login again.');
    }

    // Получаем статистику перед добавлением ключевого слова
    const wordstatData = await getWordstatData(keyword);
    console.log('Received WordStat data:', wordstatData);

    // Вычисляем trend_score на основе последних показов и округляем до целого числа
    const lastShows = wordstatData.response.data.shows.slice(-3);
    const trend_score = Math.round(lastShows.reduce((sum, item) => sum + item.shows, 0) / lastShows.length);

    // Подсчитываем общее количество упоминаний
    const mentions_count = wordstatData.response.data.sources?.reduce((sum, source) => sum + source.count, 0) || 0;

    const payload = {
      user_id: userId,
      keyword: keyword,
      type: "main",
      trend_score,
      mentions_count
    };
    console.log('Request payload:', payload);

    const { data } = await client.post<{ data: Keyword }>('/items/user_keywords', payload);
    console.log('Add keyword response:', data);
    return data.data;
  } catch (error) {
    console.error('Add keyword error:', error);
    if (axios.isAxiosError(error)) {
      const errorMessage = error.response?.data?.errors?.[0]?.message || 'Failed to add keyword';
      console.error('Detailed error:', error.response?.data);
      throw new Error(errorMessage);
    }
    throw error;
  }
}

export async function deleteKeyword(id: string) {
  try {
    await client.delete(`/items/user_keywords/${id}`);
  } catch (error) {
    console.error('Delete keyword error:', error);
    if (axios.isAxiosError(error)) {
      throw new Error(error.response?.data?.errors?.[0]?.message || 'Failed to delete keyword');
    }
    throw error;
  }
}