import React from 'react';
import { Chip } from '@mui/material';
import type { SxProps, Theme } from '@mui/material';

/**
 * Propiedades del componente ReservationStatusChip.
 */
interface ReservationStatusChipProps {
    status: string;
    sx?: SxProps<Theme>;
}

/**
 * Obtiene la configuración visual basada en el estado de la reserva.
 * 
 * @param status - El estado actual de la reserva.
 * @returns {{bgcolor: string, color: string, label: string}} Un objeto con colores y etiqueta.
 */
const getStatusConfig = (status: string) => {
    switch (status) {
        case 'APROBADA':
            return { bgcolor: '#e8f5e9', color: '#2e7d32', label: 'Aprobada' };
        case 'SOLICITADA':
            return { bgcolor: '#e3f2fd', color: '#1565c0', label: 'Pendiente' };
        case 'RECHAZADA':
            return { bgcolor: '#ffebee', color: '#c62828', label: 'Rechazada' };
        case 'CANCELADA':
            return { bgcolor: '#fafafa', color: '#9e9e9e', label: 'Cancelada' };
        case 'BLOQUEO':
            return { bgcolor: '#f0f4f8', color: '#455a64', label: 'Bloqueo' };
        default:
            return { bgcolor: '#f5f5f5', color: '#616161', label: status };
    }
};

/**
 * Componente visual que representa el estado de una reserva en formato de chip.
 * 
 * @param props - Propiedades del componente.
 * @returns {JSX.Element} El chip estilizado correspondiente al estado de la reserva.
 */
const ReservationStatusChip: React.FC<ReservationStatusChipProps> = ({ status, sx }) => {
    const config = getStatusConfig(status);
    return (
        <Chip 
            label={config.label} 
            size="small" 
            sx={{ 
                bgcolor: config.bgcolor, 
                color: config.color, 
                fontWeight: 'bold',
                fontSize: '0.75rem',
                minWidth: 80,
                px: 0.5,
                ...sx
            }} 
        />
    );
};

export default ReservationStatusChip;
