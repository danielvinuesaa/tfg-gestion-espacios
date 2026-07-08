import { 
    Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions, 
    Button, Typography, Paper, List, ListItem, ListItemIcon, ListItemText, 
    Checkbox, ListItemButton, Divider, Box
} from '@mui/material';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';

/**
 * Estructura de un elemento genérico (espacio o asignatura) que carece de actividad.
 */
interface Item {
    /** Identificador único del elemento. */
    id: number;
    /** Nombre del elemento. */
    name: string;
    /** Descripción adicional opcional. */
    description?: string;
}

/**
 * Propiedades necesarias para configurar el diálogo de validación de informes.
 */
interface ReportValidationDialogProps {
    /** Indica si el diálogo está abierto. */
    open: boolean;
    /** Función de retrollamada para cerrar el diálogo. */
    onClose: () => void;
    /** Tipo de elementos que se están validando ('SPACES' o 'SUBJECTS'). */
    type: 'SPACES' | 'SUBJECTS';
    /** Lista de elementos que no presentan actividad en el periodo seleccionado. */
    emptyItems: Item[];
    /** Número total de elementos que fueron seleccionados originalmente. */
    selectedCount: number;
    /** Lista de identificadores de elementos sin actividad que el usuario ha decidido incluir. */
    includedEmptyIds: number[];
    /** Función de retrollamada para alternar la inclusión de un elemento sin actividad. */
    onToggleInclusion: (id: number) => void;
    /** Función de retrollamada para confirmar y generar el informe. */
    onConfirm: () => void;
    /** Función de retrollamada para incluir todos los elementos sin actividad y generar el informe. */
    onIncludeAll: () => void;
    /** Indica si hay filtros adicionales aplicados que puedan estar causando la falta de actividad. */
    hasFilters?: boolean; 
}

/**
 * Cuadro de diálogo de validación que alerta al usuario cuando los elementos seleccionados
 * para un informe no presentan actividad en el periodo especificado, permitiéndole decidir
 * si desea incluirlos de todas formas o generar el informe omitiéndolos.
 *
 * @param props - Las propiedades que configuran el comportamiento y contenido del diálogo.
 * @returns Un elemento JSX que representa el diálogo modal de validación.
 */
const ReportValidationDialog = ({
    open, onClose, type, emptyItems, selectedCount, 
    includedEmptyIds, onToggleInclusion, onConfirm, onIncludeAll,
    hasFilters = false
}: ReportValidationDialogProps) => {
    
    const isAllEmpty = emptyItems.length > 0 && emptyItems.length === selectedCount;
    const isFeminine = type === 'SUBJECTS';
    
    const labelPlural = isFeminine ? 'asignaturas' : 'espacios';
    const artDefPlural = isFeminine ? 'las' : 'los';
    const adjNone = isFeminine ? 'Ninguna' : 'Ninguno';
    const adjSelected = isFeminine ? 'seleccionadas' : 'seleccionados';
    const adjEmpty = isFeminine ? 'vacías' : 'vacíos';

    return (
        <Dialog 
            open={open} 
            onClose={onClose}
            maxWidth="sm"
            fullWidth
            PaperProps={{ sx: { borderRadius: 3, boxShadow: '0 8px 32px rgba(0,0,0,0.15)' } }}
        >
            <DialogTitle sx={{ 
                display: 'flex', alignItems: 'center', gap: 1.5, 
                bgcolor: '#fff9f0', 
                color: '#b26a00', 
                py: 2.5, fontWeight: 'bold' 
            }}>
                {isAllEmpty ? <ErrorOutlineIcon /> : <WarningAmberIcon />}
                {isAllEmpty ? `Sin actividad en ${artDefPlural} ${labelPlural}` : `Aviso: ${labelPlural} sin actividad`}
            </DialogTitle>
            
            <Divider />

            <DialogContent sx={{ mt: 2 }}>
                <DialogContentText sx={{ mb: 3, color: 'text.primary' }}>
                    {isAllEmpty 
                        ? `${adjNone} de ${artDefPlural} ${labelPlural} ${adjSelected} tiene reservas aprobadas ${hasFilters ? 'de los tipos elegidos ' : ''}para el periodo seleccionado. El reporte resultará en un documento vacío.`
                        : `Se ha detectado que ${artDefPlural} siguientes ${labelPlural} no tienen reservas aprobadas ${hasFilters ? 'de los tipos elegidos ' : ''}en el periodo indicado. Por defecto se omitirán del informe.`}
                </DialogContentText>
                
                {!isAllEmpty && (
                    <>
                        <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Box component="span" sx={{ width: 4, height: 16, bgcolor: 'primary.main', borderRadius: 1 }} />
                            {`¿Desea incluir algun${isFeminine ? 'a' : 'o'} de est${isFeminine ? 'as' : 'os'} ${labelPlural} ${adjEmpty}?`}
                        </Typography>
                        <Paper variant="outlined" sx={{ bgcolor: '#fafafa', maxHeight: 220, overflow: 'auto', border: '1px solid #eee' }}>
                            <List sx={{ py: 0 }}>
                                {emptyItems.map((item) => (
                                    <ListItem key={item.id} disablePadding divider>
                                        <ListItemButton onClick={() => onToggleInclusion(item.id)} dense>
                                            <ListItemIcon sx={{ minWidth: 40 }}>
                                                <Checkbox
                                                    edge="start"
                                                    checked={includedEmptyIds.includes(item.id)}
                                                    tabIndex={-1}
                                                    disableRipple
                                                />
                                            </ListItemIcon>
                                            <ListItemText 
                                                primary={item.name} 
                                                secondary={item.description}
                                                primaryTypographyProps={{ fontWeight: 'medium', variant: 'body2' }}
                                                secondaryTypographyProps={{ variant: 'caption' }}
                                            />
                                        </ListItemButton>
                                    </ListItem>
                                ))}
                            </List>
                        </Paper>
                    </>
                )}
            </DialogContent>

            <Divider />

            <DialogActions sx={{ p: 3, px: 3, gap: 1.5, bgcolor: '#fcfcfc' }}>
                <Button 
                    onClick={onClose} 
                    color="inherit" 
                    sx={{ fontWeight: 'bold' }}
                >
                    Cancelar
                </Button>
                
                <Box sx={{ flexGrow: 1 }} />

                {!isAllEmpty && (
                    <Button 
                        onClick={onIncludeAll} 
                        color="primary" 
                        variant="outlined"
                        sx={{ fontWeight: 'bold' }}
                    >
                        {`Incluir tod${isFeminine ? 'as' : 'os'} y generar`}
                    </Button>
                )}

                <Button 
                    onClick={onConfirm} 
                    color="primary"
                    variant="contained" 
                    sx={{ 
                        fontWeight: 'bold', 
                        px: 3, 
                        boxShadow: 'none', 
                        '&:hover': { boxShadow: 'none' } 
                    }}
                >
                    {isAllEmpty ? "Generar de todos modos" : "Generar Informe"}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default ReportValidationDialog;
