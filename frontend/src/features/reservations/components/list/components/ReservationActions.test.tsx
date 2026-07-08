import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ReservationActions from './ReservationActions';

/**
 * Suite de pruebas unitarias para el componente `ReservationActions`.
 * Verifica que los botones de acción para cada reserva (aprobar, rechazar,
 * editar, cancelar) se muestren correctamente según los permisos
 * del usuario actual y el estado de la reserva.
 */
describe('ReservationActions', () => {
    const mockRes = { id: 1, status: 'SOLICITADA' };
    const mockHandleAction = vi.fn();

    /**
     * Verifica que los botones de aprobar y rechazar se muestren si el usuario
     * tiene permiso para aprobar reservas.
     */
    it('debe mostrar botones de aprobar/rechazar si puede aprobar', () => {
        render(
            <ReservationActions 
                reservation={mockRes as any} 
                handleAction={mockHandleAction}
                canApprove={() => true}
                canEdit={() => false}
                canDelete={() => false}
            />
        );

        expect(screen.getByLabelText(/aprobar/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/rechazar/i)).toBeInTheDocument();
    });

    /**
     * Verifica que al pulsar sobre el botón de aprobar se ejecute la función
     * manejadora de acciones (`handleAction`) con la acción 'approve' y los datos de la reserva.
     */
    it('debe disparar acción al pulsar aprobar', () => {
        render(
            <ReservationActions 
                reservation={mockRes as any} 
                handleAction={mockHandleAction}
                canApprove={() => true}
                canEdit={() => false}
                canDelete={() => false}
            />
        );

        fireEvent.click(screen.getByLabelText(/aprobar/i));
        expect(mockHandleAction).toHaveBeenCalledWith('approve', mockRes);
    });

    /**
     * Verifica que el botón de editar se muestre en pantalla si la función
     * de permiso de edición devuelve verdadero.
     */
    it('debe mostrar botón de editar si puede editar', () => {
        render(
            <ReservationActions 
                reservation={mockRes as any} 
                handleAction={mockHandleAction}
                canApprove={() => false}
                canEdit={() => true}
                canDelete={() => false}
            />
        );

        expect(screen.getByLabelText(/editar/i)).toBeInTheDocument();
    });

    /**
     * Verifica que el botón de cancelación o eliminación se muestre cuando
     * el usuario tiene permisos de borrado y la reserva permite ser cancelada.
     */
    it('debe mostrar botón de cancelar si puede borrar y no está terminada', () => {
        render(
            <ReservationActions 
                reservation={mockRes as any} 
                handleAction={mockHandleAction}
                canApprove={() => false}
                canEdit={() => false}
                canDelete={() => true}
            />
        );

        expect(screen.getByLabelText(/cancelar/i)).toBeInTheDocument();
    });
});
