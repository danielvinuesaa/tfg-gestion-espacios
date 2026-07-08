package com.tfg.backend.modules.identity.service;
import com.tfg.backend.modules.identity.model.User;

import java.io.OutputStream;
import java.io.IOException;
import java.util.List;
import java.util.function.Supplier;

/**
 * Interfaz que define el contrato para la exportación de información de los usuarios
 * a un flujo de salida, típicamente en formato de archivo exportable.
 */
public interface UserExportService {
    void export(OutputStream outputStream, Supplier<Iterable<User>> userSupplier, List<String> columns) throws IOException;
}
