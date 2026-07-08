package com.tfg.backend.core.audit;

import com.tfg.backend.modules.analytics.service.AuditService;
import com.tfg.backend.modules.reservation.model.Reservation;
import com.tfg.backend.modules.reservation.model.ReservationStatus;
import com.tfg.backend.modules.space.model.Space;
import jakarta.persistence.EntityManager;
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.reflect.MethodSignature;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Set;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

/**
 * Suite de pruebas unitarias para el interceptor de auditoría (AuditAspect).
 * <p>
 * Verifica que las operaciones anotadas con @Auditable sean interceptadas correctamente
 * mediante programación orientada a aspectos (AOP), registrando la información de las acciones
 * (creación, actualización, borrado) en el servicio de auditoría, e incluyendo la metadata pertinente.
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("Tests Unitarios de AuditAspect (Lógica de Intercepción)")
class AuditAspectTest {

    @Mock private AuditService auditService;
    @Mock private EntityManager entityManager;
    @Mock private ProceedingJoinPoint joinPoint;
    @Mock private MethodSignature signature;
    @Mock private Auditable auditable;

    @InjectMocks
    private AuditAspect auditAspect;

    /**
     * Verifica que el aspecto registra correctamente una acción de creación tras la ejecución exitosa del método.
     * <p>
     * <b>Precondiciones:</b> Se simula la intercepción de un método anotado para auditar la creación de un usuario.
     * <b>Ejecución:</b> El aspecto permite continuar la ejecución (proceed) y luego llama al servicio de auditoría.
     * <b>Asertos:</b> Se verifica que se invocó a {@code logAction} con los datos del usuario recién creado.
     */
    @Test
    @DisplayName("🧪 create: Registra acción tras ejecución exitosa")
    void auditAction_Create() throws Throwable {
        // Arrange
        when(auditable.entity()).thenReturn("User");
        when(auditable.action()).thenReturn("CREATE_USER");
        when(auditable.includeId()).thenReturn(true);
        
        com.tfg.backend.modules.identity.model.User newUser = com.tfg.backend.modules.identity.model.User.builder().id(10L).name("Dani").email("dani@es").build();
        when(joinPoint.proceed()).thenReturn(newUser);
        when(joinPoint.getArgs()).thenReturn(new Object[]{});

        // Act
        Object result = auditAspect.auditAction(joinPoint, auditable);

        // Assert
        assertEquals(newUser, result);
        verify(auditService).logAction(eq("User"), eq("CREATE_USER"), eq(10L), contains("Dani"));
    }

    /**
     * Verifica que el aspecto detecta y registra los cambios al comparar el estado anterior y el nuevo durante una actualización.
     * <p>
     * <b>Precondiciones:</b> Se simula la actualización de una entidad donde cambian ciertos campos (ej. el nombre).
     * <b>Ejecución:</b> El aspecto consulta el estado anterior mediante {@code EntityManager}, permite la ejecución y registra la diferencia.
     * <b>Asertos:</b> Se verifica que {@code logAction} registra el detalle del cambio de valor.
     */
    @Test
    @DisplayName("🧪 update: Detecta cambios comparando estados")
    void auditAction_Update() throws Throwable {
        // Arrange
        when(auditable.entity()).thenReturn("User");
        when(auditable.action()).thenReturn("UPDATE_USER");
        
        com.tfg.backend.modules.identity.model.User oldUser = com.tfg.backend.modules.identity.model.User.builder().id(10L).name("Old Name").email("old@es").build();
        com.tfg.backend.modules.identity.model.User newUser = com.tfg.backend.modules.identity.model.User.builder().id(10L).name("New Name").email("old@es").build();
        
        when(joinPoint.proceed()).thenReturn(newUser);
        when(joinPoint.getArgs()).thenReturn(new Object[]{10L}); 
        
        when(entityManager.find(any(), anyLong())).thenReturn(oldUser);

        // Act
        auditAspect.auditAction(joinPoint, auditable);

        // Assert
        verify(auditService).logAction(eq("User"), eq("UPDATE_USER"), eq(10L), contains("nombre: \"Old Name\" -> \"New Name\""));
    }

    /**
     * Verifica la resiliencia del aspecto, asegurando que no se registre ninguna auditoría si la ejecución del método falla.
     * <p>
     * <b>Precondiciones:</b> El método interceptado lanza una excepción (ej. error de base de datos).
     * <b>Ejecución:</b> El aspecto procesa la excepción.
     * <b>Asertos:</b> Se comprueba que la excepción se propaga y que no se llama a {@code logAction}.
     */
    @Test
    @DisplayName("🧪 resilience: No registra si la ejecución falla")
    void auditAction_Exception() throws Throwable {
        lenient().when(joinPoint.proceed()).thenThrow(new RuntimeException("DB error"));
        
        assertThrows(RuntimeException.class, () -> auditAspect.auditAction(joinPoint, auditable));
        
        verify(auditService, never()).logAction(anyString(), anyString(), any(), anyString());
    }

    /**
     * Verifica que el aspecto registra de forma adecuada una acción de borrado, extrayendo el identificador desde los argumentos.
     * <p>
     * <b>Precondiciones:</b> Se simula la intercepción de un método de borrado (ej. de un espacio) pasando el ID como argumento.
     * <b>Ejecución:</b> El aspecto permite la ejecución y registra la acción.
     * <b>Asertos:</b> Se comprueba que {@code logAction} recibe el ID correcto.
     */
    @Test
    @DisplayName("🧪 delete: Registra borrado con ID de argumentos")
    void auditAction_Delete() throws Throwable {
        lenient().when(auditable.entity()).thenReturn("Space");
        lenient().when(auditable.action()).thenReturn("DELETE_SPACE");
        lenient().when(auditable.includeId()).thenReturn(true);
        
        when(joinPoint.proceed()).thenReturn(null);
        when(joinPoint.getArgs()).thenReturn(new Object[]{50L});

        auditAspect.auditAction(joinPoint, auditable);

        verify(auditService).logAction(eq("Space"), eq("DELETE_SPACE"), eq(50L), contains("Acción ejecutada: DELETE_SPACE"));
    }

    /**
     * Verifica que el aspecto puede enriquecer los registros de auditoría obteniendo el campo 'name' del objeto, si este lo posee.
     * <p>
     * <b>Precondiciones:</b> El método interceptado devuelve un objeto que contiene una propiedad 'name' (ej. Space).
     * <b>Ejecución:</b> El aspecto extrae la propiedad usando reflexión y la incluye en los detalles.
     * <b>Asertos:</b> Se verifica que los detalles registrados incluyen el nombre del espacio.
     */
    @Test
    @DisplayName("🧪 metadata: Enriquece con nombre si el objeto lo tiene")
    void auditAction_WithMetadata_Name() throws Throwable {
        lenient().when(auditable.entity()).thenReturn("Space");
        lenient().when(auditable.action()).thenReturn("CREATE_SPACE");
        
        Space s = Space.builder().id(1L).name("Aula Magna").build();
        when(joinPoint.proceed()).thenReturn(s);
        when(joinPoint.getArgs()).thenReturn(new Object[]{});

        auditAspect.auditAction(joinPoint, auditable);

        verify(auditService).logAction(anyString(), anyString(), any(), contains("Aula Magna"));
    }

    /**
     * Verifica que el aspecto enriquece el registro de auditoría con detalles específicos cuando procesa una entidad de tipo Reserva.
     * <p>
     * <b>Precondiciones:</b> El método interceptado devuelve un objeto de tipo Reservation.
     * <b>Ejecución:</b> El aspecto detecta el tipo e invoca un formateador específico.
     * <b>Asertos:</b> Se comprueba que los detalles incluyen información del título y el responsable.
     */
    @Test
    @DisplayName("🧪 metadata: Enriquece con detalles de reserva")
    void auditAction_WithMetadata_Reservation() throws Throwable {
        lenient().when(auditable.entity()).thenReturn("Reservation");
        lenient().when(auditable.action()).thenReturn("APPROVE_RESERVATION");
        
        Reservation r = Reservation.builder()
                .id(1L).title("Reunion").responsibleName("Admin").status(ReservationStatus.APROBADA).build();
        when(joinPoint.proceed()).thenReturn(r);
        when(joinPoint.getArgs()).thenReturn(new Object[]{});

        auditAspect.auditAction(joinPoint, auditable);

        verify(auditService).logAction(anyString(), anyString(), any(), contains("Reunion (Responsable: Admin)"));
    }

    /**
     * Verifica que el aspecto formatea adecuadamente las diferencias cuando los cambios involucran colecciones (ej. lista de permisos).
     * <p>
     * <b>Precondiciones:</b> Se simula la actualización del rol modificando sus colecciones.
     * <b>Ejecución:</b> El aspecto compara el tamaño de las colecciones.
     * <b>Asertos:</b> Se verifica que el log registra el cambio utilizando la palabra "elementos".
     */
    @Test
    @DisplayName("🧪 formatting: Maneja colecciones en los detalles")
    void auditAction_Update_WithCollections() throws Throwable {
        lenient().when(auditable.entity()).thenReturn("Role");
        lenient().when(auditable.action()).thenReturn("UPDATE_ROLE");
        
        com.tfg.backend.modules.identity.model.Role oldRole = com.tfg.backend.modules.identity.model.Role.builder()
                .id(1L).name("R1").permissions(Set.of()).build();
        com.tfg.backend.modules.identity.model.Role newRole = com.tfg.backend.modules.identity.model.Role.builder()
                .id(1L).name("R1").permissions(Set.of(new com.tfg.backend.modules.identity.model.Permission())).build();
        
        when(joinPoint.proceed()).thenReturn(newRole);
        when(joinPoint.getArgs()).thenReturn(new Object[]{1L});
        when(entityManager.find(any(), anyLong())).thenReturn(oldRole);

        auditAspect.auditAction(joinPoint, auditable);

        verify(auditService).logAction(anyString(), anyString(), any(), contains("elementos"));
    }
}
