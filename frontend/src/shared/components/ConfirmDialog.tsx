import React from 'react';
import { 
    Dialog, DialogTitle, DialogContent, DialogContentText, 
    DialogActions, Button, Box, Typography 
} from '@mui/material';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';

/**
 * Interfaz que define las propiedades del componente `ConfirmDialog`.
 */
interface ConfirmDialogProps {
    /** Controla la visibilidad del diálogo. */
    open: boolean;
    /** Título principal del cuadro de diálogo. */
    title: string;
    /** Descripción detallada o contenido personalizado a mostrar en el cuerpo del diálogo. */
    description: string | React.ReactNode;
    /** Texto para el botón de confirmación. Por defecto es "Confirmar". */
    confirmText?: string;
    /** Texto para el botón de cancelación. Por defecto es "Cancelar". */
    cancelText?: string;
    /** Función callback ejecutada al hacer clic en el botón de confirmación. */
    onConfirm: () => void;
    /** Función callback ejecutada al solicitar el cierre del diálogo. */
    onClose: () => void;
    /** Nivel de severidad de la acción, que determina el esquema de color ('error', 'warning', 'info'). */
    severity?: 'error' | 'warning' | 'info';
    /** Indicador de estado de carga que deshabilita las interacciones mientras se procesa la solicitud. */
    isLoading?: boolean;
}

/**
 * Diálogo de confirmación estándar y reutilizable para acciones críticas o destructivas.
 * Garantiza la consistencia visual y semántica a través de todos los módulos de la aplicación.
 * 
 * @param props - Propiedades requeridas y opcionales para configurar el diálogo.
 * @returns Componente de React que renderiza un diálogo modal de confirmación.
 */
const ConfirmDialog = ({
    open, title, description, confirmText = "Confirmar", 
    cancelText = "Cancelar", onConfirm, onClose, 
    severity = 'error', isLoading = false
}: ConfirmDialogProps) => {
    
    const color = severity === 'error' ? 'error' : severity === 'warning' ? 'warning' : 'primary';

    return (
        <Dialog 
            open={open} 
            onClose={isLoading ? undefined : onClose}
            maxWidth="xs"
            fullWidth
            PaperProps={{ sx: { borderRadius: 2 } }}
        >
            <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1.5, pb: 1 }}>
                <WarningAmberIcon color={color} />
                <Typography variant="h6" component="span" fontWeight="bold">
                    {title}
                </Typography>
            </DialogTitle>
            
            <DialogContent>
                <DialogContentText id="confirm-dialog-description" sx={{ color: 'text.primary', py: 1 }}>
                    {description}
                </DialogContentText>
            </DialogContent>
            
            <DialogActions sx={{ p: 2, pt: 1 }}>
                <Button onClick={onClose} disabled={isLoading} color="inherit">
                    {cancelText}
                </Button>
                <Button 
                    onClick={onConfirm} 
                    variant="contained" 
                    color={color}
                    autoFocus
                    disabled={isLoading}
                >
                    {isLoading ? "Procesando..." : confirmText}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default ConfirmDialog;
