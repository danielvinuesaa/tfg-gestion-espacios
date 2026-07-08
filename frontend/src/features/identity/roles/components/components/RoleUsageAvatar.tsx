import React from 'react';
import { Box, Tooltip, Avatar } from '@mui/material';
import PeopleIcon from '@mui/icons-material/People';

/**
 * Propiedades del componente {@link RoleUsageAvatar}.
 */
interface RoleUsageAvatarProps {
    /** Número de usuarios activos que poseen el rol. */
    userCount: number;
    /** Número total de usuarios (activos y eliminados) que poseen o han poseído el rol. */
    totalUserCount: number;
}

/**
 * Componente visual que representa la cantidad de usuarios asignados a un rol mediante un avatar.
 * Diferencia entre usuarios activos y totales, mostrando la proporción si hay usuarios eliminados.
 * 
 * @param props - Propiedades necesarias para renderizar el avatar.
 * @returns Componente JSX que muestra el avatar de uso del rol.
 */
const RoleUsageAvatar: React.FC<RoleUsageAvatarProps> = ({ userCount, totalUserCount }) => {
    const hasDeletedUsers = totalUserCount > userCount;
    
    const tooltipText = hasDeletedUsers
        ? `${userCount} usuarios activos (${totalUserCount} en total incluyendo eliminados)`
        : userCount === 1 ? "1 usuario con este rol" : `${userCount} usuarios con este rol`;

    return (
        <Tooltip title={tooltipText}>
            <Box display="flex" flexDirection="column" alignItems="center">
                <Avatar 
                    sx={{ 
                        width: hasDeletedUsers ? 'auto' : 26, 
                        height: 26, 
                        px: hasDeletedUsers ? 1 : 0,
                        borderRadius: hasDeletedUsers ? 2 : '50%',
                        bgcolor: userCount > 0 ? 'primary.light' : (totalUserCount > 0 ? 'warning.light' : '#f0f0f0'),
                        color: (userCount > 0 || totalUserCount > 0) ? 'primary.contrastText' : 'text.disabled',
                        fontSize: '0.7rem', fontWeight: 'bold'
                    }}
                >
                    {hasDeletedUsers ? `${userCount} / ${totalUserCount}` : userCount}
                </Avatar>
                <PeopleIcon sx={{ fontSize: 12, mt: 0.2, color: 'text.disabled' }} />
            </Box>
        </Tooltip>
    );
};

export default RoleUsageAvatar;
