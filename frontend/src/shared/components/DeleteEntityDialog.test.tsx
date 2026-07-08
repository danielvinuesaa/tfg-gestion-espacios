import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import DeleteEntityDialog from './DeleteEntityDialog';

/**
 * Suite de pruebas unitarias para el diálogo de eliminación de entidades (DeleteEntityDialog).
 * Evalúa los textos de confirmación, los procesos de auditoría y
 * la correcta representación de bloqueos en caso de conflictos detectados.
 */
describe('DeleteEntityDialog', () => {
    const mockOnConfirm = vi.fn();
    const mockOnClose = vi.fn();

    const defaultProps = {
        open: true,
        title: '¿Eliminar?',
        entityName: 'Test Item',
        entityTypeLabel: 'Elemento',
        onConfirm: mockOnConfirm,
        onClose: mockOnClose
    };

    /**
     * Verifica la carga correcta del componente modal, incluyendo el título
     * explícito y los nombres específicos del tipo y la entidad objetivo.
     */
    it('debe renderizar el nombre de la entidad y el título', () => {
        render(<DeleteEntityDialog {...defaultProps} />);
        
        expect(screen.getByText('¿Eliminar?')).toBeInTheDocument();
        expect(screen.getByText('Test Item')).toBeInTheDocument();
        expect(screen.getByText(/elemento a eliminar/i)).toBeInTheDocument();
    });

    /**
     * Verifica que si el sistema está ejecutando validaciones asíncronas,
     * el botón quede bloqueado y se informe sobre el proceso de dependencias.
     */
    it('debe mostrar estado de comprobación de conflictos', () => {
        render(<DeleteEntityDialog {...defaultProps} checkingConflicts={true} />);
        
        expect(screen.getByText(/comprobando dependencias/i)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /confirmar eliminación/i })).toBeDisabled();
    });

    /**
     * Verifica que, en caso de restricciones de borrado o fallos, el
     * texto de error proporcionado quede expuesto claramente en la vista.
     */
    it('debe mostrar errores si se proporcionan', () => {
        render(<DeleteEntityDialog {...defaultProps} error="No se puede eliminar" />);
        
        expect(screen.getByText('No se puede eliminar')).toBeInTheDocument();
    });

    /**
     * Verifica el flujo nominal en el cual la pulsación del botón crítico
     * acciona el método onConfirm delegando la eliminación al padre.
     */
    it('debe llamar a onConfirm al pulsar el botón', () => {
        render(<DeleteEntityDialog {...defaultProps} />);
        
        fireEvent.click(screen.getByRole('button', { name: /confirmar eliminación/i }));
        expect(mockOnConfirm).toHaveBeenCalled();
    });

    /**
     * Verifica que los recordatorios relacionados con trazabilidad,
     * registros o soft-deletes aparezcan en pantalla si fueron especificados.
     */
    it('debe mostrar nota de auditoría si se proporciona', () => {
        render(<DeleteEntityDialog {...defaultProps} auditNote="Se guardará log." />);
        
        expect(screen.getByText(/se guardará log/i)).toBeInTheDocument();
    });
});
