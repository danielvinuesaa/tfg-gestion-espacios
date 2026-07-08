import React from 'react';
import { TableRow, TableCell, Box, Typography } from '@mui/material';

/**
 * Interfaz que define las propiedades para el componente de estado vacío de la tabla.
 */
interface DataTableEmptyStateProps {
    /** El número total de columnas de la tabla a lo largo del cual debe expandirse el mensaje. */
    colSpan: number;
    /** Elemento visual opcional (como un ícono) para acompañar al mensaje de estado vacío. */
    icon?: React.ReactNode;
    /** El mensaje descriptivo a mostrar cuando no haya datos. Por defecto es "No se han encontrado registros". */
    message?: string;
}

/**
 * Componente funcional que renderiza una fila especial indicando que la tabla se encuentra vacía.
 * Centraliza de manera semántica el estado sin resultados.
 *
 * @param props - Propiedades requeridas y opcionales proporcionadas al componente.
 * @returns Un elemento de fila de tabla de React que representa el estado vacío.
 */
const DataTableEmptyState: React.FC<DataTableEmptyStateProps> = ({
    colSpan,
    icon,
    message = "No se han encontrado registros"
}) => {
    return (
        <TableRow>
            <TableCell colSpan={colSpan} sx={{ py: 8, textAlign: 'center' }}>
                <Box display="flex" flexDirection="column" alignItems="center" gap={1}>
                    {icon}
                    <Typography variant="body1" color="text.secondary">
                        {message}
                    </Typography>
                </Box>
            </TableCell>
        </TableRow>
    );
};

export default DataTableEmptyState;
