import React from 'react';
import { Box, Chip, Tooltip } from '@mui/material';
import type { Space } from '../../../../../shared/types';
import { getSpaceColors } from '../../../../../theme/reservationTheme';

/**
 * Propiedades del componente ReservationSpacesCell.
 */
interface ReservationSpacesCellProps {
    spaces: Space[];
}

/**
 * Componente especializado en la renderización de la celda de espacios dentro de una tabla de reservas.
 * 
 * Se encarga de mostrar visualmente los espacios físicos asociados a una reserva utilizando chips.
 * Implementa una lógica de truncamiento visual, mostrando un máximo de dos espacios y agrupando
 * los restantes bajo un chip indicador de exceso (tooltip interactivo) para preservar la limpieza de la interfaz.
 * Adicionalmente, gestiona el estilo visual para los espacios que han sido eliminados del sistema.
 * 
 * @param props - Propiedades del componente.
 * @param props.spaces - Colección de espacios físicos a representar.
 * @returns Elemento React estructurando la visualización en formato chip de los espacios.
 */
const ReservationSpacesCell: React.FC<ReservationSpacesCellProps> = ({ spaces }) => {
    return (
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
            {spaces?.slice(0, 2).map(s => {
                const isSpaceEliminado = s.status === 'ELIMINADO';
                return (
                    <Chip 
                        key={s.id} 
                        label={isSpaceEliminado ? `${s.name} (Eliminado)` : s.name} 
                        size="small" 
                        sx={{ 
                            bgcolor: isSpaceEliminado ? '#f1f3f4' : getSpaceColors(s.type).bg, 
                            color: isSpaceEliminado ? '#70757a' : getSpaceColors(s.type).text, 
                            fontWeight: 'bold', 
                            fontSize: '0.75rem', 
                            textDecoration: isSpaceEliminado ? 'line-through' : 'none',
                            opacity: isSpaceEliminado ? 0.8 : 1
                        }} 
                    />
                );
            })}
            {spaces && spaces.length > 2 && (
                <Tooltip title={spaces.slice(2).map(s => s.name + (s.status === 'ELIMINADO' ? " (Eliminado)" : "")).join(", ")}>
                    <Chip 
                        label={`+${spaces.length - 2}`} 
                        size="small" 
                        variant="outlined" 
                        sx={{ fontSize: '0.75rem', fontWeight: 'bold', cursor: 'help' }} 
                    />
                </Tooltip>
            )}
        </Box>
    );
};

export default ReservationSpacesCell;
