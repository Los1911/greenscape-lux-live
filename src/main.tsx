import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.tsx';

import { AuthProvider } from './contexts/AuthContext';
import { SecurityProvider } from './components/SecurityProvider';

// Initialize analytics (safe, simple)
import { initGA } from './lib/analytics';
initGA();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <SecurityProvider enableCSP={true} enableRateLimit={true}>
      <AuthProvider>
        <App />
      </AuthProvider>
    </SecurityProvider>
  </StrictMode>
);