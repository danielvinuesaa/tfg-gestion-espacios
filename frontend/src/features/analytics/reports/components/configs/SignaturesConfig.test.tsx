import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '../../../../../test/test-utils';
import SignaturesConfig from './SignaturesConfig';

/**
 * @file SignaturesConfig.test.tsx
 * @description Suite de pruebas para el componente de configuración de informes de firmas.
 * Comprueba el renderizado del selector de semanas y la selección de espacios.
 */
describe('SignaturesConfig', () => {
    const mockOnWeekChange = vi.fn();
    const mockOnSpacesChange = vi.fn();

    const availableSpaces = [
        { id: 1, name: 'Aula 101', type: 'AULA' },
        { id: 2, name: 'Aula 102', type: 'AULA' },
        { id: 3, name: 'Lab 1', type: 'LABORATORIO' }
    ];

    const defaultProps = {
        week: new Date(2026, 4, 25), // Lunes 25 Mayo 2026
        onWeekChange: mockOnWeekChange,
        selectedSpaceIds: [],
        onSpacesChange: mockOnSpacesChange,
        availableSpaces
    };

    /**
     * Verifica que se muestre correctamente el selector de semanas y el
     * campo de autocompletado para seleccionar los espacios.
     */
    it('debe renderizar el picker de semana y el selector de espacios', () => {
        render(<SignaturesConfig {...defaultProps} />);
        
        expect(screen.getAllByText(/semana del/i).length).toBeGreaterThan(0);
        expect(screen.getByLabelText(/seleccionar espacios/i)).toBeInTheDocument();
        expect(screen.getByText(/25\/05 al 31\/05\/2026/i)).toBeInTheDocument();
    });

    /**
     * Verifica que la funcionalidad de seleccionar todo un grupo de espacios
     * desde el menú desplegable notifique al componente padre correctamente.
     */
    it('debe permitir seleccionar un grupo completo de espacios', async () => {
        render(<SignaturesConfig {...defaultProps} />);
        
        const autocomplete = screen.getByLabelText(/seleccionar espacios/i);
        fireEvent.mouseDown(autocomplete);
        
        const selectGroupBtns = await screen.findAllByText('SELECCIONAR TODO');
        fireEvent.click(selectGroupBtns[0]);
        
        expect(mockOnSpacesChange).toHaveBeenCalled();
    });

    /**
     * Verifica que al pulsar el texto "Seleccionar todos los espacios",
     * se envíen al componente padre los IDs de todos los espacios disponibles.
     */
    it('debe permitir seleccionar todos los espacios globalmente', () => {
        render(<SignaturesConfig {...defaultProps} />);
        
        const selectAllText = screen.getByText(/seleccionar todos los espacios/i);
        fireEvent.click(selectAllText);
        
        expect(mockOnSpacesChange).toHaveBeenCalledWith([1, 2, 3]);
    });
});
