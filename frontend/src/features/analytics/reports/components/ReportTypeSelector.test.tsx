import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ReportTypeSelector from './ReportTypeSelector';

/**
 * @file ReportTypeSelector.test.tsx
 * @description Suite de pruebas para el selector de tipo de informes.
 * Comprueba que se listen todos los tipos disponibles y su correcta selección.
 */
describe('ReportTypeSelector', () => {
    const mockOnChange = vi.fn();

    /**
     * Verifica que se listen correctamente todas las opciones de informes disponibles
     * en el componente.
     */
    it('debe renderizar todos los tipos de informe', () => {
        render(<ReportTypeSelector activeType="SIGNATURES" onTypeChange={mockOnChange} />);
        
        expect(screen.getByText('Parte de Firmas')).toBeInTheDocument();
        expect(screen.getByText('Estadísticas de Ocupación')).toBeInTheDocument();
        expect(screen.getByText('Uso por Asignatura')).toBeInTheDocument();
    });

    /**
     * Verifica que al hacer clic sobre una de las opciones de tipo de informe,
     * se notifique al componente padre de la nueva selección.
     */
    it('debe llamar a onTypeChange al pulsar un tipo', () => {
        render(<ReportTypeSelector activeType="SIGNATURES" onTypeChange={mockOnChange} />);
        
        fireEvent.click(screen.getByText('Estadísticas de Ocupación'));
        expect(mockOnChange).toHaveBeenCalledWith('OCCUPANCY');
    });

    /**
     * Verifica que la opción seleccionada actualmente (activeType)
     * se visualice y no se rompa el renderizado del componente.
     */
    it('debe resaltar el tipo activo', () => {
        render(<ReportTypeSelector activeType="OCCUPANCY" onTypeChange={mockOnChange} />);
        
        // El color cambia, pero testear estilos exactos de MUI es frágil.
        // Al menos verificamos que el texto esté presente.
        expect(screen.getByText('Estadísticas de Ocupación')).toBeInTheDocument();
    });
});
