import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '../../../test/test-utils';
import ReservationList from './ReservationList';
import { useAuth } from '../../../context/AuthContext';

vi.mock('../../../context/AuthContext', async (importOriginal) => {
    const actual = await importOriginal<typeof import('../../../context/AuthContext')>();
    return {
        ...actual,
        useAuth: vi.fn()
    };
});

/**
 * Suite de pruebas unitarias para la lista de reservas.
 * Verifica que el listado, los filtros y la visualización de
 * detalles funcionen correctamente para usuarios autenticados.
 */
describe('ReservationList', () => {
    beforeEach(() => {
        localStorage.setItem('token', 'mock-token');
        vi.clearAllMocks();
        
        (useAuth as any).mockReturnValue({
            user: { id: 1, email: 'admin@uniovi.es', permissions: ['VER_TODAS_RESERVAS', 'SOLICITAR_RESERVA', 'APROBAR_RESERVA', 'CANCELAR_RESERVA'] },
            isAuthenticated: true,
            loading: false,
            hasPermission: (p: string) => true
        });
    });

    /**
     * Verifica que se renderice el listado base y que el campo
     * de búsqueda permita filtrar los resultados obtenidos.
     */
    it('debe renderizar el título y permitir filtrar', async () => {
        render(<ReservationList />);
        
        expect(await screen.findByText(/gestión de reservas/i)).toBeInTheDocument();
        await screen.findByText('Reserva Test 1');

        const searchInput = screen.getByPlaceholderText(/buscar por título/i);
        fireEvent.change(searchInput, { target: { value: 'Test 1' } });
        
        expect(screen.getByText('Reserva Test 1')).toBeInTheDocument();
    });

    /**
     * Verifica que al presionar el botón de ver detalles en un
     * elemento de la lista, se despliegue el diálogo de información
     * de la reserva.
     */
    it('debe abrir el diálogo de detalles al pulsar ver', async () => {
        render(<ReservationList />);
        
        await screen.findByText('Reserva Test 1');
        
        const viewBtns = await screen.findAllByLabelText(/ver detalles/i);
        fireEvent.click(viewBtns[0]);

        const dialog = await screen.findByTestId('calendar-details-dialog', {}, { timeout: 15000 });
        expect(dialog).toBeInTheDocument();
        
        // Buscar dentro del diálogo para evitar duplicados con la fila de la tabla
        expect(within(dialog).getByText('Reserva Test 1')).toBeInTheDocument();
    }, 20000);
});
