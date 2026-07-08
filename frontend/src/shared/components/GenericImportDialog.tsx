import React, { useState } from 'react';
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
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    Divider
} from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import { useApi } from '../utils/api';
import { useQueryClient } from '@tanstack/react-query';

/**
 * Interfaz genérica para la configuración de cada módulo de importación.
 */
interface ImportConfig<TConflict> {
    title: string;
    icon: React.ReactNode;
    apiEndpoints: {
        validate: string;
        import: string;
    };
    // CLAVE PARA REFRESCAR: Si se proporciona, el componente refrescará esta caché automáticamente
    queryKey?: string[];
    csvFormat: string;
    instructions: string[];
    renderConflictRow: (conflict: TConflict) => {
        identity: React.ReactNode;
        changes: React.ReactNode;
        status: React.ReactNode;
    };
    conflictAlertMessage: (count: number, result: any) => React.ReactNode;
    hideOverwrite?: boolean;
    labels?: {
        new?: string;
        newPlural?: string;
    };
}

/**
 * Propiedades del componente GenericImportDialog.
 * @template TConflict - Tipo del objeto que representa un conflicto en la importación.
 */
interface GenericImportDialogProps<TConflict> {
    /** Indica si el diálogo está abierto. */
    open: boolean;
    /** Función para cerrar el diálogo. */
    handleClose: () => void;
    /** Función de callback en caso de importación exitosa. */
    onSuccess: (message?: string) => void;
    /** Objeto de configuración específico del módulo. */
    config: ImportConfig<TConflict>;
}

/**
 * Componente de Importación Genérico de Alto Nivel.
 * 
 * Centraliza la lógica de carga de archivos, validación en dos pasos, gestión de 
 * conflictos y resumen de resultados.
 * 
 * @template TConflict - El tipo del objeto de conflicto.
 * @param props - Las propiedades del componente.
 * @returns {JSX.Element} El componente visual del diálogo de importación.
 */
