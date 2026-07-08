import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, waitFor } from '../../../test/test-utils';
import AuditLogPage from './AuditLogPage';

/**
 * Suite de pruebas unitarias para la página AuditLogPage.
 * Comprueba que el historial de auditoría renderice correctamente
 * sus textos principales y la lista de registros obtenida de la API.
 */
describe('AuditLogPage', () => {
    beforeEach(() => {
        localStorage.setItem('token', 'mock-token');
    });

    /**
     * Verifica que la página cargue y muestre tanto el título como
     * el subtítulo descriptivo del historial de auditoría.
     */
    it('debe renderizar el título y el subtítulo', async () => {
        render(<AuditLogPage />);
        
        expect(await screen.findByText('Historial de Auditoría')).toBeInTheDocument();
        expect(screen.getByText(/explora las acciones y cambios realizados/i)).toBeInTheDocument();
    });

    /**
     * Verifica que se listen correctamente los registros provenientes del mock
     * de la API, comprobando que se aplique el mapeo de etiquetas cuando corresponda.
     */
    it('debe listar los registros obtenidos de la API usando sus etiquetas configuradas', async () => {
        render(<AuditLogPage />);
        
        // Esperar a que cargue la lista
        expect(await screen.findByText('Espacio Creado')).toBeInTheDocument(); // Mapeado de CREATE_SPACE
        expect(screen.getByText('LOGIN')).toBeInTheDocument(); // Sin mapear, usa el original
        expect(screen.getByText(/aula 101/i)).toBeInTheDocument();
    });
});
