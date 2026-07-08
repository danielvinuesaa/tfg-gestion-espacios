import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '../../../../test/test-utils';
import UserForm from './UserForm';
import { server } from '../../../../test/mocks/server';
import { http, HttpResponse } from 'msw';

/**
 * Suite de pruebas unitarias para el componente UserForm.
 * Verifica el comportamiento del formulario tanto en modo creación como
 * en modo edición, comprobando validaciones, carga de datos y envío a la API.
 */
describe('UserForm', () => {
    const mockOnSuccess = vi.fn();
    const mockHandleClose = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
        localStorage.setItem('token', 'mock-token');
        
        // Mock de roles para el selector
        server.use(
            http.get('/api/roles', () => {
                return HttpResponse.json([
                    { id: 1, name: 'ADMIN' },
                    { id: 2, name: 'PROFESOR' }
                ]);
            })
        );
    });

    /**
     * Verifica que el formulario se renderice correctamente en modo creación,
     * mostrando el título adecuado y presentando los campos de texto en blanco.
     */
    it('debe renderizar modo creación con campos vacíos', async () => {
        render(<UserForm open={true} handleClose={mockHandleClose} onSuccess={mockOnSuccess} />);
        
        expect(await screen.findByText('Nuevo Usuario')).toBeInTheDocument();
        expect(screen.getByLabelText(/nombre completo/i)).toHaveValue('');
        expect(screen.getByLabelText(/correo electrónico/i)).toHaveValue('');
    });

    /**
     * Verifica que, al proporcionar datos iniciales, el formulario se renderice
     * en modo edición y pre-cargue la información en los campos correspondientes.
     */
    it('debe renderizar modo edición con datos iniciales', async () => {
        const initialData = {
            id: 10,
            name: 'User Test',
            email: 'test@uniovi.es',
            role: { id: 2, name: 'PROFESOR' },
            status: 'ACTIVO'
        };

        render(<UserForm open={true} handleClose={mockHandleClose} onSuccess={mockOnSuccess} initialData={initialData as any} />);
        
        expect(await screen.findByText('Editar Usuario')).toBeInTheDocument();
        expect(screen.getByDisplayValue('User Test')).toBeInTheDocument();
        expect(screen.getByDisplayValue('test@uniovi.es')).toBeInTheDocument();
    });

    /**
     * Verifica que el formulario realice la validación de contraseña local,
     * mostrando un mensaje de error si los valores de ambos campos no coinciden.
     */
    it('debe validar que las contraseñas coincidan', async () => {
        render(<UserForm open={true} handleClose={mockHandleClose} onSuccess={mockOnSuccess} />);
        
        await screen.findByText('Nuevo Usuario');

        const passwordInput = screen.getByLabelText(/^contraseña/i);
        const confirmInput = screen.getByLabelText(/confirmar contraseña/i);

        fireEvent.change(passwordInput, { target: { value: 'password123' } });
        fireEvent.change(confirmInput, { target: { value: 'password456' } });
        fireEvent.blur(confirmInput);

        expect(await screen.findByText(/las contraseñas no coinciden/i)).toBeInTheDocument();
    });

    /**
     * Verifica que, tras rellenar correctamente todos los campos necesarios,
     * se realice la petición a la API y, si tiene éxito, se llame al callback onSuccess.
     */
    it('debe llamar a saveUser al enviar un formulario válido', async () => {
        server.use(
            http.post('/api/users', () => {
                return HttpResponse.json({ id: 11 }, { status: 201 });
            })
        );

        render(<UserForm open={true} handleClose={mockHandleClose} onSuccess={mockOnSuccess} />);
        
        await screen.findByText('Nuevo Usuario');

        fireEvent.change(screen.getByLabelText(/nombre completo/i), { target: { value: 'Nuevo Usuario' } });
        fireEvent.change(screen.getByLabelText(/correo electrónico/i), { target: { value: 'nuevo@uniovi.es' } });
        
        const passwordInput = screen.getByLabelText(/^contraseña/i);
        fireEvent.change(passwordInput, { target: { value: 'password123' } });
        fireEvent.change(screen.getByLabelText(/confirmar contraseña/i), { target: { value: 'password123' } });

        // Seleccionar Rol
        const roleSelect = screen.getByLabelText(/rol asignado/i);
        fireEvent.mouseDown(roleSelect);
        const option = await screen.findByText('PROFESOR');
        fireEvent.click(option);

        const submitButton = screen.getByRole('button', { name: /crear usuario/i });
        fireEvent.click(submitButton);

        await waitFor(() => {
            expect(mockOnSuccess).toHaveBeenCalled();
        });
    });

    /**
     * Verifica que, si el usuario actualmente autenticado intenta editar
     * su propio perfil, no se le permita modificar su rol ni su estado de cuenta.
     */
    it('debe ocultar Rol y Estado cuando el usuario se edita a sí mismo', async () => {
        const myData = {
            id: 1, // Mismo ID que el mock de Auth
            name: 'Admin User',
            email: 'admin@uniovi.es',
            role: { id: 1, name: 'ADMIN' },
            status: 'ACTIVO'
        };

        // Mock de AuthContext para que el usuario actual sea el ID 1
        server.use(
            http.get('/api/users/me', () => {
                return HttpResponse.json({
                    id: 1,
                    email: 'admin@uniovi.es',
                    name: 'Admin User',
                    role: 'ADMIN',
                    permissions: ['GESTIONAR_USUARIOS']
                });
            })
        );

        render(<UserForm open={true} handleClose={mockHandleClose} onSuccess={mockOnSuccess} initialData={myData as any} />);
        
        expect(await screen.findByText('Editar Usuario')).toBeInTheDocument();

        // Los selectores NO deben estar en el documento
        expect(screen.queryByLabelText(/rol asignado/i)).toBeNull();
        expect(screen.queryByLabelText(/estado de cuenta/i)).toBeNull();
        expect(screen.queryByText(/permisos y estados/i)).toBeNull();
    });
});
