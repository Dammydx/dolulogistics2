import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);

// Smoothly fade out the cheat HTML loader after the app boots
window.addEventListener('load', () => {
  const loader = document.getElementById('initial-loader');
  if (loader) {
    loader.classList.add('loader-fade-out');
    setTimeout(() => {
      loader.remove();
    }, 600);
  }
});
