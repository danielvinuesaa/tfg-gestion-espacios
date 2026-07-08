import { setupServer } from 'msw/node';
import { handlers } from './handlers';

/**
 * Instancia del servidor de interceptación de red simulada (`Mock Service Worker`).
 * Utilizada exclusivamente en el entorno de pruebas (`Node.js`) para interceptar
 * las peticiones HTTP y devolver las respuestas definidas en los `handlers`.
 */
export const server = setupServer(...handlers);
