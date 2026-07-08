package com.tfg.backend.modules.reservation.service;
import com.tfg.backend.core.common.BulkConflictSummaryDTO;
import com.tfg.backend.modules.reservation.dto.ReservationRequest;
import com.tfg.backend.modules.reservation.model.Reservation;
import com.tfg.backend.modules.reservation.model.ReservationStatus;
import com.tfg.backend.modules.reservation.model.ReservationType;
import com.tfg.backend.modules.space.dto.SpaceConflictDTO;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import java.time.LocalDateTime;

import java.util.List;

import com.tfg.backend.modules.reservation.dto.ReservationDTO;
import com.tfg.backend.modules.reservation.dto.ReservationRequest;
import com.tfg.backend.modules.reservation.model.Reservation;
import com.tfg.backend.modules.reservation.model.ReservationStatus;
import com.tfg.backend.modules.reservation.model.ReservationType;
import com.tfg.backend.modules.space.dto.SpaceConflictDTO;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import java.time.LocalDateTime;

import java.util.List;

/**
 * Interfaz para el servicio de gestión de reservas.
 * Define las operaciones permitidas sobre el ciclo de vida de una reserva en el sistema.
 */
public interface ReservationService {

    /**
     * Recupera una lista paginada de reservas filtradas con resolución automática de visibilidad basada en el alcance (scope).
     *
     * @param status           El estado de la reserva a filtrar.
     * @param type             El tipo de la reserva a filtrar.
     * @param spaceIds         Lista de identificadores de los espacios asociados a la reserva.
     * @param scope            El alcance o contexto de la búsqueda (por ejemplo, visibilidad global o limitada).
     * @param userIds          Lista de identificadores de los usuarios solicitantes.
     * @param startDate        Fecha y hora de inicio para el rango de búsqueda.
     * @param endDate          Fecha y hora de fin para el rango de búsqueda.
     * @param search           Término de búsqueda de texto libre (título o responsable).
     * @param subjectIds       Lista de identificadores de las asignaturas vinculadas.
     * @param includeCancelled Indica si se deben incluir reservas canceladas en los resultados.
     * @param pageable         Información de paginación y ordenamiento.
     * @return Una página que contiene los objetos de transferencia de datos de las reservas que cumplen los criterios.
     */
    Page<ReservationDTO> findAll(ReservationStatus status, ReservationType type, List<Long> spaceIds, 
                            String scope, List<Long> userIds, LocalDateTime startDate, LocalDateTime endDate, 
                            String search, List<Long> subjectIds, boolean includeCancelled, Pageable pageable);

    /**
     * Recupera reservas filtradas devolviendo las entidades de dominio originales.
     * Este método se destina a uso interno o procesos de exportación de datos.
     *
     * @param status           El estado de la reserva a filtrar.
     * @param type             El tipo de la reserva a filtrar.
     * @param spaceIds         Lista de identificadores de los espacios asociados.
     * @param scope            El alcance o contexto de la búsqueda.
     * @param userIds          Lista de identificadores de los usuarios solicitantes.
     * @param startDate        Fecha y hora de inicio para el rango de búsqueda.
     * @param endDate          Fecha y hora de fin para el rango de búsqueda.
     * @param search           Término de búsqueda de texto libre.
     * @param subjectIds       Lista de identificadores de las asignaturas vinculadas.
     * @param includeCancelled Indica si se deben incluir reservas canceladas.
     * @param pageable         Información de paginación y ordenamiento.
     * @return Una página que contiene las entidades de reservas que cumplen los criterios de búsqueda.
     */
    Page<Reservation> findAllEntities(ReservationStatus status, ReservationType type, List<Long> spaceIds, 
                            String scope, List<Long> userIds, LocalDateTime startDate, LocalDateTime endDate, 
                            String search, List<Long> subjectIds, boolean includeCancelled, Pageable pageable);

