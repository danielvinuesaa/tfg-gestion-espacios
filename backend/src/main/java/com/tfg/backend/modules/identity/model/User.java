package com.tfg.backend.modules.identity.model;
import com.tfg.backend.modules.notification.model.NotificationPreference;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.Collection;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Entidad JPA que representa a un Usuario en el sistema.
 * Implementa la interfaz {@link UserDetails} de Spring Security para integrarse
 * directamente en los mecanismos de autenticación y autorización del framework.
 * Un usuario está vinculado a un único Rol que define sus permisos en la plataforma.
 */

@Entity
@Table(name = "users")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class User implements UserDetails {

    /** Identificador único del usuario. */
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** Correo electrónico, utilizado como nombre de usuario. */
    @Column(nullable = false, unique = true)
    private String email; // Usaremos el email como username

    /** Contraseña cifrada. */
    @Column(nullable = false)
    private String password;

    /** Nombre completo del usuario. */
    @Column(nullable = false)
    private String name;

    /** Rol asignado al usuario. */
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "role_id", nullable = false)
    private Role role;

    /** Estado actual de la cuenta del usuario. */
    @Builder.Default
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private UserStatus status = UserStatus.ACTIVO;

    /** Preferencias de notificación del usuario. */
    @Embedded
    @Builder.Default
    private NotificationPreference notificationPreference = new NotificationPreference();

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        // Convertimos los permisos del rol en autoridades de Spring Security
        return role.getPermissionNames().stream()
                .map(SimpleGrantedAuthority::new)
                .collect(Collectors.toList());
    }

    @Override
    public String getUsername() {
        return email;
    }

    @Override
    public boolean isAccountNonExpired() {
        return true;
    }

    @Override
    public boolean isAccountNonLocked() {
        return status != UserStatus.BLOQUEADO;
    }

    @Override
    public boolean isCredentialsNonExpired() {
        return true;
    }

    @Override
    public boolean isEnabled() {
        return status == UserStatus.ACTIVO;
    }
}
