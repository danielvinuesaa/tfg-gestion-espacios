import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import CalendarSidebar from './CalendarSidebar';

/**
 * Suite de pruebas para el componente CalendarSidebar.
 * Verifica la renderización y funcionamiento de los filtros del calendario,
 * incluyendo selección de espacios, estados y tipos de reserva.
 */
describe('CalendarSidebar', () => {
    const mockSpaces = [
        { id: 1, name: 'Aula 101', type: 'AULA' },
        { id: 2, name: 'Lab 1', type: 'LABORATORIO' }
    ];

    const defaultProps = {
        spaces: mockSpaces as any,
        selectedSpaceIds: [1, 2],
        selectedStatuses: ['APROBADA'],
        allTypes: ['CLASE', 'EXAMEN'],
        selectedTypes: ['CLASE'],
        onToggleSpace: vi.fn(),
        onToggleAll: vi.fn(),
        onToggleStatus: vi.fn(),
        onToggleAllStatuses: vi.fn(),
        onToggleType: vi.fn(),
        onToggleAllTypes: vi.fn(),
    };

    /**
     * Verifica que el componente agrupe y renderice los espacios correctamente
     * según su tipo, mostrando la cantidad correspondiente en cada grupo.
     */
    it('debe renderizar los grupos de espacios', () => {
        render(<CalendarSidebar {...defaultProps} />);
        
        expect(screen.getByText(/AULA \(1\)/i)).toBeInTheDocument();
        expect(screen.getByText(/LABORATORIO \(1\)/i)).toBeInTheDocument();
    });

    /**
     * Verifica que los espacios individuales se muestren correctamente
     * cuando los grupos están expandidos.
     */
    it('debe mostrar los espacios individuales al estar expandido', () => {
        render(<CalendarSidebar {...defaultProps} />);
        
        expect(screen.getByText('Aula 101')).toBeInTheDocument();
        expect(screen.getByText('Lab 1')).toBeInTheDocument();
    });

    /**
     * Verifica que al hacer clic en un espacio específico, se invoque la función
     * callback correspondiente para alternar su estado de selección.
     */
    it('debe llamar a onToggleSpace al pulsar un espacio', () => {
        render(<CalendarSidebar {...defaultProps} />);
        
        const spaceCheckbox = screen.getByLabelText('Aula 101');
        fireEvent.click(spaceCheckbox);
        
        expect(defaultProps.onToggleSpace).toHaveBeenCalledWith(1);
    });

    /**
     * Verifica que se puedan seleccionar todos los espacios globalmente
     * utilizando el botón de selección múltiple.
     */
    it('debe permitir seleccionar todos los espacios globalmente', () => {
        render(<CalendarSidebar {...defaultProps} />);
        
        // Hay varios botones con el mismo label. Usamos getAll y pulsamos el primero (espacios)
        const selectAllBtns = screen.getAllByLabelText(/seleccionar todos/i);
        fireEvent.click(selectAllBtns[0]);
        
        expect(defaultProps.onToggleAll).toHaveBeenCalledWith([1, 2], true);
    });

    /**
     * Verifica que al hacer clic en un estado específico, se invoque la función
     * callback para filtrar por dicho estado.
     */
    it('debe permitir filtrar por estado', () => {
        render(<CalendarSidebar {...defaultProps} />);
        
        const statusCheckbox = screen.getByLabelText('APROBADA');
        fireEvent.click(statusCheckbox);
        
        expect(defaultProps.onToggleStatus).toHaveBeenCalledWith('APROBADA');
    });

    /**
     * Verifica que al hacer clic en un tipo de reserva específico, se invoque la función
     * callback para filtrar por dicho tipo.
     */
    it('debe permitir filtrar por tipo de reserva', () => {
        render(<CalendarSidebar {...defaultProps} />);
        
        const typeCheckbox = screen.getByLabelText('CLASE');
        fireEvent.click(typeCheckbox);
        
        expect(defaultProps.onToggleType).toHaveBeenCalledWith('CLASE');
    });
});
