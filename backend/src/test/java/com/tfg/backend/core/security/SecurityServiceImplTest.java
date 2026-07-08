package com.tfg.backend.core.security;

import com.tfg.backend.modules.identity.model.Permission;
import com.tfg.backend.modules.identity.model.Role;
import com.tfg.backend.modules.identity.model.User;
import com.tfg.backend.modules.identity.repository.UserRepository;
import com.tfg.backend.modules.reservation.dto.VisibilityResult;
import com.tfg.backend.modules.reservation.model.Reservation;
import com.tfg.backend.modules.reservation.model.ReservationStatus;
import com.tfg.backend.modules.reservation.repository.ReservationRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;

import java.util.List;
import java.util.Optional;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.when;
import static org.mockito.Mockito.when;

/**
 * Suite de pruebas unitarias para el servicio de seguridad (SecurityServiceImpl).
 * <p>
 * Verifica el motor de permisos y autorización, validando que el contexto de seguridad evalúe
 * correctamente las diferentes combinaciones de roles, permisos, propiedades y reglas de visibilidad,
 * asegurando que los usuarios solo puedan acceder y modificar recursos para los que tienen autorización.
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("Tests Unitarios de SecurityService (Motor de Permisos)")
class SecurityServiceImplTest {

    @Mock private UserRepository userRepository;
    @Mock private ReservationRepository reservationRepository;
    @Mock private Authentication authentication;
    @Mock private SecurityContext securityContext;

    @InjectMocks
    private SecurityServiceImpl securityService;

    private User admin;
    private User professor;

    @BeforeEach
    void setUp() {
        Permission pApprove = new Permission(); pApprove.setName("APROBAR_RESERVA");
        Permission pManage = new Permission(); pManage.setName("GESTIONAR_USUARIOS");
        Role adminRole = Role.builder().name("ADMIN").permissions(Set.of(pApprove, pManage)).build();
        admin = User.builder().id(1L).email("admin@uniovi.es").role(adminRole).build();

        Permission p1 = new Permission(); p1.setName("APROBAR_ASIGNATURAS_GESTIONADAS");
        Role profRole = Role.builder().name("PROFESOR").permissions(Set.of(p1)).build();
        professor = User.builder().id(2L).email("prof@uniovi.es").role(profRole).build();
        
        SecurityContextHolder.setContext(securityContext);
    }

    /**
     * Verifica que se obtiene correctamente el usuario autenticado actual desde el contexto de seguridad.
     * <p>
     * <b>Precondiciones:</b> El contexto de seguridad contiene una autenticación válida.
     * <b>Ejecución:</b> Se solicita el usuario actual.
     * <b>Asertos:</b> Se comprueba que el sistema devuelve el usuario correcto asociado al email de la sesión.
     */
    @Test
    @DisplayName("👤 getCurrentUser: Éxito")
    void getCurrentUser_Success() {
        when(securityContext.getAuthentication()).thenReturn(authentication);
        when(authentication.isAuthenticated()).thenReturn(true);
        when(authentication.getName()).thenReturn("admin@uniovi.es");
        when(userRepository.findByEmail("admin@uniovi.es")).thenReturn(Optional.of(admin));

        User result = securityService.getCurrentUser();

        assertNotNull(result);
        assertEquals("admin@uniovi.es", result.getEmail());
    }

    /**
     * Verifica que se comprueba correctamente la presencia de un permiso específico dentro del conjunto de permisos del usuario.
     * <p>
     * <b>Precondiciones:</b> Se proporciona un usuario simulado con un rol que contiene ciertos permisos.
     * <b>Ejecución:</b> Se evalúa si tiene un permiso que posee y otro que no posee.
     * <b>Asertos:</b> Se comprueba que devuelve true para el permiso asignado y false para el ausente.
     */
    @Test
    @DisplayName("🛡️ hasPermission: Verifica presencia en set de permisos")
    void hasPermission_Success() {
        assertTrue(securityService.hasPermission(professor, "APROBAR_ASIGNATURAS_GESTIONADAS"));
        assertFalse(securityService.hasPermission(professor, "BORRAR_USUARIOS"));
    }

    /**
     * Verifica que el sistema identifica correctamente a un usuario con el rol de administrador.
     * <p>
     * <b>Precondiciones:</b> El contexto tiene un usuario autenticado con rol "ADMIN".
     * <b>Ejecución:</b> Se invoca la comprobación {@code isAdmin}.
     * <b>Asertos:</b> Se espera que devuelva true.
     */
    @Test
    @DisplayName("🔒 isAdmin: Identifica rol ADMIN")
    void isAdmin_Check() {
        when(securityContext.getAuthentication()).thenReturn(authentication);
        when(authentication.isAuthenticated()).thenReturn(true);
        when(authentication.getName()).thenReturn("admin@uniovi.es");
        when(userRepository.findByEmail("admin@uniovi.es")).thenReturn(Optional.of(admin));

        assertTrue(securityService.isAdmin());
    }

    /**
     * Verifica que un administrador no tiene restricciones de visibilidad al resolver la seguridad.
     * <p>
     * <b>Precondiciones:</b> Usuario autenticado como administrador.
     * <b>Ejecución:</b> Se resuelve la visibilidad para una petición filtrada por un usuario objetivo.
     * <b>Asertos:</b> El resultado no limita el ID de seguridad (null) permitiendo ver la información del usuario objetivo.
     */
    @Test
    @DisplayName("👁️ resolveVisibility: Admin ve todo")
    void resolveVisibility_Admin() {
        when(securityContext.getAuthentication()).thenReturn(authentication);
        when(authentication.isAuthenticated()).thenReturn(true);
        when(authentication.getName()).thenReturn("admin@uniovi.es");
        when(userRepository.findByEmail("admin@uniovi.es")).thenReturn(Optional.of(admin));

        VisibilityResult res = securityService.resolveVisibility("managed", 10L);

        assertNull(res.getSecurityUserId()); // No limita por su ID
        assertEquals(10L, res.getTargetUserId()); // Respeta el filtro pedido
    }

    /**
     * Verifica que el propietario de una reserva siempre puede cancelarla, independientemente de su estado inicial (permitido).
     * <p>
     * <b>Precondiciones:</b> El usuario autenticado es el creador de la reserva.
     * <b>Ejecución:</b> Se comprueba si puede cancelar su reserva.
     * <b>Asertos:</b> Devuelve true.
     */
    @Test
    @DisplayName("📅 canCancelReservation: Dueño puede cancelar siempre")
    void canCancelReservation_OwnerSuccess() {
        when(securityContext.getAuthentication()).thenReturn(authentication);
        when(authentication.isAuthenticated()).thenReturn(true);
        when(authentication.getName()).thenReturn("prof@uniovi.es");
        when(userRepository.findByEmail("prof@uniovi.es")).thenReturn(Optional.of(professor));

        Reservation res = Reservation.builder().id(100L).user(professor).status(ReservationStatus.SOLICITADA).build();
        when(reservationRepository.findById(100L)).thenReturn(Optional.of(res));

        assertTrue(securityService.canCancelReservation(100L));
    }

    /**
     * Verifica que un gestor (como un administrador) no puede cancelar una reserva ajena si se encuentra en estado PENDIENTE, debiendo utilizar la acción de rechazar.
     * <p>
     * <b>Precondiciones:</b> Administrador autenticado evaluando una reserva ajena solicitada/pendiente.
     * <b>Ejecución:</b> Se verifica si el administrador puede cancelarla.
     * <b>Asertos:</b> Devuelve false.
     */
    @Test
    @DisplayName("❌ canCancelReservation: Gestor NO puede cancelar reserva PENDIENTE ajena")
    void canCancelReservation_ManagerPendingFailure() {
        when(securityContext.getAuthentication()).thenReturn(authentication);
        when(authentication.isAuthenticated()).thenReturn(true);
        when(authentication.getName()).thenReturn("admin@uniovi.es");
        when(userRepository.findByEmail("admin@uniovi.es")).thenReturn(Optional.of(admin));

        Reservation res = Reservation.builder().id(100L).user(professor).status(ReservationStatus.SOLICITADA).build();
        when(reservationRepository.findById(100L)).thenReturn(Optional.of(res));

        // Debe ser false: el admin debe usar RECHAZAR si está pendiente
        assertFalse(securityService.canCancelReservation(100L));
    }

    /**
     * Verifica que un gestor sí puede cancelar una reserva ajena si esta ya se encuentra en estado APROBADA.
     * <p>
     * <b>Precondiciones:</b> Administrador autenticado evaluando una reserva ajena aprobada.
     * <b>Ejecución:</b> Se verifica si el administrador puede cancelarla.
     * <b>Asertos:</b> Devuelve true.
     */
    @Test
    @DisplayName("✅ canCancelReservation: Gestor SÍ puede cancelar reserva APROBADA ajena")
    void canCancelReservation_ManagerApprovedSuccess() {
        when(securityContext.getAuthentication()).thenReturn(authentication);
        when(authentication.isAuthenticated()).thenReturn(true);
        when(authentication.getName()).thenReturn("admin@uniovi.es");
        when(userRepository.findByEmail("admin@uniovi.es")).thenReturn(Optional.of(admin));

        Reservation res = Reservation.builder().id(100L).user(professor).status(ReservationStatus.APROBADA).build();
        when(reservationRepository.findById(100L)).thenReturn(Optional.of(res));

        assertTrue(securityService.canCancelReservation(100L));
    }

    /**
     * Verifica que un administrador tiene privilegios para aprobar cualquier reserva en el sistema.
     * <p>
     * <b>Precondiciones:</b> Usuario administrador.
     * <b>Ejecución:</b> Se evalúa la autorización para aprobar una reserva cualquiera.
     * <b>Asertos:</b> Devuelve true.
     */
    @Test
    @DisplayName("✅ canUserApproveReservation: Admin puede aprobar cualquier reserva")
    void canUserApproveReservation_AdminSuccess() {
        Reservation res = Reservation.builder().id(100L).build();
        assertTrue(securityService.canUserApproveReservation(admin, res));
    }

    /**
     * Verifica que un profesor con permisos de gestión puede aprobar reservas asociadas a las asignaturas que gestiona.
     * <p>
     * <b>Precondiciones:</b> Profesor gestionando una asignatura específica.
     * <b>Ejecución:</b> Se evalúa la autorización para aprobar una reserva de dicha asignatura.
     * <b>Asertos:</b> Devuelve true.
     */
    @Test
    @DisplayName("✅ canUserApproveReservation: Profesor puede aprobar reserva de su asignatura")
    void canUserApproveReservation_SubjectSuccess() {
        com.tfg.backend.modules.reservation.model.Subject subject = new com.tfg.backend.modules.reservation.model.Subject();
        subject.setId(10L);
        professor.getRole().setSubjects(Set.of(subject));

        Reservation res = Reservation.builder()
                .id(100L)
                .subject(subject)
                .build();

        assertTrue(securityService.canUserApproveReservation(professor, res));
    }

    /**
     * Verifica que un profesor no puede aprobar reservas de asignaturas que no están bajo su gestión.
     * <p>
     * <b>Precondiciones:</b> Profesor gestionando una asignatura, evaluando una reserva de otra distinta.
     * <b>Ejecución:</b> Se evalúa la autorización para aprobar.
     * <b>Asertos:</b> Devuelve false.
     */
    @Test
    @DisplayName("❌ canUserApproveReservation: Profesor NO puede aprobar reserva de otra asignatura")
    void canUserApproveReservation_SubjectFailure() {
        com.tfg.backend.modules.reservation.model.Subject mySubject = new com.tfg.backend.modules.reservation.model.Subject();
        mySubject.setId(10L);
        com.tfg.backend.modules.reservation.model.Subject otherSubject = new com.tfg.backend.modules.reservation.model.Subject();
        otherSubject.setId(20L);
        
        professor.getRole().setSubjects(Set.of(mySubject));

        Reservation res = Reservation.builder()
                .id(100L)
                .subject(otherSubject)
                .build();

        assertFalse(securityService.canUserApproveReservation(professor, res));
    }

    /**
     * Verifica la lógica completa de aprobación de reservas integrada con el contexto de seguridad actual.
     * <p>
     * <b>Precondiciones:</b> Contexto configurado con un profesor que gestiona la asignatura de la reserva.
     * <b>Ejecución:</b> Se invoca {@code canApproveReservation} con el ID de la reserva.
     * <b>Asertos:</b> Devuelve true.
     */
    @Test
    @DisplayName("🛡️ canApproveReservation: Lógica integrada con contexto de seguridad")
    void canApproveReservation_Integration() {
        when(securityContext.getAuthentication()).thenReturn(authentication);
        when(authentication.isAuthenticated()).thenReturn(true);
        when(authentication.getName()).thenReturn("prof@uniovi.es");
        when(userRepository.findByEmail("prof@uniovi.es")).thenReturn(Optional.of(professor));

        com.tfg.backend.modules.reservation.model.Subject subject = new com.tfg.backend.modules.reservation.model.Subject();
        subject.setId(10L);
        professor.getRole().setSubjects(Set.of(subject));

        Reservation res = Reservation.builder().id(100L).subject(subject).build();
        when(reservationRepository.findById(100L)).thenReturn(Optional.of(res));

        assertTrue(securityService.canApproveReservation(100L));
    }

    /**
     * Verifica que un administrador tiene permisos para visualizar la lista de usuarios.
     * <p>
     * <b>Precondiciones:</b> Administrador autenticado.
     * <b>Ejecución:</b> Se comprueba si puede ver usuarios.
     * <b>Asertos:</b> Devuelve true.
     */
    @Test
    @DisplayName("👥 canViewUsers: Admin puede ver siempre")
    void canViewUsers_Admin() {
        when(securityContext.getAuthentication()).thenReturn(authentication);
        when(authentication.isAuthenticated()).thenReturn(true);
        when(authentication.getName()).thenReturn("admin@uniovi.es");
        when(userRepository.findByEmail("admin@uniovi.es")).thenReturn(Optional.of(admin));

        assertTrue(securityService.canViewUsers());
    }

    /**
     * Verifica que un gestor con el permiso APROBAR_RESERVA también tiene acceso a la visualización de usuarios.
     * <p>
     * <b>Precondiciones:</b> Usuario con rol de gestor autenticado.
     * <b>Ejecución:</b> Se comprueba si puede ver usuarios.
     * <b>Asertos:</b> Devuelve true.
     */
    @Test
    @DisplayName("👥 canViewUsers: Gestor de reservas puede ver")
    void canViewUsers_ReservationManager() {
        Permission p = new Permission(); p.setName("APROBAR_RESERVA");
        Role r = Role.builder().name("GESTOR").permissions(Set.of(p)).build();
        User manager = User.builder().email("manager@uniovi.es").role(r).build();

        when(securityContext.getAuthentication()).thenReturn(authentication);
        when(authentication.isAuthenticated()).thenReturn(true);
        when(authentication.getName()).thenReturn("manager@uniovi.es");
        when(userRepository.findByEmail("manager@uniovi.es")).thenReturn(Optional.of(manager));

        assertTrue(securityService.canViewUsers());
    }

    /**
     * Verifica que un usuario básico sin permisos de gestión no puede visualizar el listado de usuarios.
     * <p>
     * <b>Precondiciones:</b> Usuario básico autenticado.
     * <b>Ejecución:</b> Se comprueba si puede ver usuarios.
     * <b>Asertos:</b> Devuelve false.
     */
    @Test
    @DisplayName("👥 canViewUsers: Usuario básico NO puede ver")
    void canViewUsers_BasicUser() {
        Permission p = new Permission(); p.setName("SOLICITAR_RESERVA");
        Role r = Role.builder().name("USER").permissions(Set.of(p)).build();
        User basic = User.builder().email("user@uniovi.es").role(r).build();

        when(securityContext.getAuthentication()).thenReturn(authentication);
        when(authentication.isAuthenticated()).thenReturn(true);
        when(authentication.getName()).thenReturn("user@uniovi.es");
        when(userRepository.findByEmail("user@uniovi.es")).thenReturn(Optional.of(basic));

        assertFalse(securityService.canViewUsers());
    }

    /**
     * Verifica que cualquier usuario tiene permisos para auto-gestionar su propio perfil.
     * <p>
     * <b>Precondiciones:</b> Usuario autenticado solicitando gestionarse a sí mismo.
     * <b>Ejecución:</b> Se comprueba {@code canManageUser} con su propio ID.
     * <b>Asertos:</b> Devuelve true.
     */
    @Test
    @DisplayName("👤 canManageUser: Permite auto-edición")
    void canManageUser_Self() {
        when(securityContext.getAuthentication()).thenReturn(authentication);
        when(authentication.isAuthenticated()).thenReturn(true);
        when(authentication.getName()).thenReturn("prof@uniovi.es");
        when(userRepository.findByEmail("prof@uniovi.es")).thenReturn(Optional.of(professor));

        // Un profesor puede gestionarse a sí mismo (para editar su perfil)
        assertTrue(securityService.canManageUser(professor.getId()));
    }

    /**
     * Verifica que el motor de permisos maneja de forma segura las comprobaciones cuando el usuario o rol son nulos.
     * <p>
     * <b>Precondiciones:</b> Se pasa un usuario nulo o sin rol a la comprobación de permisos.
     * <b>Ejecución:</b> Se evalúa un permiso cualquiera.
     * <b>Asertos:</b> Devuelve false en lugar de lanzar una excepción.
     */
    @Test
    @DisplayName("🛡️ hasPermission: Maneja usuario o rol nulo")
    void hasPermission_NullHandling() {
        assertFalse(securityService.hasPermission(null, "ANY"));
        assertFalse(securityService.hasPermission(User.builder().build(), "ANY"));
    }

    /**
     * Verifica que el sistema maneja de forma segura la resolución de visibilidad cuando no hay usuario autenticado.
     * <p>
     * <b>Precondiciones:</b> Contexto de seguridad vacío.
     * <b>Ejecución:</b> Se resuelve la visibilidad.
     * <b>Asertos:</b> Devuelve un ID objetivo de -1 indicando ausencia de permisos.
     */
    @Test
    @DisplayName("👁️ resolveVisibility: Maneja usuario no autenticado")
    void resolveVisibility_NoUser() {
        when(securityContext.getAuthentication()).thenReturn(null);
        VisibilityResult res = securityService.resolveVisibility("managed", 1L);
        assertEquals(-1L, res.getTargetUserId());
    }

    /**
     * Verifica que para un usuario normal en un alcance limitado (managed), el sistema impone que solo pueda ver su propia información.
     * <p>
     * <b>Precondiciones:</b> Usuario normal autenticado solicitando información gestionada.
     * <b>Ejecución:</b> Se resuelve la visibilidad.
     * <b>Asertos:</b> Se fija su ID de seguridad para limitar los resultados.
     */
    @Test
    @DisplayName("👁️ resolveVisibility: Usuario normal (scope managed)")
    void resolveVisibility_NormalUser() {
        Role userRole = Role.builder().name("USER").permissions(Set.of()).build();
        User user = User.builder().id(3L).role(userRole).build();

        when(securityContext.getAuthentication()).thenReturn(authentication);
        when(authentication.isAuthenticated()).thenReturn(true);
        when(authentication.getName()).thenReturn("user@test.com");
        when(userRepository.findByEmail("user@test.com")).thenReturn(Optional.of(user));

        VisibilityResult res = securityService.resolveVisibility("managed", 1L);
        assertNull(res.getTargetUserId());
        assertEquals(3L, res.getSecurityUserId());
    }

    /**
     * Verifica que un profesor gestor al solicitar el alcance "all" delega la visibilidad de manera correcta.
     * <p>
     * <b>Precondiciones:</b> Profesor gestor autenticado.
     * <b>Ejecución:</b> Se resuelve la visibilidad en alcance completo (all).
     * <b>Asertos:</b> El resultado incluye el filtro solicitado y los IDs de las asignaturas que gestiona.
     */
    @Test
    @DisplayName("👁️ resolveVisibility: Gestor de asignaturas (scope default)")
    void resolveVisibility_SubjectManager_DefaultScope() {
        com.tfg.backend.modules.reservation.model.Subject s1 = new com.tfg.backend.modules.reservation.model.Subject(); s1.setId(10L);
        Permission p = new Permission(); p.setName("APROBAR_ASIGNATURAS_GESTIONADAS");
        Role role = Role.builder().name("PROF").permissions(Set.of(p)).subjects(Set.of(s1)).build();
        User user = User.builder().id(4L).role(role).build();

        when(securityContext.getAuthentication()).thenReturn(authentication);
        when(authentication.isAuthenticated()).thenReturn(true);
        when(authentication.getName()).thenReturn("prof@test.com");
        when(userRepository.findByEmail("prof@test.com")).thenReturn(Optional.of(user));

        VisibilityResult res = securityService.resolveVisibility("all", 100L);
        assertEquals(100L, res.getTargetUserId());
        assertEquals(4L, res.getSecurityUserId());
        assertEquals(List.of(10L), res.getManagedSubjectIds());
    }

    /**
     * Verifica que la comprobación de visualización de usuarios acepta diferentes tipos de permisos de gestión.
     * <p>
     * <b>Precondiciones:</b> Usuarios simulados con diferentes permisos avanzados.
     * <b>Ejecución:</b> Se itera probando cada permiso.
     * <b>Asertos:</b> Todos los permisos listados otorgan acceso a visualizar usuarios.
     */
    @Test
    @DisplayName("👥 canViewUsers: Verifica diversos permisos")
    void canViewUsers_VariousPermissions() {
        String[] permissions = {"GESTIONAR_USUARIOS", "GESTIONAR_ROLES", "VER_TODAS_RESERVAS", "IMPORTAR_RESERVAS", "EXPORTAR_RESERVAS"};
        
        for (String pName : permissions) {
            Permission p = new Permission(); p.setName(pName);
            User u = User.builder().role(Role.builder().permissions(Set.of(p)).build()).build();
            
            when(securityContext.getAuthentication()).thenReturn(authentication);
            when(authentication.isAuthenticated()).thenReturn(true);
            when(authentication.getName()).thenReturn("test@test.com");
            when(userRepository.findByEmail("test@test.com")).thenReturn(Optional.of(u));
            
            assertTrue(securityService.canViewUsers(), "Debe permitir con permiso " + pName);
        }
    }

    /**
     * Verifica las diversas casuísticas de seguridad al intentar editar una reserva.
     * <p>
     * <b>Precondiciones:</b> Contexto simulando dueños, usuarios ajenos y administradores.
     * <b>Ejecución:</b> Se comprueba el permiso de edición.
     * <b>Asertos:</b> El dueño y el administrador pueden, los demás usuarios no.
     */
    @Test
    @DisplayName("📝 canEditReservation: Diversas casuísticas")
    void canEditReservation_Flows() {
        when(securityContext.getAuthentication()).thenReturn(authentication);
        when(authentication.isAuthenticated()).thenReturn(true);
        when(authentication.getName()).thenReturn("prof@uniovi.es");
        when(userRepository.findByEmail("prof@uniovi.es")).thenReturn(Optional.of(professor));

        // 1. Dueño
        Reservation resOwner = Reservation.builder().id(100L).user(professor).build();
        when(reservationRepository.findById(100L)).thenReturn(Optional.of(resOwner));
        assertTrue(securityService.canEditReservation(100L));

        // 2. No dueño, sin permisos
        User other = User.builder().id(99L).build();
        Reservation resOther = Reservation.builder().id(101L).user(other).build();
        when(reservationRepository.findById(101L)).thenReturn(Optional.of(resOther));
        assertFalse(securityService.canEditReservation(101L));

        // 3. Admin (usando admin mock)
        when(authentication.getName()).thenReturn("admin@uniovi.es");
        when(userRepository.findByEmail("admin@uniovi.es")).thenReturn(Optional.of(admin));
        assertTrue(securityService.canEditReservation(101L));
    }

    /**
     * Verifica las diversas casuísticas de visibilidad al intentar ver los detalles de una reserva.
     * <p>
     * <b>Precondiciones:</b> Usuarios con diferentes niveles de relación con la reserva (dueño, responsable, gestor de la asignatura).
     * <b>Ejecución:</b> Se comprueba el acceso de lectura.
     * <b>Asertos:</b> Se permite el acceso si el usuario guarda alguna relación directa o de gestión con la reserva.
     */
    @Test
    @DisplayName("👁️ canViewReservation: Diversas casuísticas")
    void canViewReservation_Flows() {
        when(securityContext.getAuthentication()).thenReturn(authentication);
        when(authentication.isAuthenticated()).thenReturn(true);
        when(authentication.getName()).thenReturn("prof@uniovi.es");
        when(userRepository.findByEmail("prof@uniovi.es")).thenReturn(Optional.of(professor));

        // 1. Dueño
        Reservation resOwner = Reservation.builder().id(100L).user(professor).build();
        when(reservationRepository.findById(100L)).thenReturn(Optional.of(resOwner));
        assertTrue(securityService.canViewReservation(100L));

        // 2. Responsable
        Reservation resResp = Reservation.builder().id(102L).user(User.builder().id(99L).build()).responsible(professor).build();
        when(reservationRepository.findById(102L)).thenReturn(Optional.of(resResp));
        assertTrue(securityService.canViewReservation(102L));

        // 3. Gestor de asignatura
        com.tfg.backend.modules.reservation.model.Subject subject = new com.tfg.backend.modules.reservation.model.Subject();
        subject.setId(10L);
        professor.getRole().setSubjects(Set.of(subject));
        Reservation resSubj = Reservation.builder().id(103L).user(User.builder().id(99L).build()).subject(subject).build();
        when(reservationRepository.findById(103L)).thenReturn(Optional.of(resSubj));
        assertTrue(securityService.canViewReservation(103L));
    }

    /**
     * Verifica que un administrador puede gestionar (editar/eliminar) a cualquier otro usuario.
     * <p>
     * <b>Precondiciones:</b> Administrador autenticado evaluando la gestión de un profesor.
     * <b>Ejecución:</b> Se comprueba {@code canManageUser}.
     * <b>Asertos:</b> Devuelve true.
     */
    @Test
    @DisplayName("👤 canManageUser: Admin gestiona a cualquiera")
    void canManageUser_Admin() {
        lenient().when(securityContext.getAuthentication()).thenReturn(authentication);
        lenient().when(authentication.isAuthenticated()).thenReturn(true);
        lenient().when(authentication.getName()).thenReturn("admin@uniovi.es");
        lenient().when(userRepository.findByEmail("admin@uniovi.es")).thenReturn(Optional.of(admin));
        lenient().when(userRepository.findById(2L)).thenReturn(Optional.of(professor));

        assertTrue(securityService.canManageUser(2L));
    }

    /**
     * Verifica que un gestor, aunque tenga el permiso de gestionar usuarios, no puede alterar a un administrador.
     * <p>
     * <b>Precondiciones:</b> Gestor autenticado intentando gestionar a un administrador de mayor rango.
     * <b>Ejecución:</b> Se comprueba {@code canManageUser}.
     * <b>Asertos:</b> Devuelve false para evitar escalada de privilegios.
     */
    @Test
    @DisplayName("👤 canManageUser: Gestor no puede gestionar a Admin")
    void canManageUser_GestorVsAdmin() {
        when(securityContext.getAuthentication()).thenReturn(authentication);
        when(authentication.isAuthenticated()).thenReturn(true);

        Permission pManage = Permission.builder().name("GESTIONAR_USUARIOS").build();
        Role gestorRole = Role.builder()
                .name("GESTOR")
                .permissions(new java.util.HashSet<>(java.util.Set.of(pManage)))
                .build();
        User gestor = User.builder().id(5L).email("gestor@test.com").role(gestorRole).build();

        when(authentication.getName()).thenReturn("gestor@test.com");
        when(userRepository.findByEmail("gestor@test.com")).thenReturn(Optional.of(gestor));
        when(userRepository.findById(1L)).thenReturn(Optional.of(admin));
        
        assertFalse(securityService.canManageUser(1L));
    }

    /**
     * Verifica que un gestor de usuarios sí puede gestionar a un usuario de menor o igual rango (como un profesor).
     * <p>
     * <b>Precondiciones:</b> Gestor autenticado intentando gestionar a un profesor.
     * <b>Ejecución:</b> Se comprueba {@code canManageUser}.
     * <b>Asertos:</b> Devuelve true.
     */
    @Test
    @DisplayName("👤 canManageUser: Gestor gestiona a Profesor")
    void canManageUser_GestorVsProfessor() {
        when(securityContext.getAuthentication()).thenReturn(authentication);
        when(authentication.isAuthenticated()).thenReturn(true);

        Permission pManage = Permission.builder().name("GESTIONAR_USUARIOS").build();
        Role gestorRole = Role.builder()
                .name("GESTOR")
                .permissions(new java.util.HashSet<>(java.util.Set.of(pManage)))
                .build();
        User gestor = User.builder().id(5L).email("gestor@test.com").role(gestorRole).build();

        when(authentication.getName()).thenReturn("gestor@test.com");
        when(userRepository.findByEmail("gestor@test.com")).thenReturn(Optional.of(gestor));
        when(userRepository.findById(2L)).thenReturn(Optional.of(professor));
        
        assertTrue(securityService.canManageUser(2L));
    }

    /**
     * Verifica la funcionalidad básica para comprobar si un usuario es gestor de una asignatura específica.
     * <p>
     * <b>Precondiciones:</b> Profesor autenticado que gestiona una asignatura concreta.
     * <b>Ejecución:</b> Se comprueba la gestión sobre su asignatura y sobre otra.
     * <b>Asertos:</b> Devuelve true para su asignatura, false para la otra o nulo.
     */
    @Test
    @DisplayName("🛡️ managesSubject: Caso básico")
    void managesSubject_Check() {
        when(securityContext.getAuthentication()).thenReturn(authentication);
        when(authentication.isAuthenticated()).thenReturn(true);
        when(authentication.getName()).thenReturn("prof@uniovi.es");
        when(userRepository.findByEmail("prof@uniovi.es")).thenReturn(Optional.of(professor));

        com.tfg.backend.modules.reservation.model.Subject s = new com.tfg.backend.modules.reservation.model.Subject();
        s.setId(10L);
        professor.getRole().setSubjects(Set.of(s));

        assertTrue(securityService.managesSubject(10L));
        assertFalse(securityService.managesSubject(20L));
        assertFalse(securityService.managesSubject(null));
    }
}
