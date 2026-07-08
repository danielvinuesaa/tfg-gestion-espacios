package com.tfg.backend.modules.reservation.mapper;

import com.tfg.backend.modules.reservation.dto.SubjectDTO;
import com.tfg.backend.modules.reservation.model.Subject;
import org.mapstruct.Mapper;
import org.mapstruct.ReportingPolicy;

import java.util.List;

/**
 * Interfaz de mapeo encargada de realizar la traducción bidireccional de datos 
 * entre la entidad de dominio Asignatura (Subject) y su objeto de transferencia (SubjectDTO).
 * Emplea MapStruct para la generación automática de rutinas de conversión eficientes y seguras.
 */
@Mapper(componentModel = "spring", unmappedTargetPolicy = ReportingPolicy.IGNORE)
public interface SubjectMapper {
    SubjectDTO toDto(Subject entity);
    List<SubjectDTO> toDtoList(List<Subject> entities);
}
