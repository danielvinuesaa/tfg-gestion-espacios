import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';
import { AuthProvider, useAuth } from './AuthContext';
import { server } from '../test/mocks/server';
import { http, HttpResponse } from 'msw';

const TestComponent = () => {
    const { user, isAuthenticated, login, logout, hasPermission } = useAuth();
    return (
        <div>
            <div data-testid="auth-status">{isAuthenticated ? 'Authenticated' : 'Not Authenticated'}</div>
            <div data-testid="user-name">{user?.name || 'No User'}</div>
            <div data-testid="permission">{hasPermission('TEST_PERM') ? 'Has Perm' : 'No Perm'}</div>
            <button onClick={() => login('new-token')}>Login</button>
            <button onClick={logout}>Logout</button>
        </div>
    );
};

/**
 * Suite de pruebas unitarias para el contexto de autenticación (AuthContext).
 * Verifica la inicialización del estado, los flujos de inicio y cierre de sesión,
 * así como la comprobación de permisos de usuario.
 */
describe('AuthContext', () => {
    beforeEach(() => {
        localStorage.clear();
        server.use(
            http.get('/api/users/me', () => {
                return HttpResponse.json({
                    id: 1,
                    name: 'John Doe',
                    permissions: ['TEST_PERM'],
                    managedSubjectIds: []
                });
            })
        );
    });

    /**
     * Verifica que el estado inicial refleje correctamente que no hay
     * un usuario autenticado cuando el token no está presente en el almacenamiento local.
     */
    it('debe iniciar como no autenticado si no hay token', () => {
        render(
            <AuthProvider>
                <TestComponent />
            </AuthProvider>
        );
        expect(screen.getByTestId('auth-status')).toHaveTextContent('Not Authenticated');
    });

    /**
     * Verifica que el proceso de inicio de sesión actualice el estado a autenticado,
     * guarde el token en el almacenamiento local y cargue correctamente el perfil del usuario.
     */
    it('debe cargar el perfil de usuario al hacer login', async () => {
        render(
            <AuthProvider>
                <TestComponent />
            </AuthProvider>
        );

        act(() => {
            screen.getByText('Login').click();
        });

        await waitFor(() => {
            expect(screen.getByTestId('auth-status')).toHaveTextContent('Authenticated');
            expect(screen.getByTestId('user-name')).toHaveTextContent('John Doe');
        });
        
        expect(localStorage.getItem('token')).toBe('new-token');
    });

    /**
     * Verifica que el proceso de cierre de sesión limpie el estado de autenticación,
     * elimine el token del almacenamiento local y quite los datos del usuario.
     */
    it('debe limpiar datos al hacer logout', async () => {
        localStorage.setItem('token', 'old-token');
        render(
            <AuthProvider>
                <TestComponent />
            </AuthProvider>
        );

        await waitFor(() => {
            expect(screen.getByTestId('auth-status')).toHaveTextContent('Authenticated');
        });

        act(() => {
            screen.getByText('Logout').click();
        });

        expect(screen.getByTestId('auth-status')).toHaveTextContent('Not Authenticated');
        expect(screen.getByTestId('user-name')).toHaveTextContent('No User');
        expect(localStorage.getItem('token')).toBeNull();
    });

    /**
     * Verifica que el método para comprobar permisos funcione correctamente
     * de acuerdo con los permisos asignados en el perfil del usuario autenticado.
     */
    it('debe verificar permisos correctamente', async () => {
        localStorage.setItem('token', 'valid-token');
        render(
            <AuthProvider>
                <TestComponent />
            </AuthProvider>
        );

        await waitFor(() => {
            expect(screen.getByTestId('permission')).toHaveTextContent('Has Perm');
        });
    });
});
