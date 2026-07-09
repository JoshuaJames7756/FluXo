import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { ClerkProvider } from '@clerk/clerk-react';
import { registerSW } from 'virtual:pwa-register';
import App from './App.jsx';

const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

if (!PUBLISHABLE_KEY) {
  throw new Error('Falta VITE_CLERK_PUBLISHABLE_KEY en .env.local');
}

// Registra el Service Worker generado por vite-plugin-pwa.
// updateSW se puede llamar despues para forzar actualizacion
// si detectas una nueva version disponible (opcional a futuro).
const updateSW = registerSW({
  onNeedRefresh() {
    console.log('Nueva version de FluXo disponible');
  },
  onOfflineReady() {
    console.log('FluXo listo para funcionar sin conexion');
  },
});

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ClerkProvider publishableKey={PUBLISHABLE_KEY}>
      <App />
    </ClerkProvider>
  </StrictMode>,
);