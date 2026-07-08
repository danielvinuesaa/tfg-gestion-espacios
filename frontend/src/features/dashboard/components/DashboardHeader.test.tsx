import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '../../../test/test-utils';
import DashboardHeader from './DashboardHeader';

/**
 * Suite de pruebas unitarias para el componente DashboardHeader.
 * Verifica la correcta visualización de los selectores de fecha
 * con los valores proporcionados.
 */
describe('DashboardHeader', () => {
    const mockOnChange = vi.fn();
    const dateRange = { start: '2026-05-01', end: '2026-05-31' };

    /**
     * Verifica que el componente renderice los selectores de fecha (pickers)
     * e incluya las etiquetas y valores iniciales configurados.
     */
    it('debe renderizar los pickers de fecha con los valores iniciales', () => {
        render(<DashboardHeader dateRange={dateRange} onDateRangeChange={mockOnChange} />);
        
        // Verificamos presencia de textos que MUI renderiza para las etiquetas
        expect(screen.getAllByText(/desde/i).length).toBeGreaterThan(0);
        expect(screen.getAllByText(/hasta/i).length).toBeGreaterThan(0);
    });

    /**
     * Verifica que los campos de entrada de los selectores muestren
     * las fechas correctamente formateadas en función del locale.
     */
    it('debe contener los inputs con las fechas formateadas', () => {
        render(<DashboardHeader dateRange={dateRange} onDateRangeChange={mockOnChange} />);
        
        // El valor se muestra en el input. 2026-05-01 -> 01/05/2026 en el locale por defecto
        expect(screen.getByDisplayValue('01/05/2026')).toBeInTheDocument();
        expect(screen.getByDisplayValue('31/05/2026')).toBeInTheDocument();
    });
});
