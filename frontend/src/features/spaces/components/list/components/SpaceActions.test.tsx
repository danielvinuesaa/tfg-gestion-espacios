import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import SpaceActions from './SpaceActions';

/**
 * @file SpaceActions.test.tsx
 * @description Suite de pruebas para los botones de acción individuales de cada espacio en la tabla.
 * Verifica la correcta visibilidad e invocación de acciones (editar, bloquear, restaurar, eliminar).
 */
describe('SpaceActions', () => {
    const mockSpace = { id: 1, status: 'DISPONIBLE' };
    const mockHandleAction = vi.fn();

    /**
     * Verifica que si un usuario tiene permisos de edición y eliminación,
     * se rendericen los iconos / botones para editar, bloquear y borrar el espacio.
     */
    it('debe mostrar botones de editar, bloquear y eliminar si tiene permisos', () => {
        render(
            <SpaceActions 
                space={mockSpace as any} 
                canEdit={true} 
                canDelete={true} 
                handleAction={mockHandleAction} 
            />
        );

        expect(screen.getByLabelText(/editar espacio/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/gestionar bloqueo temporal/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/eliminar espacio/i)).toBeInTheDocument();
    });

    /**
     * Verifica que si el espacio cuenta con un estado "ELIMINADO", 
     * se muestre y dispare el manejador para restaurar el espacio al hacer clic en él.
     */
    it('debe disparar acción al pulsar restaurar en un espacio eliminado', () => {
        const deletedSpace = { ...mockSpace, status: 'ELIMINADO' };
        render(
            <SpaceActions 
                space={deletedSpace as any} 
                canEdit={true} 
                canDelete={true} 
                handleAction={mockHandleAction} 
            />
        );

        fireEvent.click(screen.getByLabelText(/restaurar espacio/i));
        expect(mockHandleAction).toHaveBeenCalledWith('restore', deletedSpace);
    });
});
