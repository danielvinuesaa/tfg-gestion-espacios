import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import AddIcon from '@mui/icons-material/Add';
import PageHeader, { type PageHeaderAction } from '../../../../../shared/components/PageHeader';

/**
 * Propiedades del componente UserHeader.
 */
interface UserHeaderProps {
    canManage: boolean;
    isEmpty: boolean;
    onExport: () => void;
    onImportClick: () => void;
    onAddClick: () => void;
}

/**
 * Cabecera superior del módulo de Usuarios.
 * Integra acciones como exportar, importar y añadir un nuevo usuario.
 *
 * @param props - Propiedades del componente.
 * @param props.canManage - Indica si el usuario actual posee permisos de gestión.
 * @param props.isEmpty - Indica si el listado de usuarios se encuentra vacío.
 * @param props.onExport - Función delegada para ejecutar la exportación de usuarios.
 * @param props.onImportClick - Función delegada para abrir el diálogo de importación de usuarios.
 * @param props.onAddClick - Función delegada para abrir el formulario de creación de un nuevo usuario.
 * @returns Elemento de React con la estructura de la cabecera de la página.
 */
const UserHeader = ({ canManage, isEmpty, onExport, onImportClick, onAddClick }: UserHeaderProps) => {
    
    const actions: PageHeaderAction[] = [
        {
            label: "Exportar CSV",
            icon: <FileDownloadIcon />,
            onClick: onExport,
            visible: canManage,
            disabled: isEmpty
        },
        {
            label: "Importar CSV",
            icon: <CloudUploadIcon />,
            onClick: onImportClick,
            visible: canManage
        },
        {
            label: "Nuevo Usuario",
            icon: <AddIcon />,
            onClick: onAddClick,
            visible: canManage,
            variant: "contained"
        }
    ];

    return (
        <PageHeader 
            title="Gestión de Usuarios" 
            actions={actions} 
        />
    );
};

export default UserHeader;
