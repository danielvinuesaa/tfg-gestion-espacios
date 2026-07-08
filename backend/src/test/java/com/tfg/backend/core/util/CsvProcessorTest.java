package com.tfg.backend.core.util;

import com.tfg.backend.core.exception.BusinessValidationException;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockMultipartFile;

import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Suite de pruebas unitarias para el procesador de archivos CSV (CsvProcessor).
 * <p>
 * Valida la resiliencia del procesamiento ante diversos formatos, codificaciones (UTF-8, Windows-1252),
 * presencia de cabeceras, y casos de error como archivos vacíos o con extensión no válida.
 */
@DisplayName("Tests Unitarios de CsvProcessor (Resiliencia de Formatos)")
class CsvProcessorTest {

    private final CsvProcessor csvProcessor = new CsvProcessor();

    /**
     * Verifica la lectura básica de un archivo CSV codificado en UTF-8 utilizando punto y coma como separador.
     * <p>
     * <b>Precondiciones:</b> Se dispone de un archivo CSV simulado con datos correctos y codificación UTF-8.
     * <b>Ejecución:</b> Se procesa el archivo extrayendo cada fila.
     * <b>Asertos:</b> Se comprueba que se extrae la fila correctamente con los valores esperados de cada columna.
     */
    @Test
    @DisplayName("✅ Lectura básica: UTF-8 con punto y coma")
    void process_BasicUtf8() {
        String content = "Nombre;Email;Rol\nDani;dani@uniovi.es;ADMIN";
        MockMultipartFile file = new MockMultipartFile("test.csv", "test.csv", "text/csv", content.getBytes(StandardCharsets.UTF_8));

        List<String[]> rows = new ArrayList<>();
        csvProcessor.process(file, true, (row, num) -> rows.add(row));

        assertEquals(1, rows.size());
        assertEquals("Dani", rows.get(0)[0]);
        assertEquals("ADMIN", rows.get(0)[2]);
    }

    /**
     * Verifica que el sistema es capaz de detectar y procesar correctamente archivos CSV generados con la codificación Windows-1252, típica de Excel en español.
     * <p>
     * <b>Precondiciones:</b> Se proporciona un archivo CSV simulado con caracteres especiales (tildes) y codificación Windows-1252.
     * <b>Ejecución:</b> Se procesa el archivo de forma automática.
     * <b>Asertos:</b> Se verifica que los caracteres acentuados se decodifican correctamente sin pérdida de información.
     */
    @Test
    @DisplayName("✅ Detección automática: Windows-1252 (Excel ES)")
    void process_Windows1252_WithAccents() {
        // "Canción" en Windows-1252
        byte[] bytes = "Título;Estado\nCanción;Aprobada".getBytes(java.nio.charset.Charset.forName("Windows-1252"));
        MockMultipartFile file = new MockMultipartFile("excel.csv", "excel.csv", "text/csv", bytes);

        List<String[]> rows = new ArrayList<>();
        csvProcessor.process(file, true, (row, num) -> rows.add(row));

        assertEquals("Canción", rows.get(0)[0]);
        assertEquals("Aprobada", rows.get(0)[1]);
    }

    /**
     * Verifica que el sistema lanza una excepción si se intenta procesar un archivo CSV vacío.
     * <p>
     * <b>Precondiciones:</b> Se provee un archivo sin contenido en bytes.
     * <b>Ejecución:</b> Se invoca el procesamiento del archivo.
     * <b>Asertos:</b> Se espera que se lance una excepción {@link BusinessValidationException}.
     * 
     * @throws BusinessValidationException si el archivo está vacío.
     */
    @Test
    @DisplayName("❌ Error: Archivo vacío")
    void process_EmptyFile_Fail() {
        MockMultipartFile file = new MockMultipartFile("empty.csv", new byte[0]);
        assertThrows(BusinessValidationException.class, () -> csvProcessor.process(file, true, (r, n) -> {}));
    }

    /**
     * Verifica que el sistema rechaza un archivo si la extensión o tipo de contenido no corresponde a un archivo CSV.
     * <p>
     * <b>Precondiciones:</b> Se proporciona un archivo con formato de texto simple (text/plain) en lugar de CSV.
     * <b>Ejecución:</b> Se intenta procesar el archivo.
     * <b>Asertos:</b> Se espera que se lance una excepción {@link BusinessValidationException} indicando el formato inválido.
     * 
     * @throws BusinessValidationException si la extensión es inválida.
     */
    @Test
    @DisplayName("❌ Error: Extensión no permitida")
    void process_InvalidExtension_Fail() {
        MockMultipartFile file = new MockMultipartFile("test.txt", "test.txt", "text/plain", "abc".getBytes());
        assertThrows(BusinessValidationException.class, () -> csvProcessor.process(file, true, (r, n) -> {}));
    }

    /**
     * Verifica que el procesador omite correctamente la primera fila si se solicita ignorar la cabecera.
     * <p>
     * <b>Precondiciones:</b> Se provee un archivo CSV con una fila de cabecera y una fila de datos.
     * <b>Ejecución:</b> Se procesa el archivo con la opción de ignorar la cabecera activada.
     * <b>Asertos:</b> Se comprueba que solo se lee una fila y que corresponde a los datos, ignorando los títulos de columna.
     */
    @Test
    @DisplayName("📋 Skip Header: Verifica que salta la primera fila si se solicita")
    void process_SkipHeader() {
        String content = "Col1;Col2\nVal1;Val2";
        MockMultipartFile file = new MockMultipartFile("data.csv", "data.csv", "text/csv", content.getBytes());

        List<String[]> rows = new ArrayList<>();
        csvProcessor.process(file, true, (row, num) -> rows.add(row));

        assertEquals(1, rows.size());
        assertEquals("Val1", rows.get(0)[0]);
    }

    /**
     * Verifica que el procesador descarta las filas vacías o compuestas únicamente por espacios en blanco durante la lectura.
     * <p>
     * <b>Precondiciones:</b> Se proporciona un archivo CSV sucio, con filas vacías intercaladas.
     * <b>Ejecución:</b> Se procesa el archivo extrayendo los datos.
     * <b>Asertos:</b> Se asegura que las filas vacías son ignoradas y solo se procesan las que contienen información real.
     */
    @Test
    @DisplayName("🧹 Filas Vacías: Ignora filas con celdas vacías o nulas")
    void process_IgnoresEmptyRows() {
        String content = "H1;H2\n\n   ;   \nData;OK";
        MockMultipartFile file = new MockMultipartFile("dirty.csv", "data.csv", "text/csv", content.getBytes());

        List<String[]> rows = new ArrayList<>();
        csvProcessor.process(file, true, (row, num) -> rows.add(row));

        assertEquals(1, rows.size());
        assertEquals("Data", rows.get(0)[0]);
    }
}
