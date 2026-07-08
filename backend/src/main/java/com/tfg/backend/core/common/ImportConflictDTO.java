package com.tfg.backend.core.common;
import com.tfg.backend.modules.space.model.SpaceStatus;
import com.tfg.backend.modules.space.model.SpaceType;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Objeto de Transferencia de Datos (DTO) que representa un conflicto detectado
 * durante el proceso de pre-importación masiva.
 * <p>
 * Agrupa los datos propuestos para la importación y los datos actuales existentes
 * en la base de datos, permitiendo al cliente decidir cómo proceder ante el conflicto.
 * </p>
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ImportConflictDTO {
    /**
     * Nombre identificador del recurso (por ejemplo, nombre del espacio).
     */
    private String name;

    /**
     * Tipo propuesto para el recurso en el fichero de importación.
     */
    private String type;

    /**
     * Capacidad propuesta en el fichero de importación.
     */
    private Integer capacity;

    /**
     * Estado propuesto en el fichero de importación.
     */
    private String status;

    /**
     * Identificador GIS propuesto en el fichero de importación.
     */
    private String gisId;
    
    /**
     * Tipo actual del recurso almacenado en la base de datos.
     */
    private String currentType;

    /**
     * Capacidad actual del recurso almacenada en la base de datos.
     */
    private Integer currentCapacity;

    /**
     * Estado actual del recurso almacenado en la base de datos.
     */
    private String currentStatus;

    /**
     * Identificador GIS actual del recurso almacenado en la base de datos.
     */
    private String currentGisId;
    
    /**
     * Indica si el recurso actualmente posee reservas asociadas que podrían verse afectadas.
     */
    private boolean hasReservations;

    /**
     * Indica si las reglas de negocio permiten sobreescribir el recurso existente.
     */
    private boolean canOverwrite;
}
