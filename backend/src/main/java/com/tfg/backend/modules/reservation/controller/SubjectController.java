package com.tfg.backend.modules.reservation.controller;

import com.tfg.backend.modules.reservation.dto.SubjectDTO;
import com.tfg.backend.modules.reservation.service.SubjectService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * Controlador de la API REST destinado a gestionar las peticiones relativas
 * a las asignaturas (Subjects). Proporciona puntos de acceso para la consulta de información
 * referente a los datos curriculares vinculables a las reservas.
 */
@RestController
@RequestMapping("/api/subjects")
@RequiredArgsConstructor
public class SubjectController {

    /** Servicio de asignaturas. */
    private final SubjectService subjectService;

    /**
     * Obtiene todas las asignaturas.
     *
     * @return Lista de asignaturas
     */
    @GetMapping
    public ResponseEntity<List<SubjectDTO>> getAll() {
        return ResponseEntity.ok(subjectService.findAll());
    }

    /**
     * Obtiene una asignatura por su ID.
     *
     * @param id Identificador de la asignatura
     * @return Asignatura encontrada
     */
    @GetMapping("/{id}")
    public ResponseEntity<SubjectDTO> getById(@PathVariable Long id) {
        return ResponseEntity.ok(subjectService.findById(id));
    }
}