    /**
     * Recupera reservas filtradas mediante una firma original para compatibilidad interna
     * o casos de uso específicos que requieren control de seguridad explícito.
     *
     * @param status            El estado de la reserva.
     * @param type              El tipo de la reserva.
     * @param spaceIds          Lista de identificadores de los espacios.
     * @param targetUserIds     Lista de identificadores de usuarios objetivo (solicitantes o responsables).
     * @param securityUserId    Identificador del usuario para aplicar lógica de seguridad y permisos.
     * @param managedSubjectIds Lista de identificadores de asignaturas gestionadas por el usuario.
     * @param startDate         Fecha y hora de inicio del filtro.
     * @param endDate           Fecha y hora de fin del filtro.
     * @param search            Término de búsqueda por texto.
     * @param subjectIds        Lista de identificadores de asignaturas.
     * @param includeCancelled  Booleano para incluir o excluir reservas canceladas/rechazadas.
     * @param pageable          Objeto que encapsula la paginación.
     * @return Una página con los resultados de reservas encapsulados en DTO.
     */
    Page<ReservationDTO> findAll(ReservationStatus status, ReservationType type, List<Long> spaceIds, 
                            List<Long> targetUserIds, Long securityUserId, List<Long> managedSubjectIds, 
                            LocalDateTime startDate, LocalDateTime endDate, String search, 
                            List<Long> subjectIds, boolean includeCancelled, Pageable pageable);
    
    /**
     * Recupera los datos de una reserva a partir de su identificador.
     *
     * @param id El identificador único de la reserva.
     * @return El objeto de transferencia de datos representativo de la reserva.
     */
    ReservationDTO findById(Long id);

    /**
     * Recupera la entidad del dominio de una reserva a partir de su identificador (uso interno).
     *
     * @param id El identificador único de la reserva.
     * @return La entidad de dominio de la reserva.
     */
    Reservation findByIdEntity(Long id);

    /**
     * Crea una nueva reserva o bloquea los espacios indicados según la solicitud.
     *
     * @param request   Objeto que contiene los datos de la solicitud de la reserva.
     * @param userEmail Correo electrónico del usuario que realiza la solicitud.
     * @return El objeto de transferencia de datos correspondiente a la nueva reserva creada.
     */
    ReservationDTO createReservation(ReservationRequest request, String userEmail);

    /**
     * Actualiza la información de una reserva existente en el sistema.
     *
     * @param id      Identificador único de la reserva a actualizar.
     * @param request Objeto que contiene los nuevos datos de la reserva.
     * @return El objeto de transferencia de datos de la reserva actualizada.
     */
    ReservationDTO updateReservation(Long id, ReservationRequest request);

    /**
     * Elimina o cancela de manera definitiva una reserva del sistema.
     *
     * @param id Identificador único de la reserva.
     */
    void deleteReservation(Long id);

    /**
     * Elimina o cancela múltiples reservas de forma masiva en una sola operación.
     *
     * @param ids Lista de identificadores de las reservas a eliminar.
     */
    void deleteMultiple(List<Long> ids);

    /**
     * Modifica el estado de una reserva (por ejemplo, para su aprobación o rechazo).
     *
     * @param id              Identificador de la reserva.
     * @param status          El nuevo estado a asignar.
     * @param rejectionReason Motivo en caso de rechazo, puede ser nulo si no aplica.
     * @return El objeto DTO de la reserva con su estado actualizado.
     */
    ReservationDTO updateStatus(Long id, ReservationStatus status, String rejectionReason);

    /**
     * Comprueba la existencia de posibles conflictos de horarios y espacios.
     *
     * @param spaceIds Lista de identificadores de los espacios a comprobar.
     * @param start    Fecha y hora de inicio de la ocupación.
     * @param end      Fecha y hora de fin de la ocupación.
     * @param excludeId Identificador de reserva a excluir de la validación (para actualizaciones).
     * @return Una lista de conflictos encontrados en los espacios seleccionados.
     */
    List<com.tfg.backend.modules.space.dto.SpaceConflictDTO> checkConflicts(List<Long> spaceIds, LocalDateTime start, LocalDateTime end, Long excludeId);

    /**
     * Obtiene un resumen consolidado de los conflictos detectados para una operación masiva sobre reservas.
     *
     * @param ids Lista de identificadores de las reservas involucradas.
     * @return Un objeto DTO que sumariza la información de los conflictos masivos.
     */
    com.tfg.backend.core.common.BulkConflictSummaryDTO getBulkReservationConflictSummary(List<Long> ids);
}
