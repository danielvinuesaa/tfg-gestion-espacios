package com.tfg.backend.modules.reservation.repository;
import com.tfg.backend.modules.reservation.model.Subject;

import org.springframework.data.jpa.repository.JpaRepository;

/**
 * Repositorio para la entidad de dominio Asignatura (Subject).
 * Provee acceso a la capa de persistencia e incluye operaciones de acceso y modificación
 * sobre los registros de las asignaturas.
 */
public interface SubjectRepository extends JpaRepository<Subject, Long> {
    java.util.Optional<Subject> findByCode(String code);
}
