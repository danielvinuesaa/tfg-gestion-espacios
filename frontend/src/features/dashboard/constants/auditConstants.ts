import HistoryIcon from '@mui/icons-material/History';
import AddCircleIcon from '@mui/icons-material/AddCircle';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import EditIcon from '@mui/icons-material/Edit';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import PersonIcon from '@mui/icons-material/Person';
import PersonOffIcon from '@mui/icons-material/PersonOff';
import SecurityIcon from '@mui/icons-material/Security';
import AssignmentIcon from '@mui/icons-material/Assignment';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import FileUploadIcon from '@mui/icons-material/FileUpload';
import RestoreFromTrashIcon from '@mui/icons-material/RestoreFromTrash';
import DeleteSweepIcon from '@mui/icons-material/DeleteSweep';
import DescriptionIcon from '@mui/icons-material/Description';
import MeetingRoomIcon from '@mui/icons-material/MeetingRoom';
import SettingsSuggestIcon from '@mui/icons-material/SettingsSuggest';

/**
 * Configuración visual y descriptiva para una acción de auditoría registrada en el sistema.
 */
export interface AuditActionConfig {
    label: string;
    color: string;
    icon: any;
    category: AuditCategory;
}

/**
 * Enumerado de las categorías bajo las cuales se agrupan las diferentes acciones de auditoría.
 */
export type AuditCategory = 'RESERVAS' | 'ESPACIOS' | 'USUARIOS' | 'ROLES' | 'INFORMES' | 'SISTEMA';

/**
 * Mapeo de categorías de auditoría a sus respectivas etiquetas legibles e iconos representativos.
 */
export const AUDIT_CATEGORIES: Record<AuditCategory, { label: string; icon: any }> = {
    RESERVAS: { label: 'Reservas', icon: AssignmentIcon },
    ESPACIOS: { label: 'Espacios', icon: MeetingRoomIcon },
    USUARIOS: { label: 'Usuarios', icon: PersonIcon },
    ROLES: { label: 'Roles', icon: SecurityIcon },
    INFORMES: { label: 'Informes', icon: DescriptionIcon },
    SISTEMA: { label: 'Sistema', icon: SettingsSuggestIcon }
};

/**
 * Configuración detallada para cada tipo de acción de auditoría, incluyendo etiquetas, colores, iconos y su categoría correspondiente.
 */
