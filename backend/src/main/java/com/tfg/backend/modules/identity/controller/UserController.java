package com.tfg.backend.modules.identity.controller;

import com.tfg.backend.core.audit.Auditable;
import com.tfg.backend.core.common.BulkConflictSummaryDTO;
import com.tfg.backend.core.util.BulkOperationUtils;
import com.tfg.backend.modules.identity.dto.UserConflictDTO;
import com.tfg.backend.modules.identity.dto.UserDTO;
import com.tfg.backend.modules.identity.dto.UserImportResultDTO;
import com.tfg.backend.modules.identity.dto.UserMeDTO;
import com.tfg.backend.modules.identity.dto.UserRequest;
import com.tfg.backend.modules.identity.model.User;
import com.tfg.backend.modules.identity.model.UserStatus;
import com.tfg.backend.modules.identity.service.UserExportService;
import com.tfg.backend.modules.identity.service.UserImportService;
import com.tfg.backend.modules.identity.service.UserService;

import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Controlador REST profesional para la gestión de usuarios.
 */
@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;
    private final UserImportService userImportService;
    private final UserExportService userExportService;

    /**
     * Exportación profesional de usuarios a CSV.
     */
    @GetMapping("/export")
    @PreAuthorize("@ss.hasPermission('GESTIONAR_USUARIOS')")
    @Auditable(entity = "User", action = "EXPORTAR_USUARIOS", includeId = false)
    public void exportUsers(
            @RequestParam(required = false) String name,
            @RequestParam(required = false) Long roleId,
            @RequestParam(required = false) UserStatus status,
            @RequestParam(defaultValue = "false") boolean includeDeleted,
            @RequestParam(name = "columns", required = false) List<String> columns,
            HttpServletResponse response) throws IOException {

        response.setContentType("text/csv; charset=UTF-8");
        response.setHeader(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"usuarios.csv\"");
        
        userExportService.export(
                response.getOutputStream(), 
                () -> userService.searchUsersEntities(name, roleId, status, includeDeleted, PageRequest.of(0, 10000)).getContent(), 
                columns
        );
    }

    /**
     * Valida la estructura y contenido de un archivo CSV para la importación de usuarios.
     * 
     * @param file Archivo CSV a validar.
     * @return El resultado de la validación con posibles errores o conflictos encontrados.
     */
    @PostMapping("/import/validate")
    @PreAuthorize("@ss.hasPermission('GESTIONAR_USUARIOS')")
    public ResponseEntity<UserImportResultDTO> validateImport(@RequestParam("file") MultipartFile file) {
        return ResponseEntity.ok(userImportService.validateCsv(file));
    }

    /**
     * Importa un conjunto de usuarios desde un archivo CSV al sistema.
     * 
     * @param file Archivo CSV que contiene los usuarios.
     * @param overwrite Indica si se deben sobrescribir los usuarios existentes.
     * @return El resultado de la importación detallando el éxito o los fallos.
     */
    @PostMapping("/import")
    @PreAuthorize("@ss.hasPermission('GESTIONAR_USUARIOS')")
    public ResponseEntity<UserImportResultDTO> importUsers(
            @RequestParam("file") MultipartFile file,
            @RequestParam(defaultValue = "false") boolean overwrite) {
        return ResponseEntity.ok(userImportService.importFromCsv(file, overwrite));
    }

    @GetMapping("/bulk/conflicts")
    @PreAuthorize("@ss.hasPermission('GESTIONAR_USUARIOS')")
    public ResponseEntity<BulkConflictSummaryDTO> getBulkConflicts(
            @RequestParam(required = false) List<Long> ids,
            @RequestParam(required = false) String name,
            @RequestParam(required = false) Long roleId,
            @RequestParam(required = false) UserStatus status,
            @RequestParam(defaultValue = "false") boolean includeDeleted,
            @AuthenticationPrincipal User admin) {
        
        List<Long> targetIds = BulkOperationUtils.resolveIds(ids, 
                () -> userService.searchUsers(name, roleId, status, includeDeleted, Pageable.unpaged()),
                UserDTO::getId);
        
        targetIds.remove(admin.getId());
        return ResponseEntity.ok(userService.getBulkUserConflictSummary(targetIds));
    }

    @DeleteMapping("/bulk")
    @PreAuthorize("@ss.hasPermission('GESTIONAR_USUARIOS')")
    public ResponseEntity<Void> deleteBulk(
            @RequestParam(required = false) List<Long> ids,
            @RequestParam(required = false) String name,
            @RequestParam(required = false) Long roleId,
            @RequestParam(required = false) UserStatus status,
            @RequestParam(defaultValue = "false") boolean includeDeleted,
            @RequestParam(defaultValue = "false") boolean force,
            @AuthenticationPrincipal User admin) {
        
        List<Long> targetIds = BulkOperationUtils.resolveIds(ids, 
                () -> userService.searchUsers(name, roleId, status, includeDeleted, Pageable.unpaged()),
                UserDTO::getId);

        targetIds.remove(admin.getId());

        if (!targetIds.isEmpty()) {
            userService.deleteMultiple(targetIds, force);
        }

        return ResponseEntity.noContent().build();
    }

    /**
     * Obtiene la información detallada del usuario actualmente autenticado en el sistema.
     * 
     * @param user Usuario autenticado inyectado por el contexto de seguridad.
     * @return Información del perfil del usuario actual.
     */
    @GetMapping("/me")
    public ResponseEntity<UserMeDTO> getMe(@AuthenticationPrincipal User user) {
        return ResponseEntity.ok(userService.getMe(user));
    }

    @PutMapping("/me/password")
    public ResponseEntity<Void> updateMyPassword(
            @RequestBody java.util.Map<String, String> request, 
            @AuthenticationPrincipal User user) {
        if (!request.containsKey("currentPassword") || request.get("currentPassword").isBlank()) {
            throw new com.tfg.backend.core.exception.BusinessValidationException("currentPassword", "La contraseña actual es obligatoria");
        }
        if (!request.containsKey("newPassword") || request.get("newPassword").isBlank()) {
            throw new com.tfg.backend.core.exception.BusinessValidationException("newPassword", "La nueva contraseña es obligatoria");
        }
        userService.updatePassword(user.getId(), request.get("currentPassword"), request.get("newPassword"));
        return ResponseEntity.noContent().build();
    }

    @GetMapping
    @PreAuthorize("@ss.canViewUsers()")
    public ResponseEntity<Page<UserDTO>> getAllUsers(
            @RequestParam(required = false) String name,
            @RequestParam(required = false) Long roleId,
            @RequestParam(required = false) UserStatus status,
            @RequestParam(defaultValue = "false") boolean includeDeleted,
            @PageableDefault(size = 10) Pageable pageable) {
        return ResponseEntity.ok(userService.searchUsers(name, roleId, status, includeDeleted, pageable));
    }

    /**
     * Restaura un usuario previamente eliminado de forma lógica en el sistema.
     * 
     * @param id Identificador único del usuario a restaurar.
     * @return Respuesta vacía con estado HTTP adecuado tras la restauración.
     */
    @PostMapping("/{id}/restore")
    @PreAuthorize("@ss.canManageUser(#id)")
    public ResponseEntity<Void> restoreUser(@PathVariable Long id) {
        userService.restoreUser(id);
        return ResponseEntity.noContent().build();
    }

    /**
     * Registra un nuevo usuario en la plataforma con los datos proporcionados.
     * 
     * @param request Objeto que encapsula la información del nuevo usuario.
     * @return Los datos del usuario recién creado.
     */
    @PostMapping
    @PreAuthorize("@ss.hasPermission('GESTIONAR_USUARIOS')")
    public ResponseEntity<UserDTO> createUser(@Valid @RequestBody UserRequest request) {
        return new ResponseEntity<>(userService.createUser(request), org.springframework.http.HttpStatus.CREATED);
    }

    /**
     * Actualiza la información de un usuario existente.
     * 
     * @param id Identificador único del usuario.
     * @param request Nuevos datos para la actualización del usuario.
     * @return El usuario actualizado.
     */
    @PutMapping("/{id}")
    @PreAuthorize("@ss.canManageUser(#id)")
    public ResponseEntity<UserDTO> updateUser(@PathVariable Long id, @Valid @RequestBody UserRequest request) {
        return ResponseEntity.ok(userService.updateUser(id, request));
    }

    @GetMapping("/{id}/conflicts")
    @PreAuthorize("@ss.canManageUser(#id)")
    public ResponseEntity<UserConflictDTO> getUserConflicts(@PathVariable Long id) {
        return ResponseEntity.ok(userService.getUserConflicts(id));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("@ss.canManageUser(#id)")
    public ResponseEntity<Void> deleteUser(
            @PathVariable Long id, 
            @RequestParam(defaultValue = "false") boolean force) {

        if (force) {
            userService.forceDeleteUser(id);
        } else {
            userService.deleteUser(id);
        }
        return ResponseEntity.noContent().build();
    }

    /**
     * Consulta un usuario específico basándose en su identificador.
     * 
     * @param id Identificador único del usuario a buscar.
     * @return Los detalles del usuario solicitado.
     */
    @GetMapping("/{id}")
    @PreAuthorize("@ss.canManageUser(#id)")
    public ResponseEntity<UserDTO> getUserById(@PathVariable Long id) {
        return ResponseEntity.ok(userService.findById(id));
    }
}
