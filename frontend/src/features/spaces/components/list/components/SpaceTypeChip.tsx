import React from 'react';
import { Chip } from '@mui/material';
import { getSpaceColors } from '../../../../../theme/reservationTheme';

/**
 * Propiedades para el componente SpaceTypeChip.
 */
interface SpaceTypeChipProps {
    /** Cadena de texto que indica el tipo de espacio. */
    type: string;
}

/**
 * Componente que muestra una etiqueta visual (chip) correspondiente al tipo de espacio.
 * Utiliza una paleta de colores predefinida basada en el tipo especificado.
 *
 * @param props - Propiedades del componente.
 * @returns Elemento React que representa visualmente el tipo de espacio.
 */
const SpaceTypeChip: React.FC<SpaceTypeChipProps> = ({ type }) => {
    const colors = getSpaceColors(type);
    return (
        <Chip 
            label={type} 
            size="small"
            sx={{ 
                bgcolor: colors.bg, 
                color: colors.text,
                fontWeight: 'bold', 
                fontSize: '0.75rem'
            }}
        />
    );
};

export default SpaceTypeChip;
