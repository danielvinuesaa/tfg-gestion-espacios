import { useCallback } from 'react';
import type { Space } from '../../../shared/types';
import SpaceForm from './SpaceForm';
import BlockForm from '../../reservations/components/BlockForm';
import ImportSpacesDialog from './ImportSpacesDialog';
import ExportSpacesDialog from './ExportSpacesDialog';
import DeleteSpaceDialog from './DeleteSpaceDialog';
import BulkDeleteResourceDialog, { type BulkDeleteConfig } from '../../../shared/components/BulkDeleteResourceDialog';
import BulkActionBar from '../../../shared/components/BulkActionBar';
import { useAuth } from '../../../context/AuthContext';
import { useSnackbar } from '../../../context/SnackbarContext';
import { useSpaces } from '../hooks/useSpaces';
import { useBulkActions } from '../../../shared/hooks/useBulkActions';
import { useModalStack } from '../../../shared/hooks/useModalStack';
import { useNavigate } from 'react-router-dom';
import { useApi } from '../../../shared/utils/api';
import { Container, Paper, Alert, Typography, Button, LinearProgress } from '@mui/material';
import { formatApiDate } from '../../../shared/utils/dateUtils';
import BusinessIcon from '@mui/icons-material/Business';

// Sub-componentes descompuestos
import SpaceHeader from './list/SpaceHeader';
import SpaceFilters from './list/SpaceFilters';
import SpaceTable from './list/SpaceTable';
import PageLoader from '../../../shared/components/PageLoader';

/**
 * Componente principal para la vista del módulo de Espacios.
 * 
 * Gestiona de forma centralizada la presentación, el filtrado, la paginación y las operaciones CRUD 
 * sobre el inventario de espacios, integrando hooks personalizados para la comunicación con la API.
 *
 * @returns Un elemento JSX que representa la lista interactiva de espacios.
 */
