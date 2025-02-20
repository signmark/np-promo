import axios from "axios";
import type { LoginCredentials, Keyword, SearchSettings } from "@shared/schema";

const API_URL = "https://directus.nplanner.ru";
const N8N_WEBHOOK_URL = "https://n8n.nplanner.ru/webhook/4af3f3e9-aeec-4d31-933b-1e6e5ef68f93";

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
    const userId = localStorage.getItem('user_id');
    if (!userId) {
      throw new Error('User ID not found. Please login again.');
    }

    const { data } = await client.get<{ data: Keyword[] }>(`/items/user_keywords?sort=-id&filter[user_id][_eq]=${userId}`);
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

export async function checkKeywordExists(keyword: string): Promise<boolean> {
  try {
    const { data } = await client.get<{ data: Keyword[] }>(`/items/user_keywords?filter[keyword][_eq]=${encodeURIComponent(keyword)}`);
    return data.data.length > 0;
  } catch (error) {
    console.error('Check keyword error:', error);
    return false;
  }
}

export async function addKeyword(keyword: string) {
  try {
    const userId = localStorage.getItem('user_id');
    console.log('Adding keyword with user_id:', userId);

    if (!userId) {
      throw new Error('User ID not found. Please login again.');
    }

    // Check if keyword already exists
    const exists = await checkKeywordExists(keyword);
    if (exists) {
      throw new Error('This keyword is already in your semantic core');
    }

    // Get statistics before adding the keyword
    const wordstatData = await getWordstatData(keyword);
    console.log('Received WordStat data:', wordstatData);

    const lastShows = wordstatData.response.data.shows.slice(-3);
    const trend_score = Math.round(lastShows.reduce((sum, item) => sum + item.shows, 0) / lastShows.length);
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