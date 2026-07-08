package com.tfg.backend.modules.reservation.dto;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.tfg.backend.modules.reservation.model.ReservationType;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

import java.util.List;

/**
 * Objeto de transferencia de datos destinado a encapsular la información necesaria para
 * procesar las peticiones de creación o actualización de reservas en el sistema.
 * Agrupa los parámetros esenciales que definen la naturaleza y temporalidad de la actividad solicitada.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ReservationRequest {
    /** 
     * Colección de identificadores correspondientes a los espacios requeridos para la reserva. 
     */
    @NotEmpty(message = "Debes seleccionar al menos un espacio para realizar la reserva.")
    private List<Long> spaceIds;
    
    /** 
     * La fecha y hora proyectada para el comienzo de la actividad. 
     */
    @NotNull(message = "Las fechas son obligatorias (*)")
    private LocalDateTime startTime;
    
    /** 
     * La fecha y hora proyectada para la conclusión de la actividad. 
     */
    @NotNull(message = "Las fechas son obligatorias (*)")
    private LocalDateTime endTime;
    
    /** 
     * La clasificación de la actividad (por ejemplo: clase lectiva, evaluación, evento extraordinario). 
     */
    @NotNull(message = "Debe seleccionar un tipo de actividad")
    private ReservationType type;
    
    /** 
     * La denominación o título representativo de la reserva. 
     */
    @NotBlank(message = "El título es obligatorio")
    private String title;
    
    /** 
     * El identificador único de la asignatura asociada a la reserva, si procediese su vinculación. 
     */
    private Long subjectId;
    
    /** 
     * Observaciones, requisitos técnicos suplementarios o descripciones funcionales relativas al evento. 
     */
    private String description;

    /** 
     * Identificador del usuario que ostenta la responsabilidad de la actividad (en caso de delegación o gestión a terceros). 
     */
    private Long responsibleId;
    
    /** 
     * Designación nominal del docente a cargo, utilizado habitualmente como alternativa o texto libre. 
     */
    private String responsibleName;
    
    /** 
     * Indicador lógico que determina si la solicitud representa un bloqueo administrativo o técnico del espacio. 
     */
    @JsonProperty("isBlock")
    private boolean isBlock;
}
