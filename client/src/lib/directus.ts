import axios from "axios";
import type { LoginCredentials, Keyword } from "@shared/schema";

const client = axios.create({
  baseURL: 'http://localhost:8055',
});

client.interceptors.request.use((config) => {
  const token = localStorage.getItem('directus_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export async function login(credentials: LoginCredentials) {
  const { data } = await client.post('/auth/login', credentials);
  localStorage.setItem('directus_token', data.data.access_token);
  return data.data;
}

export async function getKeywords() {
  const { data } = await client.get<{ data: Keyword[] }>('/items/user_keywords');
  return data.data;
}

export async function addKeyword(keyword: string) {
  const { data } = await client.post<{ data: Keyword }>('/items/user_keywords', {
    keyword
  });
  return data.data;
}

export async function deleteKeyword(id: string) {
  await client.delete(`/items/user_keywords/${id}`);
}
