import { Box, Divider, Button, CircularProgress, Alert } from '@mui/material';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import FileDownloadIcon from '@mui/icons-material/FileDownload';

/**
 * Propiedades para el componente ReportActionFooter.
 */
interface ReportActionFooterProps {
    /** Indica si actualmente se está procesando una solicitud de generación. */
    loading: boolean;
    /** Indica si los controles deben estar deshabilitados (ej. por configuración incompleta). */
    disabled: boolean;
    /**
     * Función invocada cuando se solicita una acción de generación.
     * @param action - El formato en el que se desea generar el informe ('PDF' o 'CSV').
     */
    onAction: (action: 'PDF' | 'CSV') => void;
}

/**
 * Componente modular que renderiza el pie de página de acciones para la generación de informes.
 * Centraliza los botones de previsualización (PDF) y exportación de datos (CSV), además de mostrar
 * las advertencias legales o avisos sobre los datos procesados.
 *
 * @param props - Propiedades que controlan el estado de carga, habilitación y las funciones de acción.
 * @returns Un elemento JSX que contiene las acciones de generación.
 */
const ReportActionFooter = ({ loading, disabled, onAction }: ReportActionFooterProps) => {
    return (
        <Box sx={{ mt: 4 }}>
            <Divider sx={{ mb: 3 }} />
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                <Button 
                    variant="contained" 
                    size="large"
                    startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <PictureAsPdfIcon />}
                    onClick={() => onAction('PDF')}
                    disabled={loading || disabled}
                    sx={{ borderRadius: 2, px: 4, fontWeight: 'bold' }}
                >
                    {loading ? "Generando..." : "Ver Vista Previa"}
                </Button>
                
                <Button 
                    variant="outlined" 
                    color="inherit" 
                    size="large"
                    startIcon={<FileDownloadIcon />}
                    onClick={() => onAction('CSV')}
                    disabled={loading || disabled}
                    sx={{ borderRadius: 2, px: 4, fontWeight: 'bold' }}
                >
                    Exportar CSV
                </Button>
            </Box>
            
            <Alert severity="warning" sx={{ mt: 3, borderRadius: 2 }}>
                Los informes solo contemplan reservas con estado <strong>APROBADA</strong> para garantizar la veracidad de los datos.
            </Alert>
        </Box>
    );
};

export default ReportActionFooter;
