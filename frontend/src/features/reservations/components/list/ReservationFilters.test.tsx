import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '../../../../test/test-utils';
import ReservationFilters from './ReservationFilters';

/**
 * Suite de pruebas unitarias para el componente `ReservationFilters`.
 * Verifica el renderizado correcto de la barra de filtros de reservas,
 * las interacciones en el campo de búsqueda rápida y el despliegue de los
 * filtros avanzados (búsqueda por asignaturas, espacios, etc.).
 */
describe('ReservationFilters', () => {
    const mockFilterChange = vi.fn();
    const mockClearFilters = vi.fn();
    const mockSetAdvanced = vi.fn();
    const mockSetPage = vi.fn();

    const defaultProps = {
        filters: { search: '', status: 'TODOS', type: 'TODOS', startDate: null, endDate: null },
        onFilterChange: mockFilterChange,
        onClearFilters: mockClearFilters,
        allSpaces: [],
        allUsers: [],
        allSubjects: [],
        isManagerMode: false,
        advancedOpen: false,
        setAdvancedOpen: mockSetAdvanced,
        minuteStep: 15,
        startHour: 8,
        setPage: mockSetPage
    };

    beforeEach(() => {
        vi.clearAllMocks();
    });

    /**
     * Verifica que el componente inicialice mostrando el input de búsqueda rápida
     * y el botón para acceder a las opciones de filtrado adicional.
     */
    it('debe renderizar la barra de búsqueda y el botón de más filtros', () => {
        render(<ReservationFilters {...defaultProps} />);
        
        expect(screen.getByPlaceholderText(/buscar por título o responsable/i)).toBeInTheDocument();
        expect(screen.getByText(/más filtros/i)).toBeInTheDocument();
    });

    /**
     * Verifica que al teclear texto en la barra de búsqueda rápida
     * se invoque la función `onFilterChange` con el texto escrito
     * y se restablezca la paginación a la primera página.
     */
    it('debe llamar a onFilterChange al escribir en la búsqueda', () => {
        render(<ReservationFilters {...defaultProps} />);
        
        const input = screen.getByPlaceholderText(/buscar por título o responsable/i);
        fireEvent.change(input, { target: { value: 'clase' } });
        
        expect(mockFilterChange).toHaveBeenCalledWith({ search: 'clase' });
        expect(mockSetPage).toHaveBeenCalledWith(0);
    });

    /**
     * Verifica que al hacer clic en el botón "Más filtros", se solicite la apertura
     * del panel con opciones de búsqueda avanzada.
     */
    it('debe llamar a setAdvancedOpen al pulsar el botón', () => {
        render(<ReservationFilters {...defaultProps} />);
        
        const btn = screen.getByText(/más filtros/i);
        fireEvent.click(btn);
        
        expect(mockSetAdvanced).toHaveBeenCalledWith(true);
    });

    /**
     * Verifica que si la propiedad `advancedOpen` es verdadera, los campos
     * del formulario avanzado (como selección de asignaturas o espacios)
     * sean visibles en la interfaz, y el botón se actualice a "Ocultar filtros".
     */
    it('debe mostrar filtros avanzados si advancedOpen es true', () => {
        render(<ReservationFilters {...defaultProps} advancedOpen={true} />);
        
        expect(screen.getByText(/ocultar filtros/i)).toBeInTheDocument();
        // Usar getAllByLabelText para manejar la multiplicidad de MUI
        expect(screen.getAllByLabelText(/asignaturas/i).length).toBeGreaterThan(0);
        expect(screen.getAllByLabelText(/espacios/i).length).toBeGreaterThan(0);
    });
});