export const ACTION_CONFIG: Record<string, AuditActionConfig> = {
    // RESERVAS
    'CREATE_RESERVATION': { label: 'Nueva Reserva', color: '#10b981', icon: AddCircleIcon, category: 'RESERVAS' },
    'APPROVE_RESERVATION': { label: 'Reserva Aprobada', color: '#6366f1', icon: CheckCircleIcon, category: 'RESERVAS' },
    'REJECT_RESERVATION': { label: 'Reserva Rechazada', color: '#ef4444', icon: CancelIcon, category: 'RESERVAS' },
    'CANCEL_RESERVATION': { label: 'Reserva Cancelada', color: '#6b7280', icon: CancelIcon, category: 'RESERVAS' },
    'UPDATE_RESERVATION': { label: 'Reserva Modificada', color: '#f59e0b', icon: EditIcon, category: 'RESERVAS' },
    'UPDATE_STATUS': { label: 'Estado Actualizado', color: '#6366f1', icon: CheckCircleIcon, category: 'RESERVAS' },
    'EXPORTAR_RESERVAS': { label: 'Exportación Reservas', color: '#3b82f6', icon: FileDownloadIcon, category: 'SISTEMA' },
    'IMPORTAR_RESERVAS': { label: 'Importación Reservas', color: '#8b5cf6', icon: FileUploadIcon, category: 'SISTEMA' },

    // ESPACIOS
    'CREATE_SPACE': { label: 'Espacio Creado', color: '#10b981', icon: AddCircleIcon, category: 'ESPACIOS' },
    'UPDATE_SPACE': { label: 'Espacio Modificado', color: '#f59e0b', icon: EditIcon, category: 'ESPACIOS' },
    'DELETE_SPACE': { label: 'Espacio Eliminado', color: '#ef4444', icon: CancelIcon, category: 'ESPACIOS' },
    'DELETE_SPACE_BULK': { label: 'Eliminación Masiva (Espacios)', color: '#991b1b', icon: DeleteSweepIcon, category: 'ESPACIOS' },
    'RESTORE_SPACE': { label: 'Espacio Restaurado', color: '#10b981', icon: RestoreFromTrashIcon, category: 'ESPACIOS' },
    'EXPORTAR_ESPACIOS': { label: 'Exportación Espacios', color: '#3b82f6', icon: FileDownloadIcon, category: 'SISTEMA' },
    'IMPORT_SPACES': { label: 'Importación Espacios', color: '#8b5cf6', icon: FileUploadIcon, category: 'SISTEMA' },

    // USUARIOS
    'CREATE_USER': { label: 'Usuario Creado', color: '#10b981', icon: PersonAddIcon, category: 'USUARIOS' },
    'UPDATE_USER': { label: 'Usuario Modificado', color: '#f59e0b', icon: PersonIcon, category: 'USUARIOS' },
    'DELETE_USER': { label: 'Usuario Eliminado', color: '#ef4444', icon: PersonOffIcon, category: 'USUARIOS' },
    'DELETE_USER_BULK': { label: 'Eliminación Masiva (Usuarios)', color: '#991b1b', icon: DeleteSweepIcon, category: 'USUARIOS' },
    'RESTORE_USER': { label: 'Usuario Restaurado', color: '#10b981', icon: RestoreFromTrashIcon, category: 'USUARIOS' },
    'EXPORTAR_USUARIOS': { label: 'Exportación Usuarios', color: '#3b82f6', icon: FileDownloadIcon, category: 'SISTEMA' },
    'IMPORT_USERS': { label: 'Importación Usuarios', color: '#8b5cf6', icon: FileUploadIcon, category: 'SISTEMA' },
    'REGISTRO_PUBLICO': { label: 'Registro Público', color: '#10b981', icon: PersonAddIcon, category: 'USUARIOS' },
    'ACTUALIZAR_PREFERENCIAS_NOTIFICACION': { label: 'Preferencias Notif.', color: '#f59e0b', icon: SettingsSuggestIcon, category: 'USUARIOS' },
    'RESETEAR_PREFERENCIAS_NOTIFICACION': { label: 'Reset Preferencias', color: '#6b7280', icon: SettingsSuggestIcon, category: 'USUARIOS' },

    // ROLES
    'CREATE_ROLE': { label: 'Rol Creado', color: '#10b981', icon: SecurityIcon, category: 'ROLES' },
    'UPDATE_ROLE': { label: 'Rol Modificado', color: '#6366f1', icon: SecurityIcon, category: 'ROLES' },
    'DELETE_ROLE': { label: 'Rol Eliminado', color: '#ef4444', icon: SecurityIcon, category: 'ROLES' },
    'DELETE_ROLE_BULK': { label: 'Eliminación Masiva (Roles)', color: '#991b1b', icon: DeleteSweepIcon, category: 'ROLES' },
    'ACTIVATE_ROLE': { label: 'Rol Activado', color: '#10b981', icon: SecurityIcon, category: 'ROLES' },

    // INFORMES
    'GENERAR_PARTE_FIRMAS_PDF': { label: 'Parte Firmas (PDF)', color: '#e11d48', icon: DescriptionIcon, category: 'INFORMES' },
    'GENERAR_PARTE_FIRMAS_CSV': { label: 'Parte Firmas (CSV)', color: '#059669', icon: DescriptionIcon, category: 'INFORMES' },
    'GENERAR_INFORME_USO_ASIGNATURAS_PDF': { label: 'Uso Asignaturas (PDF)', color: '#e11d48', icon: DescriptionIcon, category: 'INFORMES' },
    'GENERAR_INFORME_USO_ASIGNATURAS_CSV': { label: 'Uso Asignaturas (CSV)', color: '#059669', icon: DescriptionIcon, category: 'INFORMES' },
    'GENERAR_INFORME_OCUPACION_PDF': { label: 'Ocupación (PDF)', color: '#e11d48', icon: DescriptionIcon, category: 'INFORMES' },
    'GENERAR_INFORME_OCUPACION_CSV': { label: 'Ocupación (CSV)', color: '#059669', icon: DescriptionIcon, category: 'INFORMES' },
    'EXPORTAR_AUDITORIA': { label: 'Exportación Auditoría', color: '#3b82f6', icon: FileDownloadIcon, category: 'SISTEMA' },
};
