import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '../../../test/test-utils';
import NotificationPreferences from './NotificationPreferences';
import { server } from '../../../test/mocks/server';
import { http, HttpResponse } from 'msw';
import { useAuth } from '../../../context/AuthContext';

// Mock de useAuth
vi.mock('../../../context/AuthContext', async (importOriginal) => {
    const actual = await importOriginal<typeof import('../../../context/AuthContext')>();
    return {
        ...actual,
        useAuth: vi.fn()
    };
});

/**
 * Suite de pruebas unitarias para el componente NotificationPreferences.
 * Verifica la correcta carga, visualización, modificación y guardado
 * de las preferencias de notificación de un usuario, así como su filtrado por permisos.
 */
describe('NotificationPreferences', () => {
    const mockPrefs = {
        id: 1,
        internalOnCreated: true,
        emailOnCreated: false,
        internalOnStatusChange: true,
        emailOnStatusChange: true,
        internalOnReminder: false,
        emailOnReminder: false,
        internalOnApprovalReminder: true,
        emailOnApprovalReminder: true,
        internalOnSystem: true,
        emailOnSystem: false
    };

    beforeEach(() => {
        vi.clearAllMocks();
        localStorage.setItem('token', 'mock-token');
        (useAuth as any).mockReturnValue({
            hasPermission: () => true,
            user: { id: 1, name: 'Admin', role: 'ADMIN' }
        });
        server.use(
            http.get('/api/notifications/preferences', () => {
                return HttpResponse.json(mockPrefs);
            })
        );
    });

    /**
     * Verifica que el componente obtenga las preferencias actuales del usuario
     * desde la API y las renderice adecuadamente reflejando su estado (activado/desactivado).
     */
    it('debe cargar y renderizar las preferencias actuales', async () => {
        render(<NotificationPreferences />);
        
        expect(screen.getByRole('progressbar')).toBeInTheDocument();
        
        expect(await screen.findByText('Preferencias de Notificación')).toBeInTheDocument();
        expect(screen.getByText('Confirmación de Solicitud')).toBeInTheDocument();
        
        // El switch de emailOnCreated debería estar en false
        const switches = screen.getAllByRole('checkbox');
        expect(switches[1]).not.toBeChecked(); 
    });

    /**
     * Verifica que ciertas preferencias o categorías de notificación se oculten
     * para usuarios con roles que no poseen los permisos administrativos necesarios.
     */
    it('debe filtrar filas según permisos (Usuario básico)', async () => {
        (useAuth as any).mockReturnValue({
            hasPermission: (p: string) => p === 'SOLICITAR_RESERVA',
            user: { id: 2, name: 'Profe', role: 'PROFESOR' }
        });

        render(<NotificationPreferences />);
        
        await screen.findByText('Preferencias de Notificación');

        // Debe ver sus propias notificaciones
        expect(screen.getByText('Confirmación de Solicitud')).toBeInTheDocument();
        
        // NO debe ver alertas de gestión
        expect(screen.queryByText('Alertas de Gestión (Tiempo Real)')).toBeNull();
        expect(screen.queryByText('Recordatorios de Pendientes (Diario)')).toBeNull();
    });

    /**
     * Verifica que el botón para guardar cambios permanezca deshabilitado
     * hasta que el usuario modifique alguna de las preferencias mostradas.
     */
    it('debe habilitar el botón guardar cuando hay cambios', async () => {
        render(<NotificationPreferences />);
        
        await screen.findByText('Preferencias de Notificación');
        
        const saveButton = screen.getByRole('button', { name: /guardar preferencias/i });
        expect(saveButton).toBeDisabled();

        const switches = screen.getAllByRole('checkbox');
        fireEvent.click(switches[1]); // Cambiar emailOnCreated a true

        expect(saveButton).toBeEnabled();
    });

    /**
     * Verifica que al pulsar el botón de guardar, se envíe una petición a la API
     * que incluya correctamente el estado modificado de las preferencias.
     */
    it('debe llamar a la API al guardar cambios', async () => {
        let putBody = null;
        server.use(
            http.put('/api/notifications/preferences', async ({ request }) => {
                putBody = await request.json();
                return HttpResponse.json(putBody);
            })
        );

        render(<NotificationPreferences />);
        await screen.findByText('Preferencias de Notificación');

        fireEvent.click(screen.getAllByRole('checkbox')[1]);
        fireEvent.click(screen.getByRole('button', { name: /guardar preferencias/i }));

        await waitFor(() => {
            expect(putBody).not.toBeNull();
            expect(putBody.emailOnCreated).toBe(true);
        });
    });

    /**
     * Verifica que al pulsar el botón para restaurar valores por defecto,
     * se muestre un cuadro de diálogo solicitando la confirmación de la acción.
     */
    it('debe mostrar diálogo de confirmación al restaurar', async () => {
        render(<NotificationPreferences />);
        await screen.findByText('Preferencias de Notificación');

        fireEvent.click(screen.getByRole('button', { name: /restaurar valores/i }));
        
        expect(await screen.findByText(/¿restaurar ajustes\?/i)).toBeInTheDocument();
    });
});

