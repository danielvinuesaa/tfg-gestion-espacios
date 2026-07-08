package com.tfg.backend.modules.reservation.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * Objeto de transferencia de datos que representa una discrepancia o conflicto
 * detectado durante la fase de validación de un proceso de importación masiva de reservas.
 * Permite informar al usuario sobre las colisiones estructurales o temporales encontradas.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ReservationImportConflictDTO {
    /** 
     * Código de la asignatura asociada al registro en conflicto. 
     */
    private String subjectCode;
    
    /** 
     * Representación textual de la hora o fecha de inicio en la que surge el conflicto. 
     */
    private String startTime;
    
    /** 
     * Representación textual de la hora o fecha de conclusión. 
     */
    private String endTime;
    
    /** 
     * Denominación o código de la ubicación física requerida. 
     */
    private String location;
    
    /** 
     * Descripción complementaria del registro problemático. 
     */
    private String description;
    
    /** 
     * Categorización tipológica del conflicto (por ejemplo: 'OVERLAP' para solapamientos, 'MISSING_SPACE' ante espacios inexistentes). 
     */
    private String type; 
    
    /** 
     * Mensaje descriptivo y detallado acerca de la naturaleza del error. 
     */
    private String message;
    
    /** 
     * Colección de títulos correspondientes a aquellas reservas preexistentes con las que se ha constatado el choque. 
     */
    private List<String> conflictingReservations;
}
