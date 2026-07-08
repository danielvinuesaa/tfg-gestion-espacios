import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ConfirmCalendarActionDialog from './ConfirmCalendarActionDialog';

/**
 * Suite de pruebas unitarias para el diálogo de confirmación de acciones del calendario.
 * Verifica que los modos de arrastrar (MOVE) y redimensionar (RESIZE) presenten
 * la información correcta y manejen los eventos adecuadamente.
 */
describe('ConfirmCalendarActionDialog', () => {
    const mockOnClose = vi.fn();
    const mockOnConfirm = vi.fn();

    const mockEvent = {
        resource: {
            title: 'Reserva Test',
            user: { name: 'Juan' },
            spaces: [{ id: 1, name: 'Aula 101', type: 'AULA' }],
            status: 'APROBADA'
        }
    };

    const newStart = new Date(2026, 4, 25, 12, 0);
    const newEnd = new Date(2026, 4, 25, 14, 0);

    /**
     * Verifica que en modo traslado (MOVE), el diálogo muestre el título
     * correspondiente y refleje los datos de la reserva afectada.
     */
    it('debe renderizar modo MOVE con título y datos correctos', () => {
        render(
            <ConfirmCalendarActionDialog 
                open={true}
                onClose={mockOnClose}
                onConfirm={mockOnConfirm}
                event={mockEvent as any}
                newStart={newStart}
                newEnd={newEnd}
                actionType="MOVE"
            />
        );

        expect(screen.getByText('Confirmar Traslado')).toBeInTheDocument();
        expect(screen.getByText('Reserva Test')).toBeInTheDocument();
        expect(screen.getByText('12:00 - 14:00')).toBeInTheDocument();
        expect(screen.getByText(/lunes, 25 de mayo/i)).toBeInTheDocument();
    });

    /**
     * Verifica que en modo ajuste de duración (RESIZE), el diálogo muestre
     * el título adecuado reflejando la acción.
     */
    it('debe renderizar modo RESIZE con título diferente', () => {
        render(
            <ConfirmCalendarActionDialog 
                open={true}
                onClose={mockOnClose}
                onConfirm={mockOnConfirm}
                event={mockEvent as any}
                newStart={newStart}
                newEnd={newEnd}
                actionType="RESIZE"
            />
        );

        expect(screen.getByText('Ajustar Duración')).toBeInTheDocument();
    });

    /**
     * Verifica que al aceptar los cambios en el diálogo se llame correctamente
     * a la función de confirmación provista.
     */
    it('debe llamar a onConfirm al confirmar', () => {
        render(
            <ConfirmCalendarActionDialog 
                open={true}
                onClose={mockOnClose}
                onConfirm={mockOnConfirm}
                event={mockEvent as any}
                newStart={newStart}
                newEnd={newEnd}
                actionType="MOVE"
            />
        );

        fireEvent.click(screen.getByRole('button', { name: /confirmar cambio/i }));
        expect(mockOnConfirm).toHaveBeenCalled();
    });
});
