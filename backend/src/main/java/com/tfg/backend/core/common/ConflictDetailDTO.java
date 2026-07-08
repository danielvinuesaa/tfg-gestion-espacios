package com.tfg.backend.core.common;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Objeto de Transferencia de Datos (DTO) que representa un elemento en conflicto
 * dentro de una operación masiva.
 * <p>
 * Incluye el identificador, el nombre y el peso del impacto (por ejemplo, el número de reservas asociadas).
 * </p>
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ConflictDetailDTO {
    /**
     * Identificador único del recurso en conflicto.
     */
    private Long id;

    /**
     * Nombre legible del recurso en conflicto.
     */
    private String name;

    /**
     * Número que cuantifica el impacto del conflicto (por ejemplo, cantidad de reservas o usuarios afectados).
     */
    private long impactCount;
}
