import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '../../../../../test/test-utils';
import UserTable from './UserTable';

/**
 * Suite de pruebas unitarias para el componente UserTable.
 * Verifica que la tabla muestre correctamente los datos, gestione la
 * ordenación, permita selecciones múltiples y proporcione acciones individuales.
 */
describe('UserTable', () => {
    const mockUsers = [
        { id: 1, name: 'Admin', email: 'admin@uniovi.es', role: { name: 'ADMIN' }, status: 'ACTIVO' },
        { id: 2, name: 'Profesor Test', email: 'profe@es.com', role: { name: 'PROFESOR' }, status: 'ACTIVO' },
        { id: 3, name: 'User Blocked', email: 'block@es.com', role: { name: 'ESTUDIANTE' }, status: 'BLOQUEADO' }
    ];

    const mockHandleAction = vi.fn();
    const mockHandleSort = vi.fn();
    const mockSetPage = vi.fn();
    const mockSetRows = vi.fn();
    const mockSelectOne = vi.fn();
    const mockSelectAll = vi.fn();

    const defaultProps = {
        users: mockUsers as any,
        currentUserEmail: 'admin@uniovi.es',
        totalElements: 3,
        rowsPerPage: 10,
        page: 0,
        setPage: mockSetPage,
        setRowsPerPage: mockSetRows,
        sortBy: 'name',
        direction: 'asc' as const,
        handleSort: mockHandleSort,
        handleAction: mockHandleAction,
        selectedIds: [],
        onSelectAll: mockSelectAll,
        onSelectOne: mockSelectOne
    };

    /**
     * Verifica que la tabla renderice correctamente las filas con los datos
     * de los usuarios proporcionados, incluyendo su correo, nombre y rol.
     */
    it('debe renderizar los usuarios y sus roles', () => {
        render(<UserTable {...defaultProps} />);
        
        expect(screen.getByText('Admin')).toBeInTheDocument();
        expect(screen.getByText('admin@uniovi.es')).toBeInTheDocument();
        expect(screen.getByText('Profesor Test')).toBeInTheDocument();
        expect(screen.getByText('User Blocked')).toBeInTheDocument();
        
        // El chip Bloqueado (case insensitive)
        expect(screen.getByText(/bloqueado/i)).toBeInTheDocument();
    });

    /**
     * Verifica que al hacer clic en el encabezado de una columna ordenable
     * se invoque la función handleSort indicando el campo correspondiente.
     */
    it('debe llamar a handleSort al pulsar cabecera', () => {
        render(<UserTable {...defaultProps} />);
        
        fireEvent.click(screen.getByText('Email'));
        expect(mockHandleSort).toHaveBeenCalledWith('email');
    });

    /**
     * Verifica que la cuenta del administrador principal del sistema no pueda
     * ser seleccionada a través de las casillas de verificación (checkbox) de la tabla.
     */
    it('debe proteger la cuenta admin de selección', () => {
        render(<UserTable {...defaultProps} />);
        
        const checkboxes = screen.getAllByRole('checkbox');
        // 0: Header, 1: Admin, 2: Profesor
        expect(checkboxes[1]).toBeDisabled();
        expect(checkboxes[2]).not.toBeDisabled();
    });

    /**
     * Verifica que, al pulsar cualquiera de los botones de acción individuales
     * en la tabla (ej. editar), se dispare el evento correspondiente con el usuario afectado.
     */
    it('debe disparar acciones al pulsar botones de acción', () => {
        render(<UserTable {...defaultProps} />);
        
        const editBtns = screen.getAllByRole('button', { name: 'Editar' });
        // editBtns[0] es el del Profesor Test
        fireEvent.click(editBtns[0]);
        
        expect(mockHandleAction).toHaveBeenCalledWith('edit', expect.objectContaining({ id: 2 }));
    });
});
