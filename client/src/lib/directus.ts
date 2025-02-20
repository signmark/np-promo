import axios from "axios";
import type { LoginCredentials, Keyword } from "@shared/schema";

// Получаем URL API из переменных окружения или используем значение по умолчанию
const API_URL = import.meta.env.VITE_DIRECTUS_API_URL || 'https://directus-production-44d1.up.railway.app';

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
    if (error.response?.status === 401) {
      localStorage.removeItem('directus_token');
      window.location.href = '/auth';
    }
    return Promise.reject(error);
  }
);

export async function login(credentials: LoginCredentials) {
  try {
    const { data } = await client.post('/auth/login', credentials);
    localStorage.setItem('directus_token', data.data.access_token);
    return data.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new Error(error.response?.data?.errors?.[0]?.message || 'Failed to login');
    }
    throw error;
  }
}

export async function getKeywords() {
  try {
    const { data } = await client.get<{ data: Keyword[] }>('/items/user_keywords');
    return data.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new Error(error.response?.data?.errors?.[0]?.message || 'Failed to fetch keywords');
    }
    throw error;
  }
}

export async function addKeyword(keyword: string) {
  try {
    const { data } = await client.post<{ data: Keyword }>('/items/user_keywords', {
      keyword
    });
    return data.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new Error(error.response?.data?.errors?.[0]?.message || 'Failed to add keyword');
    }
    throw error;
  }
}

export async function deleteKeyword(id: string) {
  try {
    await client.delete(`/items/user_keywords/${id}`);
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new Error(error.response?.data?.errors?.[0]?.message || 'Failed to delete keyword');
    }
    throw error;
  }
}