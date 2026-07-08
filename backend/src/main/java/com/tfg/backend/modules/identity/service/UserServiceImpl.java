package com.tfg.backend.modules.identity.service;
import com.tfg.backend.modules.identity.dto.UserDTO;
import com.tfg.backend.core.audit.Auditable;
import com.tfg.backend.core.common.BulkConflictSummaryDTO;
import com.tfg.backend.core.common.ConflictDetailDTO;
import com.tfg.backend.core.exception.BusinessValidationException;
import com.tfg.backend.core.exception.ResourceNotFoundException;
import com.tfg.backend.core.security.SecurityService;
import com.tfg.backend.core.util.BulkConflictHelper;
import com.tfg.backend.core.util.PaginationUtils;
import com.tfg.backend.modules.identity.validator.UserValidator;
import com.tfg.backend.modules.notification.repository.NotificationRepository;
import com.tfg.backend.modules.reservation.model.Reservation;
import com.tfg.backend.modules.reservation.model.ReservationStatus;
import com.tfg.backend.modules.reservation.repository.ReservationRepository;
import com.tfg.backend.modules.space.model.Space;
import com.tfg.backend.modules.identity.dto.UserConflictDTO;
import com.tfg.backend.modules.identity.dto.UserConflictDetailDTO;
import com.tfg.backend.modules.identity.dto.UserMeDTO;
import com.tfg.backend.modules.identity.dto.UserRequest;
import com.tfg.backend.modules.identity.mapper.UserMapper;
import com.tfg.backend.modules.identity.model.Role;
import com.tfg.backend.modules.identity.model.User;
import com.tfg.backend.modules.identity.model.UserStatus;
import com.tfg.backend.modules.identity.repository.RoleRepository;
import com.tfg.backend.modules.identity.repository.UserRepository;
import com.tfg.backend.modules.identity.repository.UserSpecifications;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

/**
 * Implementación del servicio responsable de la gestión de usuarios.
 * Coordina la persistencia, las validaciones, el cifrado de contraseñas,
 * la actualización de roles y el manejo de conflictos (como la cancelación de reservas activas)
 * derivados de cambios de estado o eliminaciones de los usuarios.
 */
@Service
@RequiredArgsConstructor
@Transactional
@Slf4j
public class UserServiceImpl implements UserService {

    /** Repositorio de usuarios. */
    private final UserRepository userRepository;
    /** Repositorio de roles. */
    private final RoleRepository roleRepository;
    /** Repositorio de reservas. */
    private final ReservationRepository reservationRepository;
    /** Repositorio de notificaciones. */
    private final NotificationRepository notificationRepository;
    /** Codificador de contraseñas. */
    private final PasswordEncoder passwordEncoder;
    /** Validador de usuarios. */
    private final UserValidator userValidator;
    /** Servicio de seguridad. */
    private final SecurityService securityService;
    /** Mapeador de usuarios. */
    private final UserMapper userMapper;

