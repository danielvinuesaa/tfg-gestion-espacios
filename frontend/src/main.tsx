import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import './index.css'
import App from './App.tsx'

/**
 * Configuración global e instanciación del cliente de `TanStack Query` (React Query).
 * Centraliza la estrategia de almacenamiento en caché, los tiempos de obsolescencia de datos 
 * y las políticas de reintento para garantizar la coherencia del estado remoto en toda la aplicación.
 */
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // Los datos se consideran "frescos" durante 5 minutos
      gcTime: 1000 * 60 * 30,    // Mantener en memoria (garbage collection) 30 minutos
      retry: 1,                 // Reintentar fallos de red una vez
      refetchOnWindowFocus: false, // No refrescar solo por cambiar de pestaña (evita ruido)
    },
  },
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </QueryClientProvider>
  </StrictMode>,
)
