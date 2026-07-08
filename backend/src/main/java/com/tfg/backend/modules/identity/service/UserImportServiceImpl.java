package com.tfg.backend.modules.identity.service;
import com.tfg.backend.core.common.BaseCsvImportService;
import com.tfg.backend.core.exception.BusinessValidationException;
import com.tfg.backend.core.exception.ResourceNotFoundException;
import com.tfg.backend.core.util.CsvProcessor;
import com.tfg.backend.modules.analytics.service.AuditService;
import com.tfg.backend.modules.identity.dto.UserImportConflictDTO;
import com.tfg.backend.modules.identity.dto.UserImportResultDTO;
import com.tfg.backend.modules.identity.model.Role;
import com.tfg.backend.modules.identity.model.User;
import com.tfg.backend.modules.identity.model.UserStatus;
import com.tfg.backend.modules.identity.repository.RoleRepository;
import com.tfg.backend.modules.identity.repository.UserRepository;

import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.Set;

/**
 * Implementación del servicio de importación masiva de usuarios.
 * Extiende la funcionalidad base de importación CSV, aplicando las reglas de negocio,
 * controlando la duplicidad de correos, verificando roles asignados y auditando la operación de importación.
 */
@Service
@Slf4j
public class UserImportServiceImpl extends BaseCsvImportService<User, UserImportConflictDTO, UserImportResultDTO> implements UserImportService {

    /** Repositorio de usuarios. */
    private final UserRepository userRepository;
    /** Repositorio de roles. */
    private final RoleRepository roleRepository;
    /** Codificador de contraseñas. */
    private final PasswordEncoder passwordEncoder;
    /** Servicio de auditoría. */
    private final AuditService auditService;

    /**
     * Constructor del servicio de importación de usuarios.
     */
    public UserImportServiceImpl(UserRepository userRepository, RoleRepository roleRepository, 
                                 PasswordEncoder passwordEncoder, AuditService auditService, 
                                 CsvProcessor csvProcessor) {
        super(csvProcessor);
        this.userRepository = userRepository;
        this.roleRepository = roleRepository;
        this.passwordEncoder = passwordEncoder;
        this.auditService = auditService;
    }

    /**
     * Valida el archivo CSV de usuarios.
     */
    @Override
    @Transactional(readOnly = true)
    public UserImportResultDTO validateCsv(MultipartFile file) {
        return processFile(file, UserImportResultDTO::new, (user, result, processedEmails, row) -> {
            checkConflict(user, result, processedEmails);
        });
    }

    /**
     * Importa usuarios desde el archivo CSV.
     */
    @Override
    @Transactional
    public UserImportResultDTO importFromCsv(MultipartFile file, boolean overwrite) {
        UserImportResultDTO result = processFile(file, UserImportResultDTO::new, (user, res, processedEmails, row) -> {
            processRowImport(user, overwrite, res, processedEmails);
        });

        auditService.logAction("User", "IMPORT_USERS", null, 
                "Importación masiva finalizada. Éxitos: " + result.getSuccessCount());
        
        return result;
    }

    private void processRowImport(User csvData, boolean overwrite, UserImportResultDTO result, Set<String> processedEmails) {
        String emailKey = csvData.getEmail().trim().toLowerCase();
        if (processedEmails.contains(emailKey)) {
            throw new BusinessValidationException("Registro duplicado en el propio archivo CSV.");
        }

        Optional<User> existingOpt = userRepository.findByEmail(csvData.getEmail());
        if (existingOpt.isPresent()) {
            if (overwrite) {
                User existing = existingOpt.get();
                existing.setName(csvData.getName());
                existing.setRole(csvData.getRole());
                existing.setStatus(com.tfg.backend.modules.identity.model.UserStatus.ACTIVO);
                if (csvData.getPassword() != null) existing.setPassword(passwordEncoder.encode(csvData.getPassword()));
                userRepository.save(existing);
                result.incrementSuccess();
            } else {
                result.addError("Conflicto: El usuario '" + csvData.getEmail() + "' ya existe.");
            }
        } else {
            String rawPassword = (csvData.getPassword() == null) ? "UniOvi.2026" : csvData.getPassword();
            csvData.setPassword(passwordEncoder.encode(rawPassword));
            userRepository.save(csvData);
            result.incrementSuccess();
            result.incrementNew();
        }
        processedEmails.add(emailKey);
    }

    private void checkConflict(User user, UserImportResultDTO result, Set<String> processedEmails) {
        String emailKey = user.getEmail().trim().toLowerCase();
        if (processedEmails.contains(emailKey)) {
            throw new BusinessValidationException("Email duplicado en el propio archivo CSV.");
        }

        Optional<User> existing = userRepository.findByEmail(user.getEmail());
        if (existing.isPresent()) {
            User current = existing.get();
            result.addConflict(UserImportConflictDTO.builder()
                .name(user.getName())
                .email(user.getEmail())
                .role(user.getRole().getName())
                .currentRole(current.getRole().getName())
                .currentName(current.getName())
                .build());
        } else {
            result.incrementSuccess();
            result.incrementNew();
        }
        processedEmails.add(emailKey);
    }

    @Override
    protected void validateRowStructure(String[] row) {
        if (row.length < 3) throw new BusinessValidationException("Formato incorrecto: faltan columnas obligatorias (Nombre, Email, Rol).");
        
        List<String> errors = new java.util.ArrayList<>();
        String name = row[0].trim();
        String email = row[1].trim();
        String role = row[2].trim();

        if (name.isEmpty()) errors.add("El nombre no puede estar vacío");
        else if (name.length() < 2) errors.add("El nombre es demasiado corto (mín. 2)");
        
        if (email.isEmpty()) errors.add("El email es obligatorio");
        else if (!email.matches("^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$")) {
            errors.add("Formato de email inválido (" + email + ")");
        }

        if (role.isEmpty()) errors.add("El rol es obligatorio");

        if (!errors.isEmpty()) {
            throw new BusinessValidationException(String.join(", ", errors) + ".");
        }
    }

    @Override
    protected User mapRowToEntity(String[] row) {
        String roleName = row[2].trim().toUpperCase();
        Role role = roleRepository.findByName(roleName)
                .orElseThrow(() -> new ResourceNotFoundException("El rol '" + roleName + "' no existe en el sistema."));

        if (role.getStatus() != com.tfg.backend.modules.identity.model.RoleStatus.ACTIVO) {
            throw new BusinessValidationException("El rol '" + roleName + "' no está activo y no puede asignarse.");
        }

        return User.builder()
                .name(row[0].trim())
                .email(row[1].trim())
                .role(role)
                .password(row.length > 3 && !row[3].trim().isEmpty() ? row[3].trim() : null)
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public byte[] exportToCsv() {
        // Implementación manual simplificada o delegada
        return new byte[0]; 
    }
}
