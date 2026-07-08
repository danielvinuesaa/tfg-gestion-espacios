package com.tfg.backend.modules.reservation.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Objeto de transferencia de datos que encapsula la información representativa de una Asignatura (Subject).
 * Se emplea para facilitar el intercambio de datos curriculares de manera exenta de dependencias estructurales complejas,
 * exponiendo propiedades clave como el código y la denominación.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SubjectDTO {
    /** Identificador. */
    private Long id;
    /** Código de asignatura. */
    private String code;
    /** Nombre. */
    private String name;
    /** Curso. */
    private String course;
}
