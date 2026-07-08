import React, { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { ThemeProvider } from '@mui/material';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { es } from 'date-fns/locale/es';
import { theme } from '../theme/theme';
import { AuthProvider } from '../context/AuthContext';
import { NotificationProvider } from '../context/NotificationContext';
import { SnackbarProvider } from '../context/SnackbarContext';
import { SettingsProvider } from '../context/SettingsContext';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
  },
});

/**
 * Componente contenedor de proveedores de contexto (Providers Wrapper) utilizado en las pruebas.
 * Asegura que cualquier componente renderizado dentro de los tests posea acceso a 
 * las dependencias globales requeridas (enrutador, temas, clientes de consultas, contextos de estado).
 * 
 * @param props - Propiedades del componente, requiriendo nodos hijos de React.
 * @returns Árbol de proveedores anidados.
 */
const AllTheProviders = ({ children }: { children: React.ReactNode }) => {
  return (
    <BrowserRouter>
      <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={es}>
        <SettingsProvider>
          <QueryClientProvider client={queryClient}>
            <ThemeProvider theme={theme}>
              <SnackbarProvider>
                <AuthProvider>
                  <NotificationProvider>
                    {children}
                  </NotificationProvider>
                </AuthProvider>
              </SnackbarProvider>
            </ThemeProvider>
          </QueryClientProvider>
        </SettingsProvider>
      </LocalizationProvider>
    </BrowserRouter>
  );
};

/**
 * Función de renderizado personalizada para entornos de prueba (`@testing-library/react`).
 * Encapsula el componente evaluado dentro del árbol de proveedores globales (`AllTheProviders`), 
 * simulando el contexto de la aplicación real.
 * 
 * @param ui - El elemento o componente React a renderizar.
 * @param options - Opciones adicionales de renderizado suministradas por la librería.
 * @returns El resultado del renderizado, incluyendo herramientas de selección y aserción.
 */
const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>,
) => render(ui, { wrapper: AllTheProviders, ...options });

export * from '@testing-library/react';
export { customRender as render };
