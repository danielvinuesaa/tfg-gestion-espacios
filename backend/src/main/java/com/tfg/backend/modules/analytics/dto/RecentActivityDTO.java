package com.tfg.backend.modules.analytics.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Objeto de transferencia de datos que representa un evento de actividad
 * reciente dentro del sistema, proporcionando un resumen visual.
 */
@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class RecentActivityDTO {
    
    /**
     * Identificador único del evento de actividad.
     */
    private String id;
    
    /**
     * Descripción de la acción realizada (e.g. "RESERVA_CREADA", "RESERVA_APROBADA").
     */
    private String action;
    
    /**
     * Nombre completo o correo electrónico del usuario que realizó la acción.
     */
    private String performedBy;
    
    /**
     * Fecha y hora en la que ocurrió el evento, formateada en ISO 8601.
     */
    private String timestamp;
    
    /**
     * Información de contexto adicional sobre el evento (e.g. "Aula 1 - 12 de Oct").
     */
    private String details;
}
