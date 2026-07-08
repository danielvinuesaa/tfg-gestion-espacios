import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '../../../../../test/test-utils';
import SubjectUsageConfig from './SubjectUsageConfig';

/**
 * Suite de pruebas unitarias para el componente SubjectUsageConfig.
 * Comprueba que el formulario de configuración para el informe de uso
 * de asignaturas se renderice y maneje la interacción adecuadamente.
 */
describe('SubjectUsageConfig', () => {
    const mockOnStartDateChange = vi.fn();
    const mockOnEndDateChange = vi.fn();
    const mockOnSubjectsChange = vi.fn();
    const mockOnReservationTypesChange = vi.fn();

    const availableSubjects = [
        { id: 101, name: 'Asignatura 1', code: 'S1', course: '1' },
        { id: 102, name: 'Asignatura 2', code: 'S2', course: '2' }
    ];

    const defaultProps = {
        startDate: new Date(2026, 0, 1),
        onStartDateChange: mockOnStartDateChange,
        endDate: new Date(2026, 0, 31),
        onEndDateChange: mockOnEndDateChange,
        selectedSubjectIds: [],
        onSubjectsChange: mockOnSubjectsChange,
        reservationTypes: [],
        onReservationTypesChange: mockOnReservationTypesChange,
        availableSubjects
    };

    /**
     * Verifica que se muestren correctamente todos los controles del formulario:
     * selectores de fechas, buscador de asignaturas y filtro de tipos de reserva.
     */
    it('debe renderizar todos los controles', () => {
        render(<SubjectUsageConfig {...defaultProps} />);
        
        expect(screen.getAllByText(/fecha inicio/i).length).toBeGreaterThan(0);
        expect(screen.getAllByText(/fecha fin/i).length).toBeGreaterThan(0);
        expect(screen.getByPlaceholderText(/añadir asignatura/i)).toBeInTheDocument();
        expect(screen.getByPlaceholderText(/todos los tipos/i)).toBeInTheDocument();
    });

    /**
     * Verifica que al pulsar la opción rápida de seleccionar todas las asignaturas
     * se emita el evento onSubjectsChange con los identificadores correspondientes.
     */
    it('debe permitir seleccionar todas las asignaturas', () => {
        render(<SubjectUsageConfig {...defaultProps} />);
        
        const selectAllText = screen.getByText(/seleccionar todas \(2\)/i);
        fireEvent.click(selectAllText);
        
        expect(mockOnSubjectsChange).toHaveBeenCalledWith([101, 102]);
    });
});
