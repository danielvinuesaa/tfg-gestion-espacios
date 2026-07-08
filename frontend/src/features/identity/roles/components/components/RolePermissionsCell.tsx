import React from 'react';
import { Box, Chip, Tooltip } from '@mui/material';
import type { Permission } from '../../../../../shared/types';
import { getCategoryByPermission } from '../../constants/roleConstants';

/**
 * Propiedades del componente {@link RolePermissionsCell}.
 */
interface RolePermissionsCellProps {
    /** Lista de permisos asociados al rol. */
    permissions: Permission[];
    /** Indica si el rol al que pertenecen los permisos está marcado como eliminado. */
    isDeleted: boolean;
}

/**
 * Componente de celda para tablas que visualiza de forma resumida los permisos de un rol.
 * Muestra los primeros permisos con su formato visual correspondiente y agrupa los restantes en un indicador extra.
 * 
 * @param props - Propiedades necesarias para renderizar la celda de permisos.
 * @returns Componente JSX con la representación visual condensada de los permisos.
 */
const RolePermissionsCell: React.FC<RolePermissionsCellProps> = ({ permissions, isDeleted }) => {
    const visiblePerms = permissions.slice(0, 2);
    const extraPermsCount = permissions.length - 2;

    return (
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
            {visiblePerms.map(p => {
                const cat = getCategoryByPermission(p.name);
                return (
                    <Chip 
                        key={p.name} label={p.label} size="small" disabled={isDeleted}
                        sx={{ 
                            bgcolor: cat.bgColor, color: cat.labelColor, 
                            fontWeight: '500', border: 'none', fontSize: '0.7rem'
                        }} 
                    />
                );
            })}
            {extraPermsCount > 0 && (
                <Tooltip title={permissions.slice(2).map(p => p.label).join(', ')}>
                    <Chip label={`+${extraPermsCount}`} size="small" variant="outlined" sx={{ height: 20, fontSize: '0.65rem' }} />
                </Tooltip>
            )}
        </Box>
    );
};

export default RolePermissionsCell;
