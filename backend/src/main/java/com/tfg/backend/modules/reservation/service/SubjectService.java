package com.tfg.backend.modules.reservation.service;

import com.tfg.backend.modules.reservation.dto.SubjectDTO;
import com.tfg.backend.modules.reservation.model.Subject;

import java.util.List;

/**
 * Interfaz que define las operaciones disponibles para la consulta y obtención
 * de la información relativa a las asignaturas registradas en el sistema.
 */
public interface SubjectService {
    List<SubjectDTO> findAll();
    SubjectDTO findById(Long id);
    Subject findByIdEntity(Long id);
}
