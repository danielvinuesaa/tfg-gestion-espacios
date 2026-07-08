import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '../../../../test/test-utils';
import SpaceFilters from './SpaceFilters';

/**
 * @file SpaceFilters.test.tsx
 * @description Suite de pruebas para los filtros de la lista de espacios.
 * Comprueba el renderizado de los controles (texto, número, selects) y la emisión de cambios.
 */
describe('SpaceFilters', () => {
    const mockSetName = vi.fn();
    const mockSetIncludeDeleted = vi.fn();
    const mockHandleFilterChange = vi.fn();
    const mockClearFilters = vi.fn();
    const mockSetPage = vi.fn();

    const defaultProps = {
        searchName: '',
        setSearchName: mockSetName,
        filters: {},
        includeDeleted: false,
        setIncludeDeleted: mockSetIncludeDeleted,
        handleFilterChange: mockHandleFilterChange,
        clearFilters: mockClearFilters,
        setPage: mockSetPage
    };

    beforeEach(() => {
        vi.clearAllMocks();
    });

    /**
     * Verifica que todos los campos y desplegables para establecer filtros de búsqueda
     * sean renderizados en la interfaz.
     */
    it('debe renderizar todos los controles de filtrado', () => {
        render(<SpaceFilters {...defaultProps} />);
        
        expect(screen.getByPlaceholderText(/buscar por nombre/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/tipo/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/estado/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/cap. mín./i)).toBeInTheDocument();
        expect(screen.getByLabelText(/ord. mín./i)).toBeInTheDocument();
    });

    /**
     * Verifica que si se cambia el valor del filtro de capacidad mínima,
     * se dispare la actualización de filtros con la información adecuada.
     */
    it('debe llamar a handleFilterChange al cambiar capacidad', () => {
        render(<SpaceFilters {...defaultProps} />);
        
        const input = screen.getByLabelText(/cap. mín./i);
        fireEvent.change(input, { target: { value: '50' } });
        
        expect(mockHandleFilterChange).toHaveBeenCalledWith('minCapacity', '50');
        expect(mockSetPage).toHaveBeenCalledWith(0);
    });

    /**
     * Verifica que al cambiar el número mínimo de ordenadores en el filtro,
     * se actualice el estado y se notifique con los nuevos valores.
     */
    it('debe llamar a handleFilterChange al cambiar ordenadores', () => {
        render(<SpaceFilters {...defaultProps} />);
        
        const input = screen.getByLabelText(/ord. mín./i);
        fireEvent.change(input, { target: { value: '10' } });
        
        expect(mockHandleFilterChange).toHaveBeenCalledWith('minComputers', '10');
        expect(mockSetPage).toHaveBeenCalledWith(0);
    });

    /**
     * Verifica que el componente ignore cambios si el valor introducido es
     * un número negativo (ej. en la capacidad).
     */
    it('no debe llamar a handleFilterChange si el valor es negativo', () => {
        render(<SpaceFilters {...defaultProps} />);
        
        const input = screen.getByLabelText(/cap. mín./i);
        fireEvent.change(input, { target: { value: '-1' } });
        
        expect(mockHandleFilterChange).not.toHaveBeenCalled();
    });
});
