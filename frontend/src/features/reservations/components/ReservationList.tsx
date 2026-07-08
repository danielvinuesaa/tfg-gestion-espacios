import { useState, useCallback } from 'react';
import type { Reservation } from '../../../shared/types';
import { useAuth } from '../../../context/AuthContext';
import { useSnackbar } from '../../../context/SnackbarContext';
import { useApi } from '../../../shared/utils/api';
import { useSettings } from '../../../context/SettingsContext';
import { useReservations } from '../hooks/useReservations';
import { useBulkActions } from '../../../shared/hooks/useBulkActions';
import { useModalStack } from '../../../shared/hooks/useModalStack';
import { isFuture as isFutureUtil } from '../../../shared/utils/dateUtils';

import ReservationForm from './reservation-form/ReservationForm';
import BlockForm from './BlockForm';
import DeleteReservationDialog from './DeleteReservationDialog';
import RejectReservationDialog from './RejectReservationDialog';
import CalendarDetailsDialog from './CalendarDetailsDialog';
import ImportReservationsDialog from './ImportReservationsDialog';
import ExportReservationsDialog from './ExportReservationsDialog';
import BulkDeleteResourceDialog from '../../../shared/components/BulkDeleteResourceDialog';
import BulkActionBar from '../../../shared/components/BulkActionBar';

// Subcomponentes Refactorizados
import ReservationHeader from './list/ReservationHeader';
import ReservationFilters from './list/ReservationFilters';
import ReservationTable from './list/ReservationTable';
import PageLoader from '../../../shared/components/PageLoader';

// Material UI
import { Container, Alert, Paper, Typography, Button } from '@mui/material';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';

/**
 * Vista profesional de gestión de Reservas estandarizada.
 * Permite visualizar, buscar, filtrar y administrar las reservas del sistema,
 * soportando tanto acciones individuales como operaciones masivas.
 * 
 * @returns Componente JSX que representa el listado principal de reservas.
 */
