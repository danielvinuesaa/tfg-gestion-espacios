package com.tfg.backend.modules.identity.model;

import jakarta.persistence.*;
import lombok.*;

/**
 * Entidad JPA que representa un permiso atómico dentro del sistema.
 * Los permisos constituyen las unidades fundamentales del modelo de seguridad
 * y control de acceso. Por diseño, estos no deben ser creados dinámicamente 
 * por el usuario final, sino que son definidos e inicializados por el sistema.
 */
@Entity
@Table(name = "permissions")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Permission {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** Nombre técnico del permiso (ej: 'CREAR_ESPACIOS') */
    @Column(nullable = false, unique = true)
    private String name;

    /** Nombre legible para la interfaz (ej: 'Crear Espacios') */
    private String label;

    /** Descripción detallada de la funcionalidad que habilita */
    @Column(length = 500)
    private String description;
}
