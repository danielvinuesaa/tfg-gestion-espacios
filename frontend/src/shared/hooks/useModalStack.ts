import { useState, useCallback, useMemo } from 'react';

/**
 * Hook personalizado para la gestión centralizada y escalable de múltiples modales y sus estados asociados.
 * Utiliza un modelo de pila o mapa en el que cada modal está identificado por una clave única.
 * 
 * @typeParam T - Un tipo de registro donde las claves representan los identificadores de los modales y los valores representan el tipo de datos que manejan.
 * @param initialModals - Un objeto tipado que inicializa las claves de los modales y preestablece sus datos (generalmente a `null` al iniciar cerrados).
 * @returns Un conjunto memoizado de funciones para abrir, cerrar, verificar y extraer propiedades de los modales configurados.
 */
export const useModalStack = <T extends Record<string, any>>(initialModals: T) => {
    // Estado interno: un mapa de 'clave' -> 'datos del modal'
    // Si los datos son null o undefined, el modal se considera cerrado.
    type ModalState = {
        [K in keyof T]: T[K] | null;
    };

    const [modalData, setModalData] = useState<ModalState>(() => {
        const state = {} as ModalState;
        Object.keys(initialModals).forEach(key => {
            state[key as keyof T] = null;
        });
        return state;
    });

    /**
     * Abre un modal específico con datos opcionales.
     */
    const open = useCallback(<K extends keyof T>(key: K, data: T[K] | true = true as any) => {
        setModalData(prev => ({
            ...prev,
            [key]: data
        }));
    }, []);

    /**
     * Cierra un modal específico.
     */
    const close = useCallback((key: keyof T) => {
        setModalData(prev => ({
            ...prev,
            [key]: null
        }));
    }, []);

    /**
     * Cierra todos los modales abiertos.
     */
    const closeAll = useCallback(() => {
        setModalData(prev => {
            const newState = { ...prev };
            Object.keys(newState).forEach(key => {
                newState[key as keyof T] = null;
            });
            return newState;
        });
    }, []);

    /**
     * Comprueba si un modal está abierto.
     */
    const isOpen = useCallback((key: keyof T) => {
        return modalData[key] !== null;
    }, [modalData]);

    /**
     * Obtiene los datos asociados a un modal.
     */
    const getData = useCallback(<K extends keyof T>(key: K): T[K] | null => {
        return modalData[key];
    }, [modalData]);

    const getProps = useCallback(<K extends keyof T>(key: K) => ({
        open: modalData[key] !== null,
        onClose: () => close(key)
    }), [modalData, close]);

    return useMemo(() => ({
        open,
        close,
        closeAll,
        isOpen,
        getData,
        getProps
    }), [open, close, closeAll, isOpen, getData, getProps]);
};
