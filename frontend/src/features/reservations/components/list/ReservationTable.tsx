import React, { useMemo } from 'react';
import { Typography, Box } from '@mui/material';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';

import DataTable, { type Column } from '../../../../shared/components/DataTable';
import type { Reservation } from '../../../../shared/types';
import { formatDisplayDate, isFuture as isFutureUtil } from '../../../../shared/utils/dateUtils';

// Sub-componentes refactorizados
import ReservationStatusChip from '../../../../shared/components/Chips/ReservationStatusChip';
import ReservationTypeChip from '../../../../shared/components/Chips/ReservationTypeChip';
import ReservationSpacesCell from './components/ReservationSpacesCell';
import ReservationActions from './components/ReservationActions';

/**
 * Propiedades del componente ReservationTable.
 */
interface ReservationTableProps {
    reservations: Reservation[];
    loading: boolean;
    error?: string | null;
    totalElements: number;
    page: number;
    rowsPerPage: number;
    sortBy: string;
    direction: 'asc' | 'desc';
    onPageChange: (newPage: number) => void;
    onRowsPerPageChange: (newRows: number) => void;
    onSort: (field: string) => void;
    handleAction: (action: any, res: Reservation) => void;
    canApprove: (res: Reservation) => boolean;
    canEdit: (res: Reservation) => boolean;
    canDelete: (res: Reservation) => boolean;
    canDeleteAny?: boolean;
    hasActiveFilters: boolean;
    // Selección masiva
    selectedIds: number[];
    onSelectAll: (ids: number[]) => void;
    onSelectOne: (id: number) => void;
}

/**
 * Componente principal responsable de la representación tabular del listado de reservas.
 * 
 * Actúa como orquestador delegando el renderizado complejo a subcomponentes especializados 
 * (`ReservationSpacesCell`, `ReservationActions`, etc.). Configura las columnas, la gestión del 
 * ordenamiento, la paginación de datos y la capacidad de selección múltiple sobre los registros
 * usando el componente genérico `DataTable`.
 * 
 * @param props - Parámetros de configuración y estado para orquestar la tabla.
 * @param props.reservations - Colección de reservas a representar en la página actual.
 * @param props.loading - Indicador del estado de carga asíncrona de datos.
 * @param props.error - Mensaje de error a visualizar en caso de fallo durante la obtención de datos.
 * @param props.totalElements - Número total de registros coincidentes en el servidor.
 * @param props.page - Índice de la página actualmente visualizada (0-indexado).
 * @param props.rowsPerPage - Tamaño de la página o cantidad de registros mostrados.
 * @param props.sortBy - Identificador de la columna por la cual se encuentra ordenado el listado.
 * @param props.direction - Dirección actual del ordenamiento ('asc' o 'desc').
 * @param props.onPageChange - Callback para gestionar el evento de cambio de página.
 * @param props.onRowsPerPageChange - Callback para gestionar la alteración del tamaño de página.
 * @param props.onSort - Callback para procesar la petición de ordenamiento por una nueva columna.
 * @param props.handleAction - Controlador central de acciones específicas sobre filas individuales.
 * @param props.canApprove - Función de validación de permisos de aprobación administrativa.
 * @param props.canEdit - Función de validación de permisos de edición sobre cada fila.
 * @param props.canDelete - Función de validación de permisos de borrado o cancelación sobre cada fila.
 * @param props.canDeleteAny - Flag general para habilitar los controles de selección masiva en la tabla.
 * @param props.hasActiveFilters - Indicador utilizado para alternar el mensaje de estado cuando no hay resultados.
 * @param props.selectedIds - Lista con los identificadores de las reservas actualmente seleccionadas.
 * @param props.onSelectAll - Callback invocado al alternar la selección global de los elementos visibles.
 * @param props.onSelectOne - Callback invocado al alternar la selección de un elemento específico.
 * @returns Elemento React con el componente `DataTable` configurado.
 */
