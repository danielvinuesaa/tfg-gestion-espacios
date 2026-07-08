package com.tfg.backend;
import com.tfg.backend.modules.reservation.model.Reservation;
import com.tfg.backend.modules.reservation.model.Subject;
import com.tfg.backend.modules.reservation.repository.ReservationRepository;
import com.tfg.backend.modules.reservation.repository.SubjectRepository;
import com.tfg.backend.modules.space.model.Space;
import com.tfg.backend.modules.space.model.SpaceStatus;
import com.tfg.backend.modules.space.model.SpaceType;
import com.tfg.backend.modules.space.repository.SpaceRepository;
import com.tfg.backend.modules.identity.model.Permission;
import com.tfg.backend.modules.identity.model.Role;
import com.tfg.backend.modules.identity.model.User;
import com.tfg.backend.modules.identity.repository.PermissionRepository;
import com.tfg.backend.modules.identity.repository.RoleRepository;
import com.tfg.backend.modules.identity.repository.UserRepository;

import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Profile;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.context.annotation.Bean;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Arrays;
import java.util.HashSet;
import java.util.Set;
import java.util.stream.Collectors;

import java.util.List;

/**
 * Clase principal de la aplicación TFG Backend.
 * <p>
 * Configura y arranca el contexto de Spring Boot, habilitando la programación
 * de tareas y la ejecución asíncrona. Además, inicializa la zona horaria
 * por defecto para toda la aplicación.
 * </p>
 */
@SpringBootApplication
@EnableScheduling
@org.springframework.scheduling.annotation.EnableAsync
public class TfgBackendApplication {

	/**
	 * Método de entrada principal de la aplicación.
	 *
	 * @param args Argumentos de línea de comandos.
	 */
	public static void main(String[] args) {
		// Unificamos la zona horaria a la de España para toda la aplicación desde el arranque
		java.util.TimeZone.setDefault(java.util.TimeZone.getTimeZone("Europe/Madrid"));
		SpringApplication.run(TfgBackendApplication.class, args);
	}

