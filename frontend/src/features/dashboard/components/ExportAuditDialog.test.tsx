import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect } from 'vitest';
import ExportAuditDialog from './ExportAuditDialog';

/**
 * Suite de pruebas para el componente ExportAuditDialog.
 * Verifica la visualización del diálogo de exportación de auditoría
 * y la correcta emisión de eventos al confirmar o cancelar la acción.
 */
describe('ExportAuditDialog', () => {
    const mockOnClose = vi.fn();
    const mockOnExport = vi.fn();

    /**
     * Verifica que el cuadro de diálogo de exportación se muestre con
     * el título esperado cuando la propiedad "open" es verdadera.
     */
    it('debe renderizarse correctamente', async () => {
        render(<ExportAuditDialog open={true} onClose={mockOnClose} onExport={mockOnExport} />);
        expect(await screen.findByText(/exportar historial de auditoría/i)).toBeInTheDocument();
    });

    /**
     * Verifica que al confirmar la exportación, se llame a la función onExport
     * y se le proporcionen como argumento las columnas seleccionadas por defecto.
     */
    it('debe llamar a onExport con las columnas seleccionadas al pulsar descargar', async () => {
        render(<ExportAuditDialog open={true} onClose={mockOnClose} onExport={mockOnExport} />);
        
        const exportButton = screen.getByRole('button', { name: /generar csv/i });
        fireEvent.click(exportButton);

        await waitFor(() => {
            expect(mockOnExport).toHaveBeenCalled();
            const selectedColumns = mockOnExport.mock.calls[0][0];
            expect(selectedColumns).toContain('timestamp');
            expect(selectedColumns).toContain('action');
        });
    });

    /**
     * Verifica que se invoque la función onClose cuando el usuario pulsa
     * el botón de cancelar, cerrando así el diálogo sin realizar cambios.
     */
    it('debe llamar a onClose al pulsar cancelar', () => {
        render(<ExportAuditDialog open={true} onClose={mockOnClose} onExport={mockOnExport} />);
        
        const closeButton = screen.getByRole('button', { name: /cancelar/i });
        fireEvent.click(closeButton);

        expect(mockOnClose).toHaveBeenCalled();
    });
});