const ReservationTable: React.FC<ReservationTableProps> = ({
    reservations, loading, error, totalElements, page, rowsPerPage,
    sortBy, direction, onPageChange, onRowsPerPageChange, onSort,
    handleAction, canApprove, canEdit, canDelete, canDeleteAny = true, hasActiveFilters,
    selectedIds, onSelectAll, onSelectOne
}) => {

    const columns = useMemo<Column<Reservation>[]>(() => [
        {
            id: 'startTime',
            label: 'Horario',
            sortable: true,
            render: (res) => (
                <Box>
                    <Typography variant="body2" fontWeight="bold">
                        {formatDisplayDate(res.startTime, 'dd MMM yyyy')}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                        {formatDisplayDate(res.startTime, 'HH:mm')} - {formatDisplayDate(res.endTime, 'HH:mm')}
                    </Typography>
                </Box>
            )
        },
        {
            id: 'spaces.name',
            label: 'Espacios',
            sortable: true,
            width: 140,
            render: (res) => <ReservationSpacesCell spaces={res.spaces || []} />
        },
        {
            id: 'title',
            label: 'Título de la Reserva',
            sortable: true,
            render: (res) => (
                <Box>
                    <Typography variant="body2" fontWeight="800" color="text.primary">
                        {res.title || "Sin título"}
                    </Typography>
                    <Typography variant="caption" color="text.disabled" display="block">
                        {res.subject && (res.type === 'CLASE' || res.type === 'EXAMEN') 
                            ? res.subject.code 
                            : (res.status === 'BLOQUEO' ? "Bloqueo de espacio" : "Reserva general")}
                    </Typography>
                </Box>
            )
        },
        {
            id: 'responsibleName',
            label: 'Responsable',
            sortable: true,
            render: (res) => {
                const targetUser = res.responsible || res.user;
                const isDeleted = targetUser?.status === 'ELIMINADO';
                const displayName = res.responsible?.name || res.responsibleName || res.user.name;
                const displayEmail = res.responsible?.email || res.user.email;

                return (
                    <Box display="flex" alignItems="center" gap={1}>
                        <Box>
                            <Typography variant="body2" fontWeight="medium" sx={{ 
                                textDecoration: isDeleted ? 'line-through' : 'none', 
                                color: isDeleted ? 'text.disabled' : 'inherit' 
                            }}>
                                {displayName} {isDeleted && '(Eliminado)'}
                            </Typography>
                            <Typography variant="caption" sx={{ 
                                display: 'block', 
                                textDecoration: isDeleted ? 'line-through' : 'none', 
                                color: isDeleted ? 'text.disabled' : 'text.secondary' 
                            }}>
                                {displayEmail}
                            </Typography>
                        </Box>
                    </Box>
                );
            }
        },
        {
            id: 'type',
            label: 'Tipo',
            sortable: true,
            align: 'center',
            render: (res) => <ReservationTypeChip type={res.type} />
        },
        {
            id: 'status',
            label: 'Estado',
            sortable: true,
            align: 'center',
            render: (res) => <ReservationStatusChip status={res.status} />
        },
        {
            id: 'actions',
            label: 'Acciones',
            align: 'center',
            render: (res) => (
                <ReservationActions 
                    reservation={res}
                    handleAction={handleAction}
                    canApprove={canApprove}
                    canEdit={canEdit}
                    canDelete={canDelete}
                />
            )
        }
    ], [handleAction, canApprove, canEdit, canDelete]);

    return (
        <DataTable
            data={reservations}
            columns={columns}
            uniqueKey="id"
            loading={loading}
            error={error}
            orderBy={sortBy}
            orderDirection={direction}
            onSort={onSort}
            selectedIds={selectedIds}
            onSelectOne={canDeleteAny ? (id) => onSelectOne(id as number) : undefined}
            onSelectAll={canDeleteAny ? (ids) => onSelectAll(ids as number[]) : undefined}
            onRowClick={(res) => handleAction('view', res)}
            page={page}
            rowsPerPage={rowsPerPage}
            totalElements={totalElements}
            onPageChange={onPageChange}
            onRowsPerPageChange={onRowsPerPageChange}
            isSelectable={(res) => res.status !== 'CANCELADA' && res.status !== 'RECHAZADA' && isFutureUtil(res.startTime)}
            emptyIcon={<CalendarTodayIcon sx={{ fontSize: 60, color: 'action.disabled', mb: 2 }} />}
            emptyMessage={hasActiveFilters ? 'No hay reservas que coincidan con los filtros aplicados' : 'No hay reservas registradas en el sistema'}
            getRowProps={(res) => ({
                sx: (res.status === 'CANCELADA' || res.status === 'RECHAZADA' || res.status === 'BLOQUEO') ? {
                    bgcolor: 'rgba(0, 0, 0, 0.05)',
                    '& .MuiTableCell-root': {
                        color: (res.status === 'CANCELADA' || res.status === 'RECHAZADA') ? 'text.disabled' : 'inherit',
                    },
                    ...((res.status === 'CANCELADA' || res.status === 'RECHAZADA') && {
                        '& .MuiTypography-root': {
                            opacity: 0.7
                        }
                    })
                } : {}
            })}
        />
    );
};

export default ReservationTable;
