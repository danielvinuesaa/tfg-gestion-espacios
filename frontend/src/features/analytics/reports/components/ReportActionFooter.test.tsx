import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ReportActionFooter from './ReportActionFooter';

/**
 * @file ReportActionFooter.test.tsx
 * @description Suite de pruebas para el pie de acciones de los informes.
 * Verifica la correcta visualización e interacción de los botones de exportación (PDF/CSV) y estados de carga.
 */
describe('ReportActionFooter', () => {
    const mockOnAction = vi.fn();

    /**
     * Verifica que los botones de vista previa y exportación CSV, junto con el aviso legal,
     * se muestren correctamente por defecto.
     */
    it('debe renderizar los botones y el aviso legal', () => {
        render(<ReportActionFooter loading={false} disabled={false} onAction={mockOnAction} />);
        
        expect(screen.getByText(/ver vista previa/i)).toBeInTheDocument();
        expect(screen.getByText(/exportar csv/i)).toBeInTheDocument();
        expect(screen.getByText(/solo contemplan reservas con estado/i)).toBeInTheDocument();
    });

    /**
     * Verifica que al hacer clic en los botones de "Ver vista previa" o "Exportar CSV"
     * se notifique al padre mediante el callback onAction.
     */
    it('debe llamar a onAction al pulsar los botones', () => {
        render(<ReportActionFooter loading={false} disabled={false} onAction={mockOnAction} />);
        
        fireEvent.click(screen.getByText(/ver vista previa/i));
        expect(mockOnAction).toHaveBeenCalledWith('PDF');

        fireEvent.click(screen.getByText(/exportar csv/i));
        expect(mockOnAction).toHaveBeenCalledWith('CSV');
    });

    /**
     * Verifica que los botones se muestren deshabilitados cuando
     * la propiedad `disabled` es true.
     */
    it('debe deshabilitar botones si disabled es true', () => {
        render(<ReportActionFooter loading={false} disabled={true} onAction={mockOnAction} />);
        
        expect(screen.getByText(/ver vista previa/i)).toBeDisabled();
        expect(screen.getByText(/exportar csv/i)).toBeDisabled();
    });

    /**
     * Verifica que cuando el componente está en estado de carga (loading=true),
     * el botón muestre el texto "Generando..." y esté deshabilitado.
     */
    it('debe mostrar estado de carga', () => {
        render(<ReportActionFooter loading={true} disabled={false} onAction={mockOnAction} />);
        
        expect(screen.getByText(/generando/i)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /generando/i })).toBeDisabled();
    });
});
