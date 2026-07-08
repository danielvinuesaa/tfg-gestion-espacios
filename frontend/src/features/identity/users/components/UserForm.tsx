import { useState, useMemo } from 'react';
import type { User } from '../../../../shared/types';
import { useUserForm } from '../hooks/useUserForm';
import { useAuth } from '../../../../context/AuthContext';
import {
    Button,
    TextField,
    MenuItem,
    Grid,
    Alert,
    Box,
    Typography,
    Divider,
    InputAdornment,
    Tooltip,
    IconButton
} from '@mui/material';
import PersonIcon from '@mui/icons-material/Person';
import EmailIcon from '@mui/icons-material/Email';
import LockIcon from '@mui/icons-material/Lock';
import SecurityIcon from '@mui/icons-material/Security';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import BadgeIcon from '@mui/icons-material/Badge';
import SettingsIcon from '@mui/icons-material/Settings';
import FormDialogWrapper from '../../../../shared/components/FormDialogWrapper';

/**
 * Propiedades del componente UserForm.
 */
interface UserFormProps {
    open: boolean;
    handleClose: () => void;
    onSuccess: (message: string) => void;
    initialData?: User | null;
}

/**
 * Componente que renderiza el formulario para la creación y edición de usuarios.
 * 
 * @param props - Propiedades del componente.
 * @param props.open - Indica si el diálogo se encuentra abierto.
 * @param props.handleClose - Función delegada para cerrar el diálogo.
 * @param props.onSuccess - Función delegada que se ejecuta tras un guardado exitoso, recibiendo un mensaje de confirmación.
 * @param props.initialData - Datos iniciales del usuario para la edición; si es nulo o indefinido, se asume el modo de creación.
 * @returns Elemento de React que representa el diálogo con el formulario de usuario.
 */
