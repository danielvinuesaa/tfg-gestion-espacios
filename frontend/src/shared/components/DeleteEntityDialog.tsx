import React from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Typography,
    Box,
    Alert,
    CircularProgress,
    Divider
} from '@mui/material';
import DeleteForeverIcon from '@mui/icons-material/DeleteForever';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';

/**
 * Interfaz que estipula las propiedades del componente `DeleteEntityDialog`.
 */
interface DeleteEntityDialogProps {
    /** Estado booleano que controla la visibilidad y apertura del cuadro de diálogo. */
    open: boolean;
    /** Título principal que encabezará el diálogo (por ejemplo: "¿Eliminar Espacio?"). */
    title: string;
    /** El nombre específico y descriptivo de la entidad que se someterá a eliminación. */
    entityName: string;
    /** El identificador de clase o tipo de la entidad (por ejemplo: "Espacio", "Usuario"). */
    entityTypeLabel: string;
    /** Identificador único alfanumérico asociado a la entidad (opcional). */
    entityId?: string | number;
    /** Bandera que indica si se han encontrado dependencias o conflictos asociados a la entidad. */
    hasConflicts?: boolean;
    /** Bandera que notifica si existe un proceso asíncrono comprobando la integridad referencial. */
    checkingConflicts?: boolean;
    /** Indicador de carga activa durante la ejecución definitiva del proceso de borrado. */
    loading?: boolean;
    /** Mensaje o descripción de un error suscitado durante el proceso, si aplicase. */
    error?: string | null;
    /** Función callback requerida para invocar el cierre del cuadro modal. */
    onClose: () => void;
    /** Función callback ejecutada al presionar el botón de confirmación de la acción destructiva. */
    onConfirm: () => void;
    /** Contenido reactivo personalizado a inyectar, típicamente empleado para listar los conflictos detectados. */
    children?: React.ReactNode;
    /** Etiqueta de texto personalizada para sobreescribir el botón de confirmación por defecto. */
    confirmText?: string;
    /** Nota de texto de carácter informativo sobre implicaciones lógicas o de auditoría tras el borrado. */
    auditNote?: string;
    /** Estado que inactiva de manera forzosa el botón de confirmación debido a restricciones o reglas de negocio. */
    disabled?: boolean;
}

/**
 * Componente base unificado y profesional para la visualización de diálogos de eliminación a nivel de entidad individual.
 * Integra validaciones de conflictos, estado de carga asíncrona y un diseño consistente con la línea gráfica del sistema.
 * 
 * @param props - Las propiedades y configuraciones requeridas para el renderizado del diálogo.
 * @returns El componente modal renderizado, gestionando la interacción de la eliminación.
 */
const DeleteEntityDialog: React.FC<DeleteEntityDialogProps> = ({
    open, title, entityName, entityTypeLabel, entityId,
    hasConflicts = false, checkingConflicts = false, loading = false,
    error, onClose, onConfirm, children, confirmText, auditNote,
    disabled = false
}) => {

    const colorMain = hasConflicts ? '#e65100' : '#d32f2f';
    const colorBg = hasConflicts ? '#fff3e0' : '#fff5f5';

    return (
        <Dialog 
            open={open} 
            onClose={loading ? undefined : onClose} 
            maxWidth="sm" 
            fullWidth
            PaperProps={{ sx: { borderRadius: 2 } }}
        >
            {/* Cabecera Estilo Espacios */}
            <DialogTitle sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: 1.5, 
                bgcolor: colorBg, 
                color: colorMain, 
                fontWeight: 'bold',
                py: 2
            }}>
                {hasConflicts ? <WarningAmberIcon /> : <DeleteForeverIcon />} 
                {hasConflicts ? "Conflictos de Eliminación" : title}
            </DialogTitle>
            <Divider />
            
            <DialogContent sx={{ mt: 2 }}>
                {error && <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>{error}</Alert>}
                
                {/* Resumen del Elemento */}
                <Box sx={{ p: 2, mb: 3, bgcolor: '#f8f9fa', borderRadius: 2, border: '1px solid #eee' }}>
                    <Typography variant="subtitle2" color="textSecondary" sx={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: 1 }} gutterBottom>
                        {entityTypeLabel} A ELIMINAR
                    </Typography>
                    <Typography variant="h6" fontWeight="bold" color="primary">
                        {entityName}
                    </Typography>
                    {entityId && (
                        <Typography variant="caption" color="textSecondary">
                            ID: {entityId}
                        </Typography>
                    )}
                </Box>

                {/* Estado de Carga / Comprobación */}
                {checkingConflicts ? (
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 3, gap: 2 }}>
                        <CircularProgress size={30} thickness={4} />
                        <Typography variant="body2" color="textSecondary">Comprobando dependencias y conflictos...</Typography>
                    </Box>
                ) : (
                    <>
                        {/* Contenido Dinámico de Conflictos */}
                        {children}

                        {/* Nota de Auditoría Estándar */}
                        {auditNote && (
                            <Box sx={{ mt: 3, p: 2, bgcolor: '#fffde7', borderRadius: 2, border: '1px solid #fff9c4' }}>
                                <Typography variant="body2" color="#5d4037" sx={{ fontSize: '0.85rem' }}>
                                    <strong>Nota sobre Auditoría:</strong> {auditNote}
                                </Typography>
                            </Box>
                        )}
                    </>
                )}
            </DialogContent>

            <DialogActions sx={{ p: 2, bgcolor: '#f8f9fa', borderTop: '1px solid #eee', gap: 1 }}>
                <Button onClick={onClose} disabled={loading} color="inherit" sx={{ fontWeight: 'bold' }}>
                    Cancelar
                </Button>
                <Button 
                    onClick={onConfirm} 
                    variant="contained" 
                    color="error"
                    disabled={loading || checkingConflicts || disabled}
                    sx={{ fontWeight: 'bold', px: 3 }}
                    startIcon={loading && <CircularProgress size={18} color="inherit" />}
                >
                    {loading ? "Procesando..." : (confirmText || (hasConflicts ? "Confirmar y Procesar" : "Confirmar Eliminación"))}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default DeleteEntityDialog;
