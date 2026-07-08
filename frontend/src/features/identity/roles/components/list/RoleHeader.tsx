import React from 'react';
import AddIcon from '@mui/icons-material/Add';
import PageHeader, { type PageHeaderAction } from '../../../../../shared/components/PageHeader';

/**
 * Propiedades del componente {@link RoleHeader}.
 */
interface RoleHeaderProps {
    /** Indica si el usuario actual posee permisos para gestionar roles. */
    canManage: boolean;
    /** Función que se ejecuta al presionar el botón de añadir rol. */
    onAdd: () => void;
}

/**
 * Encabezado de la vista de listado de roles.
 * Proporciona el título principal y las acciones de página de más alto nivel (como la creación).
 * 
 * @param props - Propiedades necesarias para renderizar la cabecera.
 * @returns Componente JSX que representa el encabezado.
 */
const RoleHeader: React.FC<RoleHeaderProps> = ({ canManage, onAdd }) => {
    
    const actions: PageHeaderAction[] = canManage ? [
        {
            label: "Nuevo Rol",
            icon: <AddIcon />,
            onClick: onAdd,
            variant: "contained"
        }
    ] : [];

    return (
        <PageHeader 
            title="Gestión de Roles" 
            actions={actions} 
        />
    );
};

export default RoleHeader;
