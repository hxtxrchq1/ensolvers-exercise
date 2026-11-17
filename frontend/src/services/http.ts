import axios from 'axios';
import { getApiBaseUrl } from './api-url';

export const httpClient = axios.create({
  baseURL: getApiBaseUrl(import.meta.env.VITE_API_URL),
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});
