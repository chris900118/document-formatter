import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

// 确保你的 public/index.html 中有一个 <div id="root"></div>
const rootElement = document.getElementById('root');
if (rootElement) {
  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
} else {
  console.error('Failed to find the root element');
}