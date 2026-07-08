package com.tfg.backend.core.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;

import java.security.Key;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;
import java.util.function.Function;

/**
 * Servicio encargado de la gestión, generación, extracción de información y validación de tokens JWT.
 */
@Service
public class JwtService {

    /**
     * Clave secreta utilizada para firmar los tokens JWT.
     */
    private static final String SECRET_KEY = "404E635266556A586E3272357538782F413F4428472B4B6250645367566B5970"; // 256-bit key

    /**
     * Extrae el nombre de usuario (subject) contenido en el token JWT.
     *
     * @param token El token JWT del cual se extraerá el nombre de usuario.
     * @return El nombre de usuario especificado en el token.
     */
    public String extractUsername(String token) {
        return extractClaim(token, Claims::getSubject);
    }

    /**
     * Extrae un claim específico del token JWT utilizando una función de resolución.
     *
     * @param token El token JWT que contiene los claims.
     * @param claimsResolver La función que define cómo extraer el claim deseado.
     * @param <T> El tipo de dato del claim que se va a extraer.
     * @return El valor del claim extraído.
     */
    public <T> T extractClaim(String token, Function<Claims, T> claimsResolver) {
        final Claims claims = extractAllClaims(token);
        return claimsResolver.apply(claims);
    }

    /**
     * Genera un token JWT estándar para el usuario especificado.
     *
     * @param userDetails Los detalles del usuario autenticado.
     * @return Una cadena de texto que representa el token JWT generado.
     */
    public String generateToken(UserDetails userDetails) {
        return generateToken(new HashMap<>(), userDetails);
    }

    /**
     * Genera un token JWT incluyendo claims adicionales y los detalles del usuario.
     *
     * @param extraClaims Un mapa de claims adicionales a incluir en el payload del token.
     * @param userDetails Los detalles del usuario autenticado.
     * @return Una cadena de texto que representa el token JWT generado.
     */
    public String generateToken(Map<String, Object> extraClaims, UserDetails userDetails) {
        return Jwts.builder()
                .setClaims(extraClaims)
                .setSubject(userDetails.getUsername())
                .setIssuedAt(new Date(System.currentTimeMillis()))
                .setExpiration(new Date(System.currentTimeMillis() + 1000 * 60 * 60 * 24)) // 24 hours
                .signWith(getSignInKey(), SignatureAlgorithm.HS256)
                .compact();
    }

    /**
     * Verifica la validez de un token JWT comparándolo con los detalles del usuario y comprobando su expiración y estado.
     *
     * @param token El token JWT a validar.
     * @param userDetails Los detalles del usuario contra los cuales se valida el token.
     * @return {@code true} si el token es válido y el usuario está habilitado, {@code false} en caso contrario.
     */
    public boolean isTokenValid(String token, UserDetails userDetails) {
        final String username = extractUsername(token);
        return (username.equals(userDetails.getUsername())) 
                && !isTokenExpired(token) 
                && userDetails.isEnabled() 
                && userDetails.isAccountNonLocked();
    }

    /**
     * Verifica si el token ha expirado.
     *
     * @param token El token a comprobar.
     * @return true si está expirado, false en caso contrario.
     */
    private boolean isTokenExpired(String token) {
        return extractExpiration(token).before(new Date());
    }

    /**
     * Extrae la fecha de expiración del token.
     *
     * @param token El token del que extraer la fecha.
     * @return La fecha de expiración.
     */
    private Date extractExpiration(String token) {
        return extractClaim(token, Claims::getExpiration);
    }

    /**
     * Extrae todos los claims del token dado.
     *
     * @param token El token a parsear.
     * @return Los claims contenidos.
     */
    private Claims extractAllClaims(String token) {
        return Jwts.parserBuilder()
                .setSigningKey(getSignInKey())
                .build()
                .parseClaimsJws(token)
                .getBody();
    }

    /**
     * Obtiene la clave de firmado para los tokens.
     *
     * @return La clave decodificada.
     */
    private Key getSignInKey() {
        byte[] keyBytes = Decoders.BASE64.decode(SECRET_KEY);
        return Keys.hmacShaKeyFor(keyBytes);
    }
}
