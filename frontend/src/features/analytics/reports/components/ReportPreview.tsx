import { Box, Typography, IconButton, Stack, Tooltip, Button } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import FullscreenIcon from '@mui/icons-material/Fullscreen';
import FileDownloadIcon from '@mui/icons-material/FileDownload';

/**
 * Propiedades requeridas para el componente ReportPreview.
 */
interface ReportPreviewProps {
    /** URL del documento PDF generado que se va a previsualizar. */
    url: string;
    /** Función invocada para cerrar la vista previa y regresar a la configuración. */
    onClose: () => void;
    /** Función invocada para descargar el documento PDF. */
    onDownload: () => void;
}

/**
 * Componente interactivo para la previsualización integrada de informes en formato PDF.
 * Provee herramientas para la visualización en pantalla completa, descarga del documento y cierre del visor.
 *
 * @param props - Las propiedades que incluyen la URL del documento y las funciones de acción.
 * @returns Un elemento JSX que encapsula el visor PDF y sus controles asociados.
 */
const ReportPreview = ({ url, onClose, onDownload }: ReportPreviewProps) => {
    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 650 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6" fontWeight="bold">Vista Previa del Reporte</Typography>
                <Stack direction="row" spacing={1}>
                    <Tooltip title="Ver en pantalla completa">
                        <IconButton onClick={() => window.open(url, '_blank')}>
                            <FullscreenIcon />
                        </IconButton>
                    </Tooltip>
                    <Tooltip title="Cerrar vista previa">
                        <IconButton onClick={onClose}><CloseIcon /></IconButton>
                    </Tooltip>
                </Stack>
            </Box>

            <Box sx={{ flexGrow: 1, border: '1px solid #eee', borderRadius: 2, overflow: 'hidden', bgcolor: '#f5f5f5' }}>
                <iframe 
                    src={url} 
                    width="100%" 
                    height="100%" 
                    style={{ border: 'none', minHeight: 500 }}
                    title="Vista previa PDF"
                />
            </Box>

            <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
                <Button variant="outlined" onClick={onClose} sx={{ borderRadius: 2 }}>
                    Cambiar Selección
                </Button>
                <Button 
                    variant="contained" 
                    color="success" 
                    startIcon={<FileDownloadIcon />}
                    onClick={onDownload}
                    sx={{ borderRadius: 2, fontWeight: 'bold' }}
                >
                    Descargar PDF Final
                </Button>
            </Box>
        </Box>
    );
};

export default ReportPreview;
