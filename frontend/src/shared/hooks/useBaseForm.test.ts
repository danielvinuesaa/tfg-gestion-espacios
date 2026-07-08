import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useBaseForm } from './useBaseForm';

/**
 * Suite de pruebas unitarias para el hook `useBaseForm`.
 * Verifica la inicialización de estado de formularios, actualización de valores,
 * control del estado "sucio" (dirty), reseteo de datos y el proceso de envío.
 */
describe('useBaseForm', () => {
    const initialValues = { name: '', age: 0 };
    const mockOnSubmit = vi.fn().mockResolvedValue({});

    /**
     * Verifica que el formulario inicializa sus valores con el objeto proporcionado
     * por las opciones de configuración y que el estado `isDirty` es falso.
     */
    it('debe inicializar con los valores proporcionados', () => {
        const { result } = renderHook(() => useBaseForm({ initialValues, onSubmit: mockOnSubmit }));
        expect(result.current.formData).toEqual(initialValues);
        expect(result.current.isDirty).toBe(false);
    });

    /**
     * Verifica que al usar `setFieldValue` se actualiza el campo correspondiente
     * y el estado del formulario cambia a modificado (`isDirty` = true).
     */
    it('debe actualizar campos y marcar como sucio', () => {
        const { result } = renderHook(() => useBaseForm({ initialValues, onSubmit: mockOnSubmit }));
        
        act(() => {
            result.current.setFieldValue('name', 'John');
        });
        
        expect(result.current.formData.name).toBe('John');
        expect(result.current.isDirty).toBe(true);
    });

    /**
     * Verifica que el método `handleChange` acepta eventos estándar de elementos
     * de entrada y actualiza el estado basándose en los campos `name` y `value`.
     */
    it('debe manejar el evento handleChange estándar', () => {
        const { result } = renderHook(() => useBaseForm({ initialValues, onSubmit: mockOnSubmit }));
        
        act(() => {
            result.current.handleChange({ 
                target: { name: 'name', value: 'Jane' } 
            } as any);
        });
        
        expect(result.current.formData.name).toBe('Jane');
    });

    /**
     * Verifica que llamar a `resetForm` con un nuevo objeto de valores restablece
     * tanto el estado actual del formulario como el estado inicial base,
     * volviendo `isDirty` a ser falso.
     */
    it('debe permitir re-inicializar el formulario con resetForm', () => {
        const { result } = renderHook(() => useBaseForm({ initialValues, onSubmit: mockOnSubmit }));
        
        const newValues = { name: 'Admin', age: 99 };
        act(() => {
            result.current.resetForm(newValues);
        });
        
        expect(result.current.formData).toEqual(newValues);
        expect(result.current.isDirty).toBe(false); // Porque initialState ahora es newValues
    });

    /**
     * Verifica que al invocar `submit`, se ejecute la función `onSubmit`
     * provista en las opciones, pasando el estado completo del formulario.
     */
    it('debe llamar a onSubmit con los datos actuales', async () => {
        const { result } = renderHook(() => useBaseForm({ initialValues, onSubmit: mockOnSubmit }));
        
        act(() => {
            result.current.setFieldValue('name', 'John');
        });

        await act(async () => {
            await result.current.submit();
        });

        expect(mockOnSubmit).toHaveBeenCalledWith({ name: 'John', age: 0 });
    });
});
