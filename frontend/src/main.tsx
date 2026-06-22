import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.tsx';
import { useAuthStore } from './stores/useAuthStore';
import { useCartStore } from './stores/useCartStore';

function generateSessionId(): string {
  return crypto.randomUUID();
}

const sessionId = localStorage.getItem('cart_session_id') || generateSessionId();
localStorage.setItem('cart_session_id', sessionId);

async function initialize() {
  await useAuthStore.getState().initialize();
  await useCartStore.getState().syncWithServer();
}

initialize();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
