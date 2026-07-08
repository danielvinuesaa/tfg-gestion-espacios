import { Role } from './role';

/**
 * Tipos de estado posibles para un usuario en el sistema.
 */
export type UserStatus = 'ACTIVO' | 'BLOQUEADO' | 'ELIMINADO';

/**
 * Interfaz que define la entidad principal de Usuario.
 */
export interface User {
    /** Identificador único del usuario */
    id: number;
    /** Correo electrónico institucional o de contacto */
    email: string;
    /** Nombre completo del usuario */
    name: string;
    /** Rol que define los permisos y el nivel de acceso del usuario */
    role: Role;
    /** Estado operativo de la cuenta en el sistema */
    status?: UserStatus;
}
