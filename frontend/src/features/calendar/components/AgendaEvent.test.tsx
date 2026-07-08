import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import AgendaEvent from './AgendaEvent';

/**
 * Suite de pruebas unitarias para el componente AgendaEvent.
 * Verifica la correcta visualización de la información de un evento en la vista de agenda.
 */
describe('AgendaEvent', () => {
    const mockEvent = {
        resource: {
            type: 'CLASE',
            status: 'APROBADA'
        }
    };

    /**
     * Verifica que el componente muestre correctamente el título proporcionado
     * y el tipo de evento derivado de sus recursos.
     */
    it('debe renderizar el título y el tipo', () => {
        render(<AgendaEvent event={mockEvent as any} title="Mi Clase" />);
        
        expect(screen.getByText('Mi Clase')).toBeInTheDocument();
        expect(screen.getByText('CLASE')).toBeInTheDocument();
    });

    /**
     * Verifica que si el evento tiene estado de BLOQUEO, se muestre dicho estado
     * explícitamente en lugar del tipo de evento normal.
     */
    it('debe mostrar BLOQUEO si el estado es bloqueo', () => {
        const blockEvent = {
            resource: {
                type: 'OTROS',
                status: 'BLOQUEO'
            }
        };
        render(<AgendaEvent event={blockEvent as any} title="Mantenimiento" />);
        
        expect(screen.getByText('Mantenimiento')).toBeInTheDocument();
        expect(screen.getByText('BLOQUEO')).toBeInTheDocument();
    });
});
