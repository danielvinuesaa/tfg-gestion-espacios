import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useModalStack } from './useModalStack';

/**
 * Suite de pruebas unitarias para el hook `useModalStack`.
 * Verifica la correcta gestión de la apertura, cierre y compartición
 * de datos entre múltiples modales administrados simultáneamente.
 */
describe('useModalStack', () => {
    /**
     * Verifica que al inicializar el hook con modales en estado nulo,
     * todos se reporten como cerrados y sin datos asociados.
     */
    it('debe inicializar todos los modales como cerrados', () => {
        const { result } = renderHook(() => useModalStack({ edit: null, create: null }));
        expect(result.current.isOpen('edit')).toBe(false);
        expect(result.current.isOpen('create')).toBe(false);
        expect(result.current.getData('edit')).toBe(null);
    });

    /**
     * Verifica que el método `open` cambie el estado de un modal a abierto
     * y le asigne correctamente los datos proporcionados.
     */
    it('debe permitir abrir un modal con datos', () => {
        const { result } = renderHook(() => useModalStack({ edit: { id: 0 } }));
        
        act(() => {
            result.current.open('edit', { id: 123 });
        });

        expect(result.current.isOpen('edit')).toBe(true);
        expect(result.current.getData('edit')).toEqual({ id: 123 });
    });

    /**
     * Verifica que el método `close` cambie el estado del modal específico
     * a cerrado.
     */
    it('debe permitir cerrar un modal', () => {
        const { result } = renderHook(() => useModalStack({ edit: null }));
        
        act(() => {
            result.current.open('edit');
            result.current.close('edit');
        });

        expect(result.current.isOpen('edit')).toBe(false);
    });

    /**
     * Verifica que el método `closeAll` fuerce el cierre simultáneo
     * de todos los modales que estén actualmente abiertos.
     */
    it('debe permitir cerrar todos los modales a la vez', () => {
        const { result } = renderHook(() => useModalStack({ m1: null, m2: null }));
        
        act(() => {
            result.current.open('m1');
            result.current.open('m2');
        });

        expect(result.current.isOpen('m1')).toBe(true);
        expect(result.current.isOpen('m2')).toBe(true);

        act(() => {
            result.current.closeAll();
        });

        expect(result.current.isOpen('m1')).toBe(false);
        expect(result.current.isOpen('m2')).toBe(false);
    });

    /**
     * Verifica que el método `getProps` devuelva las propiedades estándar
     * (open, onClose) necesarias para renderizar un componente Dialog, y
     * que la función onClose generada funcione correctamente.
     */
    it('debe devolver props estándar con getProps', () => {
        const { result } = renderHook(() => useModalStack({ edit: null }));
        
        act(() => {
            result.current.open('edit');
        });

        const props = result.current.getProps('edit');
        expect(props.open).toBe(true);
        expect(typeof props.onClose).toBe('function');

        act(() => {
            props.onClose();
        });

        expect(result.current.isOpen('edit')).toBe(false);
    });
});
