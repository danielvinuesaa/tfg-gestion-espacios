import { useState, useCallback, useEffect } from 'react';
import type { Role, Permission } from '../../../../shared/types';
import { useRoleForm } from '../hooks/useRoleForm';
import SubjectSelectorDialog from './SubjectSelectorDialog';
import {
    Button,
    TextField,
    Grid,
    Alert,
    Box,
    FormControlLabel,
    Checkbox,
    Typography,
    Divider,
    Paper,
    InputAdornment,
    Tooltip,
    Stack,
    CircularProgress
} from '@mui/material';

import SettingsIcon from '@mui/icons-material/Settings';
import BadgeIcon from '@mui/icons-material/Badge';
import DescriptionIcon from '@mui/icons-material/Description';
import SecurityIcon from '@mui/icons-material/Security';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import FormDialogWrapper from '../../../../shared/components/FormDialogWrapper';

import { PERMISSION_CATEGORIES } from '../constants/roleConstants';
import { useApi } from '../../../../shared/utils/api';

/**
 * Propiedades del componente {@link RoleForm}.
 */
interface RoleFormProps {
    /** Indica si el formulario de rol está visible. */
    open: boolean;
    /** Función para cerrar el formulario. */
    handleClose: () => void;
    /** Función que se invoca al guardar el rol satisfactoriamente. */
    onSuccess: (message: string) => void;
    /** Datos del rol a editar, o nulo si es una creación nueva. */
    initialData?: Role | null;
}

/**
 * Formulario profesional para la creación y edición de roles.
 * Gestiona metadatos, selección de permisos categorizados y asignación de ámbito (asignaturas).
 * Utiliza validación proactiva y se integra con TanStack Query para sincronizar estados.
 * 
 * @param props - Propiedades necesarias para renderizar el formulario.
 * @returns Componente JSX que representa el formulario de roles.
 */
