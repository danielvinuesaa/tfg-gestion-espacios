package com.tfg.backend.modules.reservation.dto;
import com.tfg.backend.modules.space.dto.SpaceDTO;

import lombok.Builder;
import lombok.Data;
import java.util.List;
import java.time.LocalDateTime;

/**
 * Objeto de transferencia de datos que modela una proposición específica de reserva,
 * elaborada por los algoritmos de búsqueda inteligente del sistema.
 * Comprende métricas e información técnica que justifican la idoneidad y viabilidad de los espacios sugeridos.
 */
@Data
@Builder
public class ReservationProposalDTO {
    /** 
     * Colección de espacios físicos que integran de forma conjunta esta sugerencia de reserva. 
     */
    private List<SpaceDTO> spaces;
    
    /** 
     * La capacidad máxima agregada que ofrecen los espacios seleccionados. 
     */
    private int totalCapacity;

    /** 
     * La capacidad operativa calculada en base a los criterios de distribución exigidos (por ejemplo, disposiciones para evaluaciones). 
     */
    private int effectiveCapacity;
    
    /** 
     * La estimación del excedente de plazas frente a la ocupación requerida. 
     */
    private int overCapacity;
    
    /** 
     * Métrica cuantitativa que refleja el nivel de optimización de la propuesta.
     * Valores inferiores denotan mayor eficiencia, indicando menor desperdicio de aforo y menor fragmentación espacial. 
     */
    private double efficiencyScore;
    
    /** 
     * Argumentación cualitativa que justifica la formulación de esta alternativa de reserva al usuario. 
     */
    private String recommendationReason;
    
    /** 
     * El momento cronológico recomendado para el inicio de la actividad (relevante en modalidades de búsqueda flexibles). 
     */
    private LocalDateTime suggestedStartTime;
    
    /** 
     * El momento cronológico recomendado para la conclusión de la actividad. 
     */
    private LocalDateTime suggestedEndTime;
}
