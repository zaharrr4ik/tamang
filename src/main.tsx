import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

/**
 * Точка входа приложения.
 * Провайдеры (Telegram и т.п.) поднимаются внутри App, чтобы не загрязнять bootstrap.
 */
ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
