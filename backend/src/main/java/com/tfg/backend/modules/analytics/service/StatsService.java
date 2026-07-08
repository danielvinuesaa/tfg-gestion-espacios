package com.tfg.backend.modules.analytics.service;
import com.tfg.backend.modules.analytics.dto.StatsDTO;
import com.tfg.backend.modules.identity.model.User;

import java.time.LocalDateTime;

/**
 * Interfaz de servicio que define las operaciones para la obtención de métricas,
 * indicadores de rendimiento (KPIs) y análisis estadísticos tanto a nivel global
 * del sistema como a nivel individual de usuario.
 */
public interface StatsService {

    /**
     * Obtiene las estadísticas globales del sistema para un periodo temporal específico.
     *
     * @param startDate Fecha de inicio del periodo.
     * @param endDate   Fecha de fin del periodo.
     * @return Objeto {@link StatsDTO} que encapsula todas las métricas globales calculadas.
     */
    StatsDTO getGlobalStats(LocalDateTime startDate, LocalDateTime endDate);

    /**
     * Obtiene las estadísticas personalizadas referentes a la actividad de un único usuario.
     *
     * @param user      Usuario para el cual se requiere la información analítica.
     * @param startDate Fecha de inicio del periodo.
     * @param endDate   Fecha de fin del periodo.
     * @return Objeto {@link StatsDTO} que encapsula las métricas individuales.
     */
    StatsDTO getUserStats(User user, LocalDateTime startDate, LocalDateTime endDate);

    /**
     * Resuelve y retorna el conjunto de estadísticas adecuadas (globales o individuales)
     * basándose en los permisos de seguridad y el rol del usuario que realiza la petición.
     *
     * @param user      El usuario en sesión que solicita las métricas.
     * @param startDate Fecha de inicio del periodo.
     * @param endDate   Fecha de fin del periodo.
     * @return Objeto {@link StatsDTO} con la información pertinente según el perfil del usuario.
     */
    StatsDTO getStatsForUser(User user, LocalDateTime startDate, LocalDateTime endDate);
}
