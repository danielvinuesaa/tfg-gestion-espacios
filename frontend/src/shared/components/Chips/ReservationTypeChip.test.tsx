import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import ReservationTypeChip from './ReservationTypeChip';

/**
 * Suite de pruebas unitarias para la etiqueta de tipo de reserva (ReservationTypeChip).
 * Evalúa las traducciones directas de los enumerados y el mecanismo de respaldo
 * para valores no contemplados en el diccionario de la aplicación.
 */
describe('ReservationTypeChip', () => {
    /**
     * Verifica que la cadena de clasificación constante "CLASE"
     * sea mapeada correctamente a su forma legible.
     */
    it('debe renderizar la etiqueta correcta para CLASE', () => {
        render(<ReservationTypeChip type="CLASE" />);
        expect(screen.getByText('Clase')).toBeInTheDocument();
    });

    /**
     * Verifica que la cadena de clasificación constante "EXAMEN"
     * sea mapeada correctamente a su forma legible.
     */
    it('debe renderizar la etiqueta correcta para EXAMEN', () => {
        render(<ReservationTypeChip type="EXAMEN" />);
        expect(screen.getByText('Examen')).toBeInTheDocument();
    });

    /**
     * Verifica que al proporcionar un valor anómalo no mapeado,
     * el componente no falle y lo muestre tal y como se recibió.
     */
    it('debe renderizar el tipo original si no se reconoce', () => {
        render(<ReservationTypeChip type="REUNION" />);
        expect(screen.getByText('REUNION')).toBeInTheDocument();
    });
});