const RoleForm = ({ open, handleClose, onSuccess, initialData }: RoleFormProps) => {
    const { request } = useApi();
    const [subjectSelectorOpen, setSubjectSelectorOpen] = useState(false);
    
    // Estado para el catálogo real de permisos del backend
    const [systemPermissions, setSystemPermissions] = useState<Permission[]>([]);
    const [loadingPerms, setLoadingPerms] = useState(false);

    const {
        formData, loading, error, isDirty,
        handleChange, handleBlur, saveRole, getFieldError,
        touched, setFieldValue,
        allSubjects, info,
        togglePermission, toggleCategory
    } = useRoleForm(initialData, open, handleClose, onSuccess);

    // Cargar catálogo de permisos al abrir
    useEffect(() => {
        if (open) {
            setLoadingPerms(true);
            request('/api/roles/permissions')
                .then(data => setSystemPermissions(data))
                .catch(err => console.error("Error al cargar catálogo de permisos", err))
                .finally(() => setLoadingPerms(false));
        }
    }, [open, request]);

    const isSystemRole = initialData?.name === 'ADMIN';

    const handleToggleSubject = useCallback((id: number) => {
        const newIds = formData.subjectIds.includes(id) 
            ? formData.subjectIds.filter(sid => sid !== id) 
            : [...formData.subjectIds, id];
        setFieldValue('subjectIds', newIds);
    }, [formData.subjectIds, setFieldValue]);

    const nameError = getFieldError('name') || (touched.name && !formData.name?.trim() ? "El nombre es obligatorio." : "");
    const permsError = getFieldError('permissions');

    const isEdit = initialData && typeof initialData === 'object' && 'id' in initialData;

    return (
        <>
            <FormDialogWrapper
                open={open}
                onClose={handleClose}
                title={isEdit ? `Editar Rol: ${initialData.name}` : 'Nuevo Rol de Usuario'}
                icon={<SecurityIcon />}
                loading={loading || loadingPerms}
                error={error || permsError}
                info={info}
                isDirty={isDirty}
                isValid={!!formData.name.trim() && !isSystemRole}
                onSubmit={saveRole}
                submitText={isEdit ? 'Guardar Cambios' : 'Crear Rol'}
                maxWidth="md"
            >
                {loadingPerms ? (
                    <Box display="flex" justifyContent="center" py={10}><CircularProgress size={30} /></Box>
                ) : (
                    <Grid container spacing={3}>
                        <Grid item xs={12}>
                            <Divider sx={{ mb: 2 }}>
                                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 'bold', textTransform: 'uppercase' }}>Información del Rol</Typography>
                            </Divider>
                        </Grid>

                        <Grid item xs={12} md={5}>
                            <TextField
                                name="name" label="Nombre del Rol" fullWidth required
                                value={formData.name} onChange={handleChange}
                                onBlur={() => handleBlur('name')}
                                error={!!nameError}
                                helperText={nameError || "Ej: COORDINADOR_CENTRO"}
                                disabled={isSystemRole}
                                InputProps={{ startAdornment: (<InputAdornment position="start"><BadgeIcon fontSize="small" color="action" /></InputAdornment>) }}
                            />
                        </Grid>

                        <Grid item xs={12} md={7}>
                            <TextField
                                name="description" label="Descripción" fullWidth multiline rows={1}
                                value={formData.description} onChange={handleChange}
                                onBlur={() => handleBlur('description')}
                                disabled={isSystemRole} placeholder="Explique las funciones de este rol..."
                                InputProps={{ startAdornment: (<InputAdornment position="start"><DescriptionIcon fontSize="small" color="action" /></InputAdornment>) }}
                            />
                        </Grid>

                        <Grid item xs={12}>
                            <Divider sx={{ mt: 1, mb: 2 }}>
                                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 'bold', textTransform: 'uppercase' }}>Configuración de Permisos</Typography>
                            </Divider>
                        </Grid>

                        {PERMISSION_CATEGORIES.map((cat) => {
                            const isGlobalApprovalActive = formData.permissions.includes('APROBAR_RESERVA');
                            const allCategorySelected = cat.permissions.every(p => {
                                if (p === 'APROBAR_ASIGNATURAS_GESTIONADAS' && isGlobalApprovalActive) return true;
                                return formData.permissions.includes(p);
                            });
                            const someCategorySelected = cat.permissions.some(p => formData.permissions.includes(p)) && !allCategorySelected;

                            return (
                                <Grid item xs={12} key={cat.id}>
                                    <Box sx={{ mb: 1 }}>
                                        <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1}>
                                            <Typography variant="subtitle2" sx={{ color: cat.color, fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 1 }}>
                                                {cat.icon}{cat.name.toUpperCase()}
                                            </Typography>
                                            <FormControlLabel
                                                control={
                                                    <Checkbox 
                                                        size="small"
                                                        checked={allCategorySelected}
                                                        indeterminate={someCategorySelected}
                                                        onChange={(e) => toggleCategory(cat.permissions, e.target.checked)}
                                                        disabled={isSystemRole}
                                                        sx={{ color: cat.color, '&.Mui-checked, &.MuiCheckbox-indeterminate': { color: cat.color } }}
                                                    />
                                                }
                                                label={<Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 'bold' }}>MARCAR TODO</Typography>}
                                                sx={{ mr: 0 }}
                                            />
                                        </Stack>
                                        
                                        <Paper variant="outlined" sx={{ p: 2, bgcolor: cat.bgColor, border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
                                            <Grid container spacing={1}>
                                                {cat.permissions.map((permName) => {
                                                    const isManagedApproval = permName === 'APROBAR_ASIGNATURAS_GESTIONADAS';
                                                    const isDisabledByGlobal = isManagedApproval && isGlobalApprovalActive;
                                                    
                                                    const permDef = systemPermissions.find(p => p.name === permName);

                                                    return (
                                                        <Grid item xs={12} sm={6} md={4} key={permName}>
                                                            <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                                                                <FormControlLabel
                                                                    control={
                                                                        <Checkbox
                                                                            checked={formData.permissions.includes(permName)}
                                                                            onChange={(e) => togglePermission(permName, e.target.checked)}
                                                                            disabled={isSystemRole || isDisabledByGlobal}
                                                                            size="small"
                                                                            sx={{ color: cat.color, '&.Mui-checked': { color: cat.color } }}
                                                                        />
                                                                    }
                                                                    label={
                                                                        <Stack direction="row" alignItems="center" spacing={0.5}>
                                                                            <Typography variant="body2" sx={{ color: cat.color, fontWeight: '500', opacity: isDisabledByGlobal ? 0.5 : 1 }}>
                                                                                {permDef?.label || permName}
                                                                            </Typography>
                                                                            <Tooltip 
                                                                                title={
                                                                                    <Box sx={{ p: 0.5 }}>
                                                                                        <Typography variant="caption" sx={{ fontWeight: 'bold', display: 'block', mb: 0.5 }}>{permDef?.label}</Typography>
                                                                                        <Typography variant="caption">
                                                                                            {isDisabledByGlobal 
                                                                                                ? "Este permiso ya está cubierto por la aprobación global." 
                                                                                                : (permDef?.description || "Sin descripción disponible.")}
                                                                                        </Typography>
                                                                                    </Box>
                                                                                } 
                                                                                placement="top" arrow
                                                                            >
                                                                                <HelpOutlineIcon sx={{ fontSize: 14, color: 'text.disabled', opacity: 0.7, cursor: 'help' }} />
                                                                            </Tooltip>
                                                                        </Stack>
                                                                    }
                                                                />
                                                                {isManagedApproval && formData.permissions.includes(permName) && (
                                                                    <Box sx={{ ml: 4, mt: -0.5, mb: 1 }}>
                                                                        <Button 
                                                                            size="small" startIcon={<SettingsIcon />} 
                                                                            onClick={() => setSubjectSelectorOpen(true)}
                                                                            variant="outlined"
                                                                            sx={{ textTransform: 'none', fontSize: '0.75rem', py: 0, color: cat.color, borderColor: cat.color }}
                                                                        >
                                                                            Configurar Ámbito ({formData.subjectIds.length})
                                                                        </Button>
                                                                    </Box>
                                                                )}
                                                            </Box>
                                                        </Grid>
                                                    );
                                                })}
                                            </Grid>
                                        </Paper>
                                    </Box>
                                </Grid>
                            );
                        })}
                    </Grid>
                )}
            </FormDialogWrapper>

            <SubjectSelectorDialog 
                open={subjectSelectorOpen} onClose={() => setSubjectSelectorOpen(false)}
                subjects={allSubjects} selectedIds={formData.subjectIds}
                onToggle={handleToggleSubject} onClearAll={() => setFieldValue('subjectIds', [])}
            />
        </>
    );
};

export default RoleForm;
