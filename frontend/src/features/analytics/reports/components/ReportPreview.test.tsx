import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ReportPreview from './ReportPreview';

/**
 * @file ReportPreview.test.tsx
 * @description Suite de pruebas para el componente de previsualización de informes.
 * Asegura que el visor PDF y los controles de cierre, descarga y pantalla completa funcionen adecuadamente.
 */
describe('ReportPreview', () => {
    const mockOnClose = vi.fn();
    const mockOnDownload = vi.fn();
    const mockUrl = 'blob:mock-url';

    /**
     * Verifica que el elemento iframe para visualizar el informe
     * reciba y cargue la URL del blob correctamente.
     */
    it('debe renderizar el iframe con la URL proporcionada', () => {
        render(<ReportPreview url={mockUrl} onClose={mockOnClose} onDownload={mockOnDownload} />);
        
        const iframe = screen.getByTitle('Vista previa PDF');
        expect(iframe).toHaveAttribute('src', mockUrl);
    });

    /**
     * Verifica que al pulsar el botón "Cambiar selección" se invoque
     * el manejador para cerrar la previsualización.
     */
    it('debe llamar a onClose al pulsar cerrar o cambiar selección', () => {
        render(<ReportPreview url={mockUrl} onClose={mockOnClose} onDownload={mockOnDownload} />);
        
        fireEvent.click(screen.getByText(/cambiar selección/i));
        expect(mockOnClose).toHaveBeenCalled();
    });

    /**
     * Verifica que al presionar el botón de descarga del PDF final,
     * se ejecute el manejador onDownload propuesto.
     */
    it('debe llamar a onDownload al pulsar descargar', () => {
        render(<ReportPreview url={mockUrl} onClose={mockOnClose} onDownload={mockOnDownload} />);
        
        fireEvent.click(screen.getByText(/descargar pdf final/i));
        expect(mockOnDownload).toHaveBeenCalled();
    });

    /**
     * Verifica que el botón de pantalla completa abra la URL del PDF
     * en una nueva pestaña del navegador mediante window.open.
     */
    it('debe abrir la URL en una nueva pestaña al pulsar pantalla completa', () => {
        const spy = vi.spyOn(window, 'open').mockImplementation(() => null);
        render(<ReportPreview url={mockUrl} onClose={mockOnClose} onDownload={mockOnDownload} />);
        
        fireEvent.click(screen.getByLabelText(/ver en pantalla completa/i));
        expect(spy).toHaveBeenCalledWith(mockUrl, '_blank');
    });
});
