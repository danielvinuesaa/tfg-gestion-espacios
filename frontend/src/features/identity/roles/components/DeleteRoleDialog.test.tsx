import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '../../../../test/test-utils';
import DeleteRoleDialog from './DeleteRoleDialog';
import { Role } from '../../../../shared/types';

/**
 * Suite de pruebas unitarias para el diálogo de eliminación de roles.
 * Verifica la detección de conflictos de usuarios vinculados y el
 * flujo de reasignación antes de completar la eliminación.
 */
describe('DeleteRoleDialog', () => {
    const mockOnSuccess = vi.fn();
    const mockHandleClose = vi.fn();
    
    const professorRole: Role = {
        id: 2,
        name: 'PROFESOR',
        description: 'Docente',
        status: 'ACTIVO',
        permissions: [],
        subjectIds: [],
        userCount: 50
    };

    const adminRole: Role = {
        id: 1,
        name: 'ADMIN',
        description: 'Admin',
        status: 'ACTIVO',
        permissions: [],
        subjectIds: [],
        userCount: 1
    };

    const allRoles: Role[] = [adminRole, professorRole];

    const defaultProps = {
        open: true,
        role: professorRole,
        allRoles: allRoles,
        handleClose: mockHandleClose,
        onSuccess: mockOnSuccess
    };

    beforeEach(() => {
        vi.clearAllMocks();
    });

    /**
     * Verifica que el diálogo advierta sobre usuarios que aún poseen el rol
     * a eliminar, exigiendo que se seleccione un rol de reemplazo.
     */
    it('debe detectar conflictos (usuarios vinculados) y pedir reasignación', async () => {
        render(<DeleteRoleDialog {...defaultProps} />);
        
        expect(await screen.findByText(/se han encontrado 50 usuarios vinculados a este rol/i)).toBeInTheDocument();
        expect(screen.getByText(/acción requerida: reasignar usuarios/i)).toBeInTheDocument();
        // Buscar el select por su rol de combobox
        expect(screen.getByRole('combobox')).toBeInTheDocument();
    });

    /**
     * Verifica que sea posible elegir un rol alternativo del selector
     * y continuar exitosamente con el proceso de borrado.
     */
    it('debe permitir seleccionar un rol de destino y confirmar eliminación', async () => {
        render(<DeleteRoleDialog {...defaultProps} />);
        
        // Esperar a que cargue
        await screen.findByText(/acción requerida/i);

        // Click en el select (MUI Select renders a div with role button/combobox)
        const selectTrigger = screen.getByRole('combobox');
        fireEvent.mouseDown(selectTrigger);

        // Buscar la opción en el portal (fuera del componente actual)
        const adminOption = await screen.findByRole('option', { name: /ADMIN/ });
        fireEvent.click(adminOption);

        // Confirmar
        const confirmButton = screen.getByRole('button', { name: /confirmar reasignación y eliminar/i });
        fireEvent.click(confirmButton);

        await waitFor(() => {
            expect(mockOnSuccess).toHaveBeenCalled();
            expect(mockHandleClose).toHaveBeenCalled();
        }, { timeout: 3000 });
    });

    /**
     * Verifica que si el rol no tiene ningún usuario asociado, el diálogo
     * proceda de forma directa ofreciendo simplemente un mensaje de confirmación simple.
     */
    it('debe mostrar mensaje simple si no hay conflictos', async () => {
        const roleWithoutUsers = { ...professorRole, id: 99, userCount: 0 };
        render(<DeleteRoleDialog {...defaultProps} role={roleWithoutUsers} />);
        
        expect(await screen.findByText(/¿está seguro de que desea eliminar este rol\?/i)).toBeInTheDocument();
        
        const confirmButton = screen.getByRole('button', { name: /confirmar eliminación/i });
        fireEvent.click(confirmButton);

        await waitFor(() => {
            expect(mockOnSuccess).toHaveBeenCalled();
        });
    });
});