const ReservationList = () => {
    const { request } = useApi();
    const { user, hasPermission, managesSubject } = useAuth();
    const { showSnackbar } = useSnackbar();
    const { timeSettings } = useSettings();
    const { startHour, minuteStep } = timeSettings;

    const {
        reservations, allSpaces, allUsers, allSubjects,
        loading, error, pagination, filters,
        setPage, setSize, setSort, setFilters,
        clearFilters, updateStatus, refresh
    } = useReservations();

    // Centralización de Diálogos
    const modals = useModalStack({
        form: null as Reservation | null,
        blockEdit: null as Reservation | null,
        delete: null as Reservation | null,
        reject: null as Reservation | null,
        details: null as Reservation | null,
        import: false,
        export: false
    });

    const [advancedOpen, setAdvancedOpen] = useState(false);

    // -- TODOS LOS HOOKS ARRIBA --
    const getFiltersParams = useCallback(() => {
        const params = new URLSearchParams();
        if (filters.status) params.append('status', filters.status);
        if (filters.type) params.append('type', filters.type);
        if (filters.userId) params.append('userId', filters.userId.toString());
        if (filters.search) params.append('search', filters.search);
        if (filters.startDate) params.append('startDate', filters.startDate);
        if (filters.endDate) params.append('endDate', filters.endDate);
        if (Array.isArray(filters.spaceId)) filters.spaceId.forEach((id: any) => params.append('spaceId', id.toString()));
        if (Array.isArray(filters.subjectId)) filters.subjectId.forEach((id: any) => params.append('subjectId', id.toString()));
        params.append('includeCancelled', filters.includeCancelled.toString());
        params.append('scope', 'managed');
        return params;
    }, [filters]);

    const {
        selectedIds, isGlobalSelection, bulkConflictSummary, loadingBulk,
        isBulkDeleteDialogOpen, toggleBulkDeleteModal, handleBulkDelete,
        handleSelectAll: originalHandleSelectAll, handleSelectOne, clearSelection, setIsGlobalSelection
    } = useBulkActions({
        resourceNamePlural: 'reservas', endpoint: '/api/reservations', onSuccess: refresh, getFilters: getFiltersParams
    });

    const handleSelectAll = useCallback((ids: number[]) => ids.length === 0 ? clearSelection() : originalHandleSelectAll(ids), [clearSelection, originalHandleSelectAll]);

    const handleAction = useCallback(async (action: 'add' | 'edit' | 'delete' | 'view' | 'approve' | 'reject' | 'restore', res?: Reservation) => {
        switch (action) {
            case 'add': modals.open('form'); break;
            case 'edit': 
                if (res) {
                    if (res.status === 'BLOQUEO') {
                        modals.open('blockEdit', res);
                    } else {
                        modals.open('form', res);
                    }
                }
                break;
            case 'view': if (res) modals.open('details', res); break;
            case 'delete': if (res) modals.open('delete', res); break;
            case 'approve': if (res) await updateStatus(res.id, 'APROBADA'); break;
            case 'reject': if (res) modals.open('reject', res); break;
        }
    }, [updateStatus, modals]);

    const handleFormSuccess = useCallback((message: string) => { 
        showSnackbar(message); 
    }, [showSnackbar]);

    const handleExport = useCallback(async (columns: string[]) => {
        try {
            const params = getFiltersParams();
            if (pagination.sortBy) params.append('sort', `${pagination.sortBy},${pagination.direction}`);
            columns.forEach(col => params.append('columns', col));
            const blob = await request(`/api/reservations/export?${params.toString()}`);
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `reservas_filtradas_${new Date().toISOString().split('T')[0]}.csv`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            showSnackbar('Exportación completada');
        } catch (error) {}
    }, [getFiltersParams, pagination.sortBy, pagination.direction, request, showSnackbar]);

    const hasActiveFilters = Boolean(
        filters.status || 
        filters.type || 
        (filters.spaceId && filters.spaceId.length > 0) || 
        (filters.subjectId && filters.subjectId.length > 0) ||
        (filters.userId && filters.userId.length > 0) || 
        filters.startDate || 
        filters.endDate || 
        filters.search
    );

    // -- AHORA SÍ: Early Return después de todos los hooks --
    if (loading && reservations.length === 0 && !hasActiveFilters) {
        return <PageLoader message="Cargando agenda de reservas..." />;
    }

    const canApproveAll = hasPermission('APROBAR_RESERVA');
    const isManagerMode = canApproveAll || hasPermission('APROBAR_ASIGNATURAS_GESTIONADAS') || hasPermission('CANCELAR_RESERVA');
    const pageTitle = isManagerMode ? "Gestión de Reservas" : "Mis Reservas";

    const selectedRes = modals.getData('form') || modals.getData('delete') || modals.getData('reject') || modals.getData('details');

    return (
        <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
            <ReservationHeader 
                title={pageTitle} 
                canRequest={hasPermission('SOLICITAR_RESERVA')} 
                isEmpty={pagination.totalElements === 0}
                canImport={hasPermission('IMPORTAR_RESERVAS')} 
                canExport={hasPermission('EXPORTAR_RESERVAS')} 
                onAddClick={() => handleAction('add')} 
                onImportClick={() => modals.open('import')} 
                onExportClick={() => modals.open('export')} 
            />
            
            <ReservationFilters 
                filters={filters} 
                onFilterChange={setFilters} 
                onClearFilters={clearFilters} 
                allSpaces={allSpaces} 
                allUsers={allUsers} 
                allSubjects={allSubjects} 
                isManagerMode={isManagerMode} 
                advancedOpen={advancedOpen} 
                setAdvancedOpen={setAdvancedOpen} 
                minuteStep={minuteStep} 
                startHour={startHour} 
                setPage={setPage} 
            />
            
            <BulkActionBar 
                selectedCount={selectedIds.length} 
                resourceNamePlural="reservas" 
                resourceNameSingular="reserva" 
                isFeminine={true} 
                onClearSelection={clearSelection} 
                onDelete={() => toggleBulkDeleteModal(true)} 
                deleteLabel="Cancelar Lote" 
                isGlobalSelection={isGlobalSelection} 
                isPageFull={reservations.length > 0 && reservations.every(r => selectedIds.includes(r.id))} 
                totalElements={pagination.totalElements} 
                onSelectAllGlobal={() => setIsGlobalSelection(true)} 
                canDelete={hasPermission('CANCELAR_RESERVA')} 
            />
            
            {error && !loading && <Alert severity="error" variant="filled" sx={{ mb: 2, borderRadius: 2 }}>{error}</Alert>}
            
            {loading ? <PageLoader /> : reservations.length === 0 ? (
                <Paper elevation={0} sx={{ p: 8, textAlign: 'center', border: '1px dashed', borderColor: 'divider', borderRadius: 4, bgcolor: '#fcfcfc' }}>
                    <CalendarTodayIcon sx={{ fontSize: 60, color: 'action.disabled', mb: 2 }} />
                    <Typography variant="h6" color="text.secondary" gutterBottom>
                        {hasActiveFilters ? 'No hay reservas que coincidan con los filtros' : 'No hay reservas registradas'}
                    </Typography>
                    {hasActiveFilters && <Button variant="text" onClick={clearFilters}>Limpiar filtros</Button>}
                </Paper>
            ) : (
                <ReservationTable 
                    reservations={reservations} 
                    loading={loading} 
                    totalElements={pagination.totalElements} 
                    page={pagination.page} 
                    rowsPerPage={pagination.size} 
                    sortBy={pagination.sortBy} 
                    direction={pagination.direction} 
                    onPageChange={setPage} 
                    onRowsPerPageChange={setSize} 
                    onSort={setSort} 
                    handleAction={handleAction} 
                    canApprove={(res) => {
                        const isFuture = isFutureUtil(res.startTime);
                        if (!isFuture) return false;
                        return canApproveAll || (hasPermission('APROBAR_ASIGNATURAS_GESTIONADAS') && res.subject && managesSubject(res.subject.id));
                    }} 
                    canEdit={(res) => {
                        const isTerminal = res.status === 'CANCELADA' || res.status === 'RECHAZADA';
                        const isFuture = isFutureUtil(res.startTime); // No se edita si ya empezó
                        if (!isFuture || isTerminal) return false;

                        const isOwner = user?.id === res.user.id;
                        const isApprover = hasPermission('APROBAR_RESERVA') || (hasPermission('APROBAR_ASIGNATURAS_GESTIONADAS') && res.subject && managesSubject(res.subject.id));
                        return isOwner || isApprover || user?.role === 'ADMIN';
                    }} 
                    canDelete={(res) => {
                        const isFuture = isFutureUtil(res.startTime); // No se cancela si ya empezó
                        if (!isFuture) return false;
                        
                        const isOwner = user?.id === res.user.id;
                        if (isOwner) return true;
                        
                        // Gestores no pueden cancelar si está pendiente (deben RECHAZAR)
                        if (res.status === 'SOLICITADA') return false;
                        
                        const hasGlobalCancel = hasPermission('CANCELAR_RESERVA') || user?.role === 'ADMIN';
                        const hasSubjectCancel = hasPermission('APROBAR_ASIGNATURAS_GESTIONADAS') && res.subject && managesSubject(res.subject.id);
                        
                        return hasGlobalCancel || hasSubjectCancel;
                    }} 
                    canDeleteAny={hasPermission('CANCELAR_RESERVA')} 
                    hasActiveFilters={hasActiveFilters} 
                    selectedIds={selectedIds} 
                    onSelectAll={handleSelectAll} 
                    onSelectOne={handleSelectOne} 
                />
            )}

            <ReservationForm 
                open={modals.isOpen('form')} 
                handleClose={() => modals.close('form')} 
                onSuccess={handleFormSuccess} 
                initialData={modals.getData('form')} 
            />

            <BlockForm
                open={modals.isOpen('blockEdit')}
                handleClose={() => modals.close('blockEdit')}
                onSuccess={handleFormSuccess}
                space={null}
                initialData={modals.getData('blockEdit')}
            />
            
            <DeleteReservationDialog 
                open={modals.isOpen('delete')} 
                reservation={modals.getData('delete')} 
                handleClose={() => modals.close('delete')} 
                onSuccess={handleFormSuccess} 
            />
            
            <RejectReservationDialog 
                open={modals.isOpen('reject')} 
                reservation={modals.getData('reject')} 
                handleClose={() => modals.close('reject')} 
                onSuccess={handleFormSuccess} 
            />
            
            <ImportReservationsDialog 
                open={modals.isOpen('import')} 
                handleClose={() => modals.close('import')} 
                onSuccess={handleFormSuccess} 
            />
            
            <ExportReservationsDialog 
                open={modals.isOpen('export')} 
                onClose={() => modals.close('export')} 
                onExport={handleExport} 
            />
            
            <BulkDeleteResourceDialog 
                open={isBulkDeleteDialogOpen} 
                loading={loadingBulk} 
                summary={bulkConflictSummary} 
                config={{ 
                    title: "¿Cancelar Lote de Reservas?", 
                    resourceNameSingular: "reserva", 
                    resourceNamePlural: "reservas", 
                    impactTypeLabel: "reservas afectadas",
                    confirmTextWithConflicts: "Sí, cancelar lote", 
                    isFeminine: true,
                    actionVerb: "cancelar",
                    actionNoun: "Cancelación"
                }} 
                onClose={() => toggleBulkDeleteModal(false)} 
                onConfirm={() => handleBulkDelete(true)} 
            />
            
            <CalendarDetailsDialog 
                open={modals.isOpen('details')} 
                onClose={() => modals.close('details')} 
                reservation={modals.getData('details')} 
                canEdit={modals.getData('details') ? (
                    (() => {
                        const res = modals.getData('details')!;
                        const isTerminal = ['CANCELADA', 'RECHAZADA'].includes(res.status);
                        const isFuture = isFutureUtil(res.startTime);
                        if (!isFuture || isTerminal) return false;

                        const isOwner = user?.id === res.user.id;
                        const isApprover = hasPermission('APROBAR_RESERVA') || (hasPermission('APROBAR_ASIGNATURAS_GESTIONADAS') && res.subject && managesSubject(res.subject.id));
                        return isOwner || isApprover || user?.role === 'ADMIN';
                    })()
                ) : false}
                canDelete={modals.getData('details') ? (
                    (() => {
                        const res = modals.getData('details')!;
                        const isFuture = isFutureUtil(res.startTime);
                        if (!isFuture) return false;
                        
                        const isOwner = user?.id === res.user.id;
                        if (isOwner) return true;
                        
                        if (res.status === 'SOLICITADA') return false;
                        
                        const hasGlobalCancel = hasPermission('CANCELAR_RESERVA') || user?.role === 'ADMIN';
                        const hasSubjectCancel = hasPermission('APROBAR_ASIGNATURAS_GESTIONADAS') && res.subject && managesSubject(res.subject!.id);
                        
                        return hasGlobalCancel || hasSubjectCancel;
                    })()
                ) : false}
                canApproveReject={modals.getData('details') ? (
                    (() => {
                        const res = modals.getData('details')!;
                        const isFuture = isFutureUtil(res.startTime);
                        if (!isFuture || res.status !== 'SOLICITADA') return false;
                        
                        return canApproveAll || (hasPermission('APROBAR_ASIGNATURAS_GESTIONADAS') && res.subject && managesSubject(res.subject.id));
                    })()
                ) : false} 
                onEdit={(id) => { const res = modals.getData('details'); modals.close('details'); handleAction('edit', res!); }} 
                onDelete={(id) => { const res = modals.getData('details'); modals.close('details'); handleAction('delete', res!); }} 
                onApprove={(res) => { modals.close('details'); handleAction('approve', res); }} 
                onReject={(id) => { const res = modals.getData('details'); modals.close('details'); handleAction('reject', res!); }} 
            />
        </Container>
    );
};

export default ReservationList;
