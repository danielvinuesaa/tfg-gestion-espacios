import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import EventTooltip from './EventTooltip';

/**
 * Suite de pruebas unitarias para el componente EventTooltip.
 * Verifica que el tooltip se muestre con la información correcta del evento
 * (título, responsable, espacio, duración) al interactuar con el elemento.
 */
describe('EventTooltip', () => {
    const mockEvent = {
        title: 'Examen IA',
        start: new Date(2026, 4, 25, 10),
        end: new Date(2026, 4, 25, 12),
        resource: {
            user: { name: 'Dr. Turing' },
            spaces: [{ name: 'Aula 101' }],
            status: 'APROBADA'
        }
    };

    /**
     * Verifica que al pasar el ratón sobre el elemento desencadenador,
     * el tooltip se haga visible mostrando los detalles formateados del evento.
     */
    it('debe mostrar el contenido detallado al pasar el ratón', async () => {
        render(
            <EventTooltip event={mockEvent as any}>
                <span>Trigger</span>
            </EventTooltip>
        );

        const trigger = screen.getByText('Trigger');
        fireEvent.mouseEnter(trigger);

        // Tooltip tiene un enterDelay de 500ms, debemos esperar
        expect(await screen.findByText('Examen IA')).toBeInTheDocument();
        expect(screen.getByText('Dr. Turing')).toBeInTheDocument();
        expect(screen.getByText('Aula 101')).toBeInTheDocument();
        expect(screen.getByText(/2h/)).toBeInTheDocument();
    });
});
