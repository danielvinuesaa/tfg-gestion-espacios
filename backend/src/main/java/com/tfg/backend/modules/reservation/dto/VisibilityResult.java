package com.tfg.backend.modules.reservation.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * Objeto de transferencia de datos empleado para encapsular los resultados obtenidos
 * tras evaluar las directrices de visibilidad y acceso a la información.
 * Delimita los recursos (usuarios o asignaturas) sobre los que un sujeto posee privilegios de lectura o gestión.
 */
@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class VisibilityResult {
    /**
     * El identificador del usuario sobre el cual recae el filtro explícito de la consulta.
     */
    private Long targetUserId;

    /**
     * El identificador del usuario utilizado para imponer las normativas de seguridad vinculadas a la propiedad de los datos.
     * La ausencia de valor (nulo) señala la exención de restricciones propietarias (típicamente perfiles de administración).
     */
    private Long securityUserId;

    /**
     * El conjunto de identificadores de las asignaturas sobre las cuales el usuario ejerce labores de gestión.
     * Un valor nulo puede representar un permiso irrestricto o, contrariamente, la ausencia total de competencias.
     */
    private List<Long> managedSubjectIds;
}
