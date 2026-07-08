package com.tfg.backend.modules.identity.validator;

import com.tfg.backend.core.exception.BusinessValidationException;
import com.tfg.backend.modules.identity.model.Permission;
import com.tfg.backend.modules.identity.model.Role;
import com.tfg.backend.modules.identity.repository.RoleRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.HashSet;
import java.util.Optional;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.when;

/**
 * Suite de pruebas unitarias para {@link RoleValidator}.
 * Verifica exhaustivamente la coherencia de los permisos asignados a un rol,
 * así como la unicidad y validez del nombre de los roles.
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("Tests Unitarios de RoleValidator (Exhaustividad de Coherencia)")
class RoleValidatorTest {

    @Mock private RoleRepository roleRepository;
    @InjectMocks private RoleValidator roleValidator;

    private Permission perm(String name) {
        Permission p = new Permission();
        p.setName(name);
        return p;
    }

    // --- PU-RVAL-01: Nombre único y nuevo ---
    /**
     * Verifica que el sistema permita el registro de un rol con un nombre nuevo que no está en uso.
     */
    @Test
    @DisplayName("✅ PU-RVAL-01: Nombre de rol nuevo no causa excepción")
    void validateUniqueName_Success() {
        when(roleRepository.findByName(anyString())).thenReturn(Optional.empty());
        assertDoesNotThrow(() -> roleValidator.validateUniqueName("GESTOR_NUEVO", null));
    }

    // --- PU-RVAL-02: Nombre duplicado en otro ID ---
    /**
     * Verifica que el sistema rechace el registro de un rol si el nombre ya está asignado a otro rol diferente,
     * lanzando la excepción correspondiente.
     */
    @Test
    @DisplayName("❌ PU-RVAL-02: Nombre ya en uso por otro rol lanza excepción")
    void validateUniqueName_Duplicate_Fail() {
        Role existing = new Role();
        existing.setId(10L);
        when(roleRepository.findByName("GESTOR")).thenReturn(Optional.of(existing));
        assertThrows(BusinessValidationException.class, () -> roleValidator.validateUniqueName("GESTOR", null));
    }

    // --- PU-RVAL-03: Nombre perteneciente al mismo rol (auto-actualización) ---
    /**
     * Verifica que el sistema permita mantener el mismo nombre para un rol durante una operación de actualización
     * (el identificador es el mismo).
     */
    @Test
    @DisplayName("✅ PU-RVAL-03: Mismo nombre en mismo ID no causa excepción (auto-actualización)")
    void validateUniqueName_SameRoleSameId_NoDuplicate() {
        Role existing = new Role();
        existing.setId(5L);
        when(roleRepository.findByName("GESTOR")).thenReturn(Optional.of(existing));
        // Pasamos el mismo ID → no es duplicado
        assertDoesNotThrow(() -> roleValidator.validateUniqueName("GESTOR", 5L));
    }

    // --- PU-RVAL-04: Nombre null o en blanco ---
    /**
     * Verifica que la validación de unicidad sea omitida si el nombre del rol es nulo o está en blanco,
     * delegando estas comprobaciones de formato a las anotaciones de validación estándar.
     */
    @Test
    @DisplayName("✅ PU-RVAL-04: Nombre null o en blanco no lanza excepción (guard de nulos)")
    void validateUniqueName_NullOrBlank_NoException() {
        assertDoesNotThrow(() -> roleValidator.validateUniqueName(null, null));
        assertDoesNotThrow(() -> roleValidator.validateUniqueName("  ", null));
    }

    // --- PU-RVAL-05: Rol sin ningún permiso ---
    /**
     * Verifica que el sistema rechace un rol que no tiene ningún permiso asignado.
     */
    @Test
    @DisplayName("❌ PU-RVAL-05: Rol sin permisos lanza excepción")
    void validate_NoPermissions_Fail() {
        assertThrows(BusinessValidationException.class,
                () -> roleValidator.validatePermissionsCoherence(new HashSet<>()));
    }

    // --- PU-RVAL-06: Conjunto de permisos null ---
    /**
     * Verifica que el sistema rechace y lance una excepción si el conjunto de permisos proporcionado es nulo.
     */
    @Test
    @DisplayName("❌ PU-RVAL-06: Permisos null lanza excepción")
    void validate_NullPermissions_Fail() {
        assertThrows(BusinessValidationException.class,
                () -> roleValidator.validatePermissionsCoherence(null));
    }

    // --- PU-RVAL-07: APROBAR_RESERVA sin VER_TODAS_RESERVAS ---
    /**
     * Verifica que el sistema garantice la coherencia exigiendo el permiso VER_TODAS_RESERVAS
     * cuando se asigna el permiso APROBAR_RESERVA.
     */
    @Test
    @DisplayName("❌ PU-RVAL-07: APROBAR_RESERVA sin VER_TODAS_RESERVAS viola dependencia")
    void validate_ApproveWithoutView_Fail() {
        assertThrows(BusinessValidationException.class,
                () -> roleValidator.validatePermissionsCoherence(Set.of(perm("APROBAR_RESERVA"))));
    }

    // --- PU-RVAL-08: CANCELAR_RESERVA sin VER_TODAS_RESERVAS ---
    /**
     * Verifica que el sistema garantice la coherencia exigiendo el permiso VER_TODAS_RESERVAS
     * cuando se asigna el permiso CANCELAR_RESERVA.
     */
    @Test
    @DisplayName("❌ PU-RVAL-08: CANCELAR_RESERVA sin VER_TODAS_RESERVAS viola dependencia")
    void validate_CancelWithoutView_Fail() {
        assertThrows(BusinessValidationException.class,
                () -> roleValidator.validatePermissionsCoherence(Set.of(perm("CANCELAR_RESERVA"))));
    }

    // --- PU-RVAL-09: APROBAR_ASIGNATURAS_GESTIONADAS sin VER_TODAS_RESERVAS ---
    /**
     * Verifica que el sistema exija el permiso VER_TODAS_RESERVAS si el rol cuenta con
     * el permiso APROBAR_ASIGNATURAS_GESTIONADAS.
     */
    @Test
    @DisplayName("❌ PU-RVAL-09: APROBAR_ASIGNATURAS_GESTIONADAS sin VER_TODAS_RESERVAS viola dependencia")
    void validate_ApproveSubjectsWithoutView_Fail() {
        assertThrows(BusinessValidationException.class,
                () -> roleValidator.validatePermissionsCoherence(Set.of(perm("APROBAR_ASIGNATURAS_GESTIONADAS"))));
    }

    // --- PU-RVAL-10: IMPORTAR_RESERVAS sin VER_TODAS_RESERVAS ---
    /**
     * Verifica que el sistema rechace un conjunto de permisos que incluye IMPORTAR_RESERVAS
     * pero no contiene el permiso dependiente VER_TODAS_RESERVAS.
     */
    @Test
    @DisplayName("❌ PU-RVAL-10: IMPORTAR_RESERVAS sin VER_TODAS_RESERVAS viola dependencia")
    void validate_ImportWithoutView_Fail() {
        assertThrows(BusinessValidationException.class,
                () -> roleValidator.validatePermissionsCoherence(Set.of(perm("IMPORTAR_RESERVAS"))));
    }

    // --- PU-RVAL-11: EXPORTAR_RESERVAS sin VER_TODAS_RESERVAS ---
    /**
     * Verifica que el sistema rechace un conjunto de permisos que incluye EXPORTAR_RESERVAS
     * pero omite el permiso VER_TODAS_RESERVAS necesario.
     */
    @Test
    @DisplayName("❌ PU-RVAL-11: EXPORTAR_RESERVAS sin VER_TODAS_RESERVAS viola dependencia")
    void validate_ExportWithoutView_Fail() {
        assertThrows(BusinessValidationException.class,
                () -> roleValidator.validatePermissionsCoherence(Set.of(perm("EXPORTAR_RESERVAS"))));
    }

    // --- PU-RVAL-12: GESTIONAR_ESPACIOS sin LEER_ESPACIOS ---
    /**
     * Verifica que el sistema garantice que para GESTIONAR_ESPACIOS es indispensable
     * disponer también del permiso LEER_ESPACIOS.
     */
    @Test
    @DisplayName("❌ PU-RVAL-12: GESTIONAR_ESPACIOS sin LEER_ESPACIOS viola dependencia")
    void validate_ManageSpacesWithoutView_Fail() {
        assertThrows(BusinessValidationException.class,
                () -> roleValidator.validatePermissionsCoherence(Set.of(perm("GESTIONAR_ESPACIOS"))));
    }

    // --- PU-RVAL-13: Coherencia correcta ---
    /**
     * Verifica que un conjunto coherente de permisos sea aceptado sin errores por el validador.
     */
    @Test
    @DisplayName("✅ PU-RVAL-13: Conjunto coherente de permisos no lanza excepción")
    void validate_CorrectCoherence_Success() {
        assertDoesNotThrow(() -> roleValidator.validatePermissionsCoherence(
                Set.of(perm("GESTIONAR_ESPACIOS"), perm("LEER_ESPACIOS"))));
    }
}
