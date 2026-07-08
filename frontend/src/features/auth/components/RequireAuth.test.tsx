import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { RequireAuth } from './RequireAuth';
import { useAuth } from '../../../context/AuthContext';
import { MemoryRouter, Routes, Route } from 'react-router-dom';

// Mock de useAuth
vi.mock('../../../context/AuthContext', () => ({
    useAuth: vi.fn()
}));

const MockProtected = () => <div>Contenido Protegido</div>;
const MockLogin = () => <div>Página de Login</div>;
const MockUnauthorized = () => <div>No Autorizado</div>;

/**
 * Suite de pruebas unitarias para el componente de enrutamiento `RequireAuth`.
 * Verifica que se restringe correctamente el acceso a las rutas basándose
 * en el estado de autenticación, roles y permisos del usuario actual.
 */
describe('RequireAuth', () => {
    /**
     * Verifica que mientras se está comprobando el estado de la sesión,
     * se renderice un componente de carga en lugar de la ruta protegida o redirigir.
     */
    it('debe mostrar PageLoader si está cargando', () => {
        (useAuth as any).mockReturnValue({
            loading: true,
            isAuthenticated: true,
            user: null
        });

        render(
            <MemoryRouter>
                <RequireAuth>
                    <MockProtected />
                </RequireAuth>
            </MemoryRouter>
        );

        expect(screen.getByText(/verificando sesión segura/i)).toBeInTheDocument();
    });

    /**
     * Verifica que si el usuario no está autenticado, sea redirigido
     * a la página de inicio de sesión de forma automática.
     */
    it('debe redirigir a login si no está autenticado', () => {
        (useAuth as any).mockReturnValue({
            loading: false,
            isAuthenticated: false,
            user: null
        });

        render(
            <MemoryRouter initialEntries={['/protected']}>
                <Routes>
                    <Route path="/login" element={<MockLogin />} />
                    <Route path="/protected" element={
                        <RequireAuth>
                            <MockProtected />
                        </RequireAuth>
                    } />
                </Routes>
            </MemoryRouter>
        );

        expect(screen.getByText('Página de Login')).toBeInTheDocument();
    });

    /**
     * Verifica que un usuario autenticado y con los permisos adecuados
     * pueda visualizar el contenido de la ruta protegida.
     */
    it('debe renderizar el contenido si está autenticado y tiene permisos', () => {
        (useAuth as any).mockReturnValue({
            loading: false,
            isAuthenticated: true,
            user: { id: 1, role: 'ADMIN' },
            hasPermission: () => true
        });

        render(
            <MemoryRouter>
                <RequireAuth permission="VER_DASHBOARD">
                    <MockProtected />
                </RequireAuth>
            </MemoryRouter>
        );

        expect(screen.getByText('Contenido Protegido')).toBeInTheDocument();
    });

    /**
     * Verifica que si la ruta requiere un permiso específico y el usuario
     * no lo posee, sea redirigido a la página de acceso no autorizado.
     */
    it('debe redirigir a unauthorized si no tiene el permiso requerido', () => {
        (useAuth as any).mockReturnValue({
            loading: false,
            isAuthenticated: true,
            user: { id: 1, role: 'USER' },
            hasPermission: () => false
        });

        render(
            <MemoryRouter initialEntries={['/protected']}>
                <Routes>
                    <Route path="/unauthorized" element={<MockUnauthorized />} />
                    <Route path="/protected" element={
                        <RequireAuth permission="GESTIONAR_USUARIOS">
                            <MockProtected />
                        </RequireAuth>
                    } />
                </Routes>
            </MemoryRouter>
        );

        expect(screen.getByText('No Autorizado')).toBeInTheDocument();
    });

    /**
     * Verifica que si la ruta restringe el acceso por rol y el usuario actual
     * no pertenece a ninguno de los roles permitidos, se le redirija
     * a la página de acceso denegado.
     */
    it('debe redirigir a unauthorized si no tiene el rol permitido', () => {
        (useAuth as any).mockReturnValue({
            loading: false,
            isAuthenticated: true,
            user: { id: 1, role: 'USER' },
            hasPermission: () => true
        });

        render(
            <MemoryRouter initialEntries={['/protected']}>
                <Routes>
                    <Route path="/unauthorized" element={<MockUnauthorized />} />
                    <Route path="/protected" element={
                        <RequireAuth allowedRoles={['ADMIN']}>
                            <MockProtected />
                        </RequireAuth>
                    } />
                </Routes>
            </MemoryRouter>
        );

        expect(screen.getByText('No Autorizado')).toBeInTheDocument();
    });
});
