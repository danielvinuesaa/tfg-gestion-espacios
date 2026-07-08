package com.tfg.backend.modules.reservation.mapper;
import com.tfg.backend.modules.identity.mapper.UserMapper;
import com.tfg.backend.modules.reservation.dto.ReservationDTO;
import com.tfg.backend.modules.reservation.dto.ReservationRequest;
import com.tfg.backend.modules.reservation.model.Reservation;
import com.tfg.backend.modules.space.mapper.SpaceMapper;

import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;
import org.mapstruct.ReportingPolicy;

/**
 * Interfaz de mapeo para la entidad Reservation.
 * Utiliza MapStruct para generar código de mapeo eficiente y seguro entre la entidad {@link Reservation} y sus Data Transfer Objects (DTOs).
 */
@Mapper(componentModel = "spring", unmappedTargetPolicy = ReportingPolicy.IGNORE, uses = {SpaceMapper.class, UserMapper.class})
public interface ReservationMapper {

    /**
     * Convierte una entidad de tipo {@link Reservation} en su correspondiente DTO de salida {@link ReservationDTO}.
     *
     * @param entity La entidad de reserva a convertir.
     * @return El DTO de salida con los datos de la reserva.
     */
    ReservationDTO toDto(Reservation entity);

    /**
     * Convierte un DTO de solicitud de reserva {@link ReservationRequest} en una entidad base {@link Reservation}.
     * Los campos de relaciones complejas como espacios (spaces) y asignaturas (subject) deben ser gestionados manualmente en la capa de servicio.
     *
     * @param request El objeto de transferencia de datos con la solicitud de reserva.
     * @return La entidad de reserva instanciada.
     */
    @Mapping(target = "id", ignore = true)
    @Mapping(target = "user", ignore = true)
    @Mapping(target = "responsible", ignore = true)
    @Mapping(target = "spaces", ignore = true)
    @Mapping(target = "subject", ignore = true)
    @Mapping(target = "status", ignore = true)
    @Mapping(target = "rejectionReason", ignore = true)
    @Mapping(target = "reminderSent", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    Reservation toEntity(ReservationRequest request);

    /**
     * Actualiza los datos de una entidad existente de tipo {@link Reservation} utilizando la información
     * proporcionada en el DTO de solicitud {@link ReservationRequest}.
     *
     * @param request El DTO que contiene los nuevos datos de la reserva.
     * @param entity  La entidad de reserva que será actualizada.
     */
    @Mapping(target = "id", ignore = true)
    @Mapping(target = "user", ignore = true)
    @Mapping(target = "responsible", ignore = true)
    @Mapping(target = "spaces", ignore = true)
    @Mapping(target = "subject", ignore = true)
    @Mapping(target = "status", ignore = true)
    @Mapping(target = "rejectionReason", ignore = true)
    @Mapping(target = "reminderSent", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    void updateEntityFromRequest(ReservationRequest request, @MappingTarget Reservation entity);
}
