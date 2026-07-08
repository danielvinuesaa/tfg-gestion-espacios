package com.tfg.backend.modules.space.repository;
import com.tfg.backend.modules.space.model.Space;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.util.Optional;

/**
 * Repositorio de acceso a datos para la entidad {@link Space}.
 * Utiliza {@link JpaSpecificationExecutor} para soportar filtrado dinámico y consultas complejas de forma profesional.
 */
@Repository
public interface SpaceRepository extends JpaRepository<Space, Long>, JpaSpecificationExecutor<Space> {
    
    /**
     * Busca un espacio por su nombre exacto.
     *
     * @param name El nombre del espacio a buscar.
     * @return Un {@link Optional} que contiene el espacio si se encuentra, o vacío en caso contrario.
     */
    Optional<Space> findByName(String name);
    
    /**
     * Busca un espacio por su nombre, ignorando diferencias de mayúsculas y minúsculas.
     *
     * @param name El nombre del espacio a buscar.
     * @return Un {@link Optional} que contiene el espacio si coincide.
     */
    Optional<Space> findByNameIgnoreCase(String name);
    
    /**
     * Busca un espacio por su identificador en el sistema de información geográfica (GIS).
     *
     * @param gisId El identificador GIS del espacio.
     * @return Un {@link Optional} que contiene el espacio correspondiente.
     */
    Optional<Space> findByGisId(String gisId);
    
    /**
     * Busca un espacio por su identificador GIS, ignorando diferencias de formato de capitalización.
     *
     * @param gisId El identificador GIS a buscar.
     * @return Un {@link Optional} con el espacio encontrado.
     */
    Optional<Space> findByGisIdIgnoreCase(String gisId);
    
    /**
     * Verifica si existe un espacio con el nombre dado, sin distinción de mayúsculas y minúsculas.
     *
     * @param name El nombre del espacio a verificar.
     * @return Verdadero si el espacio existe, falso en caso contrario.
     */
    boolean existsByNameIgnoreCase(String name);
    
    /**
     * Recupera una lista de espacios aplicando un bloqueo pesimista de escritura para garantizar
     * la integridad de los datos durante operaciones concurrentes.
     *
     * @param ids Colección de identificadores de los espacios a recuperar y bloquear.
     * @return Lista de entidades {@link Space} correspondientes a los identificadores dados.
     */
    @org.springframework.data.jpa.repository.Lock(jakarta.persistence.LockModeType.PESSIMISTIC_WRITE)
    @org.springframework.data.jpa.repository.Query("SELECT s FROM Space s WHERE s.id IN :ids")
    java.util.List<Space> findAllByIdWithLock(@org.springframework.data.repository.query.Param("ids") java.util.Collection<Long> ids);
}
