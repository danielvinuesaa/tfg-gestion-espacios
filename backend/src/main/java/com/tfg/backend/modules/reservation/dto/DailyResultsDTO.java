package com.tfg.backend.modules.reservation.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.List;

/**
 * Objeto de transferencia de datos utilizado para agrupar de manera estructurada los resultados
 * relativos a la disponibilidad de espacios analizados para un día cronológico concreto.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DailyResultsDTO {
    /** 
     * La fecha del calendario objeto de evaluación.
     */
    private LocalDate date;
    
    /** 
     * El conjunto de segmentos temporales o franjas horarias evaluadas, 
     * cada una con sus respectivas alternativas de disponibilidad.
     */
    private List<TimeSlotResultsDTO> timeSlots;
    
    /** 
     * La cuantificación global de las combinaciones viables detectadas a lo largo de este día.
     */
    private int totalCount;
}
