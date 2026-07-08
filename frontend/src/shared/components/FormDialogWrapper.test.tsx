import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import FormDialogWrapper from './FormDialogWrapper';

/**
 * Suite de pruebas unitarias para el envoltorio de diálogos de formulario (FormDialogWrapper).
 * Comprueba el renderizado base del diálogo modal y el manejo robusto de los estados
 * alterados (isDirty) y cancelaciones por parte del usuario.
 */
describe('FormDialogWrapper', () => {
    const mockOnSubmit = vi.fn().mockResolvedValue({});
    const mockOnClose = vi.fn();

    /**
     * Verifica que el diálogo presente tanto su cabecera como
     * los componentes internos transcluidos como contenido.
     */
    it('debe renderizar el título y el contenido', () => {
        render(
            <FormDialogWrapper 
                open={true} 
                onClose={mockOnClose} 
                title="Nuevo Elemento" 
                onSubmit={mockOnSubmit}
            >
                <div data-testid="form-content">Campo de texto</div>
            </FormDialogWrapper>
        );

        expect(screen.getByText('Nuevo Elemento')).toBeInTheDocument();
        expect(screen.getByTestId('form-content')).toBeInTheDocument();
    });

    /**
     * Verifica que al hacer clic en el botón de confirmación, se despache
     * el manejador onSubmit suministrado por el consumidor del componente.
     */
    it('debe llamar a onSubmit al pulsar guardar', async () => {
        render(
            <FormDialogWrapper 
                open={true} 
                onClose={mockOnClose} 
                title="Test Dialog" 
                onSubmit={mockOnSubmit}
                isDirty={true}
                isValid={true}
            >
                <div data-testid="children">Content</div>
            </FormDialogWrapper>
        );

        fireEvent.click(screen.getByRole('button', { name: /guardar/i }));
        expect(mockOnSubmit).toHaveBeenCalled();
    });

    /**
     * Verifica que cuando el formulario registre modificaciones sin guardar,
     * se solicite una confirmación de seguridad antes de poder cerrarlo.
     */
    it('debe abrir diálogo de confirmación si está sucio al cancelar', () => {
        render(
            <FormDialogWrapper 
                open={true} 
                onClose={mockOnClose} 
                title="Título" 
                onSubmit={mockOnSubmit}
                isDirty={true}
            >
                <input />
            </FormDialogWrapper>
        );

        fireEvent.click(screen.getByRole('button', { name: /cancelar/i }));
        
        expect(screen.getByText(/¿descartar cambios\?/i)).toBeInTheDocument();
    });

    /**
     * Verifica que cuando el formulario se encuentre en estado intacto,
     * la ventana se cierre de manera inmediata y limpia sin mediar confirmaciones.
     */
    it('debe cerrar directamente si no está sucio al cancelar', () => {
        render(
            <FormDialogWrapper
                open={true}
                onClose={mockOnClose}
                title="Título"
                onSubmit={mockOnSubmit}
                isDirty={false}
            >
                <div data-testid="children">Content</div>
            </FormDialogWrapper>
        );

        fireEvent.click(screen.getByRole('button', { name: /cancelar/i }));
        expect(mockOnClose).toHaveBeenCalled();
    });
});
