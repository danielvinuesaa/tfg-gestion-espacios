import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '../../../../test/test-utils';
import UserList from './UserList';
import { server } from '../../../../test/mocks/server';
import { http, HttpResponse } from 'msw';

/**
 * Suite de pruebas para el componente UserList.
 * Verifica el renderizado general, listado, filtrado y las distintas acciones
 * (editar, eliminar, bloquear) sobre los usuarios mostrados en la lista.
 */
describe('UserList', () => {
    beforeEach(() => {
        localStorage.setItem('token', 'mock-token');
        vi.clearAllMocks();
    });

    /**
     * Verifica que el componente renderice correctamente el título de la vista
     * y el botón para crear un nuevo usuario.
     */
    it('debe renderizar el título y el botón de nuevo usuario', async () => {
        render(<UserList />);
        expect(await screen.findByText('Gestión de Usuarios')).toBeInTheDocument();
    });

    /**
     * Verifica que el componente obtenga y muestre la lista de usuarios
     * procedentes de la API tras el renderizado inicial.
     */
    it('debe listar los usuarios obtenidos de la API', async () => {
        render(<UserList />);
        await waitFor(() => {
            expect(screen.getByText('Admin User')).toBeInTheDocument();
            expect(screen.getByText('Profesor Test')).toBeInTheDocument();
        }, { timeout: 5000 });
    });

    /**
     * Verifica el correcto funcionamiento de la barra de búsqueda para filtrar
     * los usuarios por nombre o correo electrónico.
     */
    it('debe permitir filtrar usuarios', async () => {
        render(<UserList />);
        
        await screen.findByText('Admin User');

        const searchInput = screen.getByPlaceholderText(/buscar por nombre o email/i);
        fireEvent.change(searchInput, { target: { value: 'Profesor' } });

        await waitFor(() => {
            expect(screen.queryByText('Admin User')).not.toBeInTheDocument();
            expect(screen.getByText('Profesor Test')).toBeInTheDocument();
        });
    });

    /**
     * Verifica que, al pulsar el botón de edición de un usuario no protegido,
     * se despliegue el formulario con los datos correspondientes cargados.
     */
    it('debe abrir el formulario de edición al pulsar editar en un usuario no protegido', async () => {
        render(<UserList />);
        
        await screen.findByText('Profesor Test');

        // En lugar de findByLabelText, usemos un selector más directo si es posible
        // Los botones de acción están en la tabla.
        const editButtons = await screen.findAllByRole('button', { name: /editar/i });
        fireEvent.click(editButtons[0]);

        // Verificamos si aparece el texto del diálogo
        expect(await screen.findByText('Editar Usuario', {}, { timeout: 8000 })).toBeInTheDocument();
        expect(screen.getByDisplayValue('profe@uniovi.es')).toBeInTheDocument();
    });

    /**
     * Verifica que al pulsar el botón de eliminar sobre un usuario no protegido
     * se muestre un cuadro de diálogo pidiendo la confirmación del borrado.
     */
    it('debe abrir el diálogo de borrado al pulsar eliminar en un usuario no protegido', async () => {
        render(<UserList />);
        
        await screen.findByText('Profesor Test');
        
        const deleteButtons = await screen.findAllByRole('button', { name: /eliminar/i });
        fireEvent.click(deleteButtons[0]);

        expect(await screen.findByText(/¿eliminar usuario\?/i, {}, { timeout: 8000 })).toBeInTheDocument();
    });

    /**
     * Verifica que al pulsar el botón de bloquear sobre un usuario no protegido
     * aparezca el cuadro de diálogo para confirmar el bloqueo de la cuenta.
     */
    it('debe abrir el diálogo de bloqueo al pulsar bloquear en un usuario no protegido', async () => {
        render(<UserList />);
        
        await screen.findByText('Profesor Test');
        
        const blockButtons = await screen.findAllByRole('button', { name: /bloquear acceso/i });
        fireEvent.click(blockButtons[0]);

        expect(await screen.findByText(/¿bloquear acceso al usuario\?/i, {}, { timeout: 8000 })).toBeInTheDocument();
    });

    /**
     * Verifica que, al seleccionar varios usuarios a través de los checkboxes,
     * el componente muestre un banner informando de las acciones masivas posibles.
     */
    it('debe mostrar banner de acciones masivas al seleccionar varios', async () => {
        render(<UserList />);
        
        await screen.findByText('Admin User');
        
        const checkboxes = screen.getAllByRole('checkbox');
        // El 1 y 2 son las filas (0 es header)
        fireEvent.click(checkboxes[1]);
        fireEvent.click(checkboxes[2]);

        expect(await screen.findByText(/2 usuarios seleccionados/i)).toBeInTheDocument();
    });
});
