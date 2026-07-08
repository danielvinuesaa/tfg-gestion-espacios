import React from 'react';
import { 
    Dialog, DialogTitle, DialogContent, DialogActions, 
    Button, Typography, Box, Alert, List, ListItem, 
    ListItemText, Divider, CircularProgress, Chip,
    Accordion, AccordionSummary, AccordionDetails, Stack
} from '@mui/material';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import DeleteForeverIcon from '@mui/icons-material/DeleteForever';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import type { BulkConflictSummary } from '../types/bulk';
import CounterChip from './Chips/CounterChip';

/**
 * Propiedades del componente BulkDeleteConflictDialog.
 */
interface BulkDeleteConflictDialogProps {
    open: boolean;
    onClose: () => void;
    onConfirm: (payload?: any) => void;
    loading: boolean;
    summary: BulkConflictSummary | null;
    title: string;
    resourceNameSingular: string;
    resourceNamePlural: string;
    impactTypeLabel: string; // "reservas activas", "usuarios vinculados", etc.
    isFeminine?: boolean;
    /** Renderizado opcional de acciones extra (como el selector de reasignación de roles) */
    extraActions?: React.ReactNode;
    /** Texto del botón de confirmación con conflictos */
    confirmTextWithConflicts?: string;
    /** Verbo de acción (ej: "eliminar", "cancelar") */
    actionVerb?: string;
    /** Sustantivo de la acción (ej: "Eliminación", "Cancelación") */
    actionNoun?: string;
}

/**
 * Componente unificado para diálogos de borrado masivo con análisis de conflictos.
 * Proporciona una experiencia de usuario consistente y profesional en todo el sistema.
 * 
 * @param props - Las propiedades del componente.
 * @returns {JSX.Element} El componente del diálogo de borrado masivo.
 */
