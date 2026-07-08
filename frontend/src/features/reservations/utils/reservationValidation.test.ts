import { describe, it, expect, vi } from 'vitest';
import { reservationValidation } from './reservationValidation';
import { addDays, subDays } from 'date-fns';

/**
 * Suite de pruebas para las utilidades de validación de reservas.
 * Comprueba las validaciones sobre rangos temporales, asignación de espacios,
 * y los metadatos requeridos (como título o descripción).
 */
describe('reservationValidation', () => {
    /**
     * Sub-suite para la validación del rango temporal de una reserva.
     */
    describe('validateTemporalRange', () => {
        /**
         * Verifica que la validación falle si no se proporcionan ambas fechas (inicio y fin).
         */
        it('debe invalidar si faltan fechas', () => {
            const result = reservationValidation.validateTemporalRange({ startTime: null, endTime: null } as any, false);
            expect(result.isValid).toBe(false);
            expect(result.error).toContain('obligatorias');
        });

        /**
         * Verifica que la validación falle si la fecha de fin es anterior o igual a la de inicio.
         */
        it('debe invalidar si fin <= inicio', () => {
            const start = new Date(2026, 5, 25, 10, 0);
            const end = new Date(2026, 5, 25, 9, 0);
            const result = reservationValidation.validateTemporalRange({ startTime: start, endTime: end } as any, false);
            expect(result.isValid).toBe(false);
            expect(result.error).toContain('posterior');
        });

        /**
         * Verifica que al crear una reserva nueva, no se permitan fechas en el pasado.
         */
        it('debe invalidar fechas pasadas en creación', () => {
            const pastStart = subDays(new Date(), 1);
            const pastEnd = new Date(pastStart);
            pastEnd.setHours(pastStart.getHours() + 1);
            
            const result = reservationValidation.validateTemporalRange({ startTime: pastStart, endTime: pastEnd } as any, false);
            expect(result.isValid).toBe(false);
            expect(result.error).toContain('pasada');
        });

        /**
         * Verifica que se apruebe un rango de fechas válido ubicado en el futuro.
         */
        it('debe validar correctamente rangos futuros', () => {
            const futureStart = addDays(new Date(), 1);
            const futureEnd = new Date(futureStart);
            futureEnd.setHours(futureStart.getHours() + 1);
            
            const result = reservationValidation.validateTemporalRange({ startTime: futureStart, endTime: futureEnd } as any, false);
            expect(result.isValid).toBe(true);
        });
    });

    /**
     * Sub-suite para la validación de la asignación de recursos/espacios a una reserva.
     */
    describe('validateResources', () => {
        /**
         * Verifica que no se pueda realizar una reserva sin al menos un espacio asignado.
         */
        it('debe invalidar si no hay espacios', () => {
            expect(reservationValidation.validateResources([]).isValid).toBe(false);
        });
        /**
         * Verifica que la reserva se valide correctamente si tiene al menos un espacio.
         */
        it('debe validar si hay al menos uno', () => {
            expect(reservationValidation.validateResources([1]).isValid).toBe(true);
        });
    });

    /**
     * Sub-suite para la validación de la información de metadatos asociada a la reserva.
     */
    describe('validateMetadata', () => {
        /**
         * Verifica que los bloqueos de espacio sean válidos siempre y cuando
         * incluyan una descripción lo suficientemente detallada.
         */
        it('debe validar bloqueos con descripción larga', () => {
            const values = { isBlock: true, description: 'Mantenimiento preventivo' };
            expect(reservationValidation.validateMetadata(values as any).isValid).toBe(true);
        });

        /**
         * Verifica que la validación rechace bloqueos con una descripción
         * demasiado breve o genérica.
         */
        it('debe invalidar bloqueos con descripción corta', () => {
            const values = { isBlock: true, description: 'Fix' };
            expect(reservationValidation.validateMetadata(values as any).isValid).toBe(false);
        });

        /**
         * Verifica que las reservas ordinarias proporcionen como mínimo
         * un título y especifiquen el tipo de reserva.
         */
        it('debe validar reservas con título y tipo', () => {
            const values = { isBlock: false, title: 'Examen de Redes', type: 'EXAMEN' };
            expect(reservationValidation.validateMetadata(values as any).isValid).toBe(true);
        });
    });
});
