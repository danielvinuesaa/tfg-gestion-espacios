package com.tfg.backend.modules.space.dto;

import com.tfg.backend.modules.space.model.SpaceType;
import com.tfg.backend.modules.space.model.SpaceStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Objeto de Transferencia de Datos (DTO) diseñado para la transmisión de información 
 * básica y detallada de la entidad {@link com.tfg.backend.modules.space.model.Space}.
 * Desacopla la capa de presentación de la capa de persistencia, evitando problemas de serialización 
 * de entidades JPA (como la carga perezosa) y posibles dependencias circulares.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SpaceDTO {
    /**
     * Identificador único del espacio.
     */
    private Long id;

    /**
     * Nombre que identifica de manera unívoca al espacio.
     */
    private String name;

    /**
     * Tipo o categoría a la que pertenece el espacio.
     */
    private SpaceType type;

    /**
     * Capacidad máxima de personas que puede albergar el espacio.
     */
    private Integer totalCapacity;

    /**
     * Número de equipos informáticos disponibles en el espacio.
     */
    private Integer computerCount;

    /**
     * Identificador utilizado en el sistema de información geográfica (GIS).
     */
    private String gisId;

    /**
     * Estado operativo actual del espacio.
     */
    private SpaceStatus status;

    /**
     * Información adicional o notas sobre el espacio.
     */
    private String additionalInfo;

    /**
     * Indica si el espacio se encuentra ocupado en este momento.
     */
    private boolean occupiedNow;

    /**
     * Indica si el espacio está bloqueado o fuera de servicio actualmente.
     */
    private boolean blockedNow;
}
