import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import axios from 'axios'
import './index.css'
import App from './App.jsx'

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'https://chat-application-backend-eafa.onrender.com';
axios.defaults.baseURL = BACKEND_URL;
axios.defaults.withCredentials = true;

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
)
