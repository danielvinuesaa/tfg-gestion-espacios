package com.tfg.backend.modules.identity.model;

/**
 * Enumeración que establece los posibles estados operativos de la cuenta de un usuario.
 * <ul>
 *   <li>{@code ACTIVO}: El usuario posee privilegios completos de acceso y puede operar en la plataforma.</li>
 *   <li>{@code BLOQUEADO}: El acceso del usuario ha sido suspendido temporalmente, impidiendo su autenticación.</li>
 *   <li>{@code ELIMINADO}: Representa un borrado lógico para asegurar la integridad de registros históricos vinculados al usuario.</li>
 * </ul>
 */
public enum UserStatus {
    ACTIVO,
    BLOQUEADO,
    ELIMINADO
}
