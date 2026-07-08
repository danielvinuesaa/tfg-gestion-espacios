import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '../../../../test/test-utils';
import SubjectSelectorDialog from './SubjectSelectorDialog';

/**
 * Suite de pruebas unitarias para el diálogo de selección de asignaturas.
 * Verifica la correcta agrupación por curso y el funcionamiento de
 * los métodos de selección y deselección de elementos.
 */
describe('SubjectSelectorDialog', () => {
    const mockOnToggle = vi.fn();
    const mockOnClear = vi.fn();
    const mockOnClose = vi.fn();

    const subjects = [
        { id: 1, name: 'Asignatura 1', code: 'S1', course: '1' },
        { id: 2, name: 'Asignatura 2', code: 'S2', course: '2' }
    ];

    const defaultProps = {
        open: true,
        onClose: mockOnClose,
        subjects,
        selectedIds: [1],
        onToggle: mockOnToggle,
        onClearAll: mockOnClear
    };

    /**
     * Verifica que el diálogo renderice las asignaturas correctamente,
     * organizadas visualmente en grupos según su curso académico.
     */
    it('debe renderizar la lista de asignaturas agrupadas por curso', async () => {
        render(<SubjectSelectorDialog {...defaultProps} />);
        
        expect(screen.getByText('Asignatura 1')).toBeInTheDocument();
        expect(screen.getByText('Asignatura 2')).toBeInTheDocument();
        expect(screen.getByText(/curso 1/i)).toBeInTheDocument();
        expect(screen.getByText(/curso 2/i)).toBeInTheDocument();
    });

    /**
     * Verifica que, al interactuar con un elemento de la lista,
     * se notifique al componente padre llamando a la función onToggle.
     */
    it('debe llamar a onToggle al pulsar una asignatura', () => {
        render(<SubjectSelectorDialog {...defaultProps} />);
        
        fireEvent.click(screen.getByText('Asignatura 2'));
        expect(mockOnToggle).toHaveBeenCalledWith(2);
    });

    /**
     * Verifica que, al pulsar la opción global de limpieza,
     * se emita el evento onClearAll hacia el componente superior.
     */
    it('debe llamar a onClearAll al pulsar deseleccionar todas', () => {
        render(<SubjectSelectorDialog {...defaultProps} />);
        
        fireEvent.click(screen.getByText(/deseleccionar todas/i));
        expect(mockOnClear).toHaveBeenCalled();
    });
});
