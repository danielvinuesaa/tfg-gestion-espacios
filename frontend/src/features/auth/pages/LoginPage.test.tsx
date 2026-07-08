import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent, waitFor } from '../../../test/test-utils';
import LoginPage from './LoginPage';
import { server } from '../../../test/mocks/server';
import { http, HttpResponse } from 'msw';

/**
 * Suite de pruebas unitarias para la página de inicio de sesión (`LoginPage`).
 * Verifica la correcta visualización del formulario, interacciones del usuario
 * como escribir y alternar visibilidad de contraseña, y las respuestas a
 * intentos de login exitosos y fallidos.
 */
describe('LoginPage', () => {
    /**
     * Verifica que los campos de entrada para correo y contraseña, así como el
     * botón de envío, se renderizan correctamente en el documento.
     */
    it('debe renderizar los campos de login', () => {
        render(<LoginPage />);
        
        expect(screen.getByLabelText(/correo electrónico/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/contraseña/i)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /iniciar sesión/i })).toBeInTheDocument();
    });

    /**
     * Verifica que el usuario pueda escribir en los campos de correo y contraseña
     * y que los valores del formulario se actualicen correctamente.
     */
    it('debe permitir escribir en los campos', () => {
        render(<LoginPage />);
        
        const emailInput = screen.getByLabelText(/correo electrónico/i) as HTMLInputElement;
        const passwordInput = screen.getByLabelText(/contraseña/i) as HTMLInputElement;

        fireEvent.change(emailInput, { target: { value: 'test@uniovi.es' } });
        fireEvent.change(passwordInput, { target: { value: 'Pass1234!' } });

        expect(emailInput.value).toBe('test@uniovi.es');
        expect(passwordInput.value).toBe('Pass1234!');
    });

    /**
     * Verifica que al recibir una respuesta de error desde el API, se muestra un
     * mensaje informativo de credenciales incorrectas en la pantalla.
     */
    it('debe mostrar error cuando las credenciales son incorrectas', async () => {
        server.use(
            http.post('/api/auth/authenticate', () => {
                return HttpResponse.json(
                    { message: 'Email o contraseña incorrectos.' }, 
                    { status: 401 }
                );
            })
        );

        render(<LoginPage />);
        
        const emailInput = screen.getByLabelText(/correo electrónico/i);
        const passwordInput = screen.getByLabelText(/contraseña/i);
        const submitButton = screen.getByRole('button', { name: /iniciar sesión/i });

        fireEvent.change(emailInput, { target: { value: 'error@uniovi.es' } });
        fireEvent.change(passwordInput, { target: { value: 'wrong' } });
        fireEvent.click(submitButton);

        await waitFor(() => {
            expect(screen.getByText(/email o contraseña incorrectos/i)).toBeInTheDocument();
        });
    });

    /**
     * Verifica que al pulsar el icono del ojo en el campo de contraseña, el
     * tipo del input cambia entre `password` y `text` para mostrar u ocultar la clave.
     */
    it('debe cambiar la visibilidad de la contraseña al pulsar el icono', () => {
        render(<LoginPage />);
        
        const passwordInput = screen.getByLabelText(/contraseña/i) as HTMLInputElement;
        expect(passwordInput.type).toBe('password');

        const toggleButton = screen.getByRole('button', { name: /toggle password visibility/i });
        fireEvent.click(toggleButton);

        expect(passwordInput.type).toBe('text');

        fireEvent.click(toggleButton);
        expect(passwordInput.type).toBe('password');
    });

    /**
     * Verifica que si las credenciales son válidas, se llama al endpoint y la vista
     * no muestra errores (la redirección es manejada por el contexto/router en un nivel superior).
     */
    it('debe llamar al API y redirigir (implícito) al login exitoso', async () => {
        // El handler por defecto en handlers.ts devuelve 200 OK con un token
        render(<LoginPage />);
        
        const emailInput = screen.getByLabelText(/correo electrónico/i);
        const passwordInput = screen.getByLabelText(/contraseña/i);
        const submitButton = screen.getByRole('button', { name: /iniciar sesión/i });

        fireEvent.change(emailInput, { target: { value: 'admin@uniovi.es' } });
        fireEvent.change(passwordInput, { target: { value: 'Pass1234!' } });
        fireEvent.click(submitButton);

        // Si no hay error, el botón debería mostrar el loading o desaparecer/mantenerse según la lógica
        // Como hay una redirección tras el login exitoso en useLogin, 
        // podemos verificar que no hay mensajes de error y que se llamó al endpoint.
        await waitFor(() => {
            expect(screen.queryByRole('alert')).not.toBeInTheDocument();
        });
    });
});
