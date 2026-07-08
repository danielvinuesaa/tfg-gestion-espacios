import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useFormValidation } from './useFormValidation';
import { areObjectsEqual } from '../../shared/utils/formUtils';

/**
 * Interfaz de configuración para la inicialización del hook `useBaseForm`.
 * 
 * @typeParam T - El tipo representativo del modelo de datos del formulario.
 */
interface UseBaseFormOptions<T> {
    /** Los valores iniciales con los cuales el formulario arrancará o se reiniciará. */
    initialValues: T;
    /** Función callback ejecutada de forma opcional tras el procesamiento exitoso del envío. */
    onSuccess?: (data: any) => void;
    /** Promesa asíncrona que encapsula y ejecuta la lógica de guardado/actualización contra la API. */
    onSubmit: (values: T) => Promise<any>;
}

/**
 * Hook fundamental y estandarizado para la manipulación y orquestación de la lógica de formularios en todo el sistema.
 * Unifica el control de estado reactivo, la gestión de la suciedad (dirty check), las validaciones backend y el
 * ciclo de vida de carga (loading) y emisión (submit).
 * 
 * @typeParam T - El modelo o estructura de datos sobre los que opera el formulario.
 * @param options - Parámetros de configuración, como los valores por defecto y las funciones de envío.
 * @returns Propiedades y manipuladores de eventos listos para enlazarse en los componentes visuales del formulario.
 */
export function useBaseForm<T extends Record<string, any>>({ 
    initialValues, 
    onSubmit, 
    onSuccess 
}: UseBaseFormOptions<T>) {
    const [formData, setFormData] = useState<T>(initialValues);
    const [initialState, setInitialState] = useState<T>(initialValues);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [touched, setTouched] = useState<Record<keyof T, boolean>>({} as Record<keyof T, boolean>);

    const { 
        setErrorsFromApi, 
        clearFieldError, 
        clearAllErrors, 
        getFieldError 
    } = useFormValidation();

    // Resetear el formulario con nuevos valores iniciales (ej: al abrir para editar)
    const resetForm = useCallback((values: T) => {
        setFormData(values);
        setInitialState(values);
        setTouched({} as any);
        setError(null);
        clearAllErrors();
    }, [clearAllErrors]);

    const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target;
        const val = type === 'number' ? (value === '' ? '' : Number(value)) : value;
        
        setFormData(prev => ({ ...prev, [name]: val }));
        setTouched(prev => ({ ...prev, [name]: false }));
        clearFieldError(name);
    }, [clearFieldError]);

    const handleBlur = useCallback((field: keyof T) => {
        setTouched(prev => ({ ...prev, [field]: true }));
    }, []);

    const setFieldValue = useCallback((name: keyof T, value: any) => {
        setFormData(prev => ({ ...prev, [name]: value }));
        setTouched(prev => ({ ...prev, [name as any]: false } as any));
        clearFieldError(name as string);
    }, [clearFieldError]);

    const setFields = useCallback((fields: Partial<T>) => {
        setFormData(prev => ({ ...prev, ...fields }));
        Object.keys(fields).forEach(key => {
            setTouched(prev => ({ ...prev, [key]: false } as any));
            clearFieldError(key);
        });
    }, [clearFieldError]);

    const isDirty = useMemo(() => {
        return !areObjectsEqual(formData, initialState);
    }, [formData, initialState]);

    const submit = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        
        setError(null);
        clearAllErrors();
        setLoading(true);

        try {
            const result = await onSubmit(formData);
            if (onSuccess) onSuccess(result);
            return result;
        } catch (err: any) {
            const wasMapped = setErrorsFromApi(err);
            if (!wasMapped) {
                setError(err.message || 'Error al procesar la solicitud');
            }
            throw err;
        } finally {
            setLoading(false);
        }
    };

    return {
        formData,
        setFormData,
        setFieldValue,
        setFields,
        initialState,
        loading,
        error,
        setError,
        touched,
        setTouched,
        isDirty,
        handleChange,
        handleBlur,
        submit,
        resetForm,
        getFieldError,
        clearFieldError,
        clearAllErrors
    };
}
