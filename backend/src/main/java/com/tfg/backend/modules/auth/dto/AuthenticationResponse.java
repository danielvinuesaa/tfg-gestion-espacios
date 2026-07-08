package com.tfg.backend.modules.auth.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Objeto de Transferencia de Datos (DTO) que encapsula la respuesta proporcionada
 * por el sistema tras un proceso de autenticación o registro exitoso.
 */
@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class AuthenticationResponse {
    /** Token JWT generado. */
    private String token;
}