const SpaceList = () => {
    const { request } = useApi();
    const navigate = useNavigate();
    const { hasPermission } = useAuth();
    const { showSnackbar } = useSnackbar();

    const canCreate = hasPermission('CREAR_ESPACIOS');
    const canExport = hasPermission('LEER_ESPACIOS');
    const canEdit = hasPermission('EDITAR_ESPACIOS');
    const canDelete = hasPermission('ELIMINAR_ESPACIOS');
    const canManage = canEdit || canDelete;

    const {
        spaces, loading, isFetching, error, pagination, filters,
        includeDeleted, setIncludeDeleted,
        setPage, setSize, setSort, setFilters,
        clearFilters, restoreSpace
    } = useSpaces();

    const modals = useModalStack({
        form: null as Space | null,
        block: null as Space | null,
        import: false,
        export: false,
        delete: null as Space | null
    });

    const getFiltersParams = useCallback(() => {
        const params = new URLSearchParams();
        if (filters.name) params.append('name', filters.name);
        if (filters.type) params.append('type', filters.type);
        if (filters.status) params.append('status', filters.status);
        if (filters.minCapacity) params.append('minCapacity', filters.minCapacity.toString());
        if (filters.minComputers) params.append('minComputers', filters.minComputers.toString());
        params.append('includeDeleted', includeDeleted.toString());
        return params;
    }, [filters, includeDeleted]);

    const {
        selectedIds, isGlobalSelection, bulkConflictSummary, loadingBulk,
        isBulkDeleteDialogOpen, toggleBulkDeleteModal, handleBulkDelete,
        handleSelectAll, handleSelectOne, clearSelection, setIsGlobalSelection
    } = useBulkActions({
        resourceNamePlural: 'espacios',
        endpoint: '/api/spaces',
        onSuccess: (msg) => showSnackbar(msg),
        getFilters: getFiltersParams
    });

    const handleAction = useCallback(async (action: 'add' | 'edit' | 'block' | 'delete' | 'calendar' | 'restore', space?: Space) => {
        switch (action) {
            case 'add': modals.open('form'); break;
            case 'edit': if (space) modals.open('form', space); break;
            case 'block': if (space) modals.open('block', space); break;
            case 'calendar': if (space) navigate(`/calendar?spaceId=${space.id}`); break;
            case 'delete': if (space) modals.open('delete', space); break;
            case 'restore': 
                if (space) { 
                    try { 
                        await restoreSpace(space.id); 
                        showSnackbar(`Espacio "${space.name}" restaurado con éxito`); 
                    } catch (err) {} 
                } 
                break;
        }
    }, [navigate, restoreSpace, showSnackbar, modals]);

    const handleExport = useCallback(async (columns: string[]) => {
        try {
            const params = getFiltersParams();
            if (pagination.sortBy) params.append('sort', `${pagination.sortBy},${pagination.direction}`);
            columns.forEach(col => params.append('columns', col));
            const blob = await request(`/api/spaces/export?${params.toString()}`);
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `espacios_filtrados_${formatApiDate(new Date()).split('T')[0]}.csv`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            showSnackbar('Exportado correctamente');
        } catch (error) {}
    }, [getFiltersParams, pagination.sortBy, pagination.direction, request, showSnackbar]);

    const hasActiveFilters = !!(filters.name || filters.type || filters.status || filters.minCapacity || filters.minComputers);

    if (loading && spaces.length === 0 && !hasActiveFilters) {
        return <PageLoader message="Sincronizando inventario de espacios..." />;
    }

    const bulkDeleteSpaceConfig: BulkDeleteConfig = {
        title: "¿Eliminar Lote de Espacios?",
        resourceNameSingular: "espacio",
        resourceNamePlural: "espacios",
        impactTypeLabel: bulkConflictSummary?.totalImpactedItems === 1 ? "reserva activa" : "reservas activas",
        confirmTextWithConflicts: "Borrar y Cancelar Reservas"
    };

    const isPageFull = spaces.length > 0 && spaces.every(s => selectedIds.includes(s.id));

    return (
        <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
            {isFetching && !loading && <LinearProgress sx={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 9999, height: 3 }} />}

            <SpaceHeader 
                canCreate={canCreate} 
                canExport={canExport}
                isEmpty={pagination.totalElements === 0}
                handleExport={() => modals.open('export')} 
                onImportClick={() => modals.open('import')} 
                onAddClick={() => handleAction('add')} 
            />
            
            <SpaceFilters 
                searchName={filters.name || ''} 
                setSearchName={(val) => setFilters({ name: val })} 
                filters={filters} 
                includeDeleted={includeDeleted} 
                setIncludeDeleted={setIncludeDeleted} 
                handleFilterChange={(name, val) => setFilters({ [name]: val })} 
                clearFilters={clearFilters} 
                setPage={setPage} 
            />
            
            <BulkActionBar 
                selectedCount={selectedIds.length} 
                resourceNamePlural="espacios" 
                resourceNameSingular="espacio" 
                onClearSelection={clearSelection} 
                onDelete={() => toggleBulkDeleteModal(true)} 
                isGlobalSelection={isGlobalSelection} 
                isPageFull={isPageFull} 
                totalElements={pagination.totalElements} 
                onSelectAllGlobal={() => setIsGlobalSelection(true)} 
                canDelete={canDelete} 
            />
            
            {error && <Alert severity="error" variant="filled" sx={{ mb: 2, borderRadius: 2 }}>{error}</Alert>}
            
            {loading && spaces.length === 0 ? <PageLoader /> : spaces.length === 0 ? (
                <Paper elevation={0} sx={{ p: 8, textAlign: 'center', border: '1px dashed', borderColor: 'divider', borderRadius: 4, bgcolor: '#fcfcfc' }}>
                    <BusinessIcon sx={{ fontSize: 60, color: 'action.disabled', mb: 2 }} />
                    <Typography variant="h6" color="text.secondary" gutterBottom>
                        {hasActiveFilters ? 'No se han encontrado espacios que coincidan con tu búsqueda' : 'No hay espacios registrados'}
                    </Typography>
                    {hasActiveFilters && <Button variant="text" onClick={clearFilters}>Limpiar búsqueda</Button>}
                </Paper>
            ) : (
                <SpaceTable 
                    spaces={spaces} 
                    totalElements={pagination.totalElements} 
                    rowsPerPage={pagination.size} 
                    page={pagination.page} 
                    setPage={setPage} 
                    setRowsPerPage={setSize} 
                    sortBy={pagination.sortBy} 
                    direction={pagination.direction} 
                    handleSort={setSort} 
                    canManage={canManage} 
                    canEdit={canEdit} 
                    canDelete={canDelete} 
                    handleAction={handleAction} 
                    selectedIds={selectedIds} 
                    onSelectAll={(ids) => ids.length === 0 ? clearSelection() : handleSelectAll(ids)} 
                    onSelectOne={handleSelectOne} 
                    loading={isFetching} 
                />
            )}

            <SpaceForm 
                open={modals.isOpen('form')} 
                handleClose={() => modals.close('form')} 
                onSuccess={(msg) => showSnackbar(msg || 'Espacio actualizado')} 
                initialData={modals.getData('form')} 
            />
            
            <BlockForm 
                open={modals.isOpen('block')} 
                handleClose={() => modals.close('block')} 
                onSuccess={() => showSnackbar('Espacio bloqueado correctamente')} 
                space={modals.getData('block')} 
            />
            
            <ImportSpacesDialog 
                open={modals.isOpen('import')} 
                handleClose={() => modals.close('import')} 
                onSuccess={() => showSnackbar('Importación finalizada con éxito')} 
            />
            
            <ExportSpacesDialog 
                open={modals.isOpen('export')} 
                onClose={() => modals.close('export')} 
                onExport={handleExport} 
            />
            
            <DeleteSpaceDialog 
                open={modals.isOpen('delete')} 
                space={modals.getData('delete')} 
                handleClose={() => modals.close('delete')} 
                onSuccess={(msg) => showSnackbar(msg)} 
            />
            
            <BulkDeleteResourceDialog 
                open={isBulkDeleteDialogOpen} 
                loading={loadingBulk} 
                summary={bulkConflictSummary} 
                config={bulkDeleteSpaceConfig} 
                onClose={() => toggleBulkDeleteModal(false)} 
                onConfirm={() => handleBulkDelete(true)} 
            />
        </Container>
    );
};

export default SpaceList;
