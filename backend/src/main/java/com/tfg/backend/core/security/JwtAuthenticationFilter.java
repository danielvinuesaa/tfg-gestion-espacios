package com.tfg.backend.core.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.lang.NonNull;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

/**
 * Filtro de autenticación que intercepta las peticiones HTTP para validar el token JWT.
 * Hereda de {@link OncePerRequestFilter} para garantizar una única ejecución por cada petición.
 */
@Component
@RequiredArgsConstructor
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    /**
     * Servicio de gestión y validación de tokens JWT.
     */
    private final JwtService jwtService;

    /**
     * Servicio para la obtención de detalles de los usuarios.
     */
    private final UserDetailsService userDetailsService;

    /**
     * Ejecuta el proceso de filtrado interno, extrayendo y validando el token JWT presente en la cabecera de autorización.
     * Si el token es válido, establece el contexto de seguridad de Spring Security.
     *
     * @param request La solicitud HTTP entrante.
     * @param response La respuesta HTTP saliente.
     * @param filterChain La cadena de filtros a continuar ejecutando.
     * @throws ServletException Si ocurre un error en el procesamiento de la petición por parte del servlet.
     * @throws IOException Si ocurre un error de entrada o salida de datos.
     */
    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain
    ) throws ServletException, IOException {
        final String authHeader = request.getHeader("Authorization");
        final String jwt;
        final String userEmail;
        if (authHeader == null ||!authHeader.startsWith("Bearer ")) {
            filterChain.doFilter(request, response);
            return;
        }
        jwt = authHeader.substring(7);
        userEmail = jwtService.extractUsername(jwt);
        if (userEmail != null && SecurityContextHolder.getContext().getAuthentication() == null) {
            UserDetails userDetails = this.userDetailsService.loadUserByUsername(userEmail);
            if (jwtService.isTokenValid(jwt, userDetails)) {
                UsernamePasswordAuthenticationToken authToken = new UsernamePasswordAuthenticationToken(
                        userDetails,
                        null,
                        userDetails.getAuthorities()
                );
                authToken.setDetails(
                        new WebAuthenticationDetailsSource().buildDetails(request)
                );
                SecurityContextHolder.getContext().setAuthentication(authToken);
            }
        }
        filterChain.doFilter(request, response);
    }
}
