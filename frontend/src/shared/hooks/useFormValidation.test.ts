import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useFormValidation } from './useFormValidation';
import { ApiException } from '../utils/api';

/**
 * Suite de pruebas unitarias para el hook `useFormValidation`.
 * Verifica la gestión de errores de validación de formularios, el mapeo de
 * errores desde la API, y la limpieza selectiva o total de dichos errores.
 */
describe('useFormValidation', () => {
    /**
     * Verifica que el hook inicializa correctamente su estado con un objeto de
     * errores vacío y el flag de errores en `false`.
     */
    it('debe inicializar sin errores', () => {
        const { result } = renderHook(() => useFormValidation());
        expect(result.current.fieldErrors).toEqual({});
        expect(result.current.hasErrors).toBe(false);
    });

    /**
     * Verifica que el hook es capaz de recibir un `ApiException` que contenga
     * errores de validación por campo y actualizar su estado interno acordemente.
     */
    it('debe mapear errores desde una ApiException', () => {
        const { result } = renderHook(() => useFormValidation());
        const apiError = new ApiException('Validation Failed', 400, {
            email: 'Email inválido',
            password: 'Muy corta'
        });

        act(() => {
            const wasMapped = result.current.setErrorsFromApi(apiError);
            expect(wasMapped).toBe(true);
        });

        expect(result.current.fieldErrors).toEqual({
            email: 'Email inválido',
            password: 'Muy corta'
        });
        expect(result.current.hasErrors).toBe(true);
    });

    /**
     * Verifica que el método `getFieldError` devuelve el mensaje de error para
     * un campo específico, o `null` si dicho campo no tiene errores.
     */
    it('debe obtener errores de campos individuales', () => {
        const { result } = renderHook(() => useFormValidation());
        const apiError = new ApiException('Error', 400, { name: 'Requerido' });

        act(() => {
            result.current.setErrorsFromApi(apiError);
        });

        expect(result.current.getFieldError('name')).toBe('Requerido');
        expect(result.current.getFieldError('other')).toBe(null);
    });

    /**
     * Verifica que el método `clearFieldError` elimina el error asociado
     * únicamente al campo especificado, manteniendo el resto intacto.
     */
    it('debe permitir limpiar errores individuales', () => {
        const { result } = renderHook(() => useFormValidation());
        
        act(() => {
            result.current.setErrorsFromApi(new ApiException('Err', 400, { f1: 'e1', f2: 'e2' }));
        });

        act(() => {
            result.current.clearFieldError('f1');
        });

        expect(result.current.fieldErrors).toEqual({ f2: 'e2' });
    });

    /**
     * Verifica que el método `clearAllErrors` restablece el estado interno
     * eliminando todos los errores de campo y poniendo el flag de errores a `false`.
     */
    it('debe limpiar todos los errores', () => {
        const { result } = renderHook(() => useFormValidation());
        
        act(() => {
            result.current.setErrorsFromApi(new ApiException('Err', 400, { f1: 'e1' }));
            result.current.clearAllErrors();
        });

        expect(result.current.fieldErrors).toEqual({});
        expect(result.current.hasErrors).toBe(false);
    });

    /**
     * Verifica que si se intenta mapear un error genérico (que no tiene la propiedad
     * `validationErrors`), el hook devuelve `false` y no modifica su estado de errores.
     */
    it('debe devolver false si el error no tiene validationErrors', () => {
        const { result } = renderHook(() => useFormValidation());
        const genericError = new Error('Network fail');

        act(() => {
            const wasMapped = result.current.setErrorsFromApi(genericError);
            expect(wasMapped).toBe(false);
        });

        expect(result.current.hasErrors).toBe(false);
    });
});
