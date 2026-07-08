import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '../../../test/test-utils';
import SpaceList from './SpaceList';
import { useAuth } from '../../../context/AuthContext';

// Mock useAuth globalmente para este test
vi.mock('../../../context/AuthContext', async (importOriginal) => {
    const actual = await importOriginal<typeof import('../../../context/AuthContext')>();
    return {
        ...actual,
        useAuth: vi.fn()
    };
});

/**
 * @file SpaceList.test.tsx
 * @description Suite de pruebas para el componente de listado de espacios.
 * Comprueba que se rendericen los espacios correctamente y se gestionen las interacciones con la tabla y acciones masivas.
 */
describe('SpaceList', () => {
    beforeEach(() => {
        localStorage.setItem('token', 'mock-token');
        vi.clearAllMocks();
        
        // Mock Auth State
        (useAuth as any).mockReturnValue({
            user: { id: 1, email: 'admin@uniovi.es', permissions: ['VER_ESPACIOS', 'CREAR_ESPACIOS', 'EDITAR_ESPACIOS', 'BORRAR_ESPACIOS'] },
            isAuthenticated: true,
            loading: false,
            hasPermission: (p: string) => true
        });
    });

    /**
     * Verifica que el listado se renderice correctamente, que se muestren
     * las opciones de creación y que sea posible abrir los diálogos de edición correspondientes.
     */
    it('debe renderizar el título y permitir abrir diálogos', async () => {
        render(<SpaceList />);
        
        expect(await screen.findByText(/gestión de espacios/i)).toBeInTheDocument();
        
        // Botón de creación (asegurado por mock de hasPermission)
        const createBtn = await screen.findByRole('button', { name: /nuevo espacio/i });
        expect(createBtn).toBeInTheDocument();
        
        // Esperar a que la tabla cargue datos de MSW
        await screen.findByText('Aula 101');
        
        // Buscar botones de acción por aria-label
        const editBtns = await screen.findAllByLabelText(/editar espacio/i);
        fireEvent.click(editBtns[0]);
        expect(await screen.findByRole('heading', { name: /editar espacio/i, level: 2 })).toBeInTheDocument();
    });

    /**
     * Verifica que al seleccionar múltiples filas (espacios) desde los checkboxes,
     * se muestre un banner de selección masiva en la interfaz.
     */
    it('debe permitir seleccionar filas y mostrar banner masivo', async () => {
        render(<SpaceList />);
        
        await screen.findByText('Aula 101');
        
        // Esperar a que los botones de acción existan (indica que canDelete es true)
        await screen.findAllByLabelText(/eliminar espacio/i);
        
        const checkboxes = screen.getAllByRole('checkbox');
        // El 0 es el switch de eliminados, el 1 es el header, 2+ son filas
        fireEvent.click(checkboxes[2]);
        
        expect(await screen.findByText(/1 espacio seleccionado/i)).toBeInTheDocument();
    });
});
