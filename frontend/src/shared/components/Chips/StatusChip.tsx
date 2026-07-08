import React from 'react';
import { Chip } from '@mui/material';
import { PHYSICAL_STATUS_COLORS } from '../../../theme/reservationTheme';

/**
 * Tipos de estados globales soportados.
 */
export type GlobalStatus = 'ACTIVO' | 'INACTIVO' | 'BLOQUEADO' | 'ELIMINADO' | 'PENDIENTE';

/**
 * Propiedades de configuración para el componente StatusChip.
 */
interface StatusChipProps {
    status: GlobalStatus | string;
    label?: string;
    size?: 'small' | 'medium';
}

/**
 * Chip de estado estandarizado para toda la aplicación.
 * Utiliza los colores definidos en el tema de reservas para mantener la consistencia visual.
 * 
 * @param props - Las propiedades del componente, como el estado y tamaño.
 * @returns {JSX.Element} El componente visual representativo del estado.
 */
const StatusChip: React.FC<StatusChipProps> = ({ status, label, size = 'small' }) => {
    const upperStatus = status.toUpperCase();
    
    // Configuración por defecto basada en PHYSICAL_STATUS_COLORS del tema
    let colors = PHYSICAL_STATUS_COLORS[upperStatus] || { bg: '#f1f3f4', text: '#70757a' };
    
    // Casos especiales si no están en PHYSICAL_STATUS_COLORS
    if (upperStatus === 'ACTIVO' || upperStatus === 'DISPONIBLE') {
        colors = PHYSICAL_STATUS_COLORS['DISPONIBLE'];
    } else if (upperStatus === 'INACTIVO') {
        colors = { bg: '#f5f5f5', text: '#616161' };
    } else if (upperStatus === 'PENDIENTE') {
        colors = { bg: '#e8f0fe', text: '#1967d2' };
    }

    const displayLabel = label || (upperStatus.charAt(0) + upperStatus.slice(1).toLowerCase());

    return (
        <Chip 
            label={displayLabel} 
            size={size}
            sx={{ 
                bgcolor: colors.bg, 
                color: colors.text, 
                fontWeight: 'bold', 
                fontSize: size === 'small' ? '0.75rem' : '0.875rem',
                minWidth: 70,
                border: 'none',
                height: size === 'small' ? 20 : 32
            }} 
        />
    );
};

export default StatusChip;
