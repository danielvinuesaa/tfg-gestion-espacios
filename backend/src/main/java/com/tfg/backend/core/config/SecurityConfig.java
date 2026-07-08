package com.tfg.backend.core.config;
import com.tfg.backend.core.security.JwtAuthenticationFilter;

import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

/**
 * Clase de configuración encargada de establecer las políticas de seguridad de la aplicación,
 * incluyendo la gestión de filtros, autenticación y autorización de los endpoints.
 */
@Configuration
@EnableWebSecurity
@org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity
@RequiredArgsConstructor
public class SecurityConfig {


    /**
     * Filtro para la autenticación basada en tokens JWT.
     */
    private final JwtAuthenticationFilter jwtAuthFilter;

    /**
     * Proveedor de autenticación configurado.
     */
    private final AuthenticationProvider authenticationProvider;

    /**
     * Configura la cadena de filtros de seguridad, definiendo qué endpoints son públicos, 
     * cuáles requieren autenticación, y establece el filtro de tokens JWT.
     *
     * @param http El objeto {@link HttpSecurity} para configurar la seguridad web basada en HTTP.
     * @return La configuración de {@link SecurityFilterChain} construida.
     * @throws Exception Si ocurre un error durante el proceso de configuración.
     */
    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
            .csrf(csrf -> csrf.disable())
            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/api/auth/**", "/api/health", "/api/config/**", "/error").permitAll()
                .requestMatchers("/api/**").authenticated()
                .anyRequest().authenticated()
            )
            .sessionManagement(session -> session
                .sessionCreationPolicy(SessionCreationPolicy.STATELESS)
            )
            .authenticationProvider(authenticationProvider)
            .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

}
