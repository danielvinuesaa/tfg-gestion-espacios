import { useState, useCallback } from 'react';
import { ApiException } from '../utils/api';

/**
 * Hook personalizado reutilizable para gestionar el estado de los errores de validación de formularios,
 * delegando la verificación de reglas complejas a la API del backend.
 * 
 * Este hook permite mapear estructuras de error (por ejemplo, devoluciones encapsuladas en `ApiException`)
 * directamente a los componentes visuales del formulario, facilitando una experiencia de usuario fluida.
 * 
 * @returns Un objeto que contiene el estado actual de los errores y funciones utilitarias para su gestión.
 */
export const useFormValidation = () => {
    const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

    /**
     * Extrae y establece los errores de validación de una ApiException.
     */
    const setErrorsFromApi = useCallback((error: unknown) => {
        if (error instanceof ApiException && error.validationErrors) {
            setFieldErrors(error.validationErrors);
            return true;
        }
        return false;
    }, []);

    /**
     * Limpia el error de un campo específico.
     * Útil para llamar en el onChange del input.
     */
    const clearFieldError = useCallback((fieldName: string) => {
        setFieldErrors(prev => {
            if (!prev[fieldName]) return prev;
            const newErrors = { ...prev };
            delete newErrors[fieldName];
            return newErrors;
        });
    }, []);

    /**
     * Limpia todos los errores acumulados.
     */
    const clearAllErrors = useCallback(() => {
        setFieldErrors({});
    }, []);

    /**
     * Obtiene el mensaje de error para un campo concreto.
     */
    const getFieldError = useCallback((fieldName: string) => {
        return fieldErrors[fieldName] || null;
    }, [fieldErrors]);

    return {
        fieldErrors,
        setErrorsFromApi,
        clearFieldError,
        clearAllErrors,
        getFieldError,
        hasErrors: Object.keys(fieldErrors).length > 0
    };
};
