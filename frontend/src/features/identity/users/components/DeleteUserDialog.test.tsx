import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '../../../../test/test-utils';
import DeleteUserDialog from './DeleteUserDialog';
import { server } from '../../../../test/mocks/server';
import { http, HttpResponse } from 'msw';

/**
 * Suite de pruebas unitarias para el componente DeleteUserDialog.
 * Verifica la correcta comprobación de conflictos (como reservas activas),
 * la visualización de avisos y el proceso final de borrado.
 */
describe('DeleteUserDialog', () => {
    const mockOnSuccess = vi.fn();
    const mockHandleClose = vi.fn();
    const mockUser = {
        id: 10,
        name: 'Profesor Test',
        email: 'profe@uniovi.es'
    };

    beforeEach(() => {
        vi.clearAllMocks();
        localStorage.setItem('token', 'mock-token');
    });

    /**
     * Verifica que si la API reporta que el usuario no tiene conflictos
     * pendientes, el diálogo únicamente muestre el mensaje estándar de confirmación.
     */
    it('debe mostrar mensaje simple si no hay conflictos', async () => {
        server.use(
            http.get('/api/users/10/conflicts', () => {
                return HttpResponse.json({ hasConflicts: false, conflictCount: 0 });
            })
        );

        render(<DeleteUserDialog open={true} user={mockUser as any} handleClose={mockHandleClose} onSuccess={mockOnSuccess} />);
        
        expect(await screen.findByText(/¿está seguro de que desea eliminar a este usuario\?/i)).toBeInTheDocument();
        expect(screen.getByText('Profesor Test')).toBeInTheDocument();
    });

    /**
     * Verifica que si la API reporta la existencia de conflictos vinculados
     * (por ejemplo, reservas activas), el diálogo muestre una alerta detallada y
     * expanda la información si el usuario lo requiere.
     */
    it('debe mostrar lista de reservas si hay conflictos', async () => {
        server.use(
            http.get('/api/users/10/conflicts', () => {
                return HttpResponse.json({
                    hasConflicts: true,
                    conflictCount: 1,
                    details: [
                        {
                            reservationId: 1,
                            spaceName: 'Aula 101',
                            startTime: '2026-05-25T10:00:00',
                            endTime: '2026-05-25T12:00:00',
                            status: 'APROBADA'
                        }
                    ]
                });
            })
        );

        render(<DeleteUserDialog open={true} user={mockUser as any} handleClose={mockHandleClose} onSuccess={mockOnSuccess} />);
        
        expect(await screen.findByText(/se ha encontrado 1 reserva activa vinculada/i)).toBeInTheDocument();
        expect(screen.getByText('Aula 101')).toBeInTheDocument();
        
        // Expandir acordeón
        fireEvent.click(screen.getByText('Aula 101'));
        expect(await screen.findByText('10:00 — 12:00')).toBeInTheDocument();
    });

    /**
     * Verifica que al pulsar el botón de confirmación, se realice correctamente
     * la petición de eliminación a la API y se cierren los cuadros de diálogo.
     */
    it('debe llamar a handleDelete al confirmar', async () => {
        server.use(
            http.get('/api/users/10/conflicts', () => {
                return HttpResponse.json({ hasConflicts: false });
            }),
            http.delete('/api/users/10', () => {
                return new HttpResponse(null, { status: 204 });
            })
        );

        render(<DeleteUserDialog open={true} user={mockUser as any} handleClose={mockHandleClose} onSuccess={mockOnSuccess} />);
        
        await screen.findByText('Profesor Test');
        const confirmButton = screen.getByRole('button', { name: /confirmar eliminación/i });
        fireEvent.click(confirmButton);

        await waitFor(() => {
            expect(mockOnSuccess).toHaveBeenCalled();
            expect(mockHandleClose).toHaveBeenCalled();
        });
    });

    /**
     * Verifica que se detecte e impida la eliminación si el usuario
     * afectado es el administrador principal configurado en el sistema.
     */
    it('debe proteger al administrador principal', async () => {
        const adminUser = { id: 1, name: 'Admin', email: 'admin@uniovi.es' };
        
        render(<DeleteUserDialog open={true} user={adminUser as any} handleClose={mockHandleClose} onSuccess={mockOnSuccess} />);
        
        expect(await screen.findByText(/no es posible eliminar al administrador principal/i)).toBeInTheDocument();
        // El botón de confirmar debería estar deshabilitado (gestionado por DeleteEntityDialog via prop disabled)
        const confirmButton = screen.getByRole('button', { name: /confirmar/i });
        expect(confirmButton).toBeDisabled();
    });
});
