package com.tfg.backend.modules.reservation.service;

import com.tfg.backend.core.exception.ResourceNotFoundException;
import com.tfg.backend.modules.reservation.dto.SubjectDTO;
import com.tfg.backend.modules.reservation.mapper.SubjectMapper;
import com.tfg.backend.modules.reservation.model.Subject;
import com.tfg.backend.modules.reservation.repository.SubjectRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * Implementación del servicio encargado de la gestión de las asignaturas.
 * Proporciona métodos transaccionales para la consulta y recuperación de datos de las materias.
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class SubjectServiceImpl implements SubjectService {

    /** Repositorio de asignaturas. */
    private final SubjectRepository subjectRepository;
    /** Mapeador de asignaturas. */
    private final SubjectMapper subjectMapper;

    @Override
    public List<SubjectDTO> findAll() {
        return subjectMapper.toDtoList(subjectRepository.findAll());
    }

    @Override
    public SubjectDTO findById(Long id) {
        return subjectMapper.toDto(findByIdEntity(id));
    }

    @Override
    public Subject findByIdEntity(Long id) {
        return subjectRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Asignatura", "id", id));
    }
}
