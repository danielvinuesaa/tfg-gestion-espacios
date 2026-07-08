package com.tfg.backend.modules.identity.service;
import com.tfg.backend.modules.identity.dto.UserDTO;
import com.tfg.backend.modules.identity.dto.UserConflictDTO;
import com.tfg.backend.modules.identity.dto.UserMeDTO;
import com.tfg.backend.modules.identity.dto.UserRequest;
import com.tfg.backend.modules.identity.model.User;
import com.tfg.backend.modules.identity.model.UserStatus;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import java.util.List;

/**
 * Interfaz de servicio que define las operaciones de negocio permitidas para la entidad {@link User} (Usuario).
 * Proporciona métodos para la creación, consulta, actualización, eliminación (incluida masiva),
 * y restauración de usuarios, así como la gestión de conflictos relacionados con sus reservas.
 */
public interface UserService {
    
    /**
     * Obtiene todos los usuarios sin paginación (uso limitado).
     */
    List<UserDTO> findAll();

    /**
     * Busca un usuario por su ID.
     */
    UserDTO findById(Long id);

    /**
     * Busca la entidad real por su ID (uso interno).
     */
    User findByIdEntity(Long id);

    /**
     * Obtiene el perfil resumido del usuario autenticado.
     */
    UserMeDTO getMe(User user);

    /**
     * Crea un nuevo usuario en el sistema.
     */
    UserDTO createUser(UserRequest request);

    /**
     * Actualiza los datos de un usuario existente.
     */
    UserDTO updateUser(Long id, UserRequest request);

    /**
     * Actualiza solo la contraseña de un usuario.
     */
    void updatePassword(Long id, String currentPassword, String newPassword);

    /**
     * Intenta eliminar un usuario (marcado lógico o físico según política).
     */
    void deleteUser(Long id);

    /**
     * Elimina múltiples usuarios de forma masiva.
     * @param ids Lista de IDs a eliminar.
     * @param force Si es true, cancela reservas activas. Si es false, ignora usuarios con conflictos.
     */
    void deleteMultiple(List<Long> ids, boolean force);

    /**
     * Resume los conflictos de un conjunto de usuarios.
     */
    com.tfg.backend.core.common.BulkConflictSummaryDTO getBulkUserConflictSummary(List<Long> ids);

    /**
     * Fuerza la eliminación de un usuario y sus dependencias asociadas.
     */
    void forceDeleteUser(Long id);

    /**
     * Analiza conflictos de reservas del usuario.
     */
    UserConflictDTO getUserConflicts(Long id);

    /**
     * Realiza una búsqueda paginada con filtros.
     */
    Page<UserDTO> searchUsers(String searchTerm, Long roleId, com.tfg.backend.modules.identity.model.UserStatus status, boolean includeDeleted, Pageable pageable);

    /**
     * Realiza una búsqueda paginada con filtros devolviendo entidades (uso interno/exportación).
     */
    Page<User> searchUsersEntities(String searchTerm, Long roleId, com.tfg.backend.modules.identity.model.UserStatus status, boolean includeDeleted, Pageable pageable);

    /**
     * Restaura un usuario eliminado (borrado lógico) al estado activo.
     */
    void restoreUser(Long id);

    /**
     * Restaura un usuario eliminado buscando por su email.
     */
    void restoreUserByEmail(String email);
}
