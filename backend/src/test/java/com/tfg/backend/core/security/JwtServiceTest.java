package com.tfg.backend.core.security;

import com.tfg.backend.modules.identity.model.User;
import com.tfg.backend.modules.identity.model.UserStatus;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.security.core.userdetails.UserDetails;

import java.security.Key;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Suite de pruebas unitarias para el servicio de tokens (JwtService).
 * <p>
 * Verifica la correcta emisión, validación y extracción de información de los tokens JWT,
 * incluyendo el manejo de firmas, control de expiración, inyección de roles/claims extras y
 * la resiliencia frente a manipulaciones o estados de usuario inválidos.
 */
@DisplayName("Tests Unitarios de JwtService (Seguridad JWT)")
class JwtServiceTest {

    private static final String SECRET_KEY = "404E635266556A586E3272357538782F413F4428472B4B6250645367566B5970";

    private JwtService jwtService;
    private UserDetails activeUser;

    @BeforeEach
    void setUp() {
        jwtService = new JwtService();
        activeUser = User.builder()
                .email("test@uniovi.es")
                .status(UserStatus.ACTIVO)
                .build();
    }

    // --- PU-JWT-01: Generación y validación para usuario propio ---
    /**
     * Verifica que un token recién generado es reconocido como válido para el mismo usuario.
     * <p>
     * <b>Precondiciones:</b> Se dispone de un usuario activo.
     * <b>Ejecución:</b> Se genera un token y luego se verifica su validez contra el mismo usuario.
     * <b>Asertos:</b> Se extrae el nombre de usuario correctamente y la validación retorna true.
     */
    @Test
    @DisplayName("✅ PU-JWT-01: Token generado es válido para el mismo usuario")
    void generateAndValidateToken() {
        String token = jwtService.generateToken(activeUser);

        assertNotNull(token);
        assertEquals("test@uniovi.es", jwtService.extractUsername(token));
        assertTrue(jwtService.isTokenValid(token, activeUser));
    }

    // --- PU-JWT-02: Rechazo de token para usuario diferente ---
    /**
     * Verifica que un token pertenece a un usuario específico y es rechazado si se valida con otro.
     * <p>
     * <b>Precondiciones:</b> Se genera un token para un usuario dado.
     * <b>Ejecución:</b> Se intenta validar el token contra los detalles de un usuario diferente.
     * <b>Asertos:</b> La validación debe fallar (false).
     */
    @Test
    @DisplayName("❌ PU-JWT-02: Token de un usuario no es válido para otro usuario")
    void isTokenValid_WhenDifferentUser_ShouldReturnFalse() {
        String token = jwtService.generateToken(activeUser);
        UserDetails otherUser = User.builder().email("other@uniovi.es").status(UserStatus.ACTIVO).build();

        assertFalse(jwtService.isTokenValid(token, otherUser));
    }

    // --- PU-JWT-03: Detección de token caducado ---
    /**
     * Verifica que el sistema rechaza correctamente los tokens que han superado su fecha de expiración.
     * <p>
     * <b>Precondiciones:</b> Se crea manualmente un token con fecha de emisión y expiración en el pasado.
     * <b>Ejecución:</b> Se intenta validar o parsear el token.
     * <b>Asertos:</b> Se debe lanzar una excepción del tipo {@code JwtException}.
     */
    @Test
    @DisplayName("❌ PU-JWT-03: Token expirado es rechazado como inválido")
    void isTokenValid_WhenExpired_ShouldReturnFalse() {
        // Construir un token manualmente ya expirado (expiración en el pasado)
        Key signingKey = Keys.hmacShaKeyFor(Decoders.BASE64.decode(SECRET_KEY));
        String expiredToken = Jwts.builder()
                .setSubject("test@uniovi.es")
                .setIssuedAt(new Date(System.currentTimeMillis() - 10000))
                .setExpiration(new Date(System.currentTimeMillis() - 5000)) // expirado hace 5s
                .signWith(signingKey, SignatureAlgorithm.HS256)
                .compact();

        // Un token expirado lanza JwtException al intentar parsearlo
        assertThrows(JwtException.class, () -> jwtService.isTokenValid(expiredToken, activeUser));
    }

