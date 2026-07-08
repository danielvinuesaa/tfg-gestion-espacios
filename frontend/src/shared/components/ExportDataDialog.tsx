import React, { useState } from 'react';
import {
    Dialog, DialogTitle, DialogContent, DialogActions, Button,
    FormGroup, FormControlLabel, Checkbox, Typography, Box, Divider
} from '@mui/material';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import InfoIcon from '@mui/icons-material/Info';

/**
 * Representa una columna seleccionable para exportación.
 */
export interface ExportColumn {
    /** Identificador único de la columna. */
    id: string;
    /** Etiqueta visible para el usuario. */
    label: string;
}

/**
 * Propiedades del componente ExportDataDialog.
 */
interface ExportDataDialogProps {
    /** Indica si el diálogo está visible. */
    open: boolean;
    /** Función de callback para cerrar el diálogo. */
    onClose: () => void;
    /** Función de callback invocada al confirmar la exportación, recibe las columnas seleccionadas. */
    onExport: (columns: string[]) => void;
    /** Título del diálogo. */
    title: string;
    /** Lista de columnas disponibles para exportar. */
    columns: ExportColumn[];
    /** Lista de identificadores de columnas seleccionadas por defecto. */
    defaultSelected?: string[];
    /** Mensaje informativo opcional a mostrar en el diálogo. */
    infoMessage?: string;
}

/**
 * Diálogo genérico y reutilizable para exportación de datos.
 * Mantiene la consistencia visual en toda la aplicación.
 * 
 * @param props - Las propiedades del componente.
 * @returns {JSX.Element} El componente de diálogo para exportar datos.
 */
const ExportDataDialog = ({ 
    open, onClose, onExport, title, columns, defaultSelected, infoMessage 
}: ExportDataDialogProps) => {
    const [selected, setSelected] = useState<string[]>(defaultSelected || columns.map(c => c.id));

    const handleToggle = (id: string) => {
        setSelected(prev => 
            prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
        );
    };

    const handleSelectAll = () => {
        if (selected.length === columns.length) {
            setSelected([]);
        } else {
            setSelected(columns.map(c => c.id));
        }
    };

    const handleConfirm = () => {
        // Aseguramos que el orden de las columnas exportadas sea siempre el mismo 
        // que el definido en la lista de 'columns' original, independientemente
        // del orden en que el usuario haya hecho clic en los checkboxes.
        const sortedSelected = columns
            .filter(col => selected.includes(col.id))
            .map(col => col.id);
            
        onExport(sortedSelected);
        onClose();
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
            <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <FileDownloadIcon color="primary" />
                {title}
            </DialogTitle>
            
            <DialogContent dividers>
                <Typography variant="body2" color="text.secondary" paragraph>
                    Selecciona las columnas que deseas incluir en el archivo CSV generado.
                </Typography>

                {infoMessage && (
                    <Box sx={{ bgcolor: '#e3f2fd', p: 1.5, borderRadius: 1, mb: 2, display: 'flex', gap: 1 }}>
                        <InfoIcon fontSize="small" color="primary" />
                        <Typography variant="caption" color="primary.dark">
                            {infoMessage}
                        </Typography>
                    </Box>
                )}

                <Box sx={{ mb: 1, display: 'flex', justifyContent: 'flex-end' }}>
                    <Button size="small" onClick={handleSelectAll}>
                        {selected.length === columns.length ? "Desmarcar todo" : "Seleccionar todo"}
                    </Button>
                </Box>

                <Divider sx={{ mb: 2 }} />

                <FormGroup>
                    {columns.map(col => (
                        <FormControlLabel
                            key={col.id}
                            control={
                                <Checkbox 
                                    checked={selected.includes(col.id)} 
                                    onChange={() => handleToggle(col.id)} 
                                    size="small"
                                />
                            }
                            label={<Typography variant="body2">{col.label}</Typography>}
                        />
                    ))}
                </FormGroup>
            </DialogContent>

            <DialogActions sx={{ p: 2 }}>
                <Button onClick={onClose} color="inherit">Cancelar</Button>
                <Button 
                    onClick={handleConfirm} 
                    variant="contained" 
                    disabled={selected.length === 0}
                    startIcon={<FileDownloadIcon />}
                >
                    Generar CSV
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default ExportDataDialog;
