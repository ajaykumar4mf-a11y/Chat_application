import axios from 'axios';

// Centralized Axios instance for all backend API requests
const api = axios.create({
  baseURL: '',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

export default api;
