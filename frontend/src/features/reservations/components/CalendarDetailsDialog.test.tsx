import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '../../../test/test-utils';
import CalendarDetailsDialog from './CalendarDetailsDialog';
import { server } from '../../../test/mocks/server';
import { http, HttpResponse } from 'msw';

/**
 * Suite de pruebas unitarias para el componente `CalendarDetailsDialog`.
 * Verifica la correcta visualización de los detalles de una reserva,
 * la carga bajo demanda mediante ID y la disponibilidad de las acciones contextuales.
 */
describe('CalendarDetailsDialog', () => {
    const mockOnClose = vi.fn();
    const mockOnEdit = vi.fn();
    const mockOnDelete = vi.fn();
    const mockOnApprove = vi.fn();
    const mockOnReject = vi.fn();

    const mockReservation = {
        id: 1,
        title: 'Clase de Redes',
        description: 'Teoría de protocolos',
        startTime: '2026-05-25T10:00:00',
        endTime: '2026-05-25T12:00:00',
        createdAt: '2026-05-20T09:00:00',
        status: 'SOLICITADA',
        type: 'CLASE',
        user: { name: 'Juan Pérez' },
        responsibleName: 'Prof. García',
        spaces: [{ id: 1, name: 'Aula 101', totalCapacity: 50, type: 'AULA' }],
        subject: { name: 'Redes de Computadores', code: 'RED', course: '3' }
    };

    beforeEach(() => {
        vi.clearAllMocks();
        localStorage.setItem('token', 'mock-token');
    });

    /**
     * Verifica que si se le pasa solo un ID, el diálogo muestre un estado de carga,
     * consulte la API y termine mostrando los datos de la reserva correctamente.
     */
    it('debe mostrar cargando si no se proporciona reserva y se busca por ID', async () => {
        server.use(
            http.get('/api/reservations/1', () => {
                return HttpResponse.json(mockReservation);
            })
        );

        render(
            <CalendarDetailsDialog 
                open={true} 
                onClose={mockOnClose} 
                reservationId={1}
                canEdit={true}
                canDelete={true}
                canApproveReject={true}
                onEdit={mockOnEdit}
                onDelete={mockOnDelete}
                onApprove={mockOnApprove}
                onReject={mockOnReject}
            />
        );

        expect(screen.getByText(/cargando detalles/i)).toBeInTheDocument();
        
        await waitFor(() => {
            expect(screen.getByText('Clase de Redes')).toBeInTheDocument();
            expect(screen.getByText('Aula 101')).toBeInTheDocument();
        });
    });

    /**
     * Verifica que los botones para editar y borrar se rendericen si el usuario
     * tiene concedidos los permisos correspondientes.
     */
    it('debe mostrar los botones de acción si canEdit y canDelete son true', async () => {
        render(
            <CalendarDetailsDialog 
                open={true} 
                onClose={mockOnClose} 
                reservation={mockReservation as any}
                canEdit={true}
                canDelete={true}
                canApproveReject={false}
                onEdit={mockOnEdit}
                onDelete={mockOnDelete}
                onApprove={mockOnApprove}
                onReject={mockOnReject}
            />
        );

        await waitFor(() => {
            expect(screen.getByRole('button', { name: /editar reserva/i })).toBeInTheDocument();
            expect(screen.getByRole('button', { name: /cancelar reserva/i })).toBeInTheDocument();
        });
    });

    /**
     * Verifica que los botones de aprobar y rechazar se muestren si el usuario
     * tiene el permiso `canApproveReject` y la reserva está en estado SOLICITADA.
     */
    it('debe mostrar botones de aprobar/rechazar si canApproveReject es true y está SOLICITADA', async () => {
        render(
            <CalendarDetailsDialog 
                open={true} 
                onClose={mockOnClose} 
                reservation={mockReservation as any}
                canEdit={false}
                canDelete={false}
                canApproveReject={true}
                onEdit={mockOnEdit}
                onDelete={mockOnDelete}
                onApprove={mockOnApprove}
                onReject={mockOnReject}
            />
        );

        await waitFor(() => {
            expect(screen.getByRole('button', { name: /aprobar/i })).toBeInTheDocument();
            expect(screen.getByRole('button', { name: /rechazar/i })).toBeInTheDocument();
        });
    });

    /**
     * Verifica que al pulsar el botón de edición se ejecute la función
     * proveída a través de las propiedades con el ID de la reserva respectiva.
     */
    it('debe llamar a onEdit al pulsar el botón', async () => {
        render(
            <CalendarDetailsDialog 
                open={true} 
                onClose={mockOnClose} 
                reservation={mockReservation as any}
                canEdit={true}
                canDelete={false}
                canApproveReject={false}
                onEdit={mockOnEdit}
                onDelete={mockOnDelete}
                onApprove={mockOnApprove}
                onReject={mockOnReject}
            />
        );

        const editButton = await screen.findByRole('button', { name: /editar reserva/i });
        fireEvent.click(editButton);
        expect(mockOnEdit).toHaveBeenCalledWith(1);
    });
});
