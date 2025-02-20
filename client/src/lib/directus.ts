import axios from "axios";
import type { LoginCredentials, Keyword } from "@shared/schema";

const API_URL = "https://directus.nplanner.ru";

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

export async function addKeyword(keyword: string) {
  try {
    const userId = localStorage.getItem('user_id');
    console.log('Adding keyword with user_id:', userId);

    if (!userId) {
      throw new Error('User ID not found. Please login again.');
    }

    const payload = {
      user_id: userId,
      keyword: keyword,
      type: "main"
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