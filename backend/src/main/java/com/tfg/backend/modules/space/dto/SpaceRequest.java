package com.tfg.backend.modules.space.dto;
import com.tfg.backend.modules.space.model.SpaceStatus;
import com.tfg.backend.modules.space.model.SpaceType;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Objeto de Transferencia de Datos (DTO) empleado para la creación y actualización
 * de entidades {@link com.tfg.backend.modules.space.model.Space}.
 * Garantiza la separación entre el contrato definido por la API REST y el modelo interno
 * de la base de datos, incorporando además validaciones estructurales de los datos entrantes.
 */
@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class SpaceRequest {
    /**
     * Nombre del espacio, que debe ser proporcionado obligatoriamente.
     */
    @NotBlank(message = "El nombre del espacio es obligatorio")
    private String name;

    /**
     * Tipo de espacio al que corresponde la solicitud.
     */
    @NotNull(message = "El tipo de espacio es obligatorio")
    private SpaceType type;

    /**
     * Capacidad total del espacio, requerida y mayor a cero.
     */
    @NotNull(message = "La capacidad total es obligatoria")
    @Min(value = 1, message = "La capacidad debe ser al menos de 1 persona")
    private Integer totalCapacity;

    /**
     * Cantidad de ordenadores presentes en el espacio, que no puede ser un valor negativo.
     */
    @Min(value = 0, message = "El número de ordenadores no puede ser negativo")
    private Integer computerCount;

    /**
     * Identificador opcional para la integración con sistemas GIS.
     */
    private String gisId;

    /**
     * Estado operativo inicial o modificado del espacio.
     */
    @NotNull(message = "El estado del espacio es obligatorio")
    private SpaceStatus status;

    /**
     * Información complementaria sobre el espacio.
     */
    private String additionalInfo;
}
