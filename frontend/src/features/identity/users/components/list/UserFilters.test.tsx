import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '../../../../../test/test-utils';
import UserFilters from './UserFilters';

/**
 * Suite de pruebas unitarias para el componente UserFilters.
 * Verifica la correcta visualización e interacción de los elementos de filtrado
 * de la lista de usuarios (por nombre, rol y estado).
 */
describe('UserFilters', () => {
    const mockSetName = vi.fn();
    const mockSetRole = vi.fn();
    const mockSetDeleted = vi.fn();
    const mockClear = vi.fn();
    const mockSetPage = vi.fn();

    const roles = [
        { id: 1, name: 'ADMIN' },
        { id: 2, name: 'PROFESOR' }
    ];

    const defaultProps = {
        searchName: '',
        setSearchName: mockSetName,
        searchRole: '',
        setSearchRole: mockSetRole,
        includeDeleted: false,
        setIncludeDeleted: mockSetDeleted,
        roles: roles as any,
        clearFilters: mockClear,
        setPage: mockSetPage
    };

    /**
     * Verifica que se rendericen correctamente el campo de texto para buscar
     * por nombre y el selector desplegable para filtrar por rol.
     */
    it('debe renderizar búsqueda y selector de rol', () => {
        render(<UserFilters {...defaultProps} />);
        
        expect(screen.getByPlaceholderText(/buscar por nombre/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/rol/i)).toBeInTheDocument();
    });

    /**
     * Verifica que al seleccionar una opción en el desplegable de rol
     * se invoque la función de actualización de rol y se reinicie la paginación.
     */
    it('debe llamar a setSearchRole al cambiar el rol', async () => {
        render(<UserFilters {...defaultProps} />);
        
        const select = screen.getByLabelText(/rol/i);
        fireEvent.mouseDown(select);
        
        const option = await screen.findByText('PROFESOR');
        fireEvent.click(option);
        
        expect(mockSetRole).toHaveBeenCalledWith(2);
        expect(mockSetPage).toHaveBeenCalledWith(0);
    });

    /**
     * Verifica que al pulsar el botón de limpiar filtros, se invoque la
     * función encargada de restablecer el estado inicial de la búsqueda.
     */
    it('debe llamar a clearFilters al pulsar el botón de Limpiar', () => {
        render(<UserFilters {...defaultProps} searchName="test" />);
        
        // Usar name exacto para evitar colisión con "limpiar búsqueda"
        const clearBtn = screen.getByRole('button', { name: 'Limpiar' });
        fireEvent.click(clearBtn);
        
        expect(mockClear).toHaveBeenCalled();
    });
});
