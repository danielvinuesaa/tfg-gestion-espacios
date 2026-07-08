package com.tfg.backend.modules.space.service;
import com.tfg.backend.core.common.BulkConflictSummaryDTO;
import com.tfg.backend.core.common.ImportResultDTO;
import com.tfg.backend.modules.space.dto.SpaceDTO;
import com.tfg.backend.modules.space.dto.SpaceConflictDTO;
import com.tfg.backend.modules.space.dto.SpaceRequest;
import com.tfg.backend.modules.space.model.Space;
import com.tfg.backend.modules.space.model.SpaceStatus;
import com.tfg.backend.modules.space.model.SpaceType;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.web.multipart.MultipartFile;
import java.util.List;

/**
 * Interfaz que define las operaciones de servicio para la gestión de espacios.
 * Proporciona métodos para el ciclo de vida completo de la entidad {@link Space}.
 */
public interface SpaceService {

    /**
     * Recupera una página de espacios.
     *
     * @param includeDeleted Indica si se deben incluir los espacios eliminados en el resultado.
     * @param pageable       Información de paginación y ordenamiento.
     * @return Una página de objetos {@link SpaceDTO}.
     */
    Page<SpaceDTO> findAll(boolean includeDeleted, Pageable pageable);

    /**
     * Busca un espacio por su identificador único.
     *
     * @param id El identificador del espacio.
     * @return El {@link SpaceDTO} correspondiente al identificador proporcionado.
     */
    SpaceDTO findById(Long id);

    /**
     * Crea un nuevo espacio basado en la información proporcionada.
     *
     * @param request La información necesaria para crear el espacio.
     * @return El {@link SpaceDTO} creado.
     */
    SpaceDTO create(com.tfg.backend.modules.space.dto.SpaceRequest request);

    /**
     * Actualiza un espacio existente.
     *
     * @param id      El identificador del espacio a actualizar.
     * @param request La nueva información del espacio.
     * @return El {@link SpaceDTO} con la información actualizada.
     */
    SpaceDTO update(Long id, com.tfg.backend.modules.space.dto.SpaceRequest request);

    /**
     * Elimina lógicamente un espacio por su identificador.
     *
     * @param id El identificador del espacio a eliminar.
     */
    void deleteById(Long id);

    /**
     * Realiza una eliminación masiva de espacios.
     *
     * @param ids   Lista de identificadores de los espacios a eliminar.
     * @param force Si es verdadero, fuerza la eliminación incluso si existen dependencias.
     */
    void deleteMultiple(List<Long> ids, boolean force);

    /**
     * Obtiene un resumen de conflictos para un lote de espacios.
     * Útil antes de realizar operaciones destructivas masivas.
     *
     * @param ids Lista de identificadores de los espacios.
     * @return Un objeto {@link BulkConflictSummaryDTO} con el resumen de los conflictos.
     */
    com.tfg.backend.core.common.BulkConflictSummaryDTO getBulkSpaceConflictSummary(List<Long> ids);

    /**
     * Restaura un espacio que había sido eliminado lógicamente.
     *
     * @param id El identificador del espacio a restaurar.
     */
    void restoreById(Long id);

    /**
     * Importa espacios desde un archivo CSV.
     *
     * @param file      El archivo multipart que contiene los datos en formato CSV.
     * @param overwrite Indica si se deben sobrescribir los espacios existentes.
     * @return Objeto {@link ImportResultDTO} con el resultado de la importación.
     */
    ImportResultDTO importSpaces(MultipartFile file, boolean overwrite);

    /**
     * Valida la estructura y el contenido de un archivo CSV para su futura importación,
     * sin persistir los datos.
     *
     * @param file El archivo multipart a validar.
     * @return Objeto {@link ImportResultDTO} con el resultado de la validación.
     */
    ImportResultDTO validateImport(MultipartFile file);

    /**
     * Exporta la lista de espacios a formato CSV.
     *
     * @return Arreglo de bytes que representa el archivo CSV generado.
     */
    byte[] exportSpacesToCsv();

    /**
     * Busca espacios de forma paginada utilizando múltiples filtros.
     *
     * @param name           Nombre o parte del nombre del espacio.
     * @param type           Tipo de espacio.
     * @param status         Estado actual del espacio.
     * @param minCapacity    Capacidad mínima requerida.
     * @param minComputers   Número mínimo de ordenadores.
     * @param start          Fecha y hora de inicio de disponibilidad requerida.
     * @param end            Fecha y hora de fin de disponibilidad requerida.
     * @param includeDeleted Indica si se incluyen espacios marcados como eliminados.
     * @param pageable       Información de paginación.
     * @return Una página de objetos {@link SpaceDTO} que cumplen los criterios.
     */
    Page<SpaceDTO> searchSpaces(String name, com.tfg.backend.modules.space.model.SpaceType type, com.tfg.backend.modules.space.model.SpaceStatus status, Integer minCapacity, Integer minComputers, java.time.LocalDateTime start, java.time.LocalDateTime end, boolean includeDeleted, Pageable pageable);
    
    /**
     * Búsqueda de espacios devolviendo entidades (uso interno y exportación).
     *
     * @param name           Nombre o parte del nombre del espacio.
     * @param type           Tipo de espacio.
     * @param status         Estado actual del espacio.
     * @param minCapacity    Capacidad mínima requerida.
     * @param minComputers   Número mínimo de ordenadores.
     * @param start          Fecha y hora de inicio.
     * @param end            Fecha y hora de fin.
     * @param includeDeleted Indica si se incluyen espacios marcados como eliminados.
     * @param pageable       Información de paginación.
     * @return Una página de entidades {@link Space} que cumplen los criterios.
     */
    Page<Space> searchSpacesEntities(String name, com.tfg.backend.modules.space.model.SpaceType type, com.tfg.backend.modules.space.model.SpaceStatus status, Integer minCapacity, Integer minComputers, java.time.LocalDateTime start, java.time.LocalDateTime end, boolean includeDeleted, Pageable pageable);

    /**
     * Busca la entidad de un espacio por su identificador.
     *
     * @param id El identificador del espacio.
     * @return La entidad {@link Space} encontrada.
     */
    com.tfg.backend.modules.space.model.Space findByIdEntity(Long id);

    /**
     * Recupera una lista de conflictos actuales y futuros asociados a un espacio.
     *
     * @param id El identificador del espacio.
     * @return Una lista de {@link SpaceConflictDTO} que representan las reservas en conflicto.
     */
    List<com.tfg.backend.modules.space.dto.SpaceConflictDTO> getConflicts(Long id);

    /**
     * Obtiene propuestas de espacios alternativos en base a una solicitud de disponibilidad.
     *
     * @param request Criterios de búsqueda de disponibilidad.
     * @return Un objeto que encapsula las propuestas de espacios disponibles.
     */
    Object getProposals(com.tfg.backend.modules.reservation.dto.AvailabilitySearchRequest request);
}
