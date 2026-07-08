import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import ReservationStatusChip from './ReservationStatusChip';

/**
 * Suite de pruebas unitarias para la etiqueta de estado de reserva (ReservationStatusChip).
 * Evalúa las traducciones de los estados del ciclo de vida y el mecanismo de respaldo
 * para valores no contemplados.
 */
describe('ReservationStatusChip', () => {
    /**
     * Verifica que el estado de confirmación "APROBADA"
     * se traduzca correctamente a su visualización capitalizada.
     */
    it('debe renderizar la etiqueta correcta para APROBADA', () => {
        render(<ReservationStatusChip status="APROBADA" />);
        expect(screen.getByText('Aprobada')).toBeInTheDocument();
    });

    /**
     * Verifica que el estado transitorio "SOLICITADA"
     * se traduzca semánticamente a "Pendiente" para el usuario final.
     */
    it('debe renderizar la etiqueta correcta para SOLICITADA', () => {
        render(<ReservationStatusChip status="SOLICITADA" />);
        expect(screen.getByText('Pendiente')).toBeInTheDocument();
    });

    /**
     * Verifica que si se introduce un estado no definido en la tabla de mapeos,
     * el componente renderice el valor original de forma directa.
     */
    it('debe renderizar el estado original si no se reconoce', () => {
        render(<ReservationStatusChip status="DESCONOCIDO" />);
        expect(screen.getByText('DESCONOCIDO')).toBeInTheDocument();
    });
});
