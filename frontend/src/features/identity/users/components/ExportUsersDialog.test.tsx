import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '../../../../test/test-utils';
import ExportUsersDialog from './ExportUsersDialog';

/**
 * Suite de pruebas para el componente ExportUsersDialog.
 * Verifica que el diálogo de exportación de usuarios se renderice correctamente
 * y permita seleccionar y exportar las columnas deseadas.
 */
describe('ExportUsersDialog', () => {
    const mockOnExport = vi.fn();
    const mockOnClose = vi.fn();

    /**
     * Verifica que el diálogo de exportación muestre el título correspondiente
     * y liste las columnas disponibles para exportar.
     */
    it('debe renderizar el título y las columnas de usuario', async () => {
        render(<ExportUsersDialog open={true} onClose={mockOnClose} onExport={mockOnExport} />);
        
        expect(await screen.findByText(/configurar exportación de usuarios/i)).toBeInTheDocument();
        expect(screen.getByText('Nombre Completo')).toBeInTheDocument();
        expect(screen.getByText('Correo Electrónico')).toBeInTheDocument();
    });

    /**
     * Verifica que al confirmar la exportación se invoque la función onExport
     * pasándole las columnas seleccionadas por el usuario.
     */
    it('debe llamar a onExport con las columnas seleccionadas', async () => {
        render(<ExportUsersDialog open={true} onClose={mockOnClose} onExport={mockOnExport} />);
        
        const exportButton = screen.getByRole('button', { name: /generar csv/i });
        fireEvent.click(exportButton);

        expect(mockOnExport).toHaveBeenCalledWith(expect.arrayContaining(['name', 'email', 'role', 'status']));
    });
});
