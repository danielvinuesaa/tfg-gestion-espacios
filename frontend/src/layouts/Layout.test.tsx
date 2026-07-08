import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, within } from '../test/test-utils';
import Layout from './Layout';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';

// Mocks de hooks
vi.mock('../context/AuthContext', async (importOriginal) => {
    const actual = await importOriginal<typeof import('../context/AuthContext')>();
    return {
        ...actual,
        useAuth: vi.fn()
    };
});

vi.mock('../context/NotificationContext', async (importOriginal) => {
    const actual = await importOriginal<typeof import('../context/NotificationContext')>();
    return {
        ...actual,
        useNotifications: vi.fn(() => ({
            notifications: [],
            unreadCount: 0,
            fetchNotifications: vi.fn(),
            markAllAsRead: vi.fn()
        }))
    };
});

/**
 * Suite de pruebas para el componente Layout y su sistema de navegación inteligente.
 * Verifica que el menú de navegación se adapte dinámicamente según los roles
 * y permisos del usuario, mostrando, ocultando o aplanando opciones según corresponda.
 */
describe('Layout - Navegación Inteligente', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    /**
     * Verifica que si el usuario tiene permisos para múltiples opciones dentro de una
     * categoría (como un ADMIN), se rendericen menús desplegables (dropdowns) en lugar
     * de botones directos.
     */
    it('debe mostrar menús desplegables cuando hay múltiples opciones (ADMIN)', async () => {
        (useAuth as any).mockReturnValue({
            user: { name: 'Admin', role: 'ADMIN' },
            isAuthenticated: true,
            hasPermission: () => true, // Tiene todos los permisos
            logout: vi.fn()
        });

        render(<Layout>Content</Layout>);

        // Dashboard es siempre un botón
        expect(screen.getByText(/DASHBOARD/i)).toBeInTheDocument();

        // Reservas tiene múltiples opciones -> Debe ser un desplegable (con icono de flecha)
        const resvBtn = screen.getByRole('button', { name: /RESERVAS/i });
        expect(resvBtn).toBeInTheDocument();
        
        // Administración tiene múltiples opciones -> Debe ser un desplegable
        const adminBtn = screen.getByRole('button', { name: /ADMINISTRACIÓN/i });
        expect(adminBtn).toBeInTheDocument();

        // Informes solo tiene una opción (GENERAR_INFORMES) -> Debe ser un botón directo
        expect(screen.getByText(/INFORMES/i)).toBeInTheDocument();
        // Verificamos que no es un botón con flecha (menú)
        const reportsBtn = screen.getByRole('link', { name: /INFORMES/i });
        expect(reportsBtn.querySelector('svg[data-testid="KeyboardArrowDownIcon"]')).toBeFalsy();
    });

    /**
     * Verifica que si el usuario tiene permisos limitados y una categoría contiene
     * una única opción, el menú se aplane promoviendo esa opción a un botón de
     * acceso directo (ej. un PROFESOR que solo puede gestionar espacios).
     */
    it('debe promover a botón directo cuando solo hay una opción (PROFESOR - Solo Espacios)', async () => {
        (useAuth as any).mockReturnValue({
            user: { name: 'Profe', role: 'PROFESOR' },
            isAuthenticated: true,
            hasPermission: (perm: string) => perm === 'LEER_ESPACIOS',
            logout: vi.fn()
        });

        render(<Layout>Content</Layout>);

        // No debe haber botón de Administración (dropdown)
        expect(screen.queryByRole('button', { name: /ADMINISTRACIÓN/i })).toBeFalsy();

        // Debe haber un botón directo de Gestión de Espacios
        const spacesBtn = screen.getByRole('link', { name: /GESTIÓN DE ESPACIOS/i });
        expect(spacesBtn).toBeInTheDocument();
        
        // No debe tener flecha de desplegable
        expect(spacesBtn.querySelector('svg[data-testid="KeyboardArrowDownIcon"]')).toBeFalsy();
    });

    /**
     * Verifica el aplanamiento específico en la sección de Reservas: si el usuario
     * solo puede ver el calendario pero no gestionar reservas, debe ver un botón
     * directo de "CALENDARIO" sin el desplegable superior.
     */
    it('debe promover a botón directo en Reservas si solo hay una opción', async () => {
        (useAuth as any).mockReturnValue({
            user: { name: 'Usuario', role: 'USER' },
            isAuthenticated: true,
            hasPermission: (perm: string) => perm === 'VER_TODAS_RESERVAS', // Solo ver calendario
            logout: vi.fn()
        });

        render(<Layout>Content</Layout>);

        // No debe haber botón de Reservas (dropdown)
        expect(screen.queryByRole('button', { name: /RESERVAS/i })).toBeNull();

        // Debe haber un botón directo de Calendario
        expect(screen.getByText(/CALENDARIO/i)).toBeInTheDocument();
    });

    /**
     * Verifica que si el usuario carece totalmente de permisos para una categoría
     * completa, la sección se oculte completamente del menú de navegación.
     */
    it('debe ocultar secciones si no hay permisos', async () => {
        (useAuth as any).mockReturnValue({
            user: { name: 'Invitado', role: 'GUEST' },
            isAuthenticated: true,
            hasPermission: () => false,
            logout: vi.fn()
        });

        render(<Layout>Content</Layout>);

        expect(screen.getByRole('link', { name: /DASHBOARD/i })).toBeInTheDocument();
        expect(screen.queryByRole('button', { name: /RESERVAS/i })).toBeNull();
        expect(screen.queryByRole('button', { name: /ADMINISTRACIÓN/i })).toBeNull();
        expect(screen.queryByRole('link', { name: /INFORMES/i })).toBeNull();
    });
});
