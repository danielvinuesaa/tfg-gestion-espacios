import React from 'react';
import { Chip } from '@mui/material';
import type { SxProps, Theme } from '@mui/material';

/**
 * Propiedades del componente ReservationTypeChip.
 */
interface ReservationTypeChipProps {
    type: string;
    sx?: SxProps<Theme>;
}

/**
 * Obtiene la configuración visual basada en el tipo de reserva especificado.
 * 
 * @param type - El tipo de reserva a evaluar (CLASE, EXAMEN, OTRO).
 * @returns {{bgcolor: string, color: string, label: string}} Un objeto con los colores y la etiqueta formateada.
 */
const getTypeConfig = (type: string) => {
    switch (type) {
        case 'CLASE':
            return { bgcolor: '#f3e5f5', color: '#7b1fa2', label: 'Clase' };
        case 'EXAMEN':
            return { bgcolor: '#fff8e1', color: '#ffa000', label: 'Examen' };
        case 'OTRO':
            return { bgcolor: '#e0f2f1', color: '#00796b', label: 'Otro' };
        default:
            return { bgcolor: '#f5f5f5', color: '#616161', label: type };
    }
};

/**
 * Componente visual que representa el tipo de reserva en formato de píldora o chip.
 * 
 * @param props - Propiedades del componente, incluyendo el tipo de reserva.
 * @returns {JSX.Element} El componente del chip.
 */
const ReservationTypeChip: React.FC<ReservationTypeChipProps> = ({ type, sx }) => {
    const config = getTypeConfig(type);
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

export default ReservationTypeChip;
