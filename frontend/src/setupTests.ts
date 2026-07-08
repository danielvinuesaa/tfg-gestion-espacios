/**
 * Configuración de entorno para las pruebas unitarias.
 * Importa las aserciones de DOM de jest, configura el servidor de Mock Service Worker (MSW)
 * y establece rutinas de limpieza después de cada prueba.
 */
import '@testing-library/jest-dom';
import { beforeAll, afterEach, afterAll } from 'vitest';
import { cleanup } from '@testing-library/react';
import { server } from './test/mocks/server';

// Iniciar el servidor de MSW
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));

// Limpieza automática tras cada test
afterEach(() => {
  cleanup();
  server.resetHandlers();
});

// Cerrar el servidor al terminar
afterAll(() => server.close());
