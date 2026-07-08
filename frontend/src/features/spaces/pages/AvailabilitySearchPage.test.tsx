import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '../../../test/test-utils';
import AvailabilitySearchPage from './AvailabilitySearchPage';

/**
 * @file AvailabilitySearchPage.test.tsx
 * @description Suite de pruebas para la página principal del buscador de disponibilidad de espacios.
 * Valida la vista del formulario, transiciones entre modos de búsqueda y validaciones básicas.
 */
describe('AvailabilitySearchPage', () => {
    beforeEach(() => {
        localStorage.setItem('token', 'mock-token');
        vi.clearAllMocks();
    });

    /**
     * Verifica que el título y los filtros por defecto se muestren al cargar la página.
     */
    it('debe renderizar el título y los filtros iniciales', async () => {
        render(<AvailabilitySearchPage />);
        
        // El título principal es un H4
        expect(await screen.findByRole('heading', { name: /buscador inteligente de espacios/i, level: 4 })).toBeInTheDocument();
        expect(screen.getAllByLabelText(/alumnos \/ asistentes/i).length).toBeGreaterThan(0);
    });

    /**
     * Verifica que si se intenta realizar una búsqueda estricta sin completar
     * el rango horario obligatorio, se muestre un mensaje de error.
     */
    it('debe realizar una búsqueda en modo fijo y mostrar error si faltan campos', async () => {
        render(<AvailabilitySearchPage />);
        
        const searchButton = screen.getByRole('button', { name: /ver propuestas/i });
        
        // Disparar submit directamente sobre el formulario para asegurar ejecución
        fireEvent.submit(searchButton);

        await waitFor(() => {
            expect(screen.getByText(/seleccione un rango horario/i)).toBeInTheDocument();
        });
    });

    /**
     * Verifica que al alternar el modo a "Flexible", los campos de fechas cambien
     * a rangos (días y horas por separado).
     */
    it('debe permitir cambiar a búsqueda flexible y mostrar sus campos', async () => {
        render(<AvailabilitySearchPage />);
        
        const flexibleSwitch = screen.getByLabelText(/flexible/i);
        fireEvent.click(flexibleSwitch);

        await waitFor(() => {
            expect(screen.getAllByLabelText(/día inicio rango/i).length).toBeGreaterThan(0);
            expect(screen.getAllByLabelText(/día fin rango/i).length).toBeGreaterThan(0);
        });
    });

    /**
     * Verifica que el usuario pueda introducir una capacidad mínima 
     * mediante los controles del formulario y esta se refleje.
     */
    it('debe permitir introducir la capacidad mínima', async () => {
        render(<AvailabilitySearchPage />);
        
        const capacityInputs = screen.getAllByLabelText(/alumnos \/ asistentes/i);
        fireEvent.change(capacityInputs[0], { target: { value: '50' } });
        expect(capacityInputs[0]).toHaveValue(50);
    });
});
