package com.tfg.backend.core.common;

import lombok.Builder;
import lombok.Data;

/**
 * Objeto de Transferencia de Datos (DTO) que representa la configuración de
 * franjas horarias del sistema.
 * <p>
 * Contiene la información necesaria para que el cliente pueda renderizar
 * las opciones de horas permitidas para realizar operaciones, tales como
 * la creación de reservas.
 * </p>
 */
@Data
@Builder
public class TimeConfigResponse {
    /**
     * Hora de inicio mínima permitida (en formato de 24 horas).
     */
    private int startHour;
    
    /**
     * Hora de fin máxima permitida (en formato de 24 horas).
     */
    private int endHour;
    
    /**
     * Intervalo mínimo en minutos permitido para las selecciones de tiempo
     * (por ejemplo, intervalos de 15 o 30 minutos).
     */
    private int minuteStep;
}
