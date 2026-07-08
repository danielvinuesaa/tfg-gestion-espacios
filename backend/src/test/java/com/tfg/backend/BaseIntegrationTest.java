package com.tfg.backend;

import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;
import com.tfg.backend.config.TestAsyncConfig;

/**
 * Clase base para la suite de pruebas de integración.
 * <p>
 * Proporciona el entorno configurado de Spring Boot, define el perfil de pruebas
 * y gestiona la transaccionalidad para que las pruebas no afecten a los datos reales.
 * Incluye la configuración asíncrona necesaria para el correcto funcionamiento del sistema durante los tests.
 */
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.MOCK)
@ActiveProfiles("test")
@Transactional
@Import(TestAsyncConfig.class)
public abstract class BaseIntegrationTest {
}