const UserForm = ({ open, handleClose, onSuccess, initialData }: UserFormProps) => {
    const [showPassword, setShowPassword] = useState(false);
    const { user: currentUser } = useAuth();

    const {
        formData, confirmPassword, setConfirmPassword, roles,
        loading, error, isDeletedError, isDirty,
        handleChange, saveUser, restoreUserByEmail, getFieldError,
        touched, handleBlur
    } = useUserForm(initialData, open, handleClose, onSuccess);

    const onConfirmPasswordChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setConfirmPassword(e.target.value);
        (handleBlur as any)('confirmPassword');
    };

    const togglePasswordVisibility = () => setShowPassword(!showPassword);

    const isEdit = initialData && typeof initialData === 'object' && 'id' in initialData;
    const isSelf = !!(isEdit && currentUser && (initialData as any).id === currentUser.id);
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    
    // -- Validaciones Visuales --
    const nameErrorMsg = getFieldError('name') || (touched.name && !formData.name?.trim() ? "El nombre es obligatorio" : "");
    const emailErrorMsg = getFieldError('email') || (touched.email && (!formData.email?.trim() ? "El email es obligatorio" : (!emailRegex.test(formData.email) ? "Formato inválido (ej: usuario@dominio.com)" : "")));
    
    const isPasswordTooShort = formData.password && formData.password.length > 0 && formData.password.length < 8;
    const passwordErrorMsg = getFieldError('password') || (touched.password && (isEdit ? (isPasswordTooShort ? "Mínimo 8 caracteres" : "") : (!formData.password ? "La contraseña es obligatoria" : (isPasswordTooShort ? "Mínimo 8 caracteres" : ""))));
    
    const passwordsMatch = formData.password === confirmPassword;
    const confirmError = (touched as any).confirmPassword && !passwordsMatch ? "Las contraseñas no coinciden" : "";
    
    const isFormValid = useMemo(() => {
        const hasName = !!formData.name?.trim();
        const hasEmail = !!formData.email?.trim() && emailRegex.test(formData.email);
        const hasRole = !!formData.roleId;
        const hasPassword = isEdit 
            ? (!isPasswordTooShort && passwordsMatch) 
            : (!!formData.password && !isPasswordTooShort && passwordsMatch);
        return hasName && hasEmail && hasRole && hasPassword;
    }, [formData, confirmPassword, isEdit, isPasswordTooShort, passwordsMatch]);

    return (
        <FormDialogWrapper
            open={open}
            onClose={handleClose}
            title={isEdit ? 'Editar Usuario' : 'Nuevo Usuario'}
            icon={<PersonIcon />}
            loading={loading}
            error={isDeletedError ? null : error} // Si es error de borrado, lo manejamos con el Alert personalizado
            isDirty={isDirty}
            isValid={isFormValid}
            onSubmit={saveUser}
            submitText={isEdit ? 'Guardar Cambios' : 'Crear Usuario'}
        >
            {isDeletedError && (
                <Alert 
                    severity="warning" 
                    sx={{ borderRadius: 2, mb: 3 }}
                    action={
                        <Button color="inherit" size="small" onClick={restoreUserByEmail} disabled={loading} sx={{ fontWeight: 'bold' }}>
                            Restaurar Cuenta
                        </Button>
                    }
                >
                    Este email pertenece a un usuario eliminado. ¿Deseas restaurar su cuenta anterior?
                </Alert>
            )}

            <Grid container spacing={3}>
                <Grid item xs={12}>
                    <Divider sx={{ mb: 1 }}>
                        <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 'bold', textTransform: 'uppercase' }}>Información Personal</Typography>
                    </Divider>
                </Grid>
                <Grid item xs={12}>
                    <TextField
                        name="name" label="Nombre Completo" fullWidth required value={formData.name}
                        onChange={handleChange} onBlur={() => handleBlur('name')}
                        error={!!nameErrorMsg} helperText={nameErrorMsg}
                        InputProps={{ startAdornment: (<InputAdornment position="start"><PersonIcon fontSize="small" color="action" /></InputAdornment>) }}
                    />
                </Grid>
                <Grid item xs={12}>
                    <TextField
                        name="email" label="Correo Electrónico" type="email" fullWidth required value={formData.email}
                        onChange={handleChange} onBlur={() => handleBlur('email')}
                        error={!!emailErrorMsg} helperText={emailErrorMsg || "Se usará para acceso y notificaciones"}
                        InputProps={{ startAdornment: (<InputAdornment position="start"><EmailIcon fontSize="small" color="action" /></InputAdornment>) }}
                    />
                </Grid>

                <Grid item xs={12}>
                    <Divider sx={{ my: 1 }}>
                        <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 'bold', textTransform: 'uppercase' }}>Seguridad y Acceso</Typography>
                    </Divider>
                </Grid>
                <Grid item xs={12} sm={6}>
                    <TextField
                        name="password" label={isEdit ? "Nueva Contraseña" : "Contraseña"}
                        type={showPassword ? 'text' : 'password'} fullWidth required={!isEdit}
                        value={formData.password} onChange={handleChange} onBlur={() => handleBlur('password')}
                        error={!!passwordErrorMsg} helperText={passwordErrorMsg || (isEdit ? "Dejar vacío para mantener la actual (mín. 8 caracteres)" : "Obligatoria (mín. 8 caracteres)")}
                        InputProps={{
                            startAdornment: (<InputAdornment position="start"><LockIcon fontSize="small" color="action" /></InputAdornment>),
                            endAdornment: (
                                <InputAdornment position="end">
                                    <Tooltip title={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}>
                                        <IconButton onClick={togglePasswordVisibility} edge="end" size="small">
                                            {showPassword ? <VisibilityOffIcon fontSize="small" /> : <VisibilityIcon fontSize="small" />}
                                        </IconButton>
                                    </Tooltip>
                                </InputAdornment>
                            )
                        }}
                    />
                </Grid>
                <Grid item xs={12} sm={6}>
                    <TextField
                        label="Confirmar Contraseña" type={showPassword ? 'text' : 'password'} fullWidth required={!!formData.password}
                        value={confirmPassword} onChange={onConfirmPasswordChange} onBlur={() => (handleBlur as any)('confirmPassword')}
                        disabled={!formData.password} error={!!confirmError} helperText={confirmError}
                        InputProps={{ 
                            startAdornment: (<InputAdornment position="start"><SecurityIcon fontSize="small" color="action" /></InputAdornment>),
                            endAdornment: (
                                <InputAdornment position="end">
                                    <Tooltip title={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}>
                                        <IconButton onClick={togglePasswordVisibility} edge="end" size="small">
                                            {showPassword ? <VisibilityOffIcon fontSize="small" /> : <VisibilityIcon fontSize="small" />}
                                        </IconButton>
                                    </Tooltip>
                                </InputAdornment>
                            )
                        }}
                    />
                </Grid>

                {!isSelf && (
                    <>
                        <Grid item xs={12}>
                            <Divider sx={{ my: 1 }}>
                                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 'bold', textTransform: 'uppercase' }}>Permisos y Estados</Typography>
                            </Divider>
                        </Grid>
                        <Grid item xs={12} sm={isEdit ? 6 : 12}>
                            <TextField
                                select name="roleId" label="Rol Asignado" fullWidth required value={formData.roleId} 
                                onChange={handleChange} error={!!getFieldError('roleId')} helperText={getFieldError('roleId')}
                                InputProps={{ startAdornment: (<InputAdornment position="start"><BadgeIcon fontSize="small" color="action" /></InputAdornment>) }}
                            >
                                {roles.map((role) => (<MenuItem key={role.id} value={role.id.toString()}>{role.name}</MenuItem>))}
                            </TextField>
                        </Grid>
                        {isEdit && (
                            <Grid item xs={12} sm={6}>
                                <TextField
                                    select name="status" label="Estado de Cuenta" fullWidth value={formData.status} onChange={handleChange}
                                    disabled={formData.email === 'admin@uniovi.es'}
                                    InputProps={{ startAdornment: (<InputAdornment position="start"><SettingsIcon fontSize="small" color="action" /></InputAdornment>) }}
                                >
                                    <MenuItem value="ACTIVO">Activo</MenuItem>
                                    <MenuItem value="BLOQUEADO">Bloqueado</MenuItem>
                                </TextField>
                            </Grid>
                        )}
                    </>
                )}
            </Grid>
        </FormDialogWrapper>
    );
};

export default UserForm;