function GenericImportDialog<TConflict>({ open, handleClose, onSuccess, config }: GenericImportDialogProps<TConflict>) {
    const { request } = useApi();
    const queryClient = useQueryClient();
    const [file, setFile] = useState<File | null>(null);
    const [loading, setLoading] = useState(false);
    const [step, setStep] = useState<'upload' | 'validate' | 'result'>('upload');
    const [result, setResult] = useState<any | null>(null);
    const [error, setError] = useState<string | null>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            const selectedFile = e.target.files[0];
            const isCsv = selectedFile.name.toLowerCase().endsWith('.csv');
            
            if (!isCsv) {
                setFile(null);
                setError("El archivo seleccionado no es un CSV válido.");
                return;
            }

            setFile(selectedFile);
            setResult(null);
            setError(null);
        }
    };

    const handleAction = async (endpoint: string, overwrite: boolean = false) => {
        if (!file) return;
        setLoading(true);
        setError(null);
        
        const formData = new FormData();
        formData.append('file', file);
        if (overwrite) formData.append('overwrite', 'true');

        try {
            const data = await request(endpoint, {
                method: 'POST',
                body: formData
            });
            
            setResult(data);
            
            if (endpoint === config.apiEndpoints.validate) {
                setStep('validate');
            } else {
                setStep('result');
                if (data.successCount > 0) {
                    // SI HAY ÉXITO: Invalidamos la query si se ha configurado
                    if (config.queryKey) {
                        queryClient.invalidateQueries({ queryKey: config.queryKey });
                    }
                    onSuccess(`Importación finalizada: ${data.successCount} registros procesados correctamente.`);
                }
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : "Error desconocido");
        } finally {
            setLoading(false);
        }
    };

    const handleReset = () => {
        setFile(null);
        setResult(null);
        setError(null);
        setStep('upload');
        handleClose();
    };

    const renderUpload = () => (
        <Box sx={{ py: 2 }}>
            <Typography variant="body2" gutterBottom color="textSecondary">
                Sube un archivo CSV con el formato: <strong>{config.csvFormat}</strong>
            </Typography>
            
            <Box sx={{ mt: 2, p: 2, bgcolor: '#f5f5f5', borderRadius: 1 }}>
                {config.instructions.map((inst, idx) => (
                    <Typography key={idx} variant="caption" display="block" color="textSecondary">
                        • {inst}
                    </Typography>
                ))}
            </Box>

            <Button
                variant="outlined"
                component="label"
                startIcon={<CloudUploadIcon />}
                fullWidth
                sx={{ mt: 3, py: 4, borderStyle: 'dashed' }}
            >
                Seleccionar Archivo CSV de {config.title.split(' ')[1] || 'Datos'}
                <input type="file" hidden accept=".csv" onChange={handleFileChange} />
            </Button>
            {file && <Typography variant="subtitle2" sx={{ mt: 2, textAlign: 'center', fontWeight: 'bold', color: 'primary.main' }}>📄 {file.name}</Typography>}
            {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
        </Box>
    );

    const renderValidate = () => {
        const conflictCount = result?.conflicts?.length || 0;
        const errorCount = result?.errors?.length || 0;
        const totalRows = (result?.newCount || 0) + conflictCount + errorCount;
        const newCount = result?.newCount || 0;

        const labelNew = config.labels?.new || 'Nuevo';
        const labelNewPlural = config.labels?.newPlural || 'Nuevos';

        return (
            <Box sx={{ mt: 1 }}>
                <Box sx={{ mb: 3, display: 'flex', gap: 2 }}>
                    <Paper variant="outlined" sx={{ p: 1.5, flex: 1, textAlign: 'center', bgcolor: '#f8f9fa' }}>
                        <Typography variant="h6" color="primary.main">{newCount}</Typography>
                        <Typography variant="caption" fontWeight="bold">{newCount === 1 ? labelNew : labelNewPlural}</Typography>
                    </Paper>
                    <Paper variant="outlined" sx={{ p: 1.5, flex: 1, textAlign: 'center', bgcolor: conflictCount > 0 ? '#fffef2' : '#f8f9fa' }}>
                        <Typography variant="h6" color="warning.main">{conflictCount}</Typography>
                        <Typography variant="caption" fontWeight="bold">{conflictCount === 1 ? 'Conflicto' : 'Conflictos'}</Typography>
                    </Paper>
                    {errorCount > 0 && (
                        <Paper variant="outlined" sx={{ p: 1.5, flex: 1, textAlign: 'center', bgcolor: '#fff5f5' }}>
                            <Typography variant="h6" color="error.main">{errorCount}</Typography>
                            <Typography variant="caption" fontWeight="bold">{errorCount === 1 ? 'Error' : 'Errores'}</Typography>
                        </Paper>
                    )}
                </Box>

                {config.conflictAlertMessage(conflictCount, result)}

                <Typography variant="subtitle2" sx={{ mt: 3, mb: 1, fontWeight: 'bold' }}>
                    Detalle de Conflictos y Actualizaciones
                </Typography>
                
                <TableContainer component={Paper} sx={{ mt: 1, maxHeight: 300 }}>
                <Table size="small" stickyHeader>
                    <TableHead>
                        <TableRow>
                            <TableCell>Identificador / Datos CSV</TableCell>
                            <TableCell>Cambios Detectados</TableCell>
                            <TableCell align="center">Estado</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {result?.conflicts?.map((c: TConflict, i: number) => {
                            const row = config.renderConflictRow(c);
                            return (
                                <TableRow key={i}>
                                    <TableCell>{row.identity}</TableCell>
                                    <TableCell>{row.changes}</TableCell>
                                    <TableCell align="center">{row.status}</TableCell>
                                </TableRow>
                            );
                        })}
                    </TableBody>
                </Table>
            </TableContainer>
            
            {result?.errors?.length > 0 && (
                <Box sx={{ mt: 2 }}>
                    <Typography variant="caption" color="error">Errores de formato ({result.errors.length})</Typography>
                    <Box sx={{ maxHeight: 100, overflow: 'auto', bgcolor: '#fff5f5', p: 1, borderRadius: 1 }}>
                        {result.errors.slice(0, 5).map((e: string, i: number) => (
                            <Typography key={i} variant="caption" display="block">• {e}</Typography>
                        ))}
                    </Box>
                </Box>
            )}
        </Box>
        );
    };

    const renderResult = () => (
        <Box sx={{ textAlign: 'center', py: 2 }}>
            <CheckCircleOutlineIcon color="success" sx={{ fontSize: 60 }} />
            <Typography variant="h6" sx={{ mt: 2 }}>{config.title} Finalizada</Typography>
            <Box sx={{ display: 'flex', justifyContent: 'center', gap: 4, mt: 3 }}>
                <Box>
                    <Typography variant="h4" color="success.main">{result?.successCount || 0}</Typography>
                    <Typography variant="caption">{result?.successCount === 1 ? 'Éxito' : 'Éxitos'}</Typography>
                </Box>
                <Divider orientation="vertical" flexItem />
                <Box>
                    <Typography variant="h4" color="error.main">{result?.failureCount || 0}</Typography>
                    <Typography variant="caption">{result?.failureCount === 1 ? 'Fallo' : 'Fallos'}</Typography>
                </Box>
            </Box>
            {result?.errors?.length > 0 && (
                <Alert severity="info" sx={{ mt: 3, textAlign: 'left' }}>
                    Se omitieron algunas filas debido a conflictos técnicos o errores de formato.
                </Alert>
            )}
        </Box>
    );

    return (
        <Dialog open={open} onClose={handleReset} maxWidth="md" fullWidth>
            <DialogTitle sx={{ 
                bgcolor: 'primary.main', 
                color: 'white', 
                display: 'flex', 
                alignItems: 'center', 
                gap: 1 
            }}>
                {config.icon}
                {step === 'upload' && config.title}
                {step === 'validate' && "Validación de Datos"}
                {step === 'result' && "Resumen de Importación"}
            </DialogTitle>
            <DialogContent dividers>
                {loading && (
                    <Box display="flex" flexDirection="column" alignItems="center" py={4}>
                        <CircularProgress />
                        <Typography variant="body2" sx={{ mt: 2 }}>Procesando catálogo...</Typography>
                    </Box>
                )}
                {!loading && step === 'upload' && renderUpload()}
                {!loading && step === 'validate' && renderValidate()}
                {!loading && step === 'result' && renderResult()}
            </DialogContent>
            <DialogActions sx={{ p: 2 }}>
                <Button onClick={handleReset} color="inherit">
                    {step === 'result' ? "Cerrar" : "Cancelar"}
                </Button>
                
                {!loading && step === 'upload' && (
                    <Button onClick={() => handleAction(config.apiEndpoints.validate)} variant="contained" disabled={!file}>
                        Validar Archivo
                    </Button>
                )}
                
                {!loading && step === 'validate' && (
                    <>
                        {/* Solo permitimos importar si hay algo útil (nuevos o conflictos procesables) */}
                        <Button 
                            onClick={() => handleAction(config.apiEndpoints.import, false)} 
                            variant="contained" 
                            color="primary"
                            disabled={(result?.newCount || 0) === 0}
                        >
                            {config.hideOverwrite ? "Confirmar Importación" : "Importar solo nuevos"}
                        </Button>
                        
                        {!config.hideOverwrite && (
                            <Button 
                                onClick={() => handleAction(config.apiEndpoints.import, true)} 
                                variant="contained" 
                                color="warning"
                                disabled={(result?.conflicts?.length || 0) === 0}
                            >
                                Importar y actualizar existentes
                            </Button>
                        )}
                    </>
                )}
            </DialogActions>
        </Dialog>
    );
}

export default GenericImportDialog;
