package com.tfg.backend.modules.auth.controller;
import com.tfg.backend.modules.auth.dto.AuthenticationRequest;
import com.tfg.backend.modules.auth.dto.AuthenticationResponse;
import com.tfg.backend.modules.auth.dto.RegisterRequest;
import com.tfg.backend.modules.auth.service.AuthenticationService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Controlador de tipo REST que expone los endpoints correspondientes a la autenticación 
 * y registro de usuarios en el sistema.
 */
@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    /** Servicio de autenticación. */
    private final AuthenticationService service;

    /**
     * Endpoint para el registro de un nuevo usuario en el sistema.
     *
     * @param request Los datos de registro encapsulados en un {@link RegisterRequest}.
     * @return Una respuesta HTTP 201 (Created) con el token de autenticación.
     */
    @PostMapping("/register")
    public ResponseEntity<AuthenticationResponse> register(
            @Valid @RequestBody RegisterRequest request
    ) {
        return new ResponseEntity<>(service.register(request), org.springframework.http.HttpStatus.CREATED);
    }

    /**
     * Endpoint para la autenticación de un usuario existente.
     *
     * @param request Las credenciales de acceso encapsuladas en un {@link AuthenticationRequest}.
     * @return Una respuesta HTTP 200 (OK) con el token de autenticación.
     */
    @PostMapping("/authenticate")
    public ResponseEntity<AuthenticationResponse> authenticate(
            @Valid @RequestBody AuthenticationRequest request
    ) {
        return ResponseEntity.ok(service.authenticate(request));
    }
}
