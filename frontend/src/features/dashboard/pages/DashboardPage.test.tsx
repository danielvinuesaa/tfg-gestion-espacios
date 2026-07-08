import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, waitFor } from '../../../test/test-utils';
import DashboardPage from './DashboardPage';
import { server } from '../../../test/mocks/server';
import { http, HttpResponse } from 'msw';

/**
 * Suite de pruebas unitarias para la página DashboardPage.
 * Verifica la correcta visualización del panel de control en función
 * de los roles y permisos del usuario (vista global vs vista personal).
 */
describe('DashboardPage', () => {
    beforeEach(() => {
        localStorage.setItem('token', 'mock-token');
    });

    /**
     * Verifica que si el usuario tiene permisos globales (ej. Administrador),
     * se renderice el dashboard global con los indicadores y estadísticas generales.
     */
    it('debe renderizar el dashboard global para administradores', async () => {
        render(<DashboardPage />);
        
        expect(await screen.findByText('Dashboard de Análisis')).toBeInTheDocument();
        
        // KPIs globales
        expect(screen.getByText(/SOLICITUDES DE RESERVA/i)).toBeInTheDocument();
        
        // Inventario global
        expect(screen.getByText(/ESPACIOS TOTALES/i)).toBeInTheDocument();
        expect(screen.getByText('10')).toBeInTheDocument();
    });

    /**
     * Verifica que si el usuario carece de permisos globales (ej. Profesor),
     * se muestre el dashboard personal enfocado en su propia actividad e indicadores.
     */
    it('debe renderizar el dashboard personal para usuarios normales', async () => {
        // Sobrescribir el mock de /me para un usuario sin permisos globales
        server.use(
            http.get('/api/users/me', () => {
                return HttpResponse.json({
                    id: 2,
                    email: 'profe@uniovi.es',
                    name: 'Profe Test',
                    role: { id: 2, name: 'PROFESOR' },
                    permissions: ['SOLICITAR_RESERVA'],
                    managedSubjectIds: []
                });
            })
        );

        render(<DashboardPage />);
        
        expect(await screen.findByText('Mi Actividad')).toBeInTheDocument();
        
        // KPIs personales
        expect(screen.getByText(/MIS SOLICITUDES/i)).toBeInTheDocument();
        
        // Actividad reciente (solo visible en vista personal)
        expect(screen.getByText(/registro de eventos/i)).toBeInTheDocument();
        
        // Usar findAllByText para manejar la duplicidad (título del chip y texto de la actividad)
        const activityElements = await screen.findAllByText(/nueva reserva/i);
        expect(activityElements.length).toBeGreaterThan(0);
    });
});
