import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '../../../test/test-utils';
import NotificationCenter from './NotificationCenter';

/**
 * Suite de pruebas unitarias para la página NotificationCenter.
 * Verifica la correcta visualización de notificaciones, la interacción con ellas
 * (como marcarlas como leídas o borrarlas) y la navegación hacia preferencias.
 */
describe('NotificationCenter', () => {
    beforeEach(() => {
        localStorage.setItem('token', 'mock-token');
    });

    /**
     * Verifica que la página cargue y muestre correctamente el título principal,
     * así como los elementos y el texto de las notificaciones simuladas.
     */
    it('debe renderizar el título y las notificaciones', async () => {
        render(<NotificationCenter />);
        
        expect(await screen.findByText('Notificaciones')).toBeInTheDocument();
        // El chip tiene el texto "2 nuevas"
        expect(await screen.findByText(/2 nuevas/i)).toBeInTheDocument();
        
        // Verificar contenido de las notificaciones del mock
        expect(await screen.findByText(/reserva ha sido aprobada/i)).toBeInTheDocument();
        expect(screen.getByText(/Nueva solicitud de reserva/i)).toBeInTheDocument();
        expect(screen.getByText(/Mantenimiento del sistema/i)).toBeInTheDocument();
    });

    /**
     * Verifica que al pulsar el botón correspondiente, se dispare la acción para
     * marcar todas las notificaciones como leídas y se muestre un aviso de confirmación.
     */
    it('debe permitir marcar todas como leídas', async () => {
        render(<NotificationCenter />);
        
        const markAllButton = await screen.findByRole('button', { name: /marcar leídas/i });
        fireEvent.click(markAllButton);

        // El mensaje sale en un snackbar.
        expect(await screen.findByText(/todas las notificaciones marcadas como leídas/i)).toBeInTheDocument();
    });

    /**
     * Verifica que al intentar vaciar el historial de notificaciones,
     * se despliegue un cuadro de diálogo requiriendo la confirmación del usuario.
     */
    it('debe permitir abrir la confirmación de vaciado', async () => {
        render(<NotificationCenter />);
        
        const clearButton = await screen.findByRole('button', { name: /vaciar historial/i });
        fireEvent.click(clearButton);

        // El título del diálogo es un H2
        expect(await screen.findByRole('heading', { name: /vaciar historial/i, level: 2 })).toBeInTheDocument();
        // El texto está fragmentado por un <strong>
        expect(screen.getByText(/esta acción eliminará/i)).toBeInTheDocument();
        expect(screen.getByText(/todas tus notificaciones/i)).toBeInTheDocument();
    });

    /**
     * Verifica que el cambio entre la pestaña de historial de notificaciones
     * y la de preferencias de notificación renderice el contenido adecuado.
     */
    it('debe permitir cambiar a la pestaña de preferencias', async () => {
        render(<NotificationCenter />);
        
        const prefsTab = await screen.findByRole('tab', { name: /preferencias/i });
        fireEvent.click(prefsTab);

        expect(await screen.findByText(/configura cómo quieres recibir avisos/i)).toBeInTheDocument();
        expect(screen.getByText(/confirmación de solicitud/i)).toBeInTheDocument();
    });
});
