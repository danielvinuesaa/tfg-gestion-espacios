package com.tfg.backend.modules.space.mapper;
import com.tfg.backend.modules.space.dto.SpaceDTO;
import com.tfg.backend.modules.space.dto.SpaceRequest;
import com.tfg.backend.modules.space.model.Space;

import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;
import org.mapstruct.ReportingPolicy;

import java.util.List;

/**
 * Componente (Mapper) basado en MapStruct responsable de la conversión bidireccional 
 * entre la entidad de dominio {@link Space}, sus Objetos de Transferencia de Datos (DTOs)
 * y los objetos de petición. Facilita la transformación de datos entre capas del sistema de forma eficiente y segura.
 */
@Mapper(componentModel = "spring", unmappedTargetPolicy = ReportingPolicy.IGNORE)
public interface SpaceMapper {

    /**
     * Mapea un objeto de petición de creación o actualización hacia la entidad de dominio.
     * Los atributos de control interno y de estado transitorio son ignorados durante el proceso.
     *
     * @param request El objeto que contiene la información de entrada.
     * @return Una nueva instancia de {@link Space} poblada con los datos provistos.
     */
    @Mapping(target = "id", ignore = true)
    @Mapping(target = "occupiedNow", ignore = true)
    Space toEntity(SpaceRequest request);

    /**
     * Convierte la entidad de dominio en un DTO ligero para su exposición a través de la API.
     *
     * @param entity La entidad {@link Space} original.
     * @return El objeto {@link SpaceDTO} correspondiente.
     */
    SpaceDTO toDto(Space entity);

    /**
     * Realiza la conversión masiva de una lista de entidades a una lista de DTOs.
     *
     * @param entities Lista de entidades de tipo {@link Space}.
     * @return Lista resultante de tipo {@link SpaceDTO}.
     */
    List<SpaceDTO> toDtoList(List<Space> entities);

    /**
     * Actualiza el estado de una entidad existente aplicando la información contenida en el objeto de petición.
     * Los atributos de identidad y de estado volátil permanecen inalterados.
     *
     * @param request El objeto con las actualizaciones requeridas.
     * @param entity  La entidad {@link Space} que será modificada (pasada por referencia).
     */
    @Mapping(target = "id", ignore = true)
    @Mapping(target = "occupiedNow", ignore = true)
    void updateEntityFromRequest(SpaceRequest request, @MappingTarget Space entity);
}
