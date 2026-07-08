package com.tfg.backend.modules.reservation.service;
import com.tfg.backend.modules.reservation.dto.AvailabilitySearchRequest;
import com.tfg.backend.modules.reservation.dto.DailyResultsDTO;
import com.tfg.backend.modules.reservation.dto.ReservationProposalDTO;

import java.util.List;

/**
 * Interfaz que define el servicio encargado de la elaboración de propuestas de disponibilidad.
 * Abstrae y aísla la lógica algorítmica requerida para la localización de espacios compatibles,
 * separándola de la gestión elemental del catálogo de recursos.
 */
public interface AvailabilitySearchService {
    
    /**
     * Produce un conjunto de propuestas de reserva factibles en función de los criterios de búsqueda especificados.
     * Incorpora soporte para búsquedas de precisión (fecha y hora concretas) y exploratorias (intervalos de días y franjas horarias).
     *
     * @param request El objeto que encapsula los parámetros y restricciones de la búsqueda.
     * @return Una colección de alternativas viables. El tipo concreto de la colección 
     *         ({@code List<ReservationProposalDTO>} o {@code List<DailyResultsDTO>}) depende de la modalidad de búsqueda invocada.
     */
    Object getProposals(AvailabilitySearchRequest request);
}