	/**
	 * Inicializa la base de datos con los datos maestros necesarios para el
	 * funcionamiento del sistema, tales como permisos, roles, asignaturas,
	 * usuario administrador y espacios por defecto.
	 *
	 * @param spaceRepository Repositorio para la gestión de espacios.
	 * @param roleRepository Repositorio para la gestión de roles.
	 * @param userRepository Repositorio para la gestión de usuarios.
	 * @param reservationRepository Repositorio para la gestión de reservas.
	 * @param subjectRepository Repositorio para la gestión de asignaturas.
	 * @param permissionRepository Repositorio para la gestión de permisos.
	 * @param passwordEncoder Codificador de contraseñas.
	 * @return Un {@link CommandLineRunner} que se ejecutará tras el inicio de la aplicación.
	 */
	@Bean
	@Profile("!test")
	CommandLineRunner initDatabase(
			SpaceRepository spaceRepository, 
			RoleRepository roleRepository, 
			UserRepository userRepository, 
			ReservationRepository reservationRepository,
			SubjectRepository subjectRepository,
			PermissionRepository permissionRepository,
			PasswordEncoder passwordEncoder) {
		return args -> {
			// 1. Init Permissions (Professional Sync)
			List<Permission> permissionsToSync = Arrays.asList(
				// Espacios
				Permission.builder().name("LEER_ESPACIOS").label("Leer Espacios").description("Permite visualizar el catálogo de espacios y sus detalles.").build(),
				Permission.builder().name("CREAR_ESPACIOS").label("Crear Espacios").description("Permite dar de alta nuevos espacios en el sistema.").build(),
				Permission.builder().name("EDITAR_ESPACIOS").label("Editar Espacios").description("Permite modificar la información y configuración de espacios existentes.").build(),
				Permission.builder().name("ELIMINAR_ESPACIOS").label("Eliminar Espacios").description("Permite realizar el borrado lógico de espacios.").build(),
				
				// Reservas
				Permission.builder().name("VER_TODAS_RESERVAS").label("Ver todas las Reservas").description("Permite visualizar las reservas de todos los usuarios del centro.").build(),
				Permission.builder().name("SOLICITAR_RESERVA").label("Solicitar Reserva").description("Permite realizar solicitudes de reserva de espacios.").build(),
				Permission.builder().name("APROBAR_RESERVA").label("Aprobar todas las Reservas").description("Capacidad de aprobar o rechazar cualquier reserva del sistema (Nivel Global).").build(),
				Permission.builder().name("APROBAR_ASIGNATURAS_GESTIONADAS").label("Gestionar Reservas por Ámbito").description("Permite aprobar reservas solo de las asignaturas vinculadas a este rol.").build(),
				Permission.builder().name("CANCELAR_RESERVA").label("Cancelar Reservas").description("Permite cancelar reservas activas de otros usuarios.").build(),
				Permission.builder().name("IMPORTAR_RESERVAS").label("Importar Reservas").description("Permite realizar cargas masivas de reservas mediante ficheros CSV.").build(),
				Permission.builder().name("EXPORTAR_RESERVAS").label("Exportar Reservas").description("Permite descargar volcados masivos del historial de reservas a CSV.").build(),
				
				// Sistema
				Permission.builder().name("GESTIONAR_USUARIOS").label("Gestionar Usuarios").description("Acceso total a la creación, edición y bloqueo de cuentas de usuario.").build(),
				Permission.builder().name("GESTIONAR_ROLES").label("Gestionar Roles").description("Permite administrar los roles del sistema y sus permisos asociados.").build(),
				Permission.builder().name("GENERAR_INFORMES").label("Generar Informes").description("Acceso a la sección de analítica y exportación de datos del centro.").build()
			);

			for (Permission p : permissionsToSync) {
				Permission existing = permissionRepository.findByName(p.getName()).orElse(null);
				if (existing == null) {
					permissionRepository.save(p);
				} else {
					// Sincronizar textos si han cambiado
					existing.setLabel(p.getLabel());
					existing.setDescription(p.getDescription());
					permissionRepository.save(existing);
				}
			}

			Set<Permission> allPermissions = new HashSet<>(permissionRepository.findAll());

			// 2. Init ADMIN Role (Immutable system role)
			Role adminRole = roleRepository.findByName("ADMIN").orElse(null);
			if (adminRole == null) {
				adminRole = Role.builder()
					.name("ADMIN")
					.description("Administrador Total del Sistema")
					.permissions(allPermissions)
					.build();
				roleRepository.save(adminRole);
			} else {
				                                                                // Sincronizar permisos del admin con el catálogo completo
				                                                                adminRole.setPermissions(allPermissions);
				                                                                roleRepository.save(adminRole);
				                                                        }			// 3. Init Subjects (Professional Sync Approach)
			List<Subject> subjectsToSync = Arrays.asList(
				// 1º Curso
				Subject.builder().code("AL").name("Álgebra lineal").course("1").build(),
				Subject.builder().code("Cal").name("Cálculo").course("1").build(),
				Subject.builder().code("Emp").name("Empresa").course("1").build(),
				Subject.builder().code("FI").name("Fundamentos de Informática").course("1").build(),
				Subject.builder().code("IP").name("Introducción a la Programación").course("1").build(),
				Subject.builder().code("OyE").name("Ondas y Electromagnetismo").course("1").build(),
				Subject.builder().code("Est").name("Estadística").course("1").build(),
				Subject.builder().code("FCR").name("Fundamentos de Computadores y Redes").course("1").build(),
				Subject.builder().code("AMD").name("Autómatas y Matemáticas Discretas").course("1").build(),
				Subject.builder().code("MP").name("Metodología de la Programación").course("1").build(),

				// 2º Curso
				Subject.builder().code("TEC").name("Tecnología Electrónica de Computadores").course("2").build(),
				Subject.builder().code("AC").name("Arquitectura de Computadores").course("2").build(),
				Subject.builder().code("ED").name("Estructuras de Datos").course("2").build(),
				Subject.builder().code("CPM").name("Comunicación Persona Máquina").course("2").build(),
				Subject.builder().code("Com").name("Computabilidad").course("2").build(),
				Subject.builder().code("SO").name("Sistemas Operativos").course("2").build(),
				Subject.builder().code("TPP").name("Tecnologías y Paradigmas de la Programación").course("2").build(),
				Subject.builder().code("BD").name("Bases de Datos").course("2").build(),
				Subject.builder().code("CN").name("Computación numérica").course("2").build(),
				Subject.builder().code("Alg").name("Algoritmia").course("2").build(),

				// 3º Curso
				Subject.builder().code("RI").name("Repositorios de Información").course("3").build(),
				Subject.builder().code("SEW").name("Software y Estándares para la Web").course("3").build(),
				Subject.builder().code("IPS").name("Ingeniería del Proceso Software").course("3").build(),
				Subject.builder().code("DS").name("Diseño del Software").course("3").build(),
				Subject.builder().code("SDI").name("Sistemas Distribuidos e Internet").course("3").build(),
				Subject.builder().code("ASR").name("Administración de Sistemas y Redes").course("3").build(),
				Subject.builder().code("ASW").name("Arquitectura del Software").course("3").build(),
				Subject.builder().code("DLP").name("Diseño de Lenguajes de Programación").course("3").build(),
				Subject.builder().code("SSI").name("Seguridad de Sistemas Informáticos").course("3").build(),

				// 4º Curso
				Subject.builder().code("SI").name("Sistemas Inteligentes").course("4").build(),
				Subject.builder().code("IR").name("Ingeniería de Requisitos").course("4").build(),
				Subject.builder().code("CVVS").name("Calidad, Validación y Verificación del Software").course("4").build(),
				Subject.builder().code("DPPI").name("Dirección y Planificación de Proyectos Informáticos").course("4").build(),
				Subject.builder().code("ASLEPI").name("Aspectos sociales, legales, éticos y profesionales de la Informática").course("4").build(),
				Subject.builder().code("PE").name("Prácticas en Empresa").course("4").build(),
				Subject.builder().code("TFG").name("Trabajo Fin de Grado").course("4").build(),

				// Optativas
				Subject.builder().code("IAE").name("Integración de Aplicaciones Empresariales").course("Optativa").build(),
				Subject.builder().code("IFA").name("Informática Forense y Auditoría").course("Optativa").build(),
				Subject.builder().code("MIS").name("Modelado en Ingeniería del Software (inactiva)").course("Optativa").build(),
				Subject.builder().code("SDM").name("Software para dispositivos Móviles").course("Optativa").build(),
				Subject.builder().code("RAA").name("Realidad y Accesibilidad Aumentadas").course("Optativa").build(),
				Subject.builder().code("SIW").name("Sistemas de Información para la Web").course("Optativa").build(),
				Subject.builder().code("SEV").name("Software de Entretenimiento y Videojuegos").course("Optativa").build(),
				Subject.builder().code("SR").name("Software para Robots").course("Optativa").build(),
				Subject.builder().code("IA").name("Informática Audiovisual").course("Optativa").build()
			);

			for (Subject s : subjectsToSync) {
				subjectRepository.findByCode(s.getCode()).ifPresentOrElse(
					existing -> {
						existing.setName(s.getName());
						existing.setCourse(s.getCourse());
						subjectRepository.save(existing);
					},
					() -> subjectRepository.save(s)
				);
			}

			// 4. Init Admin User
			if (userRepository.findByEmail("admin@uniovi.es").isEmpty()) {
				User admin = User.builder()
						.name("Administrador")
						.email("admin@uniovi.es")
						.password(passwordEncoder.encode("admin123"))
						.role(adminRole)
						.build();
				userRepository.save(admin);
			}
			
			// 5. Init Spaces (Comentado o eliminado a petición, se usarán los del ZIP)
		};
	}
}
