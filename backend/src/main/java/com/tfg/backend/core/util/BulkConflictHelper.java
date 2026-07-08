package com.tfg.backend.core.util;
import com.tfg.backend.core.common.BulkConflictSummaryDTO;
import com.tfg.backend.core.common.ConflictDetailDTO;
import com.tfg.backend.modules.space.model.Space;
import com.tfg.backend.modules.identity.model.Role;
import com.tfg.backend.modules.identity.model.User;

import java.util.ArrayList;
import java.util.List;
import java.util.function.Function;

/**
 * Clase de utilidad que facilita la construcción de resúmenes consolidados sobre
 * conflictos generados durante la ejecución de operaciones masivas.
 * <p>
 * Centraliza la lógica funcional para iterar entidades, calcular el impacto
 * derivado de su modificación o eliminación, y componer un objeto de transferencia de datos
 * estandarizado (DTO) que describe el resultado de la pre-evaluación del conflicto.
 * </p>
 */
public class BulkConflictHelper {

    /**
     * Construye un resumen de conflictos estandarizado evaluando individualmente
     * cada identificador de la operación solicitada.
     *
     * @param ids Lista de identificadores seleccionados para participar en la operación masiva.
     * @param entityResolver Función proveedora que recupera la entidad completa a partir de su identificador.
     * @param nameResolver Función encargada de extraer o componer el nombre visual/descriptivo de la entidad.
     * @param impactCounter Función que evalúa y devuelve el grado de impacto (número de conflictos, dependencias, etc.) que sufriría la entidad.
     * @param <T> El tipo de la entidad evaluada (por ejemplo, User, Role, Space).
     * @return Un {@link BulkConflictSummaryDTO} que contiene la estructura unificada con el conteo y desglose de conflictos.
     */
    public static <T> BulkConflictSummaryDTO buildSummary(
            List<Long> ids,
            Function<Long, T> entityResolver,
            Function<T, String> nameResolver,
            Function<T, Long> impactCounter) {

        int conflictCount = 0;
        long totalImpactedItems = 0;
        List<ConflictDetailDTO> itemsWithConflicts = new ArrayList<>();

        for (Long id : ids) {
            T entity = entityResolver.apply(id);
            if (entity == null) continue;

            long impact = impactCounter.apply(entity);
            if (impact > 0) {
                conflictCount++;
                totalImpactedItems += impact;
                itemsWithConflicts.add(ConflictDetailDTO.builder()
                        .id(id)
                        .name(nameResolver.apply(entity))
                        .impactCount(impact)
                        .build());
            }
        }

        return BulkConflictSummaryDTO.builder()
                .totalTarget(ids.size())
                .cleanCount(ids.size() - conflictCount)
                .conflictCount(conflictCount)
                .totalImpactedItems(totalImpactedItems)
                .itemsWithConflicts(itemsWithConflicts)
                .build();
    }
}
