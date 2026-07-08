import React, { useMemo } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Grid,
    Box,
    FormControlLabel,
    Checkbox,
    Typography,
    IconButton,
    Divider,
    Paper
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import SchoolIcon from '@mui/icons-material/School';
import DeleteSweepIcon from '@mui/icons-material/DeleteSweep';
import type { Subject } from '../../../../shared/types';

/**
 * Propiedades del componente {@link SubjectSelectorDialog}.
 */
interface SubjectSelectorDialogProps {
    /** Indica si el diálogo está visible */
    open: boolean;
    /** Callback para cerrar el diálogo */
    onClose: () => void;
    /** Catálogo completo de asignaturas disponibles */
    subjects: Subject[];
    /** Lista de IDs de las asignaturas actualmente seleccionadas */
    selectedIds: number[];
    /** Callback para alternar la selección de una asignatura */
    onToggle: (id: number) => void;
    /** Callback para limpiar toda la selección */
    onClearAll: () => void;
}

/**
 * Diálogo especializado para la selección del ámbito de gestión (asignaturas).
 * 
 * Agrupa las asignaturas por curso para facilitar la navegación y permite
 * una selección granular o limpieza masiva de la selección.
 * Mantiene la consistencia visual con la suite administrativa del sistema.
 */
const SubjectSelectorDialog: React.FC<SubjectSelectorDialogProps> = ({
    open,
    onClose,
    subjects,
    selectedIds,
    onToggle,
    onClearAll
}) => {
    /**
     * Agrupa las asignaturas por curso para una presentación jerárquica.
     * Memorizado para evitar cálculos redundantes en cada renderizado.
     */
    const subjectsByCourse = useMemo(() => {
        const groups: Record<string, Subject[]> = {};
        subjects.forEach(s => {
            const courseKey = s.course || 'Otros';
            if (!groups[courseKey]) groups[courseKey] = [];
            groups[courseKey].push(s);
        });
        return groups;
    }, [subjects]);

    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth scroll="paper">
            {/* Cabecera Profesional Unificada */}
            <DialogTitle sx={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center', 
                bgcolor: '#f8f9fa',
                borderBottom: 1,
                borderColor: 'divider',
                py: 2
            }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <SchoolIcon color="primary" />
                    <Typography variant="h6" fontWeight="bold">Ámbito de Gestión: Asignaturas</Typography>
                </Box>
                <IconButton onClick={onClose} size="small" sx={{ color: 'text.secondary' }}>
                    <CloseIcon />
                </IconButton>
            </DialogTitle>

            <DialogContent sx={{ p: 0 }}>
                <Box sx={{ p: 3 }}>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                        Seleccione las asignaturas que los usuarios con este rol tendrán permiso para supervisar y aprobar.
                    </Typography>

                    {Object.entries(subjectsByCourse)
                        .sort(([a], [b]) => a.localeCompare(b))
                        .map(([course, courseSubjects]) => (
                            <Box key={course} sx={{ mb: 4 }}>
                                {/* Divisor de Sección por Curso (Consistente con Formularios) */}
                                <Divider textAlign="left" sx={{ mb: 2 }}>
                                    <Typography variant="caption" sx={{ fontWeight: 'bold', color: 'primary.main', textTransform: 'uppercase' }}>
                                        Curso {course}
                                    </Typography>
                                </Divider>

                                <Paper variant="outlined" sx={{ p: 1, bgcolor: '#fafafa', borderRadius: 2 }}>
                                    <Grid container spacing={0}>
                                        {courseSubjects.map(subject => (
                                            <Grid item xs={12} key={subject.id}>
                                                <FormControlLabel
                                                    sx={{ 
                                                        width: '100%', 
                                                        margin: 0, 
                                                        px: 1,
                                                        borderRadius: 1,
                                                        '&:hover': { bgcolor: 'rgba(0,0,0,0.02)' }
                                                    }}
                                                    control={
                                                        <Checkbox 
                                                            checked={selectedIds.includes(subject.id)}
                                                            onChange={() => onToggle(subject.id)}
                                                            size="small"
                                                        />
                                                    }
                                                    label={
                                                        <Box sx={{ display: 'flex', alignItems: 'center', py: 0.5 }}>
                                                            <Typography variant="body2" component="span" fontWeight="bold" sx={{ mr: 2, minWidth: '65px', color: 'text.secondary' }}>
                                                                {subject.code}
                                                            </Typography>
                                                            <Typography variant="body2" component="span" color="text.primary">
                                                                {subject.name}
                                                            </Typography>
                                                        </Box>
                                                    }
                                                />
                                            </Grid>
                                        ))}
                                    </Grid>
                                </Paper>
                            </Box>
                        ))}
                </Box>
            </DialogContent>

            {/* Acciones del Diálogo Unificadas */}
            <DialogActions sx={{ 
                p: 2.5, 
                bgcolor: '#f8f9fa', 
                borderTop: 1, 
                borderColor: 'divider',
                justifyContent: 'space-between'
            }}>
                <Button 
                    onClick={onClearAll} 
                    color="inherit" 
                    startIcon={<DeleteSweepIcon />}
                    sx={{ textTransform: 'none' }}
                    disabled={selectedIds.length === 0}
                >
                    Deseleccionar todas
                </Button>
                <Button 
                    onClick={onClose} 
                    variant="contained" 
                    color="primary"
                    sx={{ px: 4, fontWeight: 'bold' }}
                >
                    Aceptar ({selectedIds.length})
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default SubjectSelectorDialog;
