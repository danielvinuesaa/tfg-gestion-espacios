package com.tfg.backend.modules.space.model;

/**
 * Enumeración que define los diferentes estados físicos y lógicos que puede adoptar un espacio.
 * - DISPONIBLE: El espacio se encuentra operativo y es susceptible de ser reservado.
 * - ELIMINADO: El espacio ha sido dado de baja lógicamente en el sistema (soft delete) y no admite nuevas reservas.
 */
public enum SpaceStatus {
    DISPONIBLE,
    ELIMINADO
}
