import React from 'react';
import { Chip } from '@mui/material';
import { PHYSICAL_STATUS_COLORS } from '../../../theme/reservationTheme';

/**
 * Tipos de conflictos estandarizados para los procesos de importación.
 */
export type ConflictType = 
    | 'EXISTING'    // El registro ya existe (Amarillo)
    | 'OVERLAP'     // Hay un solapamiento temporal (Rojo)
    | 'INVALID'     // Datos inválidos o incompletos (Rojo)
    | 'UPDATEABLE'  // Existe pero se puede sobreescribir (Azul/Info)
    | 'BLOCKED';    // Existe y NO se puede tocar por reglas de negocio (Rojo suave)

/**
 * Propiedades del componente ImportConflictChip.
 */
interface ImportConflictChipProps {
    type: ConflictType;
    label?: string;
}

/**
 * Chip de conflicto estandarizado para los diálogos de importación.
 * Mantiene la consistencia visual y de contenido en toda la aplicación.
 * Sigue el estilo de StatusChip (sin bordes, colores suaves, fuente en negrita).
 * 
 * @param props - Propiedades del componente.
 * @returns {JSX.Element} El componente visual para el conflicto.
 */
const ImportConflictChip: React.FC<ImportConflictChipProps> = ({ type, label }) => {
    let displayLabel = label;
    let colors = { bg: '#f1f3f4', text: '#70757a' }; // Default

    switch (type) {
        case 'EXISTING':
            colors = { bg: '#fff7e0', text: '#b06000' };
            displayLabel = label || 'Existente';
            break;
        case 'UPDATEABLE':
            colors = { bg: '#e8f0fe', text: '#1967d2' };
            displayLabel = label || 'Actualizable';
            break;
        case 'OVERLAP':
            colors = PHYSICAL_STATUS_COLORS['BLOQUEADO'];
            displayLabel = label || 'Solapamiento';
            break;
        case 'INVALID':
            colors = PHYSICAL_STATUS_COLORS['BLOQUEADO'];
            displayLabel = label || 'Dato Inválido';
            break;
        case 'BLOCKED':
            colors = { bg: '#fce8e6', text: '#c5221f' };
            displayLabel = label || 'Bloqueado';
            break;
    }

    return (
        <Chip 
            label={displayLabel} 
            size="small" 
            sx={{ 
                bgcolor: colors.bg, 
                color: colors.text,
                fontWeight: 'bold', 
                fontSize: '0.75rem',
                height: 20,
                minWidth: 85,
                border: 'none',
                borderRadius: 1
            }} 
        />
    );
};

export default ImportConflictChip;
