package com.tfg.backend.modules.analytics.dto;

import lombok.Builder;
import lombok.Data;

/**
 * Objeto de transferencia de datos que representa de forma segura y formateada
 * un registro del historial de auditoría para su exposición hacia los clientes.
 */
@Data
@Builder
public class AuditLogDTO {
    
    /**
     * Identificador único del registro de auditoría.
     */
    private String id;
    
    /**
     * Tipo o nombre de la acción auditada que se llevó a cabo.
     */
    private String action;
    
    /**
     * Identificación del usuario o sistema que desencadenó la acción.
     */
    private String performedBy;
    
    /**
     * Marca de tiempo formateada indicando el momento exacto de la acción.
     */
    private String timestamp;
    
    /**
     * Información detallada adicional sobre los cambios producidos o el contexto de la acción.
     */
    private String details;
}
