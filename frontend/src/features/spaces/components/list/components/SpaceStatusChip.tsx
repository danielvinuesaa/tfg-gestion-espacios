import React from 'react';
import { Chip } from '@mui/material';
import { getPhysicalStatusColors, getDynamicStatusColors } from '../../../../../theme/reservationTheme';
import StatusChip from '../../../../../shared/components/Chips/StatusChip';

/**
 * Propiedades para el componente SpaceStatusChip.
 */
interface SpaceStatusChipProps {
    /** Estado del espacio a mostrar. */
    status: string;
    /** Tipo de estado a representar: físico o dinámico. */
    type: 'physical' | 'dynamic';
}

/**
 * Componente que renderiza un chip (etiqueta) visual para representar el estado de un espacio.
 * Adapta el color y la etiqueta mostrada en función de si el estado es global (como eliminado o bloqueado),
 * físico (estado de las instalaciones) o dinámico (estado de ocupación en un momento dado).
 *
 * @param props - Propiedades del componente.
 * @returns Elemento React que representa el estado mediante un chip.
 */
const SpaceStatusChip: React.FC<SpaceStatusChipProps> = ({ status, type }) => {
    const upperStatus = status.toUpperCase();
    
    // Si el estado es de los globales (Eliminado/Bloqueado), usamos el chip estandarizado
    if (upperStatus === 'ELIMINADO' || upperStatus === 'BLOQUEADO' || upperStatus === 'BLOQUEO') {
        const mappedStatus = upperStatus === 'BLOQUEO' ? 'BLOQUEADO' : upperStatus;
        return <StatusChip status={mappedStatus} />;
    }

    let label = status;
    let colors;

    if (type === 'physical') {
        label = status === 'DISPONIBLE' ? 'Disponible' : status;
        colors = getPhysicalStatusColors(status);
    } else {
        label = status === 'LIBRE' ? 'Libre' : (status === 'OCUPADO' ? 'En uso' : status);
        colors = getDynamicStatusColors(status);
    }

    return (
        <Chip 
            label={label} size="small" 
            sx={{ 
                bgcolor: colors.bg, 
                color: colors.text, 
                fontWeight: 'bold', 
                fontSize: '0.75rem', 
                minWidth: 80 
            }} 
        />
    );
};

export default SpaceStatusChip;
