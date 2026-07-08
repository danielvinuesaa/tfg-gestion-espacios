import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import BulkDeleteConflictDialog from './BulkDeleteConflictDialog';

/**
 * Suite de pruebas unitarias para el componente BulkDeleteConflictDialog.
 * Verifica la visualización de mensajes y listas de conflictos cuando se intenta
 * eliminar elementos en lote, así como las interacciones del usuario y los estados de carga.
 */
describe('BulkDeleteConflictDialog', () => {
    const mockOnConfirm = vi.fn();
    const mockOnClose = vi.fn();

    const summaryNoConflicts = {
        totalTarget: 5,
        cleanCount: 5,
        conflictCount: 0,
        totalImpactedItems: 0,
        itemsWithConflicts: []
    };

    const summaryWithConflicts = {
        totalTarget: 10,
        cleanCount: 8,
        conflictCount: 2,
        totalImpactedItems: 15,
        itemsWithConflicts: [
            { id: 1, name: 'Aula 101', impactCount: 10 },
            { id: 2, name: 'Aula 102', impactCount: 5 }
        ]
    };

    const defaultConfig = {
        open: true,
        onClose: mockOnClose,
        onConfirm: mockOnConfirm,
        loading: false,
        title: '¿Eliminar Lote?',
        resourceNameSingular: 'espacio',
        resourceNamePlural: 'espacios',
        impactTypeLabel: 'reservas activas'
    };

    /**
     * Verifica que si el resumen no reporta conflictos, se muestra un mensaje
     * de éxito o informativo sin la lista de elementos afectados.
     */
    it('debe renderizar mensaje de éxito si no hay conflictos', () => {
        render(<BulkDeleteConflictDialog {...defaultConfig} summary={summaryNoConflicts} />);
        
        expect(screen.getByText(/has seleccionado/i)).toBeInTheDocument();
        expect(screen.getAllByText(/5/).length).toBeGreaterThan(0);
        expect(screen.getAllByText(/espacios/).length).toBeGreaterThan(0);
        expect(screen.getByText(/conflictos/i)).toBeInTheDocument();
    });

    /**
     * Verifica que cuando existen conflictos en el resumen, se muestran
     * los avisos correspondientes y el usuario puede abrir un acordeón para
     * inspeccionar los elementos concretos afectados.
     */
    it('debe renderizar aviso de conflictos y lista desplegable', () => {
        render(<BulkDeleteConflictDialog {...defaultConfig} summary={summaryWithConflicts} />);
        
        expect(screen.getByText(/has seleccionado/i)).toBeInTheDocument();
        expect(screen.getAllByText(/10/).length).toBeGreaterThan(0);
        
        expect(screen.getAllByText(/detectado/i).length).toBeGreaterThan(0);
        expect(screen.getAllByText(/2/).length).toBeGreaterThan(0);
        expect(screen.getAllByText(/15/).length).toBeGreaterThan(0);
        
        // El acordeón
        const accordion = screen.getByText(/elementos afectados/i);
        expect(accordion).toBeInTheDocument();
        fireEvent.click(accordion);
        
        expect(screen.getByText('Aula 101')).toBeInTheDocument();
        expect(screen.getByText('Aula 102')).toBeInTheDocument();
    });

    /**
     * Verifica que se ejecuta la función `onConfirm` proporcionada al hacer clic
     * en el botón de confirmación de borrado.
     */
    it('debe llamar a onConfirm al pulsar borrar', () => {
        render(<BulkDeleteConflictDialog {...defaultConfig} summary={summaryNoConflicts} />);
        
        fireEvent.click(screen.getByRole('button', { name: /confirmar/i }));
        expect(mockOnConfirm).toHaveBeenCalled();
    });

    /**
     * Verifica que se muestra un indicador o mensaje de carga al inicio, cuando
     * el estado `loading` es verdadero y todavía no hay un resumen de conflictos disponible.
     */
    it('debe mostrar estado de carga inicial', () => {
        render(<BulkDeleteConflictDialog {...defaultConfig} summary={null} loading={true} />);
        
        expect(screen.getByText(/analizando impacto/i)).toBeInTheDocument();
    });
});