    @Override
    @Transactional(readOnly = true)
    public List<UserDTO> findAll() {
        return userRepository.findAll().stream()
                .filter(u -> u.getStatus() != UserStatus.ELIMINADO)
                .map(userMapper::toDto)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public UserDTO findById(Long id) {
        return userMapper.toDto(findByIdEntity(id));
    }

    @Override
    @Transactional(readOnly = true)
    public User findByIdEntity(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Usuario", "id", id));
        if (user.getStatus() == UserStatus.ELIMINADO) {
            throw new ResourceNotFoundException("Usuario", "id", id);
        }
        return user;
    }

    @Override
    @Transactional(readOnly = true)
    public UserMeDTO getMe(User user) {
        return UserMeDTO.builder()
                .id(user.getId())
                .email(user.getEmail())
                .name(user.getName())
                .role(user.getRole().getName())
                .permissions(user.getRole().getPermissionNames())
                .managedSubjectIds(user.getRole().getSubjectIds())
                .build();
    }

    @Override
    @Auditable(entity = "User", action = "CREATE_USER")
    public UserDTO createUser(UserRequest request) {
        userValidator.validateEmail(request.getEmail(), userRepository.findByEmail(request.getEmail()));
        userValidator.validatePasswordStrength(request.getPassword());

        Role role = roleRepository.findById(request.getRoleId())
                .orElseThrow(() -> new ResourceNotFoundException("Rol", "id", request.getRoleId()));

        // Mapeo automático de campos simples
        User user = userMapper.toEntity(request);
        
        // Resolución manual de campos críticos
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setRole(role);
        
        if (user.getStatus() == null) {
            user.setStatus(UserStatus.ACTIVO);
        }

        return userMapper.toDto(userRepository.save(user));
    }

    @Override
    @Auditable(entity = "User", action = "UPDATE_USER")
    public UserDTO updateUser(Long id, UserRequest request) {
        User user = findByIdEntity(id);
        String currentEmail = getCurrentUserEmail();

        // Si se está editando a sí mismo, validamos que no cambie campos críticos
        if (user.getEmail().equalsIgnoreCase(currentEmail)) {
            userValidator.validateSelfUpdate(user, request.getRoleId(), request.getStatus());
        }

        String oldEmail = user.getEmail();

        if (!oldEmail.equalsIgnoreCase(request.getEmail())) {
            userValidator.validateEmail(request.getEmail(), userRepository.findByEmail(request.getEmail()));
        } else {
            userValidator.validateEmail(request.getEmail(), Optional.empty());
        }

        // Actualización automática de campos mediante MapStruct
        userMapper.updateEntityFromRequest(request, user);

        // Actualización manual de rol y seguridad
        if (request.getRoleId() != null) {
            Role role = roleRepository.findById(request.getRoleId())
                    .orElseThrow(() -> new ResourceNotFoundException("Rol", "id", request.getRoleId()));
            user.setRole(role);
        }

        if (request.getPassword() != null && !request.getPassword().isEmpty()) {
            userValidator.validatePasswordStrength(request.getPassword());
            user.setPassword(passwordEncoder.encode(request.getPassword()));
        }

        // Reglas de integridad para el administrador principal
        if (request.getStatus() != null) {
            boolean statusChangingToBlocked = request.getStatus() == UserStatus.BLOQUEADO && user.getStatus() != UserStatus.BLOQUEADO;
            
            if (statusChangingToBlocked && !"admin@uniovi.es".equalsIgnoreCase(user.getEmail())) {
                List<Reservation> activeReservations = reservationRepository.findActiveReservationsByUserId(user.getId(), LocalDateTime.now());
                if (!activeReservations.isEmpty()) {
                    if (Boolean.TRUE.equals(request.getForce())) {
                        cancelUserReservations(user.getId(), "Cancelada por bloqueo del usuario propietario.");
                    } else {
                        throw new BusinessValidationException("reservations", "CONFLICTO: El usuario tiene " + activeReservations.size() + " reservas activas.");
                    }
                }
            }

            if (!"admin@uniovi.es".equalsIgnoreCase(user.getEmail()) || request.getStatus() == UserStatus.ACTIVO) {
                user.setStatus(request.getStatus());
            }
        }

        return userMapper.toDto(userRepository.save(user));
    }

    @Override
    @Auditable(entity = "User", action = "UPDATE_PASSWORD")
    public void updatePassword(Long id, String currentPassword, String newPassword) {
        User user = findByIdEntity(id);
        
        if (!passwordEncoder.matches(currentPassword, user.getPassword())) {
            throw new BusinessValidationException("currentPassword", "La contraseña actual no es correcta.");
        }
        
        userValidator.validatePasswordStrength(newPassword);
        user.setPassword(passwordEncoder.encode(newPassword));
        userRepository.save(user);
    }

    private void cancelUserReservations(Long userId, String reason) {
        LocalDateTime now = LocalDateTime.now();
        // Buscamos todas donde sea solicitante O responsable
        List<Reservation> userReservations = reservationRepository.findActiveReservationsByUserId(userId, now);
        for (Reservation res : userReservations) {
            // Ya vienen filtradas por estado y tiempo en el repo
            res.setStatus(ReservationStatus.CANCELADA);
            res.setRejectionReason(reason);
            reservationRepository.save(res);
        }
    }

    @Override
    @Transactional(readOnly = true)
    public Page<UserDTO> searchUsers(String searchTerm, Long roleId, UserStatus status, boolean includeDeleted, Pageable pageable) {
        Page<User> page = searchUsersEntities(searchTerm, roleId, status, includeDeleted, pageable);

        List<User> content = new ArrayList<>(page.getContent());
        if (pageable.getPageNumber() == 0 && !content.isEmpty()) {
            content.stream()
                .filter(u -> "admin@uniovi.es".equalsIgnoreCase(u.getEmail()))
                .findFirst()
                .ifPresent(admin -> {
                    content.remove(admin);
                    content.add(0, admin);
                });
        }

        return new PageImpl<>(
                content.stream().map(userMapper::toDto).collect(Collectors.toList()),
                pageable,
                page.getTotalElements()
        );
    }

    @Override
    @Transactional(readOnly = true)
    public Page<User> searchUsersEntities(String searchTerm, Long roleId, UserStatus status, boolean includeDeleted, Pageable pageable) {
        Pageable insensitivePageable = PaginationUtils.ensureCaseInsensitive(pageable);
        var spec = UserSpecifications.withFilters(searchTerm, roleId, status, includeDeleted);
        return userRepository.findAll(spec, insensitivePageable);
    }

    @Override
    @Transactional(readOnly = true)
    public UserConflictDTO getUserConflicts(Long id) {
        List<Reservation> activeReservations = reservationRepository.findActiveReservationsByUserId(id, LocalDateTime.now());
        
        List<String> spaceNames = activeReservations.stream()
                .flatMap(r -> r.getSpaces().stream())
                .map(Space::getName)
                .distinct()
                .collect(Collectors.toList());

        List<UserConflictDetailDTO> details = activeReservations.stream()
                .map(r -> UserConflictDetailDTO.builder()
                        .reservationId(r.getId())
                        .spaceName(r.getSpaces().stream().map(Space::getName).collect(Collectors.joining(", ")))
                        .startTime(r.getStartTime())
                        .endTime(r.getEndTime())
                        .status(r.getStatus().name())
                        .build())
                .collect(Collectors.toList());

        return UserConflictDTO.builder()
                .hasConflicts(!activeReservations.isEmpty())
                .conflictCount(activeReservations.size())
                .spaceNames(spaceNames)
                .details(details)
                .build();
    }

    @Override
    @Auditable(entity = "User", action = "DELETE_USER")
    public void forceDeleteUser(Long id) {
        User user = findByIdEntity(id);
        userValidator.validateNotAdmin(user);

        cancelUserReservations(user.getId(), "Cancelada por eliminación del usuario propietario.");

        notificationRepository.deleteByUser(user);
        user.setStatus(UserStatus.ELIMINADO);
        userRepository.save(user);
    }

    @Override
    @Auditable(entity = "User", action = "DELETE_USER")
    public void deleteUser(Long id) {
        User user = findByIdEntity(id);
        userValidator.validateNotAdmin(user);
        userValidator.validateNotSelf(getCurrentUserEmail(), user.getEmail());

        List<Reservation> activeReservations = reservationRepository.findActiveReservationsByUserId(id, LocalDateTime.now());
        if (!activeReservations.isEmpty()) {
            throw new BusinessValidationException("reservations", "CONFLICTO: El usuario tiene " + activeReservations.size() + " reservas activas.");
        }

        notificationRepository.deleteByUser(user);
        user.setStatus(UserStatus.ELIMINADO);
        userRepository.save(user);
    }

    @Override
    @Transactional(readOnly = true)
    public BulkConflictSummaryDTO getBulkUserConflictSummary(List<Long> ids) {
        return BulkConflictHelper.buildSummary(
                ids,
                id -> userRepository.findById(id).orElse(null),
                u -> u.getName() + " (" + u.getEmail() + ")",
                user -> (long) reservationRepository.findActiveReservationsByUserId(user.getId(), LocalDateTime.now()).size()
        );
    }

    @Override
    @Transactional
    @Auditable(entity = "User", action = "DELETE_USER_BULK", includeId = false)
    public void deleteMultiple(List<Long> ids, boolean force) {
        if (ids == null || ids.isEmpty()) return;
        
        for (Long id : ids) {
            try {
                if (force) {
                    forceDeleteUser(id);
                } else {
                    deleteUser(id);
                }
            } catch (Exception e) {
                log.warn("Saltando usuario {} en borrado masivo por conflicto: {}", id, e.getMessage());
            }
        }
    }


    @Override
    @Auditable(entity = "User", action = "RESTORE_USER")
    public void restoreUser(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Usuario", "id", id));
        
        if (user.getStatus() != UserStatus.ELIMINADO) {
            throw new BusinessValidationException("status", "El usuario no está eliminado.");
        }

        user.setStatus(UserStatus.ACTIVO);
        userRepository.save(user);
    }

    @Override
    @Auditable(entity = "User", action = "RESTORE_USER")
    public void restoreUserByEmail(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Usuario", "email", email));
        
        if (user.getStatus() != UserStatus.ELIMINADO) {
            throw new BusinessValidationException("status", "El usuario no está eliminado.");
        }

        user.setStatus(UserStatus.ACTIVO);
        userRepository.save(user);
    }

    private String getCurrentUserEmail() {
        User user = securityService.getCurrentUser();
        return user != null ? user.getEmail() : "SYSTEM";
    }
}
