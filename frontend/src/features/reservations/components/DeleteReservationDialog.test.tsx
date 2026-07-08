import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '../../../test/test-utils';
import DeleteReservationDialog from './DeleteReservationDialog';
import { Reservation } from '../../../shared/types';
import { server } from '../../../test/mocks/server';
import { http, HttpResponse } from 'msw';

/**
 * Suite de pruebas unitarias para el diálogo de cancelación de reservas.
 * Verifica la correcta presentación de los datos de la reserva,
 * la acción de confirmación y el manejo de errores.
 */
describe('DeleteReservationDialog', () => {
    const mockOnSuccess = vi.fn();
    const mockHandleClose = vi.fn();
    
    const mockReservation: Reservation = {
        id: 1,
        title: 'Reserva Test',
        startTime: '2026-05-25T10:00:00',
        endTime: '2026-05-25T12:00:00',
        type: 'CLASE',
        status: 'SOLICITADA',
        user: { id: 2, name: 'Profe', email: 'profe@es', role: { id: 1, name: 'R' }, status: 'ACTIVO' },
        spaces: [{ id: 1, name: 'Aula 101', type: 'AULA', totalCapacity: 50, computerCount: 0, status: 'DISPONIBLE' }],
        createdAt: '2026-01-01T10:00:00'
    };

    const defaultProps = {
        open: true,
        reservation: mockReservation,
        handleClose: mockHandleClose,
        onSuccess: mockOnSuccess
    };

    beforeEach(() => {
        vi.clearAllMocks();
        localStorage.setItem('token', 'mock-token');
    });

    /**
     * Verifica que el diálogo de eliminación muestre la información
     * correspondiente a la reserva a cancelar y el mensaje de confirmación.
     */
    it('debe mostrar los detalles de la reserva a cancelar', async () => {
        render(<DeleteReservationDialog {...defaultProps} />);
        
        expect(screen.getByText('Reserva Test')).toBeInTheDocument();
        // El diálogo DeleteEntityDialog no muestra 'Aula 101', muestra Nombre (Title) y el ID.
        // Verificamos si sale el texto de cancelar
        expect(screen.getByText(/¿estás seguro de que deseas cancelar esta reserva\?/i)).toBeInTheDocument();
    });

    /**
     * Verifica que al pulsar el botón de confirmación se proceda con la
     * cancelación de la reserva y se llame al callback de éxito.
     */
    it('debe permitir confirmar la cancelación', async () => {
        render(<DeleteReservationDialog {...defaultProps} />);
        
        const confirmButton = screen.getByRole('button', { name: /confirmar cancelación/i });
        fireEvent.click(confirmButton);

        await waitFor(() => {
            expect(mockOnSuccess).toHaveBeenCalled();
            expect(mockHandleClose).toHaveBeenCalled();
        });
    });

    /**
     * Verifica que en caso de fallo en la petición HTTP al servidor,
     * el diálogo muestre un mensaje de error y no llame a onSuccess.
     */
    it('debe mostrar error de red si falla la cancelación', async () => {
        server.use(
            http.delete('/api/reservations/1', () => {
                return new HttpResponse(null, { status: 500 });
            })
        );

        render(<DeleteReservationDialog {...defaultProps} />);
        
        const confirmButton = screen.getByRole('button', { name: /confirmar cancelación/i });
        fireEvent.click(confirmButton);

        expect(await screen.findByText(/error en la petición: 500/i)).toBeInTheDocument();
        expect(mockOnSuccess).not.toHaveBeenCalled();
    });
});
