import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '../../../../test/test-utils';
import ReportsPage from './ReportsPage';

/**
 * @file ReportsPage.test.tsx
 * @description Suite de pruebas para la página principal de informes.
 * Comprueba la integración de componentes, títulos y opciones de interacción principales de los reportes.
 */
describe('ReportsPage', () => {
    beforeEach(() => {
        localStorage.setItem('token', 'mock-token');
    });

    /**
     * Verifica que la página cargue adecuadamente y muestre el título y la descripción
     * principal del centro de informes.
     */
    it('debe renderizar el título y las opciones de reportes', async () => {
        render(<ReportsPage />);
        
        expect(await screen.findByText('Centro de Informes')).toBeInTheDocument();
        expect(screen.getByText(/generación profesional de reportes/i)).toBeInTheDocument();
    });

    /**
     * Verifica que al pulsar en una tarjeta de tipo de informe, se actualice
     * la cabecera correspondiente con el título del nuevo informe activo.
     */
    it('debe permitir cambiar el tipo de informe pulsando en las tarjetas', async () => {
        render(<ReportsPage />);
        
        // El texto aparece en la tarjeta (subtitle1) y en el header (h6)
        // Inicialmente el tipo activo es SIGNATURES por lo que ya hay un "Parte de Firmas"
        
        const occupancyCard = await screen.findByText(/estadísticas de ocupación/i);
        fireEvent.click(occupancyCard);

        // Verificamos que se actualiza el título del panel derecho (ahora hay 2 ocurrencias)
        const headers = await screen.findAllByText('Estadísticas de Ocupación');
        expect(headers.length).toBeGreaterThan(1);
    });

    /**
     * Verifica que si no se ha configurado al menos un espacio/asignatura requerida,
     * el botón para generar informe permanezca deshabilitado por defecto.
     */
    it('debe tener el botón de generar inicialmente deshabilitado', async () => {
        render(<ReportsPage />);
        
        const generateButton = await screen.findByRole('button', { name: /ver vista previa/i });
        expect(generateButton).toBeDisabled();
    });
});
