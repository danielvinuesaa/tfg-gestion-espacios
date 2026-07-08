import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '../../../test/test-utils';
import ImportReservationsDialog from './ImportReservationsDialog';
import { server } from '../../../test/mocks/server';
import { http, HttpResponse } from 'msw';

/**
 * Suite de pruebas para el componente ImportReservationsDialog.
 * Verifica la correcta carga de archivos, la validación de los datos importados
 * para detectar conflictos, y la confirmación de la importación.
 */
describe('ImportReservationsDialog', () => {
    const mockOnSuccess = vi.fn();
    const mockHandleClose = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
        localStorage.setItem('token', 'mock-token');
    });

    /**
     * Verifica que, al abrir el modal, se renderice el título de la ventana
     * y las instrucciones sobre el formato esperado del archivo.
     */
    it('debe renderizar el título e instrucciones de importación', async () => {
        render(
            <ImportReservationsDialog 
                open={true} 
                handleClose={mockHandleClose} 
                onSuccess={mockOnSuccess} 
            />
        );

        expect(await screen.findByText('Importar Reservas')).toBeInTheDocument();
        expect(screen.getByText(/formato fecha: DD\/MM\/YYYY/i)).toBeInTheDocument();
    });

    /**
     * Verifica que, si al validar el archivo CSV la API reporta conflictos,
     * estos se muestran en la interfaz de forma detallada.
     */
    it('debe mostrar conflictos detectados tras la validación', async () => {
        server.use(
            http.post('/api/reservations/import/validate', () => {
                return HttpResponse.json({
                    valid: true,
                    newCount: 10,
                    conflicts: [
                        {
                            subjectCode: 'RED',
                            startTime: '25/05/2026 10.00',
                            endTime: '25/05/2026 12.00',
                            location: 'Aula 101',
                            message: 'Solapamiento detectado',
                            type: 'OVERLAP'
                        }
                    ]
                });
            })
        );

        render(
            <ImportReservationsDialog 
                open={true} 
                handleClose={mockHandleClose} 
                onSuccess={mockOnSuccess} 
            />
        );

        const file = new File(['...'], 'reservas.csv', { type: 'text/csv' });
        const input = screen.getByLabelText(/seleccionar archivo csv/i);
        fireEvent.change(input, { target: { files: [file] } });

        fireEvent.click(screen.getByRole('button', { name: /validar archivo/i }));

        expect(await screen.findByText(/detectado 1 reserva/i)).toBeInTheDocument();
        expect(screen.getByText('RED')).toBeInTheDocument();
        expect(screen.getByText(/solapamiento detectado/i)).toBeInTheDocument();
    });

    /**
     * Verifica que si hay elementos válidos para importar, el botón de confirmación
     * funciona adecuadamente, llama a la API de importación y dispara el callback de éxito.
     */
    it('debe permitir completar la importación si hay elementos válidos', async () => {
        server.use(
            http.post('/api/reservations/import/validate', () => {
                return HttpResponse.json({ valid: true, newCount: 5, conflicts: [] });
            }),
            http.post('/api/reservations/import', () => {
                return HttpResponse.json({ successCount: 5, failureCount: 0 });
            })
        );

        render(
            <ImportReservationsDialog 
                open={true} 
                handleClose={mockHandleClose} 
                onSuccess={mockOnSuccess} 
            />
        );

        const file = new File(['...'], 'reservas.csv', { type: 'text/csv' });
        fireEvent.change(screen.getByLabelText(/seleccionar archivo csv/i), { target: { files: [file] } });
        fireEvent.click(screen.getByRole('button', { name: /validar archivo/i }));

        const importButton = await screen.findByRole('button', { name: /confirmar importación/i });
        fireEvent.click(importButton);

        await waitFor(() => {
            expect(mockOnSuccess).toHaveBeenCalled();
        });
    });
});
