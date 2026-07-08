import React, { useState } from 'react';
import { Button, Menu, MenuItem, ListItemIcon, ListItemText, Divider } from '@mui/material';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import { useNavigate, Link } from 'react-router-dom';

/**
 * Interfaz que define la estructura y propiedades de un elemento individual de navegación.
 */
export interface NavItem {
    /** Texto descriptivo que se mostrará en la interfaz para el elemento. */
    label: string;
    /** Ruta de destino a la que navegará el usuario al hacer clic. */
    path: string;
    /** Elemento React correspondiente al icono visual que acompaña al texto. */
    icon: React.ReactNode;
    /** Indica si se debe renderizar un separador visual antes de este elemento en un menú desplegable. */
    divider?: boolean;
}

/**
 * Interfaz que define las propiedades requeridas para el componente SmartNavGroup.
 */
interface SmartNavGroupProps {
    /** Etiqueta principal que se muestra en el botón cuando el grupo contiene múltiples elementos, desplegando un menú. */
    label: string;
    /** Colección de elementos de navegación que conforman este grupo lógico. */
    items: NavItem[];
}

/**
 * Componente de navegación adaptable e inteligente para la barra de navegación superior.
 * 
 * Este componente implementa un patrón de diseño centrado en la experiencia de usuario (UX):
 * - Si el grupo contiene un único elemento, se renderiza directamente como un botón de acción principal.
 * - Si el grupo contiene múltiples elementos, se consolida en un menú desplegable (dropdown) bajo una etiqueta común.
 * 
 * El objetivo es optimizar el espacio en la interfaz y reducir la fricción en la navegación,
 * evitando clics superfluos cuando solo existe una única ruta disponible.
 *
 * @param props - Propiedades del componente descritas en {@link SmartNavGroupProps}.
 * @returns Elemento JSX que renderiza el botón directo o el menú desplegable según la cantidad de elementos.
 */
const SmartNavGroup: React.FC<SmartNavGroupProps> = ({ label, items }) => {
    const navigate = useNavigate();
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

    if (items.length === 0) return null;

    // PATRÓN ESTÁNDAR: Si solo hay un elemento, lo promovemos a botón directo
    if (items.length === 1) {
        const item = items[0];
        return (
            <Button 
                color="inherit" 
                component={Link} 
                to={item.path}
                startIcon={item.icon}
                sx={{ 
                    fontWeight: 'bold', 
                    textTransform: 'none', 
                    px: 2, 
                    borderRadius: 2,
                    '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.08)' }
                }}
            >
                {item.label.toUpperCase()}
            </Button>
        );
    }

    // Si hay varios, mantenemos el comportamiento de menú desplegable
    const handleOpen = (event: React.MouseEvent<HTMLElement>) => setAnchorEl(event.currentTarget);
    const handleClose = () => setAnchorEl(null);

    return (
        <>
            <Button 
                color="inherit" 
                onClick={handleOpen}
                endIcon={<KeyboardArrowDownIcon />}
                sx={{ 
                    fontWeight: 'bold', 
                    textTransform: 'none', 
                    px: 2, 
                    borderRadius: 2,
                    '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.08)' }
                }}
            >
                {label.toUpperCase()}
            </Button>
            <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={handleClose}
                sx={{ mt: 1 }}
                PaperProps={{ 
                    elevation: 3,
                    sx: { 
                        minWidth: 220, 
                        borderRadius: 2, 
                        boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                        border: '1px solid',
                        borderColor: 'divider'
                    } 
                }}
            >
                {items.map((item, index) => (
                    <React.Fragment key={item.path}>
                        {item.divider && index > 0 && <Divider sx={{ my: 1 }} />}
                        <MenuItem 
                            onClick={() => { handleClose(); navigate(item.path); }}
                            sx={{ py: 1, px: 2, borderRadius: 1.5, mx: 0.5, mb: 0.5 }}
                        >
                            <ListItemIcon sx={{ color: 'primary.main' }}>{item.icon}</ListItemIcon>
                            <ListItemText 
                                primary={item.label} 
                                primaryTypographyProps={{ variant: 'body2', fontWeight: 600 }}
                            />
                        </MenuItem>
                    </React.Fragment>
                ))}
            </Menu>
        </>
    );
};

export default SmartNavGroup;