    // --- PU-JWT-04: Rechazo de token con firma manipulada ---
    /**
     * Verifica que la manipulación del contenido del token (payload) invalida la firma criptográfica y resulta en rechazo.
     * <p>
     * <b>Precondiciones:</b> Se dispone de un token válido firmado. Se inyecta texto extraño en su sección payload.
     * <b>Ejecución:</b> Se intenta validar el token adulterado.
     * <b>Asertos:</b> La validación lanza una excepción {@code JwtException} debido al fallo en la firma.
     */
    @Test
    @DisplayName("❌ PU-JWT-04: Token con payload manipulado tras la firma es rechazado")
    void isTokenValid_WhenSignatureManipulated_ShouldThrow() {
        String validToken = jwtService.generateToken(activeUser);
        // Manipulamos el payload (parte central del JWT) añadiendo caracteres
        String[] parts = validToken.split("\\.");
        String tamperedToken = parts[0] + ".TAMPERED_PAYLOAD." + parts[2];

        assertThrows(JwtException.class, () -> jwtService.isTokenValid(tamperedToken, activeUser));
    }

    // --- PU-JWT-05: Extracción de claims adicionales ---
    /**
     * Verifica que el sistema puede inyectar y recuperar información adicional (claims) dentro del JWT.
     * <p>
     * <b>Precondiciones:</b> Se provee un mapa con claims adicionales (ej. rol o ID) junto al usuario.
     * <b>Ejecución:</b> Se genera el token y posteriormente se solicita la extracción del claim inyectado.
     * <b>Asertos:</b> El claim es recuperado con el valor exacto proporcionado.
     */
    @Test
    @DisplayName("✅ PU-JWT-05: Claims adicionales se incluyen y se extraen correctamente")
    void generateToken_WithExtraClaims_ShouldExtractCorrectly() {
        Map<String, Object> extraClaims = new HashMap<>();
        extraClaims.put("role", "ADMIN");
        extraClaims.put("userId", 42);

        String token = jwtService.generateToken(extraClaims, activeUser);

        assertNotNull(token);
        assertEquals("test@uniovi.es", jwtService.extractUsername(token));
        // Verificamos que el claim 'role' se puede extraer
        String role = jwtService.extractClaim(token, claims -> claims.get("role", String.class));
        assertEquals("ADMIN", role);
    }

    // --- PU-JWT-06: Rechazo de token para usuario BLOQUEADO ---
    /**
     * Verifica que un token que era válido deja de serlo inmediatamente si el estado del usuario cambia a bloqueado.
     * <p>
     * <b>Precondiciones:</b> Token generado para un usuario en estado activo.
     * <b>Ejecución:</b> Se valida el token contra una instancia del mismo usuario pero con estado BLOQUEADO.
     * <b>Asertos:</b> La validación es rechazada (false).
     */
    @Test
    @DisplayName("❌ PU-JWT-06: Token válido es rechazado si el usuario está BLOQUEADO")
    void isTokenValid_WhenUserBlocked_ShouldReturnFalse() {
        // Generamos token cuando el usuario estaba activo
        String token = jwtService.generateToken(activeUser);

        // Simulamos que el estado ha cambiado a BLOQUEADO
        UserDetails blockedUser = User.builder()
                .email("test@uniovi.es")
                .status(UserStatus.BLOQUEADO)
                .build();

        assertFalse(jwtService.isTokenValid(token, blockedUser));
    }

    // --- PU-JWT-07: Rechazo de token para usuario ELIMINADO ---
    /**
     * Verifica que un token se invalida si la cuenta del usuario es marcada como eliminada lógicamente en la base de datos.
     * <p>
     * <b>Precondiciones:</b> Token generado para un usuario activo.
     * <b>Ejecución:</b> Se valida contra una instancia del mismo usuario pero en estado ELIMINADO.
     * <b>Asertos:</b> La validación retorna false.
     */
    @Test
    @DisplayName("❌ PU-JWT-07: Token válido es rechazado si el usuario está ELIMINADO")
    void isTokenValid_WhenUserDeleted_ShouldReturnFalse() {
        String token = jwtService.generateToken(activeUser);

        UserDetails deletedUser = User.builder()
                .email("test@uniovi.es")
                .status(UserStatus.ELIMINADO)
                .build();

        assertFalse(jwtService.isTokenValid(token, deletedUser));
    }

    // --- PU-JWT-08: Token con formato inválido o nulo ---
    /**
     * Verifica la solidez del decodificador ante cadenas que no siguen el formato estándar de JWT.
     * <p>
     * <b>Precondiciones:</b> Se proporciona una cadena arbitraria (o vacía) al método de extracción.
     * <b>Ejecución:</b> Se invoca la extracción del nombre de usuario.
     * <b>Asertos:</b> Se lanzan las excepciones correspondientes evitando que la aplicación se caiga de forma insegura.
     */
    @Test
    @DisplayName("❌ PU-JWT-08: String que no es JWT válido lanza excepción al extraer username")
    void extractUsername_WhenInvalidToken_ShouldThrowJwtException() {
        assertThrows(JwtException.class, () -> jwtService.extractUsername("this.is.not.a.jwt"));
        assertThrows(Exception.class, () -> jwtService.extractUsername(""));
    }
}
