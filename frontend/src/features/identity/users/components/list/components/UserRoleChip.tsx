import React from 'react';
import { Chip } from '@mui/material';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import SchoolIcon from '@mui/icons-material/School';
import ManageAccountsIcon from '@mui/icons-material/ManageAccounts';
import PersonIcon from '@mui/icons-material/Person';

/**
 * Propiedades del componente UserRoleChip.
 */
interface UserRoleChipProps {
    roleName: string;
    isDeleted?: boolean;
}

/**
 * Determina la configuración visual (color de fondo, color de texto e icono) dependiendo del nombre del rol.
 *
 * @param roleName - Nombre del rol del usuario (por ejemplo, 'ADMIN', 'GESTOR', 'PROFESOR').
 * @returns Objeto con las propiedades de estilo y el icono correspondiente al rol.
 */
const getRoleConfig = (roleName: string) => {
    switch (roleName) {
        case 'ADMIN':
            return { bgcolor: '#ffebee', color: '#c62828', icon: <AdminPanelSettingsIcon fontSize="small" /> };
        case 'GESTOR':
            return { bgcolor: '#fff3e0', color: '#ef6c00', icon: <ManageAccountsIcon fontSize="small" /> };
        case 'PROFESOR':
            return { bgcolor: '#e3f2fd', color: '#1565c0', icon: <SchoolIcon fontSize="small" /> };
        default:
            return { bgcolor: '#f5f5f5', color: '#616161', icon: <PersonIcon fontSize="small" /> };
    }
};

/**
 * Componente visual que muestra una etiqueta (chip) estilizada indicando el rol asignado a un usuario.
 *
 * @param props - Propiedades del componente.
 * @param props.roleName - Nombre del rol a mostrar en la etiqueta.
 * @param props.isDeleted - (Opcional) Indica si el usuario está eliminado, lo cual deshabilitará visualmente el chip.
 * @returns Elemento de React que representa la etiqueta del rol.
 */
const UserRoleChip: React.FC<UserRoleChipProps> = ({ roleName, isDeleted }) => {
    const config = getRoleConfig(roleName);
    return (
        <Chip 
            icon={config.icon} label={roleName} size="small" 
            disabled={isDeleted}
            sx={{ 
                bgcolor: config.bgcolor, 
                color: config.color, 
                fontWeight: 'bold', 
                border: 'none', 
                '& .MuiChip-icon': { color: config.color } 
            }} 
        />
    );
};

export default UserRoleChip;
