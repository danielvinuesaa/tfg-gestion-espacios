import { useState, useEffect } from 'react';
import {
    Typography,
    Box,
    Alert,
    FormControl,
    InputLabel,
    Select,
    MenuItem
} from '@mui/material';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import type { Role } from '../../../../shared/types';
import DeleteEntityDialog from '../../../../shared/components/DeleteEntityDialog';
import { useDeleteEntity } from '../../../../shared/hooks/useDeleteEntity';

/**
 * Propiedades del componente {@link DeleteRoleDialog}.
 */
interface DeleteRoleDialogProps {
    /** Indica si el diálogo está visible. */
    open: boolean;
    /** Rol objetivo que se desea eliminar. */
    role: Role | null;
    /** Catálogo de todos los roles, necesario para posibles reasignaciones. */
    allRoles: Role[];
    /** Función para cerrar el diálogo. */
    handleClose: () => void;
    /** Función callback que se ejecuta tras una eliminación exitosa. */
    onSuccess: (message: string) => void;
}

/**
 * Diálogo de confirmación para la eliminación de un rol.
 * Si el rol tiene usuarios asignados, exige y facilita su reasignación a otro rol
 * antes de confirmar la baja (eliminación lógica).
 * 
 * @param props - Propiedades necesarias para renderizar el diálogo de borrado.
 * @returns Componente JSX que representa el diálogo de confirmación.
 */
const DeleteRoleDialog = ({ open, role, allRoles, handleClose, onSuccess }: DeleteRoleDialogProps) => {
    
    const [reassignToId, setReassignToId] = useState<string>('');

    // Resetear selección al abrir el diálogo
    useEffect(() => {
        if (open) setReassignToId('');
    }, [open]);

    const {
        loading,
        checkingConflicts,
        conflicts,
        error,
        handleDelete
    } = useDeleteEntity({
        open,
        conflictsUrl: role ? `/api/roles/${role.id}/usage` : null,
        deleteUrl: role ? `/api/roles/${role.id}` : null,
        onSuccess: (msg) => {
            onSuccess(msg);
            handleClose();
        },
        successMessage: `El rol "${role?.name}" ha sido eliminado correctamente.`
    });

    const rolesDisponibles = (allRoles || []).filter(r => r.id !== role?.id && r.status !== 'ELIMINADO');
    const hasConflicts = conflicts?.hasConflicts || false;
    const usageCount = conflicts?.conflictCount || 0;

    const onConfirm = () => {
        const extraParams = reassignToId ? { reassignToId } : {};
        handleDelete(extraParams);
    };

    const conflictContent = hasConflicts ? (
        <Box sx={{ mt: 1 }}>
            <Alert severity="warning" icon={<WarningAmberIcon fontSize="small" />} sx={{ mb: 2, borderRadius: 2 }}>
                <Typography variant="body2" fontWeight="bold">
                    {usageCount === 1 
                        ? 'Se ha encontrado 1 usuario vinculado a este rol.' 
                        : `Se han encontrado ${usageCount} usuarios vinculados a este rol.`}
                </Typography>
            </Alert>

            <Box sx={{ p: 2, bgcolor: '#fff4e5', borderRadius: 2, border: '1px solid #ffa726', mb: 2 }}>
                <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 'bold' }}>
                    {usageCount === 1 ? 'Acción Requerida: Reasignar Usuario' : 'Acción Requerida: Reasignar Usuarios'}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    Para poder eliminar este rol, debe seleccionar un nuevo rol de destino para {usageCount === 1 ? 'el usuario afectado:' : `los ${usageCount} usuarios afectados:`}
                </Typography>
                
                <FormControl fullWidth size="small" sx={{ bgcolor: 'white' }}>
                    <InputLabel>Nuevo Rol de Destino</InputLabel>
                    <Select
                        value={reassignToId}
                        label="Nuevo Rol de Destino"
                        onChange={(e) => setReassignToId(e.target.value)}
                    >
                        {rolesDisponibles.map(r => (
                            <MenuItem key={r.id} value={r.id}>
                                <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                                    <Typography variant="body2" fontWeight="bold">{r.name}</Typography>
                                    {r.description && (
                                        <Typography variant="caption" color="text.secondary">
                                            {r.description}
                                        </Typography>
                                    )}
                                </Box>
                            </MenuItem>
                        ))}
                    </Select>
                </FormControl>
            </Box>
        </Box>
    ) : (
        <Typography variant="body2" color="textSecondary">
            ¿Está seguro de que desea eliminar este rol? Esta acción es irreversible administrativamente.
        </Typography>
    );

    return (
        <DeleteEntityDialog
            open={open}
            title="¿Eliminar Rol?"
            entityName={role?.name || ''}
            entityTypeLabel="Rol"
            entityId={role?.id}
            hasConflicts={hasConflicts}
            checkingConflicts={checkingConflicts}
            loading={loading}
            error={error}
            onClose={handleClose}
            onConfirm={onConfirm}
            confirmText={hasConflicts ? "Confirmar Reasignación y Eliminar" : "Confirmar Eliminación"}
            auditNote="Los roles se desactivan lógicamente para mantener la trazabilidad de los permisos históricos de los usuarios."
        >
            {conflictContent}
        </DeleteEntityDialog>
    );
};

export default DeleteRoleDialog;