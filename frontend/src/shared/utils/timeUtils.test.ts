import { describe, it, expect } from 'vitest';
import { isTimeDisabled, adjustTimeToStartHour } from './timeUtils';

/**
 * Suite de pruebas unitarias para las utilidades de manejo de rangos de tiempo (timeUtils).
 * Asegura que se detecten de forma correcta los períodos de disponibilidad
 * y se apliquen los ajustes horarios sobre las fechas base.
 */
describe('timeUtils', () => {
    describe('isTimeDisabled', () => {
        /**
         * Verifica que una hora que caiga explícitamente dentro del período activo
         * no se considere inhabilitada.
         */
        it('debe permitir horas dentro del rango', () => {
            const time = new Date();
            time.setHours(10, 0);
            expect(isTimeDisabled(time, 8, 20)).toBe(false);
        });

        /**
         * Verifica que horas previas a la apertura o posteriores al cierre
         * resulten catalogadas como inhabilitadas.
         */
        it('debe deshabilitar horas fuera del rango', () => {
            const time = new Date();
            time.setHours(7, 0);
            expect(isTimeDisabled(time, 8, 20)).toBe(true);
            
            time.setHours(21, 0);
            expect(isTimeDisabled(time, 8, 20)).toBe(true);
        });

        /**
         * Verifica la precisión sobre el límite final, permitiendo seleccionar
         * exactamente la hora de cierre en punto, pero inhabilitando minutos posteriores.
         */
        it('solo debe permitir el minuto 0 en la hora de cierre', () => {
            const time = new Date();
            time.setHours(20, 0);
            expect(isTimeDisabled(time, 8, 20)).toBe(false);

            time.setHours(20, 30);
            expect(isTimeDisabled(time, 8, 20)).toBe(true);
        });
    });

    describe('adjustTimeToStartHour', () => {
        /**
         * Verifica que un objeto Date situado a medianoche sea rectificado
         * a la hora de inicio definida en los parámetros.
         */
        it('debe ajustar la medianoche a la hora de inicio', () => {
            const midnight = new Date(2026, 4, 25, 0, 0);
            const result = adjustTimeToStartHour(midnight, 8);
            expect(result?.getHours()).toBe(8);
        });

        /**
         * Verifica que si el objeto Date ya cuenta con una hora especificada
         * diferente de medianoche, su valor original se preserve intacto.
         */
        it('no debe tocar la hora si ya está establecida', () => {
            const midday = new Date(2026, 4, 25, 12, 0);
            const result = adjustTimeToStartHour(midday, 8);
            expect(result?.getHours()).toBe(12);
        });
    });
});
