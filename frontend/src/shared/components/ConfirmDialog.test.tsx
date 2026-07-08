import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ConfirmDialog from './ConfirmDialog';

/**
 * Suite de pruebas unitarias para el componente ConfirmDialog.
 * Verifica la correcta visualización de mensajes y títulos, así como la interacción
 * con los botones de confirmar y cancelar, incluyendo el estado de carga.
 */
describe('ConfirmDialog', () => {
    const mockOnConfirm = vi.fn();
    const mockOnClose = vi.fn();

    /**
     * Verifica que el título y la descripción proporcionados como propiedades
     * se rendericen correctamente cuando el cuadro de diálogo está abierto.
     */
    it('debe renderizar título y descripción cuando está abierto', () => {
        render(
            <ConfirmDialog 
                open={true}
                title="¿Estás seguro?"
                description="Esta acción no se puede deshacer."
                onConfirm={mockOnConfirm}
                onClose={mockOnClose}
            />
        );

        expect(screen.getByText('¿Estás seguro?')).toBeInTheDocument();
        expect(screen.getByText('Esta acción no se puede deshacer.')).toBeInTheDocument();
    });

    /**
     * Verifica que se llama al método `onConfirm` cuando el usuario hace clic
     * en el botón de confirmación personalizado.
     */
    it('debe llamar a onConfirm al pulsar confirmar', () => {
        render(
            <ConfirmDialog 
                open={true}
                title="Título"
                description="Desc"
                onConfirm={mockOnConfirm}
                onClose={mockOnClose}
                confirmText="Sí, borrar"
            />
        );

        fireEvent.click(screen.getByText('Sí, borrar'));
        expect(mockOnConfirm).toHaveBeenCalled();
    });

    /**
     * Verifica que se llama al método `onClose` cuando el usuario hace clic
     * en el botón de cancelación personalizado.
     */
    it('debe llamar a onClose al pulsar cancelar', () => {
        render(
            <ConfirmDialog 
                open={true}
                title="Título"
                description="Desc"
                onConfirm={mockOnConfirm}
                onClose={mockOnClose}
                cancelText="No, volver"
            />
        );

        fireEvent.click(screen.getByText('No, volver'));
        expect(mockOnClose).toHaveBeenCalled();
    });

    /**
     * Verifica que cuando la propiedad `isLoading` es verdadera, el diálogo
     * muestra un texto indicando el procesamiento y deshabilita los botones.
     */
    it('debe mostrar estado de carga y deshabilitar botones', () => {
        render(
            <ConfirmDialog 
                open={true}
                title="Título"
                description="Desc"
                onConfirm={mockOnConfirm}
                onClose={mockOnClose}
                isLoading={true}
            />
        );

        expect(screen.getByText(/procesando/i)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /procesando/i })).toBeDisabled();
        expect(screen.getByRole('button', { name: /cancelar/i })).toBeDisabled();
    });
});
