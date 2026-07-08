/**
 * Interfaz que define la estructura de un permiso del sistema.
 */
export interface Permission {
    /** Identificador único del permiso */
    id: number;
    /** Nombre técnico del permiso, habitualmente en mayúsculas (ej. CREAR_RESERVA) */
    name: string;
    /** Etiqueta descriptiva para mostrar al usuario */
    label: string;
    /** Descripción detallada de las acciones que habilita el permiso */
    description: string;
}

/**
 * Interfaz que define la estructura de un rol, agrupando permisos y metadatos asociados.
 */
export interface Role {
    /** Identificador único del rol */
    id: number;
    /** Nombre representativo del rol */
    name: string;
    /** Descripción opcional sobre el propósito del rol */
    description?: string;
    /** Lista de permisos detallados asociados al rol */
    permissions: Permission[];
    /** Lista auxiliar de nombres de permisos, utilizada temporalmente o como respaldo */
    permissionNames?: string[];
    /** Identificadores de las asignaturas sobre las que este rol tiene jurisdicción */
    subjectIds?: number[];
    /** Objetos completos de asignaturas asociadas al rol */
    subjects?: Array<{ id: number; code: string; name: string }>;
    /** Estado actual del rol en el sistema */
    status?: 'ACTIVO' | 'ELIMINADO';
    /** Número de usuarios activos asignados a este rol */
    userCount?: number;
    /** Número total de usuarios (activos y eliminados) que poseen este rol */
    totalUserCount?: number;
}
