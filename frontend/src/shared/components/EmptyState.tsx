import React from 'react';
import { Paper, Typography, Box } from '@mui/material';
import type { SxProps, Theme } from '@mui/material';

/**
 * Interfaz de propiedades correspondientes al componente informativo de estado vacío o ausencia de contenido.
 */
interface EmptyStateProps {
    /** El elemento gráfico a representar como acompañamiento central (generalmente un componente de ícono SVG). */
    icon?: React.ReactNode;
    /** El texto primario para el título; por defecto asume "No se han encontrado registros". */
    title?: string;
    /** Texto secundario empleado para otorgar mayor contexto explicativo o recomendaciones. */
    description?: string;
    /** Propiedades de estilos sobreescritos o condicionales extendidas desde el ecosistema MUI. */
    sx?: SxProps<Theme>;
}

/**
 * Componente de propósito general empleado para denotar estados informativos de inactividad o la carencia de resultados
 * (por ejemplo, búsquedas infructuosas o vistas que carecen de elementos registrados).
 * Diseñado arquitectónicamente para un emplazamiento global, difiriendo del componente de uso interno para tablas (`DataTableEmptyState`).
 * 
 * @param props - Objeto contenedor con las configuraciones relativas al texto e iconografía a mostrar.
 * @returns Componente de bloque renderizado en pantalla indicando un estado contextual vacío.
 */
const EmptyState: React.FC<EmptyStateProps> = ({
    icon,
    title = "No se han encontrado registros",
    description,
    sx = {}
}) => {
    return (
        <Paper 
            variant="outlined" 
            sx={{ 
                p: 8, 
                textAlign: 'center', 
                borderRadius: 4, 
                borderStyle: 'dashed',
                bgcolor: 'background.default',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                ...sx 
            }}
        >
            {icon && (
                <Box sx={{ color: 'text.disabled', mb: 2, '& svg': { fontSize: 48 } }}>
                    {icon}
                </Box>
            )}
            <Typography variant="h6" color="text.secondary" fontWeight="600">
                {title}
            </Typography>
            {description && (
                <Typography variant="body2" color="text.disabled" sx={{ mt: 1, maxWidth: 400 }}>
                    {description}
                </Typography>
            )}
        </Paper>
    );
};

export default EmptyState;
