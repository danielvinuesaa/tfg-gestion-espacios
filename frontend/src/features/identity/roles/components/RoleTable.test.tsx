import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '../../../../test/test-utils';
import RoleTable from './RoleTable';

/**
 * Suite de pruebas unitarias para el componente RoleTable.
 * Comprueba el renderizado de los datos de roles en formato de tabla,
 * así como las funciones de ordenación, selección y botones de acción.
 */
describe('RoleTable', () => {
    const mockRoles = [
        { id: 1, name: 'ADMIN', description: 'Acceso total', userCount: 5, totalUserCount: 5, status: 'ACTIVO', permissions: [] },
        { id: 2, name: 'PROFESOR', description: 'Acceso limitado', userCount: 50, totalUserCount: 55, status: 'ACTIVO', permissions: [] }
    ];

    const mockHandleAction = vi.fn();
    const mockOnSort = vi.fn();
    const mockOnToggleSelect = vi.fn();
    const mockOnSelectAll = vi.fn();

    const defaultProps = {
        roles: mockRoles as any,
        sortBy: 'name',
        direction: 'asc' as const,
        onSort: mockOnSort,
        handleAction: mockHandleAction,
        selectedIds: [],
        onToggleSelect: mockOnToggleSelect,
        onSelectAll: mockOnSelectAll
    };

    /**
     * Verifica que las filas de la tabla presenten correctamente el nombre,
     * descripción y estadísticas de usuarios para cada rol suministrado.
     */
    it('debe renderizar los roles y sus columnas', () => {
        render(<RoleTable {...defaultProps} />);
        
        expect(screen.getByText('ADMIN')).toBeInTheDocument();
        expect(screen.getByText('Acceso total')).toBeInTheDocument();
        expect(screen.getByText('5')).toBeInTheDocument(); // User count (active == total)
        
        expect(screen.getByText('50 / 55')).toBeInTheDocument(); // User count (active != total)
        expect(screen.getByText('PROFESOR')).toBeInTheDocument();
    });

    /**
     * Verifica que al pulsar en un botón de acción de la tabla (ej. Ver Detalles),
     * el evento se comunique a la función controladora de acciones con el rol adecuado.
     */
    it('debe disparar acciones al pulsar botones', () => {
        render(<RoleTable {...defaultProps} />);
        
        const viewBtn = screen.getByTestId('view-details-1');
        fireEvent.click(viewBtn);
        expect(mockHandleAction).toHaveBeenCalledWith('view', mockRoles[0]);
    });

    /**
     * Verifica que al pulsar en la cabecera de una columna, se invoque la función
     * de ordenación pasándole la clave correspondiente a la columna.
     */
    it('debe manejar la ordenación al pulsar en cabecera', () => {
        render(<RoleTable {...defaultProps} />);
        
        fireEvent.click(screen.getByText(/nombre y descripción/i));
        expect(mockOnSort).toHaveBeenCalledWith('name');
    });

    /**
     * Verifica que las casillas de verificación permitan seleccionar individualmente
     * cada una de las filas (roles) dentro de la tabla.
     */
    it('debe permitir seleccionar una fila', () => {
        render(<RoleTable {...defaultProps} />);
        
        const checkboxes = screen.getAllByRole('checkbox');
        // El 0 es header, el 1 es ADMIN (no seleccionable), el 2 es PROFESOR
        fireEvent.click(checkboxes[2]);
        
        expect(mockOnToggleSelect).toHaveBeenCalledWith(2);
    });
});
