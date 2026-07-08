import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '../../../../test/test-utils';
import RoleList from './RoleList';

/**
 * Suite de pruebas unitarias para el componente de listado principal de roles.
 * Comprueba la integración de la tabla, búsqueda, panel de detalles y
 * el diálogo para la eliminación de roles.
 */
describe('RoleList', () => {
    beforeEach(() => {
        localStorage.setItem('token', 'mock-token');
        vi.clearAllMocks();
    });

    /**
     * Verifica la correcta inicialización de la pantalla, cargando
     * tanto el título superior como la tabla poblada con los roles.
     */
    it('debe renderizar el título y la tabla de roles', async () => {
        render(<RoleList />);
        
        expect(await screen.findByText('Gestión de Roles')).toBeInTheDocument();
        expect(screen.getByText('ADMIN')).toBeInTheDocument();
        expect(screen.getByText('PROFESOR')).toBeInTheDocument();
    });

    /**
     * Verifica que al interactuar con el botón principal de creación,
     * se monte e inicialice adecuadamente el formulario de nuevo rol.
     */
    it('debe abrir el formulario de nuevo rol al pulsar el botón', async () => {
        render(<RoleList />);
        
        const addButton = await screen.findByRole('button', { name: /nuevo rol/i });
        fireEvent.click(addButton);

        expect(await screen.findByText('Nuevo Rol de Usuario')).toBeInTheDocument();
    });

    /**
     * Verifica que el campo de búsqueda modifique el listado mostrado,
     * ocultando los roles que no coincidan con el texto introducido.
     */
    it('debe filtrar roles por búsqueda', async () => {
        render(<RoleList />);
        
        const searchInput = await screen.findByPlaceholderText(/buscar/i);
        fireEvent.change(searchInput, { target: { value: 'ADMIN' } });

        await waitFor(() => {
            expect(screen.getByText('ADMIN')).toBeInTheDocument();
            expect(screen.queryByText('PROFESOR')).not.toBeInTheDocument();
        });
    });

    /**
     * Verifica que al accionar la opción de vista sobre un rol,
     * el panel lateral (Drawer) se despliegue enseñando sus detalles.
     */
    it('debe permitir ver detalles de un rol', async () => {
        render(<RoleList />);
        
        const detailsButton = await screen.findByTestId('view-details-1'); // ADMIN has ID 1
        fireEvent.click(detailsButton);

        // El Drawer muestra el nombre del rol en un H5
        expect(await screen.findByText('ADMIN', { selector: 'h5' })).toBeInTheDocument();
        expect(screen.getByText(/permisos asignados/i)).toBeInTheDocument();
    });

    /**
     * Verifica que al emplear la acción de borrado en un rol, se abra
     * el cuadro de diálogo de confirmación de eliminación pertinente.
     */
    it('debe permitir abrir el diálogo de borrado', async () => {
        render(<RoleList />);
        
        const deleteButton = await screen.findByTestId('delete-role-2'); // PROFESOR has ID 2
        fireEvent.click(deleteButton);

        // DeleteEntityDialog usa el título pasado como prop
        expect(await screen.findByText(/¿eliminar rol\?/i)).toBeInTheDocument();
        expect(await screen.findByText(/se han encontrado 50 usuarios vinculados/i)).toBeInTheDocument();
    });
});
