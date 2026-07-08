import React from 'react';
import {
    Table,
    TableBody,
    TableContainer,
    TablePagination,
    Paper,
    Box,
    CircularProgress,
    Alert
} from '@mui/material';
import type { Column, DataTableSortConfig, DataTableSelectionConfig, DataTablePaginationConfig, DataTableRowConfig } from './types';
import DataTableHead from './DataTableHead';
import DataTableRow from './DataTableRow';
import DataTableEmptyState from './DataTableEmptyState';

/**
 * Interfaz que consolida todas las configuraciones necesarias para renderizar la tabla principal.
 * 
 * @typeParam T - El tipo de la entidad de datos representada en la tabla.
 */
interface DataTableProps<T> extends DataTableSortConfig, DataTableSelectionConfig<T>, DataTablePaginationConfig, DataTableRowConfig<T> {
    /** La colección de datos a renderizar en el cuerpo de la tabla. */
    data: T[];
    /** La definición estructural y de renderizado de las columnas. */
    columns: Column<T>[];
    /** La propiedad clave empleada para identificar de forma única a cada fila de datos (por ejemplo, 'id'). */
    uniqueKey: keyof T;
    
    /** Indicador booleano que señala si se está realizando una operación asíncrona de carga. */
    loading?: boolean;
    /** Mensaje de error a visualizar en caso de que ocurra una interrupción o fallo. */
    error?: string | null;
    
    /** Elemento gráfico opcional a mostrar si el conjunto de datos está vacío. */
    emptyIcon?: React.ReactNode;
    /** Texto descriptivo a presentar en ausencia de datos. */
    emptyMessage?: string;
}

/**
 * Componente orquestador de tabla de datos de propósito general.
 * Proporciona una interfaz unificada para la visualización, paginación, selección y ordenación
 * de colecciones de datos, manteniendo una estructura modular y profesional.
 * 
 * @typeParam T - El tipo de la entidad de datos.
 * @param props - El conjunto de propiedades de configuración y datos a presentar.
 * @returns La estructura completa y renderizada de la tabla, incluyendo sus controles auxiliares.
 */
function DataTable<T>({
    data,
    columns,
    uniqueKey,
    loading = false,
    error = null,
    orderBy,
    orderDirection = 'asc',
    onSort,
    selectedIds = [],
    onSelectOne,
    onSelectAll,
    isSelectable = () => true,
    page = 0,
    rowsPerPage = 10,
    totalElements = 0,
    onPageChange,
    onRowsPerPageChange,
    emptyIcon,
    emptyMessage,
    onRowClick,
    getRowProps
}: DataTableProps<T>) {

    if (error) {
        return <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>{error}</Alert>;
    }

    return (
        <Paper elevation={0} variant="outlined" sx={{ borderRadius: 2, overflow: 'hidden', border: '1px solid #eee' }}>
            <TableContainer sx={{ minHeight: loading ? '300px' : 'auto', position: 'relative' }}>
                {loading && (
                    <Box sx={{
                        position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        bgcolor: 'rgba(255, 255, 255, 0.7)', zIndex: 2
                    }}>
                        <CircularProgress size={40} thickness={4} />
                    </Box>
                )}

                <Table sx={{ minWidth: 650 }} size="medium" stickyHeader>
                    <DataTableHead 
                        columns={columns}
                        orderBy={orderBy}
                        orderDirection={orderDirection}
                        onSort={onSort}
                        selectedIds={selectedIds}
                        onSelectAll={onSelectAll}
                        isSelectable={isSelectable}
                        data={data}
                        uniqueKey={uniqueKey}
                    />
                    <TableBody>
                        {!loading && data.length === 0 ? (
                            <DataTableEmptyState 
                                colSpan={columns.length + (onSelectAll ? 1 : 0)}
                                icon={emptyIcon}
                                message={emptyMessage}
                            />
                        ) : (
                            data.map((item) => (
                                <DataTableRow 
                                    key={item[uniqueKey] as unknown as string}
                                    item={item}
                                    columns={columns}
                                    uniqueKey={uniqueKey}
                                    selectedIds={selectedIds}
                                    onSelectOne={onSelectOne}
                                    isSelectable={isSelectable}
                                    onRowClick={onRowClick}
                                    getRowProps={getRowProps}
                                />
                            ))
                        )}
                    </TableBody>
                </Table>
            </TableContainer>

            {onPageChange && (
                <TablePagination
                    rowsPerPageOptions={[5, 10, 25, 50]}
                    component="div"
                    count={totalElements}
                    rowsPerPage={rowsPerPage}
                    page={page}
                    onPageChange={(_, newPage) => onPageChange(newPage)}
                    onRowsPerPageChange={(e) => onRowsPerPageChange?.(parseInt(e.target.value, 10))}
                    labelRowsPerPage="Filas por página:"
                    labelDisplayedRows={({ from, to, count }) => `${from}-${to} de ${count !== -1 ? count : `más de ${to}`}`}
                    sx={{ 
                        borderTop: '1px solid #eee',
                        bgcolor: '#fafafa',
                        '.MuiTablePagination-selectLabel, .MuiTablePagination-displayedRows': {
                            fontWeight: 600,
                            color: 'text.secondary',
                            fontSize: '0.85rem'
                        },
                        '.MuiTablePagination-actions': {
                            ml: 2
                        }
                    }}
                    showFirstButton
                    showLastButton
                    getItemAriaLabel={(type) => {
                        switch (type) {
                            case 'first': return 'Primera página';
                            case 'previous': return 'Página anterior';
                            case 'next': return 'Siguiente página';
                            case 'last': return 'Última página';
                            default: return '';
                        }
                    }}
                />
            )}
        </Paper>
    );
}

export default DataTable;
