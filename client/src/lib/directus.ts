import axios from "axios";
import type { LoginCredentials, Keyword, SearchSettings } from "@shared/schema";
import type { KeywordTrend, KeywordWithTrend } from "@shared/schema";

const API_URL = "https://directus.nplanner.ru";

const client = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add request interceptor to refresh token if needed
client.interceptors.request.use(async (config) => {
  const token = localStorage.getItem('directus_token');
  const refreshToken = localStorage.getItem('directus_refresh_token');

  if (!token && refreshToken) {
    try {
      const response = await axios.post(`${API_URL}/auth/refresh`, {
        refresh_token: refreshToken
      });

      if (response.data?.data?.access_token) {
        localStorage.setItem('directus_token', response.data.data.access_token);
        config.headers.Authorization = `Bearer ${response.data.data.access_token}`;
      }
    } catch (error) {
      console.error('Token refresh failed:', error);
      window.location.href = '/auth';
      return Promise.reject(error);
    }
  } else if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

// Modify response interceptor for better error handling
client.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      const refreshToken = localStorage.getItem('directus_refresh_token');

      if (refreshToken) {
        try {
          const response = await axios.post(`${API_URL}/auth/refresh`, {
            refresh_token: refreshToken
          });

          if (response.data?.data?.access_token) {
            localStorage.setItem('directus_token', response.data.data.access_token);
            originalRequest.headers.Authorization = `Bearer ${response.data.data.access_token}`;
            return client(originalRequest);
          }
        } catch (refreshError) {
          console.error('Token refresh failed:', refreshError);
        }
      }

      localStorage.removeItem('directus_token');
      localStorage.removeItem('directus_refresh_token');
      localStorage.removeItem('user_id');
      window.location.href = '/auth';
      return Promise.reject(new Error('Session expired. Please login again.'));
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
      localStorage.setItem('directus_refresh_token', response.data.data.refresh_token);

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

// В функции getKeywords обновляем фильтр для правильной работы с campaign_id
export async function getKeywords(campaignId?: string) {
  try {
    const userId = localStorage.getItem('user_id');
    if (!userId) {
      throw new Error('User ID not found. Please login again.');
    }

    console.log('Fetching keywords for user:', userId, 'campaign:', campaignId);

    // Формируем фильтр с учетом кампании
    const filter = {
      _and: [
        { user_id: { _eq: userId } }
      ]
    };

    if (campaignId) {
      filter._and.push({ campaign_id: { _eq: campaignId } });
    }

    const url = `/items/user_keywords?fields=*,campaign.*&filter=${JSON.stringify(filter)}`;
    console.log('Request URL:', url);
    const response = await client.get(url);
    console.log('Keywords API response:', response);

    if (!response.data?.data) {
      throw new Error('Invalid response format from API');
    }

    return response.data.data;
  } catch (error) {
    console.error('Get keywords error:', error);
    if (axios.isAxiosError(error)) {
      console.error('API Error details:', {
        status: error.response?.status,
        data: error.response?.data,
        headers: error.response?.headers
      });

      if (error.response?.status === 401 || error.response?.status === 403) {
        const token = localStorage.getItem('directus_token');
        console.log('Current token exists:', !!token);
        throw new Error('Session expired or insufficient permissions. Please login again.');
      }
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

    // Validate data structure
    if (!data?.response?.data?.shows || !Array.isArray(data.response.data.shows)) {
      throw new Error('Invalid WordStat data format');
    }

    // Ensure minimum data points
    if (data.response.data.shows.length < 6) {
      throw new Error('Insufficient historical data for accurate prediction');
    }

    // Remove any invalid entries
    data.response.data.shows = data.response.data.shows.filter(
      (item: any) => typeof item.shows === 'number' && !isNaN(item.shows)
    );

    // Sort data chronologically if timestamps are available
    if (data.response.data.shows[0]?.timestamp) {
      data.response.data.shows.sort((a: any, b: any) => a.timestamp - b.timestamp);
    }

    console.log('WordStat data received:', data);
    return data;
  } catch (error) {
    console.error('Wordstat API error:', error);
    throw error;
  }
}

export async function checkKeywordExists(keyword: string): Promise<boolean> {
  try {
    const { data } = await client.get<{ data: Keyword[] }>(`/items/user_keywords?filter[keyword][_eq]=${encodeURIComponent(keyword)}`);
    return data.data.length > 0;
  } catch (error) {
    console.error('Check keyword error:', error);
    return false;
  }
}

// В функции addKeyword обновляем структуру payload
export async function addKeyword(keyword: string, campaignId?: string) {
  try {
    const userId = localStorage.getItem('user_id');
    console.log('Adding keyword with user_id:', userId, 'campaign_id:', campaignId);

    if (!userId) {
      throw new Error('User ID not found. Please login again.');
    }

    // Проверяем существование ключевого слова в этой кампании
    const filter = {
      _and: [
        { keyword: { _eq: keyword } },
        { user_id: { _eq: userId } }
      ]
    };

    if (campaignId) {
      filter._and.push({ campaign_id: { _eq: campaignId } });
    }

    const exists = await checkKeywordExists(keyword);
    if (exists) {
      throw new Error('This keyword is already in your semantic core');
    }

    // Получаем статистику перед добавлением ключевого слова
    const wordstatData = await getWordstatData(keyword);
    console.log('Received WordStat data:', wordstatData);

    const lastShows = wordstatData.response.data.shows.slice(-3);
    const trend_score = Math.round(lastShows.reduce((sum, item) => sum + item.shows, 0) / lastShows.length);
    const mentions_count = wordstatData.response.data.sources?.reduce((sum, source) => sum + source.count, 0) || 0;

    const payload = {
      user_id: userId,
      campaign_id: campaignId,
      keyword: keyword,
      type: "main",
      trend_score,
      mentions_count
    };
    console.log('Request payload:', payload);

    const { data } = await client.post('/items/user_keywords', payload);
    console.log('Add keyword response:', data);
    return data.data;
  } catch (error) {
    console.error('Add keyword error:', error);
    if (axios.isAxiosError(error)) {
      if (error.response?.status === 401) {
        throw new Error('Session expired. Please login again.');
      }
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

// Search Settings
export async function getSearchSettings() {
  try {
    const userId = localStorage.getItem('user_id');
    if (!userId) {
      throw new Error('User ID not found. Please login again.');
    }

    const { data } = await client.get<{ data: SearchSettings[] }>(`/items/search_settings?filter[user_id][_eq]=${userId}`);
    return data.data[0];
  } catch (error) {
    console.error('Get search settings error:', error);
    if (axios.isAxiosError(error)) {
      throw new Error(error.response?.data?.errors?.[0]?.message || 'Failed to fetch search settings');
    }
    throw error;
  }
}

export async function saveSearchSettings(settings: SearchSettings) {
  try {
    const userId = localStorage.getItem('user_id');
    if (!userId) {
      throw new Error('User ID not found. Please login again.');
    }

    // Check if settings already exist
    const existingSettings = await getSearchSettings();

    if (existingSettings) {
      const { data } = await client.patch<{ data: SearchSettings }>(
        `/items/search_settings/${existingSettings.id}`,
        settings
      );
      return data.data;
    } else {
      const { data } = await client.post<{ data: SearchSettings }>(
        '/items/search_settings',
        settings
      );
      return data.data;
    }
  } catch (error) {
    console.error('Save search settings error:', error);
    if (axios.isAxiosError(error)) {
      throw new Error(error.response?.data?.errors?.[0]?.message || 'Failed to save search settings');
    }
    throw error;
  }
}

// Search query generation via n8n webhook
export async function generateSearchQuery(keyword: string, settings: SearchSettings) {
  try {
    const token = localStorage.getItem('directus_token');
    if (!token) {
      throw new Error('Authentication token not found. Please login again.');
    }

    const response = await fetch(N8N_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        jwt_token: token,
        keyword: keyword
      })
    });

    if (!response.ok) {
      throw new Error('Failed to generate search queries');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('N8N webhook error:', error);
    throw new Error('Failed to generate search queries');
  }
}

export async function getKeywordWithTrendPrediction(keyword: string): Promise<KeywordWithTrend> {
  try {
    // First get the existing keyword data
    const { data: { data: keywords } } = await client.get<{ data: KeywordWithTrend[] }>(`/items/user_keywords?filter[keyword][_eq]=${encodeURIComponent(keyword)}`);

    if (!keywords || keywords.length === 0) {
      throw new Error('Keyword not found');
    }

    const keywordData = keywords[0];

    // Get historical data from WordStat
    const wordstatData = await getWordstatData(keyword);

    // Get AI prediction based on historical data
    const trendPrediction = await predictKeywordTrend(keyword, {
      shows: wordstatData.response.data.shows,
      sources: wordstatData.response.data.sources
    });

    console.log('Generated trend prediction:', trendPrediction);

    // Update the keyword with trend prediction in Directus
    const { data: { data: updatedKeyword } } = await client.patch<{ data: KeywordWithTrend }>(
      `/items/user_keywords/${keywordData.id}`,
      {
        trend_prediction: JSON.stringify(trendPrediction) // Stringify the prediction object
      }
    );

    console.log('Updated keyword with trend:', updatedKeyword);

    // Parse the trend_prediction back from string if needed
    if (typeof updatedKeyword.trend_prediction === 'string') {
      updatedKeyword.trend_prediction = JSON.parse(updatedKeyword.trend_prediction);
    }

    return updatedKeyword;
  } catch (error) {
    console.error('Get keyword trend prediction error:', error);
    if (axios.isAxiosError(error)) {
      if (error.response?.status === 401 || error.response?.status === 403) {
        throw new Error('Session expired or insufficient permissions. Please login again.');
      }
      throw new Error(error.response?.data?.errors?.[0]?.message || 'Failed to get trend prediction');
    }
    throw error;
  }
}

export { predictKeywordTrend } from './openai';

export async function getCampaigns() {
  try {
    const userId = localStorage.getItem('user_id');
    if (!userId) {
      throw new Error('User ID not found. Please login again.');
    }

    console.log('Fetching campaigns for user:', userId);
    const { data } = await client.get(`/items/user_campaigns?filter[user_id][_eq]=${userId}`);
    console.log('Received campaigns:', data.data);
    return data.data;
  } catch (error) {
    console.error('Get campaigns error:', error);
    if (axios.isAxiosError(error)) {
      if (error.response?.status === 401 || error.response?.status === 403) {
        throw new Error('Session expired or insufficient permissions. Please login again.');
      }
      throw new Error(error.response?.data?.errors?.[0]?.message || 'Failed to fetch campaigns');
    }
    throw error;
  }
}

export async function addCampaign(data: { name: string; description?: string }) {
  const user_id = localStorage.getItem('user_id');
  const response = await client.post('/items/user_campaigns', {
    ...data,
    user_id
  });
  return response.data.data;
}