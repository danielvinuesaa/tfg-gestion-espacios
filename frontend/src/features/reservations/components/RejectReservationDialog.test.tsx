import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '../../../test/test-utils';
import RejectReservationDialog from './RejectReservationDialog';
import { Reservation } from '../../../shared/types';
import { server } from '../../../test/mocks/server';
import { http, HttpResponse } from 'msw';

/**
 * Suite de pruebas unitarias para el componente `RejectReservationDialog`.
 * Comprueba el renderizado del cuadro de diálogo, la obligación de incluir
 * un motivo de rechazo y el comportamiento al confirmar la acción.
 */
describe('RejectReservationDialog', () => {
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
     * Verifica que al abrir el cuadro de diálogo se muestren correctamente
     * el título de la acción y el campo de texto requerido para el motivo.
     */
    it('debe renderizar el campo para el motivo de rechazo', () => {
        render(<RejectReservationDialog {...defaultProps} />);
        
        expect(screen.getByText(/rechazar reserva/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/motivo del rechazo/i)).toBeInTheDocument();
    });

    /**
     * Verifica que el botón de confirmación de rechazo permanezca desactivado
     * hasta que el usuario introduzca un motivo en el campo correspondiente.
     */
    it('debe requerir un motivo antes de habilitar el botón', () => {
        render(<RejectReservationDialog {...defaultProps} />);
        
        const confirmButton = screen.getByRole('button', { name: /rechazar reserva/i });
        expect(confirmButton).toBeDisabled();

        const reasonInput = screen.getByLabelText(/motivo del rechazo/i);
        fireEvent.change(reasonInput, { target: { value: 'Falta de disponibilidad' } });

        expect(confirmButton).not.toBeDisabled();
    });

    /**
     * Verifica que al hacer clic en el botón de confirmación con un motivo válido,
     * se envíe la solicitud al backend, se notifique el éxito mediante el callback y se cierre el modal.
     */
    it('debe llamar al endpoint y notificar éxito', async () => {
        render(<RejectReservationDialog {...defaultProps} />);
        
        const reasonInput = screen.getByLabelText(/motivo del rechazo/i);
        fireEvent.change(reasonInput, { target: { value: 'Falta de disponibilidad' } });

        const confirmButton = screen.getByRole('button', { name: /rechazar reserva/i });
        fireEvent.click(confirmButton);

        await waitFor(() => {
            expect(mockOnSuccess).toHaveBeenCalledWith('La reserva ha sido rechazada y se ha notificado al usuario.');
            expect(mockHandleClose).toHaveBeenCalled();
        });
    });
});
