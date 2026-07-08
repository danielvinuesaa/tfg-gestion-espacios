import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '../../../test/test-utils';
import DeleteSpaceDialog from './DeleteSpaceDialog';
import { Space } from '../../../shared/types';
import { server } from '../../../test/mocks/server';
import { http, HttpResponse } from 'msw';

/**
 * @file DeleteSpaceDialog.test.tsx
 * @description Suite de pruebas para el diálogo de eliminación de espacios.
 * Comprueba el manejo de eliminaciones de espacios, detectando conflictos si hay reservas pendientes.
 */
describe('DeleteSpaceDialog', () => {
    const mockOnSuccess = vi.fn();
    const mockHandleClose = vi.fn();
    
    const spaceWithConflicts: Space = {
        id: 1,
        name: 'Aula 101',
        type: 'AULA',
        totalCapacity: 50,
        computerCount: 0,
        status: 'DISPONIBLE'
    };

    const spaceWithoutConflicts: Space = {
        id: 2,
        name: 'Aula Libre',
        type: 'AULA',
        totalCapacity: 50,
        computerCount: 0,
        status: 'DISPONIBLE'
    };

    beforeEach(() => {
        vi.clearAllMocks();
        localStorage.setItem('token', 'mock-token');
    });

    /**
     * Verifica que el componente liste las reservas activas (conflictos)
     * vinculadas al espacio que se desea eliminar.
     */
    it('debe detectar conflictos y listar los detalles', async () => {
        render(<DeleteSpaceDialog open={true} space={spaceWithConflicts} handleClose={mockHandleClose} onSuccess={mockOnSuccess} />);
        
        expect(await screen.findByText(/se han encontrado 2 eventos activos vinculados/i)).toBeInTheDocument();
        expect(screen.getByText('Reserva Test 1')).toBeInTheDocument();
        expect(screen.getByText('Bloqueo 1')).toBeInTheDocument();
        expect(screen.getByText('Único')).toBeInTheDocument(); // Chip de onlySpace
        expect(screen.getByText('Multi')).toBeInTheDocument();
    });

    /**
     * Verifica que el usuario pueda forzar la eliminación del espacio,
     * procesando las reservas conflictivas mediante el botón correspondiente.
     */
    it('debe permitir eliminar forzadamente con conflictos', async () => {
        render(<DeleteSpaceDialog open={true} space={spaceWithConflicts} handleClose={mockHandleClose} onSuccess={mockOnSuccess} />);
        
        const confirmButton = await screen.findByRole('button', { name: /confirmar y procesar reservas/i });
        fireEvent.click(confirmButton);

        await waitFor(() => {
            expect(mockOnSuccess).toHaveBeenCalled();
            expect(mockHandleClose).toHaveBeenCalled();
        });
    });

    /**
     * Verifica que si el espacio no cuenta con reservas pendientes (sin conflictos),
     * se muestre un mensaje de confirmación simple.
     */
    it('debe mostrar confirmación simple cuando no hay conflictos', async () => {
        render(<DeleteSpaceDialog open={true} space={spaceWithoutConflicts} handleClose={mockHandleClose} onSuccess={mockOnSuccess} />);
        
        expect(await screen.findByText(/¿está seguro de que desea eliminar este espacio/i)).toBeInTheDocument();
        
        const confirmButton = screen.getByRole('button', { name: /confirmar eliminación/i });
        fireEvent.click(confirmButton);

        await waitFor(() => {
            expect(mockOnSuccess).toHaveBeenCalled();
            expect(mockHandleClose).toHaveBeenCalled();
        });
    });

    /**
     * Verifica que el diálogo capture y renderice de forma correcta los errores devueltos
     * si la llamada a la API de eliminación falla (ej. error 500).
     */
    it('debe mostrar error de red si falla la eliminación', async () => {
        server.use(
            http.delete('/api/spaces/1', () => {
                return new HttpResponse(null, { status: 500 });
            })
        );

        render(<DeleteSpaceDialog open={true} space={spaceWithConflicts} handleClose={mockHandleClose} onSuccess={mockOnSuccess} />);
        
        const confirmButton = await screen.findByRole('button', { name: /confirmar y procesar reservas/i });
        fireEvent.click(confirmButton);

        expect(await screen.findByText(/error en la petición: 500/i)).toBeInTheDocument();
        expect(mockOnSuccess).not.toHaveBeenCalled();
    });
});
