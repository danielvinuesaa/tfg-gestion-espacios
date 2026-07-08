import React from 'react';
import { Chip } from '@mui/material';
import type { SxProps, Theme } from '@mui/material';

/**
 * Propiedades del componente CounterChip.
 */
interface CounterChipProps {
    count: number | string;
    variant?: 'warning' | 'error' | 'default';
    sx?: SxProps<Theme>;
}

/**
 * Obtiene la configuración visual basada en la variante del contador.
 * 
 * @param variant - La variante visual seleccionada.
 * @returns {{bgcolor: string, color: string}} Un objeto con el color de fondo y de texto.
 */
const getCounterConfig = (variant: 'warning' | 'error' | 'default') => {
    switch (variant) {
        case 'error':
            return { bgcolor: '#ffebee', color: '#c62828' };
        case 'warning':
            return { bgcolor: '#fff3e0', color: '#ef6c00' };
        default:
            return { bgcolor: '#f5f5f5', color: '#616161' };
    }
};

/**
 * Chip especializado para mostrar contadores o cantidades (ej: conflictos, notificaciones).
 * Sigue el estilo visual plano y sin bordes de la aplicación.
 * 
 * @param props - Propiedades del componente, que incluyen el valor del contador.
 * @returns {JSX.Element} El componente visual del contador.
 */
const CounterChip: React.FC<CounterChipProps> = ({ count, variant = 'default', sx }) => {
    const config = getCounterConfig(variant);
    
    return (
        <Chip 
            label={count} 
            size="small" 
            sx={{ 
                height: 20, 
                fontSize: '0.7rem', 
                fontWeight: 'bold',
                bgcolor: config.bgcolor,
                color: config.color,
                minWidth: 24,
                ...sx
            }} 
        />
    );
};

export default CounterChip;
