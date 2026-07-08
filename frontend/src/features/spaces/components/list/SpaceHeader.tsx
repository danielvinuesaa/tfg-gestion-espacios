import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import AddIcon from '@mui/icons-material/Add';
import PageHeader, { type PageHeaderAction } from '../../../../shared/components/PageHeader';

/**
 * Propiedades para el componente SpaceHeader.
 */
interface SpaceHeaderProps {
    /** Indica si el usuario tiene permisos para crear un nuevo espacio o importar datos. */
    canCreate: boolean;
    /** Indica si el usuario tiene permisos para exportar la información a CSV. */
    canExport: boolean;
    /** Indica si la lista actual de espacios se encuentra vacía. */
    isEmpty: boolean;
    /** Función a ejecutar para exportar los espacios a un archivo CSV. */
    handleExport: () => void;
    /** Función a ejecutar al accionar la importación de datos. */
    onImportClick: () => void;
    /** Función a ejecutar al solicitar la creación de un nuevo espacio. */
    onAddClick: () => void;
}

/**
 * Componente de cabecera para el módulo de gestión de espacios.
 * Emplea el componente genérico PageHeader para mostrar el título y definir las
 * acciones principales (exportar, importar y añadir) en función de los permisos otorgados.
 *
 * @param props - Propiedades del componente.
 * @returns Elemento React que representa la cabecera de la página.
 */
const SpaceHeader = ({ canCreate, canExport, isEmpty, handleExport, onImportClick, onAddClick }: SpaceHeaderProps) => {
    
    const actions: PageHeaderAction[] = [
        {
            label: "Exportar CSV",
            icon: <FileDownloadIcon />,
            onClick: handleExport,
            visible: canExport,
            disabled: isEmpty
        },
        {
            label: "Importar CSV",
            icon: <CloudUploadIcon />,
            onClick: onImportClick,
            visible: canCreate
        },
        {
            label: "Nuevo Espacio",
            icon: <AddIcon />,
            onClick: onAddClick,
            visible: canCreate,
            variant: "contained"
        }
    ];

    return (
        <PageHeader 
            title="Gestión de Espacios" 
            actions={actions} 
        />
    );
};

export default SpaceHeader;
