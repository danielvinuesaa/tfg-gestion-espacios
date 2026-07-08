import { describe, it, expect, vi } from 'vitest';
import { parseApiDate, formatDisplayDate, formatApiDate, isFuture, isToday, getSmartDefaultTime } from './dateUtils';
import { addDays, subDays, setHours, setMinutes, startOfToday } from 'date-fns';

/**
 * Suite de pruebas unitarias para las utilidades de manejo de fechas (dateUtils).
 * Comprueba el parseo correcto desde la API, el formateo en texto legible
 * y funciones accesorias como la detección de fechas futuras o el día actual.
 */
describe('dateUtils', () => {
    describe('parseApiDate', () => {
        /**
         * Verifica que una cadena de fecha en formato ISO se transforme correctamente
         * en un objeto Date con sus valores precisos.
         */
        it('debe parsear una cadena ISO correctamente', () => {
            const date = parseApiDate('2026-05-25T10:00:00');
            expect(date.getFullYear()).toBe(2026);
            expect(date.getMonth()).toBe(4); // Mayo (0-indexed)
            expect(date.getDate()).toBe(25);
        });

        /**
         * Verifica que el parseo sea tolerante y pueda convertir fechas
         * donde el separador de tiempo sea un espacio en vez de la letra T.
         */
        it('debe parsear una cadena con espacio en lugar de T', () => {
            const date = parseApiDate('2026-05-25 10:00:00');
            expect(date.getHours()).toBe(10);
        });

        /**
         * Verifica que si el valor proporcionado ya es una instancia de Date,
         * la función retorne exactamente la misma referencia.
         */
        it('debe devolver el mismo objeto si ya es una fecha', () => {
            const original = new Date();
            const result = parseApiDate(original);
            expect(result).toBe(original);
        });
    });

    describe('formatDisplayDate', () => {
        /**
         * Verifica que al formatear un objeto Date, la salida emplee
         * el formato y la localización en español requerida por la interfaz.
         */
        it('debe formatear en español por defecto', () => {
            const date = new Date(2026, 4, 25);
            expect(formatDisplayDate(date)).toContain('may');
            expect(formatDisplayDate(date)).toContain('2026');
        });

        /**
         * Verifica que la función pueda admitir y procesar
         * una cadena de fecha sin necesidad de instanciar un Date previamente.
         */
        it('debe aceptar una cadena de fecha como entrada', () => {
            expect(formatDisplayDate('2026-05-25T10:30:00', 'HH:mm')).toBe('10:30');
        });
    });

    describe('formatApiDate', () => {
        /**
         * Verifica que al exportar fechas hacia la API, se envíen
         * en el formato ISO esperado (Y-m-dTH:i:s) sin offsets locales.
         */
        it('debe formatear para la API (ISO sin offset)', () => {
            const date = new Date(2026, 4, 25, 10, 30, 0);
            expect(formatApiDate(date)).toBe('2026-05-25T10:30:00');
        });
    });

    describe('isFuture', () => {
        /**
         * Verifica que la función devuelva verdadero si la fecha evaluada
         * se encuentra en un momento temporal posterior al actual.
         */
        it('debe detectar fechas futuras', () => {
            const future = addDays(new Date(), 1);
            expect(isFuture(future)).toBe(true);
        });

        /**
         * Verifica que la función devuelva falso si la fecha evaluada
         * es previa o simultánea al momento actual.
         */
        it('debe detectar fechas pasadas', () => {
            const past = subDays(new Date(), 1);
            expect(isFuture(past)).toBe(false);
        });
    });

    describe('isToday', () => {
        /**
         * Verifica que la función devuelva verdadero si la fecha corresponde
         * al mismo día del calendario en que se ejecuta.
         */
        it('debe detectar el día actual', () => {
            expect(isToday(new Date())).toBe(true);
        });

        /**
         * Verifica que la función devuelva falso para fechas
         * del día anterior o posterior, independientemente de la hora.
         */
        it('debe detectar días distintos', () => {
            expect(isToday(addDays(new Date(), 1))).toBe(false);
            expect(isToday(subDays(new Date(), 1))).toBe(false);
        });
    });

    describe('getSmartDefaultTime', () => {
        /**
         * Verifica que al seleccionar un día futuro, se asigne
         * por defecto la hora de apertura especificada.
         */
        it('debe usar la hora de apertura para días futuros', () => {
            const tomorrow = addDays(startOfToday(), 1);
            const { start } = getSmartDefaultTime(tomorrow, 9);
            expect(start.getHours()).toBe(9);
            expect(start.getMinutes()).toBe(0);
        });

        /**
         * Verifica que al seleccionar el día de hoy, la sugerencia avance
         * automáticamente a la siguiente marca de media hora más próxima.
         */
        it('debe redondear a la siguiente media hora si es hoy', () => {
            // Mock de "ahora" a las 13:10
            vi.useFakeTimers();
            const now = setMinutes(setHours(new Date(), 13), 10);
            vi.setSystemTime(now);

            const { start } = getSmartDefaultTime(new Date(), 9);
            expect(start.getHours()).toBe(13);
            expect(start.getMinutes()).toBe(30);

            vi.useRealTimers();
        });

        /**
         * Verifica que si el minuto actual supera la media hora,
         * el tiempo sugerido avance a la hora en punto inmediatamente siguiente.
         */
        it('debe redondear a la siguiente hora entera si pasan de las :30', () => {
            vi.useFakeTimers();
            const now = setMinutes(setHours(new Date(), 15), 45);
            vi.setSystemTime(now);

            const { start } = getSmartDefaultTime(new Date(), 9);
            expect(start.getHours()).toBe(16);
            expect(start.getMinutes()).toBe(0);

            vi.useRealTimers();
        });

        /**
         * Verifica que si se está en el día actual pero antes de la apertura del sistema,
         * la función opte por usar la hora de inicio oficial en vez de la hora actual.
         */
        it('debe usar la hora de apertura si es hoy pero muy temprano', () => {
            vi.useFakeTimers();
            const now = setMinutes(setHours(new Date(), 7), 0);
            vi.setSystemTime(now);

            const { start } = getSmartDefaultTime(new Date(), 9);
            expect(start.getHours()).toBe(9);
            expect(start.getMinutes()).toBe(0);

            vi.useRealTimers();
        });
    });
});
