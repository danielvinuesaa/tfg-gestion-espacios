import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ReportValidationDialog from './ReportValidationDialog';

/**
 * @file ReportValidationDialog.test.tsx
 * @description Suite de pruebas para el diálogo de validación de informes.
 * Comprueba el manejo de elementos sin actividad y las acciones del usuario frente a ellos.
 */
describe('ReportValidationDialog', () => {
    const mockOnClose = vi.fn();
    const mockOnToggle = vi.fn();
    const mockOnConfirm = vi.fn();
    const mockOnIncludeAll = vi.fn();

    const emptyItems = [
        { id: 1, name: 'Aula 101' },
        { id: 2, name: 'Aula 102' }
    ];

    const defaultProps = {
        open: true,
        onClose: mockOnClose,
        type: 'SPACES' as const,
        emptyItems,
        selectedCount: 5,
        includedEmptyIds: [],
        onToggleInclusion: mockOnToggle,
        onConfirm: mockOnConfirm,
        onIncludeAll: mockOnIncludeAll
    };

    /**
     * Verifica que se muestre un aviso al usuario informándole
     * de los espacios que no tienen actividad o reservas en el periodo.
     */
    it('debe renderizar aviso de espacios sin actividad', () => {
        render(<ReportValidationDialog {...defaultProps} />);
        
        expect(screen.getByText(/aviso: espacios sin actividad/i)).toBeInTheDocument();
        expect(screen.getByText(/se ha detectado que los siguientes espacios no tienen reservas/i)).toBeInTheDocument();
        expect(screen.getByText('Aula 101')).toBeInTheDocument();
        expect(screen.getByText('Aula 102')).toBeInTheDocument();
    });

    /**
     * Verifica que si la cantidad de seleccionados coincide con los vacíos,
     * se muestre un error indicando que ningún espacio tiene reservas.
     */
    it('debe renderizar error si todos los seleccionados están vacíos', () => {
        render(<ReportValidationDialog {...defaultProps} selectedCount={2} />);
        
        expect(screen.getByText(/sin actividad en los espacios/i)).toBeInTheDocument();
        expect(screen.getByText(/ninguno de los espacios seleccionados tiene reservas/i)).toBeInTheDocument();
    });

    /**
     * Verifica que al hacer clic sobre un elemento vacío de la lista,
     * se invoque la función de alternar su inclusión en el informe.
     */
    it('debe llamar a onToggleInclusion al pulsar un item de la lista', () => {
        render(<ReportValidationDialog {...defaultProps} />);
        
        fireEvent.click(screen.getByText('Aula 101'));
        expect(mockOnToggle).toHaveBeenCalledWith(1);
    });

    /**
     * Verifica que al pulsar el botón "Incluir todos y generar",
     * se notifique al componente padre para forzar su inclusión en el reporte.
     */
    it('debe llamar a onIncludeAll al pulsar el botón correspondiente', () => {
        render(<ReportValidationDialog {...defaultProps} />);
        
        fireEvent.click(screen.getByText(/incluir todos y generar/i));
        expect(mockOnIncludeAll).toHaveBeenCalled();
    });

    /**
     * Verifica que el botón principal "Generar Informe"
     * dispare correctamente el evento onConfirm.
     */
    it('debe llamar a onConfirm al pulsar Generar Informe', () => {
        render(<ReportValidationDialog {...defaultProps} />);
        
        fireEvent.click(screen.getByText('Generar Informe'));
        expect(mockOnConfirm).toHaveBeenCalled();
    });

    /**
     * Verifica que el diálogo adapte los textos y el género de las palabras
     * cuando se trata de asignaturas ('SUBJECTS') en vez de espacios ('SPACES').
     */
    it('debe adaptar el género para asignaturas', () => {
        render(<ReportValidationDialog {...defaultProps} type="SUBJECTS" />);
        
        expect(screen.getByText(/aviso: asignaturas sin actividad/i)).toBeInTheDocument();
        expect(screen.getByText(/incluir todas y generar/i)).toBeInTheDocument();
    });
});
