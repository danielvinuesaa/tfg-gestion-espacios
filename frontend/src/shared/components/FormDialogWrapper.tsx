import React, { useState } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Alert,
    Box,
    Divider
} from '@mui/material';
import ConfirmDialog from './ConfirmDialog';

/**
 * Propiedades de configuración para el componente FormDialogWrapper.
 */
interface FormDialogWrapperProps {
    open: boolean;
    onClose: () => void;
    title: string;
    icon?: React.ReactNode;
    loading?: boolean;
    error?: string | null;
    info?: string | null;
    isDirty?: boolean;
    onSubmit: (e?: React.FormEvent) => Promise<any>;
    submitText?: string;
    cancelText?: string;
    maxWidth?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
    children: React.ReactNode;
    isValid?: boolean;
    confirmExitTitle?: string;
    confirmExitDescription?: string;
}

/**
 * Envoltorio genérico profesional para diálogos de formulario.
 * Centraliza la interfaz de usuario de cabecera, manejo de errores, acciones
 * y confirmación de salida al tener cambios sin guardar.
 * 
 * @param props - Propiedades de configuración del diálogo.
 * @returns {JSX.Element} El componente envuelto para el diálogo del formulario.
 */
const FormDialogWrapper = ({
    open,
    onClose,
    title,
    icon,
    loading = false,
    error,
    info,
    isDirty = false,
    onSubmit,
    submitText,
    cancelText = "Cancelar",
    maxWidth = "sm",
    children,
    isValid = true,
    confirmExitTitle = "¿Descartar cambios?",
    confirmExitDescription = "Si sale ahora, se perderán los cambios realizados en el formulario."
}: FormDialogWrapperProps) => {
    const [confirmExitOpen, setConfirmExitOpen] = useState(false);

    const handleCancel = () => {
        if (isDirty) {
            setConfirmExitOpen(true);
        } else {
            onClose();
        }
    };

    const finalSubmitText = submitText || (loading ? "Guardando..." : "Guardar");

    return (
        <>
            <Dialog 
                open={open} 
                onClose={handleCancel} 
                maxWidth={maxWidth} 
                fullWidth
                aria-labelledby="form-dialog-title"
            >
                <DialogTitle 
                    id="form-dialog-title"
                    sx={{ 
                        bgcolor: '#f8f9fa', 
                        borderBottom: 1, 
                        borderColor: 'divider', 
                        fontWeight: 'bold', 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: 1.5 
                    }}
                >
                    {icon && <Box sx={{ display: 'flex', color: 'primary.main' }}>{icon}</Box>}
                    {title}
                </DialogTitle>
                
                {/* Zona de alertas Sticky */}
                {(error || info) && (
                    <Box sx={{ 
                        position: 'sticky', 
                        top: 0, 
                        zIndex: 10, 
                        bgcolor: 'background.paper',
                        px: 3, 
                        pt: 2,
                        pb: 1,
                        borderBottom: 1,
                        borderColor: 'divider',
                        boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                    }}>
                        {info && (
                            <Alert severity="info" sx={{ borderRadius: 2, mb: error ? 1 : 0 }}>
                                {info}
                            </Alert>
                        )}
                        
                        {error && (
                            <Alert severity="error" sx={{ borderRadius: 2 }}>
                                {error}
                            </Alert>
                        )}
                    </Box>
                )}

                <DialogContent sx={{ mt: 0, pt: 2 }}>
                    <Box sx={{ mt: 1 }}>
                        {children}
                    </Box>
                </DialogContent>

                <Divider />

                <DialogActions sx={{ p: 3, bgcolor: '#f8f9fa' }}>
                    <Button 
                        onClick={handleCancel} 
                        color="inherit" 
                        disabled={loading}
                    >
                        {cancelText}
                    </Button>
                    <Button 
                        onClick={() => onSubmit().catch(() => {
                            // El error ya se gestiona dentro del hook useBaseForm
                            // y se muestra visualmente en el formulario.
                        })} 
                        variant="contained" 
                        disabled={loading || !isDirty || !isValid} 
                        sx={{ px: 4 }}
                    >
                        {finalSubmitText}
                    </Button>
                </DialogActions>
            </Dialog>

            <ConfirmDialog 
                open={confirmExitOpen}
                title={confirmExitTitle}
                description={confirmExitDescription}
                confirmText="Descartar y salir"
                cancelText="Seguir editando"
                onClose={() => setConfirmExitOpen(false)}
                onConfirm={() => {
                    setConfirmExitOpen(false);
                    onClose();
                }}
            />
        </>
    );
};

export default FormDialogWrapper;
