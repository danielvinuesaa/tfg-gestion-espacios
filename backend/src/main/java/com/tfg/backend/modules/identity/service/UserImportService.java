package com.tfg.backend.modules.identity.service;
import com.tfg.backend.modules.identity.dto.UserImportResultDTO;

import org.springframework.web.multipart.MultipartFile;

/**
 * Interfaz que define los métodos para la importación y validación de usuarios
 * a partir de archivos en formato CSV u otros medios externos.
 */
public interface UserImportService {
    UserImportResultDTO validateCsv(MultipartFile file);
    UserImportResultDTO importFromCsv(MultipartFile file, boolean overwrite);
    byte[] exportToCsv();
}
