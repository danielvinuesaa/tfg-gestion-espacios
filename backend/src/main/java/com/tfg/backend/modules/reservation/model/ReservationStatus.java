package com.tfg.backend.modules.reservation.model;

/**
 * Define el conjunto finito de estados transicionales posibles dentro del
 * ciclo de vida procedimental de las reservas en la institución.
 */
public enum ReservationStatus {
    /** 
     * Solicitud formulada formalmente, aguardando la preceptiva evaluación por parte del personal de gestión. 
     */
    SOLICITADA,
    
    /** 
     * Solicitud que cuenta con el dictamen favorable de los gestores o ha superado el procedimiento de validación automatizada. 
     */
    APROBADA,
    
    /** 
     * Petición desestimada administrativamente por los gestores, requiriendo justificación expresa. 
     */
    RECHAZADA,
    
    /** 
     * Procedimiento invalidado de manera proactiva, sea a instancia del solicitante original o de un administrador de sistemas. 
     */
    CANCELADA,
    
    /** 
     * Inhabilitación técnica o administrativa sobre el espacio, impidiendo la programación regular por causas operativas. 
     */
    BLOQUEO
}
