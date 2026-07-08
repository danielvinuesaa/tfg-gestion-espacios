package com.tfg.backend.modules.space.validator;
import com.tfg.backend.core.exception.BusinessValidationException;
import com.tfg.backend.modules.reservation.model.Reservation;
import com.tfg.backend.modules.reservation.repository.ReservationRepository;
import com.tfg.backend.modules.space.model.Space;
import com.tfg.backend.modules.space.model.SpaceStatus;
import com.tfg.backend.modules.space.repository.SpaceRepository;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Componente dedicado a la validación de reglas de negocio intrínsecas a la gestión de espacios.
 * Evita la persistencia de datos inconsistentes (ej. nombres duplicados, reducciones de capacidad inválidas).
 */
@Component
@RequiredArgsConstructor
public class SpaceValidator {

    /** Repositorio de espacios. */
    private final SpaceRepository spaceRepository;
    /** Repositorio de reservas. */
    private final ReservationRepository reservationRepository;

    /**
     * Valida si un nombre de espacio ya está en uso (excluyendo el actual).
     */
    public void validateUniqueName(String name, Long currentId) {
        spaceRepository.findByName(name).ifPresent(existing -> {
            if (currentId == null || !existing.getId().equals(currentId)) {
                if (existing.getStatus() != com.tfg.backend.modules.space.model.SpaceStatus.ELIMINADO) {
                    throw new BusinessValidationException("name", "Ya existe un espacio activo con el nombre '" + name + "'.");
                } else {
                    throw new BusinessValidationException("name", "El nombre '" + name + "' pertenece a un espacio que fue eliminado. Puede restaurarlo desde el historial o elegir otro nombre.");
                }
            }
        });
    }

    /**
     * Valida si un GIS ID ya está en uso.
     */
    public void validateUniqueGisId(String gisId, Long currentId) {
        if (gisId == null || gisId.trim().isEmpty()) return;

        spaceRepository.findByGisId(gisId).ifPresent(existing -> {
            if (currentId == null || !existing.getId().equals(currentId)) {
                if (existing.getStatus() != com.tfg.backend.modules.space.model.SpaceStatus.ELIMINADO) {
                    throw new BusinessValidationException("gisId", "El ID GIS '" + gisId + "' ya está asignado al espacio '" + existing.getName() + "'.");
                }
            }
        });
    }

    /**
     * Valida la consistencia técnica de las capacidades.
     */
    public void validateCapacities(Space space) {
        // Validación de consistencia de capacidades
        if (space.getComputerCount() != null && space.getComputerCount() > space.getTotalCapacity()) {
            throw new BusinessValidationException("computerCount", "El número de ordenadores no puede superar la capacidad total.");
        }
    }

    /**
     * Valida si es seguro reducir la capacidad de un espacio.
     * Solo se permite si no existen reservas activas (aprobadas o solicitadas) en el futuro.
     */
    public void validateCapacityReduction(Long spaceId, Integer newCapacity, Integer oldCapacity) {
        if (newCapacity < oldCapacity) {
            int activeCount = reservationRepository.countActiveBySpace(spaceId, LocalDateTime.now());

            if (activeCount > 0) {
                throw new BusinessValidationException("totalCapacity", 
                    "No se puede reducir la capacidad total porque existen reservas activas (aprobadas o pendientes) para este espacio en el futuro.");
            }
        }
    }
}
