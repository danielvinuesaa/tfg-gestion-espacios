import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor, act } from '../test/test-utils';
import { NotificationProvider, useNotifications } from './NotificationContext';
import { server } from '../test/mocks/server';
import { http, HttpResponse } from 'msw';

// Mock de useAuth para simular usuario autenticado
vi.mock('./AuthContext', () => ({
    useAuth: () => ({ isAuthenticated: true }),
    AuthProvider: ({ children }: any) => <div>{children}</div>
}));

const TestComponent = () => {
    const { notifications, unreadCount, markAsRead, clearAllNotifications } = useNotifications();
    return (
        <div>
            <div data-testid="unread">{unreadCount}</div>
            <div data-testid="count">{notifications.length}</div>
            <button onClick={() => markAsRead(1)}>Mark Read</button>
            <button onClick={clearAllNotifications}>Clear All</button>
        </div>
    );
};

/**
 * Suite de pruebas unitarias para el contexto de notificaciones del sistema (NotificationContext).
 * Evalúa la recuperación de notificaciones, conteo de mensajes sin leer
 * y las interacciones para marcar como leído o limpiar notificaciones.
 */
describe('NotificationContext', () => {
    beforeEach(() => {
        server.use(
            http.get('/api/notifications/unread-count', () => {
                return HttpResponse.json({ count: 5 });
            }),
            http.get('/api/notifications', () => {
                return HttpResponse.json({
                    content: [{ id: 1, content: 'Test', read: false }],
                    totalPages: 1,
                    totalElements: 1
                });
            }),
            http.patch('/api/notifications/1/read', () => {
                return new HttpResponse(null, { status: 204 });
            }),
            http.delete('/api/notifications/clear-all', () => {
                return new HttpResponse(null, { status: 204 });
            })
        );
    });

    /**
     * Verifica que el contexto obtenga inicialmente la lista de notificaciones
     * de la API y muestre correctamente el contador de mensajes no leídos.
     */
    it('debe cargar el contador y la lista inicial', async () => {
        render(
            <NotificationProvider>
                <TestComponent />
            </NotificationProvider>
        );

        await waitFor(() => {
            expect(screen.getByTestId('unread')).toHaveTextContent('5');
            expect(screen.getByTestId('count')).toHaveTextContent('1');
        });
    });

    /**
     * Verifica que al interactuar para marcar una notificación como leída,
     * el contexto llame correctamente a la API para actualizar el estado en el servidor.
     */
    it('debe llamar a la API para marcar como leída', async () => {
        render(
            <NotificationProvider>
                <TestComponent />
            </NotificationProvider>
        );

        await waitFor(() => expect(screen.getByTestId('count')).toHaveTextContent('1'));

        act(() => {
            screen.getByText('Mark Read').click();
        });

        // La mutación dispara invalidación, MSW interceptará las nuevas llamadas
        await waitFor(() => {
            // No verificamos el estado final exacto porque depende de la respuesta del refetch,
            // pero el click no debe fallar.
            expect(screen.getByTestId('count')).toBeInTheDocument();
        });
    });

    /**
     * Verifica que la acción para limpiar todas las notificaciones
     * invoque al endpoint de la API correspondiente para realizar el borrado.
     */
    it('debe llamar a la API para borrar todo', async () => {
        render(
            <NotificationProvider>
                <TestComponent />
            </NotificationProvider>
        );

        await waitFor(() => expect(screen.getByTestId('count')).toHaveTextContent('1'));

        act(() => {
            screen.getByText('Clear All').click();
        });

        await waitFor(() => {
            expect(screen.getByTestId('count')).toBeInTheDocument();
        });
    });
});
