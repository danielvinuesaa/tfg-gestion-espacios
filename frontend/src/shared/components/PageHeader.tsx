import React from 'react';
import { Stack, Typography, Button, Box, type ButtonProps, useMediaQuery, useTheme } from '@mui/material';

/**
 * Interfaz que define una acción (botón) a incluir en la cabecera de la página.
 */
export interface PageHeaderAction {
    /** Etiqueta del botón */
    label: string;
    /** Icono a mostrar (ej: <AddIcon />) */
    icon?: React.ReactNode;
    /** Callback al hacer clic */
    onClick: () => void;
    /** Variante del botón (contained, outlined, text) */
    variant?: ButtonProps['variant'];
    /** Color del botón (primary, secondary, error, etc.) */
    color?: ButtonProps['color'];
    /** Indica si el botón está deshabilitado */
    disabled?: boolean;
    /** Indica si el botón debe mostrarse (para control de permisos) */
    visible?: boolean;
}

/**
 * Propiedades del componente PageHeader.
 */
interface PageHeaderProps {
    /** Título principal de la página */
    title: string;
    /** Subtítulo opcional */
    subtitle?: string;
    /** Listado de acciones principales (botones a la derecha) */
    actions?: PageHeaderAction[];
    /** Margen inferior (default: 3) */
    mb?: number;
}

/**
 * Componente genérico profesional para cabeceras de página.
 * Unifica el diseño de títulos y acciones principales en toda la aplicación.
 * 
 * @param props - Las propiedades de configuración de la cabecera.
 * @returns {JSX.Element} El componente visual que conforma la cabecera de la página.
 */
const PageHeader: React.FC<PageHeaderProps> = ({ 
    title, 
    subtitle, 
    actions = [], 
    mb = 3 
}) => {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

    const visibleActions = actions.filter(a => a.visible !== false);

    return (
        <Stack 
            direction={isMobile ? "column" : "row"} 
            justifyContent="space-between" 
            alignItems={isMobile ? "flex-start" : "center"} 
            spacing={2}
            mb={mb}
        >
            <Box>
                <Typography variant="h4" component="h1" fontWeight="bold">
                    {title}
                </Typography>
                {subtitle && (
                    <Typography variant="body2" color="textSecondary" sx={{ mt: 0.5 }}>
                        {subtitle}
                    </Typography>
                )}
            </Box>

            {visibleActions.length > 0 && (
                <Stack 
                    direction="row" 
                    spacing={isMobile ? 1 : 2} 
                    sx={{ width: isMobile ? '100%' : 'auto' }}
                    flexWrap="wrap"
                >
                    {visibleActions.map((action, index) => (
                        <Button
                            key={index}
                            variant={action.variant || (index === visibleActions.length - 1 ? "contained" : "outlined")}
                            color={action.color || "primary"}
                            startIcon={action.icon}
                            onClick={action.onClick}
                            disabled={action.disabled}
                            fullWidth={isMobile}
                            sx={{ fontWeight: 'bold' }}
                        >
                            {action.label}
                        </Button>
                    ))}
                </Stack>
            )}
        </Stack>
    );
};

export default PageHeader;
