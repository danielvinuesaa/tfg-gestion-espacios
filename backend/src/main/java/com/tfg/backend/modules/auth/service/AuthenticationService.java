package com.tfg.backend.modules.auth.service;
import com.tfg.backend.core.exception.ResourceNotFoundException;
import com.tfg.backend.core.security.JwtService;
import com.tfg.backend.modules.analytics.service.AuditService;
import com.tfg.backend.modules.auth.dto.AuthenticationRequest;
import com.tfg.backend.modules.auth.dto.AuthenticationResponse;
import com.tfg.backend.modules.auth.dto.RegisterRequest;
import com.tfg.backend.modules.identity.model.Role;
import com.tfg.backend.modules.identity.model.User;
import com.tfg.backend.modules.identity.repository.RoleRepository;
import com.tfg.backend.modules.identity.repository.UserRepository;

import com.tfg.backend.modules.identity.validator.UserValidator;

import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

/**
 * Servicio encargado de gestionar la lógica de negocio para la autenticación y el registro de usuarios.
 * Interactúa con los repositorios y servicios de seguridad para la validación y emisión de tokens.
 */
@Service
@RequiredArgsConstructor
public class AuthenticationService {
    /** Repositorio de usuarios. */
    private final UserRepository repository;
    /** Repositorio de roles. */
    private final RoleRepository roleRepository;
    /** Codificador de contraseñas. */
    private final PasswordEncoder passwordEncoder;
    /** Servicio JWT. */
    private final JwtService jwtService;
    /** Gestor de autenticación de Spring Security. */
    private final AuthenticationManager authenticationManager;
    /** Servicio de auditoría. */
    private final AuditService auditService;
    /** Validador de usuarios. */
    private final UserValidator userValidator;

    /**
     * Registra un nuevo usuario en el sistema.
     * Valida el formato y disponibilidad del correo, así como la fortaleza de la contraseña.
     * Asigna por defecto el rol "PROFESOR" al nuevo usuario.
     *
     * @param request El objeto que contiene los datos necesarios para el registro.
     * @return Un objeto {@link AuthenticationResponse} que incluye el token JWT generado.
     */
    public AuthenticationResponse register(RegisterRequest request) {
        userValidator.validateEmail(request.getEmail(), repository.findByEmail(request.getEmail()));
        userValidator.validatePasswordStrength(request.getPassword());

        // Default role: PROFESOR for now, or fetch by name
        Role userRole = roleRepository.findByName("PROFESOR")
                .orElseThrow(() -> new ResourceNotFoundException("Rol", "nombre", "PROFESOR"));

        var user = User.builder()
                .name(request.getName())
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .role(userRole)
                .build();
        repository.save(user);

        auditService.logAction("User", "REGISTRO_PUBLICO", user.getId(), "Nuevo registro de usuario: " + user.getEmail(), user.getEmail());

        var jwtToken = jwtService.generateToken(user);
        return AuthenticationResponse.builder()
                .token(jwtToken)
                .build();
    }

    /**
     * Autentica a un usuario existente verificando sus credenciales frente al sistema.
     *
     * @param request El objeto que contiene el correo electrónico y la contraseña del usuario.
     * @return Un objeto {@link AuthenticationResponse} que incluye el token JWT generado.
     */
    public AuthenticationResponse authenticate(AuthenticationRequest request) {
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        request.getEmail(),
                        request.getPassword()
                )
        );
        var user = repository.findByEmail(request.getEmail())
                .orElseThrow();
        var jwtToken = jwtService.generateToken(user);
        return AuthenticationResponse.builder()
                .token(jwtToken)
                .build();
    }
}
