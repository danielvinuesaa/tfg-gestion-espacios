import React from 'react';
import MeetingRoomIcon from '@mui/icons-material/MeetingRoom';
import EventAvailableIcon from '@mui/icons-material/EventAvailable';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import InfoIcon from '@mui/icons-material/Info';

/**
 * Categorías de permisos para la organización visual en la interfaz.
 * Define la estructura jerárquica, colores e iconos asociados para cada grupo funcional.
 */
export const PERMISSION_CATEGORIES = [
    {
        id: 'SPACES',
        name: 'Espacios',
        permissions: ['LEER_ESPACIOS', 'CREAR_ESPACIOS', 'EDITAR_ESPACIOS', 'ELIMINAR_ESPACIOS'],
        color: '#1976d2',
        bgColor: '#f0f7ff',
        labelColor: '#1976d2',
        icon: <MeetingRoomIcon fontSize="small" />
    },
    {
        id: 'RESERVATIONS',
        name: 'Reservas',
        permissions: ['VER_TODAS_RESERVAS', 'SOLICITAR_RESERVA', 'APROBAR_RESERVA', 'APROBAR_ASIGNATURAS_GESTIONADAS', 'CANCELAR_RESERVA', 'IMPORTAR_RESERVAS', 'EXPORTAR_RESERVAS'],
        color: '#2e7d32',
        bgColor: '#f1f8f1',
        labelColor: '#2e7d32',
        icon: <EventAvailableIcon fontSize="small" />
    },
    {
        id: 'SYSTEM',
        name: 'Gestión de Sistema',
        permissions: ['GESTIONAR_USUARIOS', 'GESTIONAR_ROLES', 'GENERAR_INFORMES'],
        color: '#ed6c02',
        bgColor: '#fff8f1',
        labelColor: '#ed6c02',
        icon: <AdminPanelSettingsIcon fontSize="small" />
    }
];

/**
 * Recupera la configuración visual de la categoría asociada a un permiso específico.
 * 
 * @param permission - Nombre técnico del permiso a buscar.
 * @returns Un objeto con la configuración visual (colores e icono) de la categoría, o un valor por defecto.
 */
export const getCategoryByPermission = (permission: string) => {
    return PERMISSION_CATEGORIES.find(cat => cat.permissions.includes(permission)) || {
        name: 'Otros',
        color: '#757575',
        bgColor: '#f5f5f5',
        labelColor: '#757575',
        icon: <InfoIcon fontSize="small" />
    };
};

/**
 * Formatea el nombre técnico de un permiso para mostrarlo de forma legible.
 * Actúa como mecanismo de respaldo cuando no se dispone de la etiqueta provista por el backend.
 * 
 * @param name - Nombre técnico del permiso (ej. VER_TODAS_RESERVAS).
 * @returns Cadena de texto formateada (ej. Ver Todas Reservas).
 */
export const formatPermissionName = (name: string): string => {
    return name.replace(/_/g, ' ').toLowerCase()
        .replace(/\b\w/g, l => l.toUpperCase());
};
