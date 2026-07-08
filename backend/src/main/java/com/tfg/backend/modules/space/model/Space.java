package com.tfg.backend.modules.space.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Entidad del modelo de dominio que representa un espacio físico dentro de la organización
 * (por ejemplo, aulas, laboratorios, despachos). Contiene la información persistente sobre 
 * sus características técnicas, capacidad y estado operativo, así como propiedades transitorias
 * para indicar su nivel de ocupación en tiempo real.
 */
@Entity
@Table(name = "spaces")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Space {

    /**
     * Identificador único autogenerado de la entidad en la base de datos.
     */
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /**
     * Nombre único que identifica el espacio dentro del sistema.
     */
    @Column(nullable = false, unique = true)
    private String name;

    /**
     * Clasificación o tipo de espacio, por ejemplo, aula, laboratorio o sala de reuniones.
     */
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private SpaceType type;

    /**
     * Aforo máximo o capacidad total admitida en el espacio.
     */
    @Column(nullable = false)
    private Integer totalCapacity;

    /**
     * Número de equipos informáticos de los que dispone el espacio.
     */
    private Integer computerCount;

    /**
     * Código o identificador externo utilizado para sistemas de mapeo y GIS.
     */
    private String gisId;

    /**
     * Estado operativo actual del espacio, como activo, inactivo o en mantenimiento.
     */
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private SpaceStatus status;

    /**
     * Notas o detalles adicionales relevantes sobre el equipamiento o características del espacio.
     */
    private String additionalInfo;

    /**
     * Atributo transitorio que indica si el espacio está siendo utilizado en el momento de la consulta.
     */
    @Transient
    private boolean occupiedNow;

    /**
     * Atributo transitorio que indica si el espacio se encuentra temporalmente bloqueado en el momento actual.
     */
    @Transient
    private boolean blockedNow;
}
