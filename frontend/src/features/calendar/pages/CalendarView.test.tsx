import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor, fireEvent } from '../../../test/test-utils';
import CalendarView from './CalendarView';

// Mock de react-big-calendar para evitar problemas con layouts y fechas complejas
vi.mock('react-big-calendar', async (importOriginal) => {
    const actual = await importOriginal<typeof import('react-big-calendar')>();
    return {
        ...actual,
        Calendar: (props: any) => (
            <div data-testid="mock-calendar">
                <div data-testid="calendar-view">{props.view}</div>
                <div data-testid="calendar-events">
                    {props.events.map((e: any) => <div key={e.id}>{e.title}</div>)}
                </div>
                <button onClick={() => props.onView('week')}>Change to Week</button>
            </div>
        ),
    };
});

/**
 * Suite de pruebas integradas para la página CalendarView.
 * Verifica la renderización principal del calendario, la carga de eventos,
 * la gestión de vistas y el filtrado mediante la barra lateral.
 */
describe('CalendarView', () => {
    beforeEach(() => {
        localStorage.setItem('token', 'mock-token');
    });

    /**
     * Verifica que el componente principal renderice tanto el calendario
     * como la barra lateral de filtros ("MIS ESPACIOS").
     */
    it('debe renderizar el calendario y la barra lateral', async () => {
        render(<CalendarView />);
        
        expect(await screen.findByTestId('mock-calendar')).toBeInTheDocument();
        expect(screen.getByText(/MIS ESPACIOS/i)).toBeInTheDocument();
    });

    /**
     * Verifica que el calendario muestre los eventos obtenidos desde la API,
     * comprobando que el formato del título de la reserva es correcto.
     */
    it('debe mostrar los eventos cargados de la API', async () => {
        render(<CalendarView />);
        
        await waitFor(() => {
            // El mapeo de título en useCalendarEvents es: `${spaceLabel} - ${res.title || res.user.name}`
            expect(screen.getByText(/Aula 101 - Reserva Test 1/i)).toBeInTheDocument();
            expect(screen.getByText(/Aula 101 - Reserva Aprobada/i)).toBeInTheDocument();
        });
    });

    /**
     * Verifica que el calendario permita cambiar entre las diferentes vistas
     * (por ejemplo, de mes a semana).
     */
    it('debe permitir cambiar de vista', async () => {
        render(<CalendarView />);
        
        const changeViewButton = await screen.findByText('Change to Week');
        fireEvent.click(changeViewButton);

        expect(screen.getByTestId('calendar-view')).toHaveTextContent('week');
    });

    /**
     * Verifica que al interactuar con los filtros de la barra lateral
     * (como desmarcar un espacio), los eventos del calendario se actualicen
     * para reflejar dicho filtro.
     */
    it('debe filtrar eventos por espacio en la barra lateral', async () => {
        render(<CalendarView />);
        
        // Esperar a que carguen los espacios
        const spaceCheckbox = await screen.findByLabelText('Aula 101');
        
        // Desmarcar Aula 101 (están todos marcados por defecto)
        fireEvent.click(spaceCheckbox);

        await waitFor(() => {
            expect(screen.queryByText(/Reserva Test 1/i)).not.toBeInTheDocument();
        });
    });
});
