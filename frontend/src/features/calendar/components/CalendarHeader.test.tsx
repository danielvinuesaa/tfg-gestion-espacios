import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '../../../test/test-utils';
import CalendarHeader from './CalendarHeader';

// Mock de DateCalendar
vi.mock('@mui/x-date-pickers/DateCalendar', () => ({
    DateCalendar: ({ onChange }: any) => (
        <div data-testid="mock-datepicker">
            <button onClick={() => onChange(new Date(2026, 0, 1))}>Select Date</button>
        </div>
    )
}));

/**
 * Suite de pruebas para el componente CalendarHeader.
 * Verifica la navegación, cambio de vistas, selección de fechas y 
 * la interacción con el panel lateral de filtros.
 */
describe('CalendarHeader', () => {
    const mockOnNavigate = vi.fn();
    const mockOnView = vi.fn();
    const mockOnToggleSidebar = vi.fn();

    const defaultProps = {
        date: new Date(2026, 4, 25), // Mayo 2026
        label: 'Mayo 2026',
        onNavigate: mockOnNavigate,
        onView: mockOnView,
        view: 'month',
        onToggleSidebar: mockOnToggleSidebar
    };

    beforeEach(() => {
        vi.clearAllMocks();
    });

    /**
     * Verifica que se renderice correctamente la etiqueta con el mes/año actual
     * y el botón para volver a la fecha de hoy.
     */
    it('debe renderizar el label y el botón Hoy', () => {
        render(<CalendarHeader {...defaultProps} />);
        
        expect(screen.getByText('Mayo 2026')).toBeInTheDocument();
        expect(screen.getByText('Hoy')).toBeInTheDocument();
    });

    /**
     * Verifica que los controles de navegación (Anterior, Siguiente, Hoy)
     * disparen las acciones correspondientes al ser pulsados.
     */
    it('debe navegar al pulsar Anterior/Siguiente/Hoy', () => {
        render(<CalendarHeader {...defaultProps} />);
        
        fireEvent.click(screen.getByLabelText(/anterior/i));
        expect(mockOnNavigate).toHaveBeenCalledWith('PREV');

        fireEvent.click(screen.getByLabelText(/siguiente/i));
        expect(mockOnNavigate).toHaveBeenCalledWith('NEXT');

        fireEvent.click(screen.getByText('Hoy'));
        expect(mockOnNavigate).toHaveBeenCalledWith('TODAY');
    });

    /**
     * Verifica que el usuario pueda cambiar la vista del calendario (Mes, Semana, etc.)
     * mediante el menú desplegable.
     */
    it('debe permitir cambiar de vista usando el menú', async () => {
        render(<CalendarHeader {...defaultProps} />);
        
        const viewButton = screen.getByText('Mes');
        fireEvent.click(viewButton);

        const weekOption = await screen.findByText('Semana');
        fireEvent.click(weekOption);

        expect(mockOnView).toHaveBeenCalledWith('week');
    });

    /**
     * Verifica que al pulsar sobre la etiqueta de la fecha se abra un selector
     * y que al elegir una fecha se navegue correctamente hacia ella.
     */
    it('debe abrir el selector de fecha al pulsar el label', async () => {
        render(<CalendarHeader {...defaultProps} />);
        
        fireEvent.click(screen.getByText('Mayo 2026'));
        
        expect(await screen.findByTestId('mock-datepicker')).toBeInTheDocument();
        
        fireEvent.click(screen.getByText('Select Date'));
        expect(mockOnNavigate).toHaveBeenCalledWith('DATE', expect.any(Date));
    });

    /**
     * Verifica que al pulsar el botón del menú lateral se dispare la acción
     * para mostrar u ocultar el panel de filtros.
     */
    it('debe llamar a onToggleSidebar al pulsar el icono de menú', () => {
        render(<CalendarHeader {...defaultProps} />);
        
        fireEvent.click(screen.getByLabelText(/panel de filtros/i));
        expect(mockOnToggleSidebar).toHaveBeenCalled();
    });
});
