package com.tfg.backend.core.config;
import com.tfg.backend.modules.identity.model.User;
import com.tfg.backend.modules.identity.repository.UserRepository;

import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;

/**
 * Configuración central de la aplicación encargada de la inicialización de los componentes 
 * de seguridad y de la gestión de la autenticación de usuarios.
 */
@Configuration
@RequiredArgsConstructor
public class ApplicationConfig {

    /**
     * Repositorio de usuarios para autenticación.
     */
    private final UserRepository repository;

    /**
     * Define y registra el servicio que proporciona los detalles del usuario a partir del repositorio.
     *
     * @return Una implementación de {@link UserDetailsService} empleada para la búsqueda y validación de usuarios.
     */
    @Bean
    public UserDetailsService userDetailsService() {
        return username -> {
            var user = repository.findByEmail(username)
                .orElseThrow(() -> new UsernameNotFoundException("User not found"));
            // Forzar carga de permisos en el mismo contexto de persistencia
            if (user.getRole() != null && user.getRole().getPermissions() != null) {
                user.getRole().getPermissions().size();
            }
            return user;
        };
    }

    /**
     * Configura y provee el proveedor de autenticación que empleará el servicio de detalles de usuario
     * y el codificador de contraseñas.
     *
     * @return Un proveedor de autenticación configurado, concretamente un {@link DaoAuthenticationProvider}.
     */
    @Bean
    public AuthenticationProvider authenticationProvider() {
        DaoAuthenticationProvider authProvider = new DaoAuthenticationProvider(userDetailsService());
        authProvider.setPasswordEncoder(passwordEncoder());
        return authProvider;
    }

    /**
     * Expone el gestor de autenticación principal provisto por la configuración de Spring Security.
     *
     * @param config La configuración de autenticación actual del contexto.
     * @return El {@link AuthenticationManager} de la aplicación.
     * @throws Exception Si ocurre un error durante la obtención del gestor.
     */
    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration config) throws Exception {
        return config.getAuthenticationManager();
    }

    /**
     * Proporciona el componente responsable de la codificación y verificación de contraseñas
     * utilizando el algoritmo BCrypt.
     *
     * @return Una instancia de {@link PasswordEncoder}.
     */
    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
}
