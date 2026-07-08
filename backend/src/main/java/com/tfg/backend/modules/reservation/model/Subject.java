package com.tfg.backend.modules.reservation.model;

import jakarta.persistence.*;
import lombok.*;

/**
 * Entidad de dominio que representa formalmente una Asignatura dentro de la estructura académica.
 * Contiene la definición curricular básica, que permite la asociación de reservas específicas
 * (evaluaciones o clases magistrales) a sus respectivas ramas formativas.
 */
@Entity
@Table(name = "subjects")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Subject {

    /** Identificador único. */
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** Código de la asignatura. */
    @Column(nullable = false, unique = true)
    private String code;

    /** Nombre de la asignatura. */
    @Column(nullable = false)
    private String name;

    /** Curso en el que se imparte. */
    @Column(nullable = false)
    private String course;
}
