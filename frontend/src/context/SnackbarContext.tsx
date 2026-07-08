import React, { createContext, useContext, useState, ReactNode, useCallback } from 'react';
import { Snackbar, Alert } from '@mui/material';

/**
 * Tipo que define los posibles colores y niveles de severidad para el componente Alert.
 */
export type AlertColor = 'success' | 'info' | 'warning' | 'error';

/**
 * Interfaz para el contexto del Snackbar.
 */
interface SnackbarContextType {
    /**
     * Muestra un mensaje emergente en pantalla.
     * 
     * @param message - Texto del mensaje a mostrar.
     * @param severity - Severidad del mensaje (por defecto, success).
     */
    showSnackbar: (message: string, severity?: AlertColor) => void;
}

const SnackbarContext = createContext<SnackbarContextType | undefined>(undefined);

/**
 * Proveedor de contexto para las notificaciones efímeras (Snackbar) del sistema.
 * Permite a cualquier componente hijo lanzar mensajes globales.
 * 
 * @param props - Propiedades del componente, incluyendo los elementos hijos.
 * @returns Proveedor del contexto de Snackbar.
 */
export const SnackbarProvider = ({ children }: { children: ReactNode }) => {
    const [open, setOpen] = useState(false);
    const [message, setMessage] = useState('');
    const [severity, setSeverity] = useState<AlertColor>('success');

    const showSnackbar = useCallback((msg: string, sev: AlertColor = 'success') => {
        setMessage(msg);
        setSeverity(sev);
        setOpen(true);
    }, []);

    const handleClose = (event?: React.SyntheticEvent | Event, reason?: string) => {
        if (reason === 'clickaway') {
            return;
        }
        setOpen(false);
    };

    const value = React.useMemo(() => ({ showSnackbar }), [showSnackbar]);

    return (
        <SnackbarContext.Provider value={value}>
            {children}
            <Snackbar 
                open={open} 
                autoHideDuration={6000} 
                onClose={handleClose}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            >
                <Alert 
                    onClose={handleClose} 
                    severity={severity} 
                    variant="filled" 
                    sx={{ width: '100%', boxShadow: 3 }}
                >
                    {message}
                </Alert>
            </Snackbar>
        </SnackbarContext.Provider>
    );
};

/**
 * Hook personalizado para acceder a la funcionalidad del Snackbar.
 * 
 * @returns El contexto para mostrar mensajes.
 * @throws Error si se utiliza fuera de un SnackbarProvider.
 */
export const useSnackbar = () => {
    const context = useContext(SnackbarContext);
    if (context === undefined) {
        throw new Error('useSnackbar must be used within a SnackbarProvider');
    }
    return context;
};
