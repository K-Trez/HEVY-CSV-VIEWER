import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(<App />);

// Production only: a service worker in dev would cache HMR responses, and the
// Android shell serves its own bundle without one.
if ('serviceWorker' in navigator && import.meta.env.PROD && !('HevyNative' in window)) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {});
  });
}
