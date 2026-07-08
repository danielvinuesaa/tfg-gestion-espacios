import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '../../../test/test-utils';
import ExportReservationsDialog from './ExportReservationsDialog';

/**
 * Suite de pruebas unitarias para el diálogo de exportación de reservas.
 * Verifica la correcta configuración de las opciones de exportación y la
 * emisión de las columnas seleccionadas.
 */
describe('ExportReservationsDialog', () => {
    const mockOnExport = vi.fn();
    const mockOnClose = vi.fn();

    /**
     * Verifica que el diálogo se renderice con el título apropiado
     * y las columnas disponibles por defecto para seleccionar.
     */
    it('debe renderizar el título correcto y las columnas predefinidas', async () => {
        render(
            <ExportReservationsDialog 
                open={true} 
                onClose={mockOnClose} 
                onExport={mockOnExport} 
            />
        );

        expect(await screen.findByText(/configurar exportación de reservas/i)).toBeInTheDocument();
        expect(screen.getByText(/título de la reserva/i)).toBeInTheDocument();
        expect(screen.getByText(/espacios \/ aulas/i)).toBeInTheDocument();
    });

    /**
     * Verifica que al generar el CSV, el componente emita correctamente
     * las columnas configuradas por defecto.
     */
    it('debe llamar a onExport con las columnas seleccionadas por defecto', async () => {
        render(
            <ExportReservationsDialog 
                open={true} 
                onClose={mockOnClose} 
                onExport={mockOnExport} 
            />
        );

        const exportButton = screen.getByRole('button', { name: /generar csv/i });
        fireEvent.click(exportButton);

        expect(mockOnExport).toHaveBeenCalledWith(expect.arrayContaining(['title', 'location', 'status']));
    });
});
