import React, { useMemo } from 'react';
import { 
    Typography, IconButton, Tooltip, Box
} from '@mui/material';
import MapIcon from '@mui/icons-material/Map';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import LockIcon from '@mui/icons-material/Lock';
import MeetingRoomIcon from '@mui/icons-material/MeetingRoom';

import DataTable, { type Column } from '../../../../shared/components/DataTable';
import type { Space } from '../../../../shared/types';

// Sub-componentes refactorizados
import SpaceTypeChip from './components/SpaceTypeChip';
import SpaceStatusChip from './components/SpaceStatusChip';
import SpaceActions from './components/SpaceActions';

/**
 * Propiedades para el componente SpaceTable.
 */
interface SpaceTableProps {
    spaces: Space[];
    totalElements: number;
    rowsPerPage: number;
    page: number;
    setPage: (page: number) => void;
    setRowsPerPage: (rows: number) => void;
    sortBy: string;
    direction: 'asc' | 'desc';
    handleSort: (field: string) => void;
    canManage: boolean;
    canEdit: boolean;
    canDelete: boolean;
    handleAction: (action: any, space?: Space) => void;
    // Props para selección masiva
    selectedIds: number[];
    onSelectAll: (ids: number[]) => void;
    onSelectOne: (id: number) => void;
    loading?: boolean;
    error?: string | null;
}

/**
 * Componente que renderiza una tabla de datos interactiva para el catálogo de espacios.
 * Soporta ordenación, paginación, selección múltiple y define columnas dinámicas
 * según los permisos del usuario activo.
 *
 * @param props - Las propiedades que incluyen los datos, controles de paginación y manejadores de acción.
 * @returns Un elemento JSX que representa la tabla de espacios.
 */
const SpaceTable: React.FC<SpaceTableProps> = ({ 
    spaces, totalElements, rowsPerPage, page, setPage, setRowsPerPage, 
    sortBy, direction, handleSort, canManage, canEdit, canDelete, handleAction,
    selectedIds, onSelectAll, onSelectOne, loading, error
}) => {

    const columns = useMemo<Column<Space>[]>(() => {
        const cols: Column<Space>[] = [
            {
                id: 'name',
                label: 'Nombre',
                sortable: true,
                render: (space) => {
                    const isEliminado = space.status === 'ELIMINADO';
                    const isBlocked = space.blockedNow;
                    return (
                        <Box display="flex" alignItems="center" gap={1}>
                            {isBlocked && (
                                <Tooltip title="Espacio en Mantenimiento / Bloqueado actualmente">
                                    <LockIcon fontSize="small" color="error" />
                                </Tooltip>
                            )}
                            <Typography 
                                variant="body2" 
                                fontWeight={isEliminado ? "normal" : "bold"} 
                                color={isEliminado ? "text.disabled" : "text.primary"}
                            >
                                {space.name}
                            </Typography>
                        </Box>
                    );
                }
            },
            {
                id: 'type',
                label: 'Tipo',
                sortable: true,
                render: (space) => <SpaceTypeChip type={space.type} />
            },
            {
                id: 'totalCapacity',
                label: 'Capacidad',
                align: 'center',
                sortable: true,
                render: (space) => (
                    <Tooltip title={`Total: ${space.totalCapacity} | Ordenadores: ${space.computerCount || 0}`}>
                        <Typography variant="body2">{space.totalCapacity}</Typography>
                    </Tooltip>
                )
            },
            {
                id: 'dynamicStatus',
                label: 'Estado Actual',
                align: 'center',
                render: (space) => {
                    let status = 'LIBRE';
                    if (space.status === 'ELIMINADO') status = 'ELIMINADO';
                    else if (space.blockedNow) status = 'BLOQUEADO';
                    else if (space.occupiedNow) status = 'OCUPADO';
                    return <SpaceStatusChip status={status} type="dynamic" />;
                }
            },
            {
                id: 'location',
                label: 'Ubicación',
                align: 'center',
                render: (space) => (
                    <Tooltip title={space.gisId ? "Ver ubicación en GIS Uniovi" : "Sin ubicación GIS asignada"}>
                        <span>
                            <IconButton 
                                size="small" color="secondary" disabled={!space.gisId || space.status === 'ELIMINADO'}
                                onClick={() => space.gisId && window.open(`https://gis.uniovi.es/GISUniovi/MostrarDetalle.do?tipoDetalle=dEstancia&idDetalle=${space.gisId}`, '_blank')}
                            >
                                <MapIcon fontSize="small" />
                            </IconButton>
                        </span>
                    </Tooltip>
                )
            },
            {
                id: 'calendar',
                label: 'Calendario',
                align: 'center',
                render: (space) => (
                    <Tooltip title="Ver ocupación y calendario">
                        <IconButton 
                            size="small" color="info" 
                            disabled={space.status === 'ELIMINADO'}
                            onClick={() => handleAction('calendar', space)}
                        >
                            <CalendarMonthIcon fontSize="small" />
                        </IconButton>
                    </Tooltip>
                )
            }
        ];

        if (canManage) {
            cols.push({
                id: 'actions',
                label: 'Acciones',
                align: 'center',
                render: (space) => (
                    <SpaceActions 
                        space={space} 
                        canEdit={canEdit} 
                        canDelete={canDelete} 
                        handleAction={handleAction} 
                    />
                )
            });
        }

        return cols;
    }, [canManage, canEdit, canDelete, handleAction]);

    return (
        <DataTable
            data={spaces}
            columns={columns}
            uniqueKey="id"
            loading={loading}
            error={error}
            orderBy={sortBy}
            orderDirection={direction}
            onSort={handleSort}
            selectedIds={selectedIds}
            onSelectOne={canDelete ? (id) => onSelectOne(id as number) : undefined}
            onSelectAll={canDelete ? (ids) => onSelectAll(ids as number[]) : undefined}
            page={page}
            rowsPerPage={rowsPerPage}
            totalElements={totalElements}
            onPageChange={setPage}
            onRowsPerPageChange={(rows) => { setRowsPerPage(rows); setPage(0); }}
            isSelectable={(space) => space.status !== 'ELIMINADO'}
            emptyIcon={<MeetingRoomIcon sx={{ fontSize: 60, color: 'action.disabled', mb: 2 }} />}
            emptyMessage="No se han encontrado espacios"
            getRowProps={(space) => ({
                sx: (space.status === 'ELIMINADO') ? {
                    bgcolor: 'rgba(0, 0, 0, 0.05)',
                    '& .MuiTableCell-root': {
                        color: 'text.disabled',
                    },
                    '& .MuiTypography-root': {
                        opacity: 0.7
                    }
                } : {}
            })}
        />
    );
};

export default SpaceTable;
