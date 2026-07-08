import AddIcon from '@mui/icons-material/Add';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import PageHeader, { type PageHeaderAction } from '../../../../shared/components/PageHeader';

/**
 * Propiedades del componente ReservationHeader.
 */
interface ReservationHeaderProps {
    title: string;
    canRequest: boolean;
    isEmpty: boolean;
    canImport?: boolean;
    canExport?: boolean;
    onAddClick: () => void;
    onImportClick?: () => void;
    onExportClick?: () => void;
}

/**
 * Componente superior para la cabecera del módulo de Reservas.
 * 
 * Se apoya en el componente genérico `PageHeader` para la presentación de un título contextual
 * y centraliza las acciones globales de la vista (exportación, importación masiva y solicitud 
 * de nueva reserva) evaluando la visibilidad de los controles en función de los permisos de 
 * acceso del rol activo.
 * 
 * @param props - Propiedades de configuración de la cabecera.
 * @param props.title - Título principal a mostrar en la parte superior de la vista.
 * @param props.canRequest - Permiso booleano para mostrar el botón de solicitud de nueva reserva.
 * @param props.isEmpty - Flag booleano que indica si la tabla carece de registros; utilizado para inhabilitar exportaciones.
 * @param props.canImport - Permiso booleano que determina si se ofrece la funcionalidad de importación CSV.
 * @param props.canExport - Permiso booleano que determina si se ofrece la funcionalidad de exportación CSV.
 * @param props.onAddClick - Callback invocado al presionar el botón de creación.
 * @param props.onImportClick - Callback invocado al accionar la opción de importar.
 * @param props.onExportClick - Callback invocado al accionar la opción de exportar.
 * @returns Elemento React para la cabecera del módulo, incluyendo su botonera principal.
 */
const ReservationHeader = ({ 
    title, canRequest, isEmpty, canImport, canExport, 
    onAddClick, onImportClick, onExportClick 
}: ReservationHeaderProps) => {
    
    const actions: PageHeaderAction[] = [
        {
            label: "Exportar CSV",
            icon: <FileDownloadIcon />,
            onClick: onExportClick || (() => {}),
            visible: canExport && !!onExportClick,
            disabled: isEmpty
        },
        {
            label: "Importar CSV",
            icon: <CloudUploadIcon />,
            onClick: onImportClick || (() => {}),
            visible: canImport && !!onImportClick
        },
        {
            label: "Nueva Reserva",
            icon: <AddIcon />,
            onClick: onAddClick,
            visible: canRequest,
            variant: "contained"
        }
    ];

    return (
        <PageHeader 
            title={title} 
            actions={actions} 
        />
    );
};

export default ReservationHeader;
