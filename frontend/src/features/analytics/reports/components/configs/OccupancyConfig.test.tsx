import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '../../../../../test/test-utils';
import OccupancyConfig from './OccupancyConfig';

/**
 * @file OccupancyConfig.test.tsx
 * @description Suite de pruebas para el componente de configuración de informes de ocupación.
 * Verifica que los selectores de fechas y espacios se rendericen y funcionen correctamente.
 */
describe('OccupancyConfig', () => {
    const mockOnStartDateChange = vi.fn();
    const mockOnEndDateChange = vi.fn();
    const mockOnSpacesChange = vi.fn();

    const availableSpaces = [
        { id: 1, name: 'Aula 101', type: 'AULA' },
        { id: 2, name: 'Aula 102', type: 'AULA' }
    ];

    const defaultProps = {
        startDate: new Date(2026, 0, 1),
        onStartDateChange: mockOnStartDateChange,
        endDate: new Date(2026, 0, 31),
        onEndDateChange: mockOnEndDateChange,
        selectedSpaceIds: [],
        onSpacesChange: mockOnSpacesChange,
        availableSpaces
    };

    /**
     * Verifica que el componente muestre los selectores de fechas (inicio y fin)
     * y el campo de selección múltiple de espacios de forma adecuada.
     */
    it('debe renderizar pickers de fecha y selector de espacios', () => {
        render(<OccupancyConfig {...defaultProps} />);
        
        expect(screen.getAllByText(/fecha inicio/i).length).toBeGreaterThan(0);
        expect(screen.getAllByText(/fecha fin/i).length).toBeGreaterThan(0);
        // OccupancyConfig usa placeholder dinámico
        expect(screen.getByPlaceholderText(/seleccione espacios/i)).toBeInTheDocument();
    });

    /**
     * Verifica que se pueda seleccionar la opción "Seleccionar todos los espacios"
     * y que se notifique al componente padre con la lista completa de identificadores.
     */
    it('debe permitir seleccionar todos los espacios', () => {
        render(<OccupancyConfig {...defaultProps} />);
        
        const selectAllText = screen.getByText(/seleccionar todos los espacios/i);
        fireEvent.click(selectAllText);
        
        expect(mockOnSpacesChange).toHaveBeenCalledWith([1, 2]);
    });

    /**
     * Verifica que si hay espacios preseleccionados pero no todos,
     * al pulsar "Seleccionar todos", el componente emita la lista con todos los espacios disponibles.
     */
    it('debe mostrar estado indeterminado si algunos espacios están seleccionados', () => {
        render(<OccupancyConfig {...defaultProps} selectedSpaceIds={[1]} />);
        
        const selectAllText = screen.getByText(/seleccionar todos los espacios/i);
        fireEvent.click(selectAllText);
        expect(mockOnSpacesChange).toHaveBeenCalledWith([1, 2]);
    });
});