const BulkDeleteConflictDialog: React.FC<BulkDeleteConflictDialogProps> = ({
    open, onClose, onConfirm, loading, summary,
    title, resourceNameSingular, resourceNamePlural,
    impactTypeLabel, isFeminine = false, extraActions,
    confirmTextWithConflicts = "Borrar de todos modos",
    actionVerb = "eliminar",
    actionNoun = "Eliminación"
}) => {

    if (!summary && loading) {
        return (
            <Dialog open={open} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: 2 } }}>
                <DialogContent sx={{ textAlign: 'center', py: 6 }}>
                    <CircularProgress size={40} thickness={4} />
                    <Typography sx={{ mt: 2, fontWeight: 'medium', color: 'text.secondary' }}>
                        Analizando impacto en el sistema...
                    </Typography>
                </DialogContent>
            </Dialog>
        );
    }

    const hasConflicts = summary ? summary.conflictCount > 0 : false;
    
    // Configuración de concordancia gramatical
    const art = isFeminine ? 'La' : 'El';
    const arts = isFeminine ? 'Las' : 'Los';
    const quant = isFeminine ? 'Todas' : 'Todos';
    const suffix = isFeminine ? 'a' : 'o';

    return (
        <Dialog 
            open={open} 
            onClose={loading ? undefined : onClose} 
            maxWidth="sm" 
            fullWidth
            PaperProps={{ sx: { borderRadius: 3, boxShadow: '0 8px 32px rgba(0,0,0,0.2)' } }}
        >
            <DialogTitle sx={{ 
                display: 'flex', alignItems: 'center', gap: 1.5, 
                bgcolor: hasConflicts ? '#fff5f5' : '#f0f9f0', 
                color: hasConflicts ? '#d32f2f' : '#2e7d32', 
                py: 2.5 
            }}>
                {hasConflicts ? <DeleteForeverIcon /> : <CheckCircleOutlineIcon />}
                <Box component="span" sx={{ fontWeight: 'bold', fontSize: '1.25rem' }}>
                    {title}
                </Box>
            </DialogTitle>
            <Divider />
            
            <DialogContent sx={{ mt: 2 }}>
                <Typography variant="body1" sx={{ mb: 2, color: 'text.primary' }}>
                    Has seleccionado <strong>{summary?.totalTarget} {summary?.totalTarget === 1 ? resourceNameSingular : resourceNamePlural}</strong> para {actionVerb}.
                </Typography>

                {hasConflicts ? (
                    <Box sx={{ mt: 2 }}>
                        <Box sx={{ 
                            p: 2, bgcolor: '#fff4e5', borderRadius: 2, 
                            border: '1px solid #ffa726', mb: 3 
                        }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1, color: '#f57c00' }}>
                                <WarningAmberIcon fontSize="small" />
                                <Typography variant="subtitle2" fontWeight="bold">Conflicto Detectado</Typography>
                            </Box>
                            <Typography variant="body2" color="text.secondary">
                                Se {summary?.conflictCount === 1 ? 'ha' : 'han'} detectado <strong>{summary?.conflictCount} {summary?.conflictCount === 1 ? resourceNameSingular : resourceNamePlural}</strong> con <strong>{summary?.totalImpactedItems} {impactTypeLabel}</strong>.
                            </Typography>
                        </Box>

                        <Accordion variant="outlined" sx={{ borderRadius: 2, mb: 2, overflow: 'hidden' }}>
                            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                                <Stack direction="row" spacing={1} alignItems="center">
                                    <ErrorOutlineIcon color="action" fontSize="small" />
                                    <Typography variant="subtitle2" fontWeight="bold">
                                        {summary?.conflictCount === 1 ? 'Elemento afectado' : 'Elementos afectados'}
                                    </Typography>
                                    <CounterChip count={summary?.conflictCount || 0} variant="error" />
                                </Stack>
                            </AccordionSummary>
                            <AccordionDetails sx={{ p: 0, bgcolor: '#fafafa' }}>
                                <List dense sx={{ maxHeight: 180, overflowY: 'auto' }}>
                                    {summary?.itemsWithConflicts.map((item, i) => (
                                        <ListItem key={i} divider={i < (summary?.itemsWithConflicts.length || 0) - 1}>
                                            <ListItemText 
                                                primaryTypographyProps={{ component: 'div' }}
                                                primary={
                                                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                                                        <Typography variant="caption" fontWeight="bold">
                                                            {item.name}
                                                        </Typography>
                                                        <CounterChip count={item.impactCount} variant="warning" />
                                                    </Box>
                                                } 
                                            />
                                        </ListItem>
                                    ))}
                                </List>
                            </AccordionDetails>
                        </Accordion>

                        {extraActions && (
                            <Box sx={{ mt: 3, mb: 1 }}>
                                {extraActions}
                            </Box>
                        )}
                    </Box>
                ) : (
                    <Alert 
                        severity="success" 
                        icon={<CheckCircleOutlineIcon fontSize="inherit" />}
                        sx={{ mt: 2, borderRadius: 2, alignItems: 'center' }}
                    >
                        {summary?.totalTarget === 1 
                            ? `${art} ${resourceNameSingular} seleccionad${suffix} está libre de conflictos y puede ${actionVerb}se de forma segura.` 
                            : `${quant} ${arts.toLowerCase()} ${resourceNamePlural} seleccionad${suffix}s están libres de conflictos y pueden ${actionVerb}se de forma segura.`
                        }
                    </Alert>
                )}
            </DialogContent>

            <DialogActions sx={{ p: 3, bgcolor: '#fcfcfc', gap: 1 }}>
                <Button onClick={onClose} disabled={loading} color="inherit" sx={{ fontWeight: 'bold' }}>
                    Cancelar
                </Button>
                
                <Button 
                    onClick={() => onConfirm()} 
                    variant="contained" 
                    color={hasConflicts ? "error" : "primary"}
                    disabled={loading}
                    sx={{ fontWeight: 'bold', px: 3 }}
                >
                    {loading ? "Procesando..." : (hasConflicts ? confirmTextWithConflicts : `Confirmar ${actionNoun}`)}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default BulkDeleteConflictDialog;
