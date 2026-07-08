package com.tfg.backend.modules.reservation.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalTime;
import java.util.List;

/**
 * Objeto de transferencia de datos que encapsula un conjunto de propuestas alternativas de reserva,
 * acotadas en un fragmento o intervalo de tiempo delimitado dentro de una jornada.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TimeSlotResultsDTO {
    /** 
     * El punto cronológico exacto en el que da comienzo el periodo evaluado.
     */
    private LocalTime startTime;
    
    /** 
     * El punto cronológico exacto que enmarca la finalización del periodo evaluado.
     */
    private LocalTime endTime;
    
    /** 
     * Una representación textual del periodo de tiempo (por ejemplo, "09:00 - 10:30") 
     * destinada a facilitar la lectura del usuario final.
     */
    private String label;
    
    /** 
     * Una compilación de las distintas agrupaciones de espacios susceptibles de ser 
     * reservados de forma simultánea en la duración determinada.
     */
    private List<ReservationProposalDTO> proposals;
    
    /** 
     * El recuento total de configuraciones de espacios alternativas descubiertas para esta banda horaria.
     */
    private int count;
}
