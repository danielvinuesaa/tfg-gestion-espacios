import { describe, it, expect } from 'vitest';
import { areObjectsEqual } from './formUtils';

/**
 * Suite de pruebas unitarias para las utilidades de validación de formularios (formUtils).
 * Incluye validaciones extensas sobre la comparación en profundidad de objetos
 * y distintos tipos de primitivas en el estado del formulario.
 */
describe('formUtils', () => {
    describe('areObjectsEqual', () => {
        /**
         * Verifica que valores primitivos del mismo tipo y valor
         * sean considerados estrictamente idénticos.
         */
        it('debe identificar primitivos iguales', () => {
            expect(areObjectsEqual(1, 1)).toBe(true);
            expect(areObjectsEqual('a', 'a')).toBe(true);
            expect(areObjectsEqual(true, true)).toBe(true);
            expect(areObjectsEqual(null, null)).toBe(true);
        });

        /**
         * Verifica que valores primitivos con diferente contenido
         * o diferente tipo resulten no idénticos.
         */
        it('debe identificar primitivos distintos', () => {
            expect(areObjectsEqual(1, 2)).toBe(false);
            expect(areObjectsEqual('a', 'b')).toBe(false);
            expect(areObjectsEqual(true, false)).toBe(false);
            expect(areObjectsEqual(null, undefined)).toBe(false);
        });

        /**
         * Verifica que dos objetos distintos en memoria pero con el mismo
         * contenido simple sean considerados iguales de forma estructurada.
         */
        it('debe comparar objetos simples', () => {
            expect(areObjectsEqual({ a: 1 }, { a: 1 })).toBe(true);
            expect(areObjectsEqual({ a: 1 }, { b: 1 })).toBe(false);
            expect(areObjectsEqual({ a: 1 }, { a: 2 })).toBe(false);
        });

        /**
         * Verifica que el orden en que las claves fueron añadidas a los objetos
         * no afecte el resultado final de la comparación de igualdad.
         */
        it('debe ignorar el orden de las claves', () => {
            expect(areObjectsEqual({ a: 1, b: 2 }, { b: 1, a: 1 })).toBe(false); // different values
            expect(areObjectsEqual({ a: 1, b: 2 }, { b: 2, a: 1 })).toBe(true);
        });

        /**
         * Verifica que los objetos instancia de Date se comparen evaluando
         * su valor de tiempo en lugar de sus referencias de memoria.
         */
        it('debe comparar fechas correctamente', () => {
            const d1 = new Date(2026, 5, 25);
            const d2 = new Date(2026, 5, 25);
            const d3 = new Date(2026, 5, 26);
            expect(areObjectsEqual(d1, d2)).toBe(true);
            expect(areObjectsEqual(d1, d3)).toBe(false);
        });

        /**
         * Verifica que las estructuras que contengan arreglos
         * se validen analizando el contenido individual de cada elemento.
         */
        it('debe comparar arrays profundamente', () => {
            expect(areObjectsEqual([1, { a: 1 }], [1, { a: 1 }])).toBe(true);
            expect(areObjectsEqual([1, { a: 1 }], [1, { a: 2 }])).toBe(false);
            expect(areObjectsEqual([1], [1, 2])).toBe(false);
        });

        /**
         * Verifica que un árbol complejo de objetos anidados se evalúe recursivamente
         * detectando cambios en cualquier nivel de profundidad.
         */
        it('debe comparar objetos anidados', () => {
            const obj1 = { user: { id: 1, profile: { bio: 'hi' } } };
            const obj2 = { user: { id: 1, profile: { bio: 'hi' } } };
            const obj3 = { user: { id: 1, profile: { bio: 'bye' } } };
            expect(areObjectsEqual(obj1, obj2)).toBe(true);
            expect(areObjectsEqual(obj1, obj3)).toBe(false);
        });
    });
});
