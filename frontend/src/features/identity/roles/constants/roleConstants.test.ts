import { describe, it, expect } from 'vitest';
import { getCategoryByPermission, formatPermissionName, PERMISSION_CATEGORIES } from './roleConstants';

/**
 * Suite de pruebas unitarias para las constantes y funciones auxiliares
 * relacionadas con la gestión de roles y permisos.
 */
describe('roleConstants', () => {
    /**
     * Pruebas para la función getCategoryByPermission.
     */
    describe('getCategoryByPermission', () => {
        /**
         * Verifica que se asigne correctamente la categoría predefinida a
         * un permiso existente en el sistema.
         */
        it('debe devolver la categoría correcta para un permiso conocido', () => {
            const cat = getCategoryByPermission('LEER_ESPACIOS');
            expect(cat.name).toBe('Espacios');
        });

        /**
         * Verifica que, en caso de recibir un permiso no registrado,
         * la función devuelva la categoría por defecto (Otros).
         */
        it('debe devolver la categoría Otros para un permiso desconocido', () => {
            const cat = getCategoryByPermission('UNKNOWN_PERM');
            expect(cat.name).toBe('Otros');
        });
    });

    /**
     * Pruebas para la función formatPermissionName.
     */
    describe('formatPermissionName', () => {
        /**
         * Verifica que los nombres de permisos en formato de constante (MAYÚSCULAS_CON_GUIONES)
         * se transformen a un formato legible con mayúsculas iniciales.
         */
        it('debe formatear nombres con guiones bajos a mayúsculas iniciales', () => {
            expect(formatPermissionName('LEER_ESPACIOS')).toBe('Leer Espacios');
            expect(formatPermissionName('CREAR_RESERVA_PROPIA')).toBe('Crear Reserva Propia');
        });
    });

    /**
     * Pruebas para el arreglo de PERMISSION_CATEGORIES.
     */
    describe('PERMISSION_CATEGORIES', () => {
        /**
         * Verifica que la lista de categorías contenga los grupos principales
         * requeridos por el sistema de roles.
         */
        it('debe contener las categorías principales', () => {
            const names = PERMISSION_CATEGORIES.map(c => c.name);
            expect(names).toContain('Espacios');
            expect(names).toContain('Reservas');
            expect(names).toContain('Gestión de Sistema');
        });
    });
});
