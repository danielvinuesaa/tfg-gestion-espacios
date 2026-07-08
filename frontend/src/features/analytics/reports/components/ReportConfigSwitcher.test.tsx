import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '../../../../test/test-utils';
import ReportConfigSwitcher from './ReportConfigSwitcher';

/**
 * @file ReportConfigSwitcher.test.tsx
 * @description Suite de pruebas para el conmutador de configuraciones de informes.
 * Verifica que el componente cambie y renderice la configuración adecuada según el tipo de informe.
 */
describe('ReportConfigSwitcher', () => {
    const mockUpdateFilter = vi.fn();
    const defaultProps = {
        reportType: 'SIGNATURES' as const,
        label: 'Configuración: Firmas',
        filters: { spaceIds: [], week: new Date() },
        updateFilter: mockUpdateFilter,
        spaces: [
            { id: 1, name: 'Aula 101', type: 'AULA' },
            { id: 2, name: 'Aula 102', type: 'AULA' }
        ],
        subjects: [
            { id: 101, code: 'SUB1', name: 'Asignatura 1', course: '1' }
        ]
    };

    /**
     * Verifica que al seleccionar el tipo 'SIGNATURES', se muestre la configuración
     * de firmas y se permita la selección de los espacios deseados.
     */
    it('debe renderizar el config de firmas y permitir seleccionar espacios', async () => {
        render(<ReportConfigSwitcher {...defaultProps} />);
        
        expect(screen.getByText('Configuración: Firmas')).toBeInTheDocument();
        
        // El Autocomplete de MUI para espacios tiene label "Seleccionar Espacios"
        const autocomplete = screen.getByLabelText(/seleccionar espacios/i);
        fireEvent.mouseDown(autocomplete);
        
        const option = await screen.findByText('Aula 101');
        fireEvent.click(option);

        expect(mockUpdateFilter).toHaveBeenCalled();
    });

    /**
     * Verifica que al cambiar el tipo a 'SUBJECT_USAGE', el componente renderice
     * el panel correspondiente y permita seleccionar las asignaturas.
     */
    it('debe cambiar al config de uso de asignaturas y permitir seleccionar asignaturas', async () => {
        render(
            <ReportConfigSwitcher 
                {...defaultProps} 
                reportType="SUBJECT_USAGE" 
                label="Uso de Asignaturas"
                filters={{ subjectIds: [], reservationTypes: [], startDate: null, endDate: null }}
            />
        );

        expect(screen.getByText('Uso de Asignaturas')).toBeInTheDocument();
        
        // SubjectUsageConfig usa placeholder "Añadir asignatura..."
        const autocomplete = screen.getByPlaceholderText(/añadir asignatura/i);
        fireEvent.mouseDown(autocomplete);
        
        // getOptionLabel devuelve "[code] name"
        const option = await screen.findByText(/Asignatura 1/i);
        fireEvent.click(option);

        expect(mockUpdateFilter).toHaveBeenCalled();
    });

    /**
     * Verifica que el tipo 'OCCUPANCY' renderice correctamente su configuración,
     * mostrando la descripción esperada sobre el análisis del espacio.
     */
    it('debe renderizar el config de ocupación', () => {
        render(
            <ReportConfigSwitcher 
                {...defaultProps} 
                reportType="OCCUPANCY" 
                label="Ocupación"
                filters={{ spaceIds: [], startDate: null, endDate: null }} 
            />
        );

        expect(screen.getByText('Ocupación')).toBeInTheDocument();
        expect(screen.getByText(/este informe analiza/i)).toBeInTheDocument();
    });
});
