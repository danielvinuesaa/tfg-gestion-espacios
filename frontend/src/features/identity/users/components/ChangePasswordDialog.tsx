import React, { useState, useEffect } from 'react';
import {
    TextField,
    Typography,
    IconButton,
    InputAdornment,
    Tooltip
} from '@mui/material';
import LockIcon from '@mui/icons-material/Lock';
import SecurityIcon from '@mui/icons-material/Security';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import { useApi } from '../../../../shared/utils/api';
import { useSnackbar } from '../../../../context/SnackbarContext';
import FormDialogWrapper from '../../../../shared/components/FormDialogWrapper';

/**
 * Propiedades del componente ChangePasswordDialog.
 */
interface ChangePasswordDialogProps {
    open: boolean;
    onClose: () => void;
}

/**
 * Componente que muestra un diálogo para que el usuario autenticado cambie su contraseña.
 * Incluye validaciones de seguridad y confirmación de la nueva contraseña.
 *
 * @param props - Propiedades del componente.
 * @param props.open - Indica si el diálogo se encuentra visible.
 * @param props.onClose - Función delegada para cerrar el diálogo.
 * @returns Elemento de React que representa el diálogo de cambio de contraseña.
 */
const ChangePasswordDialog: React.FC<ChangePasswordDialogProps> = ({ open, onClose }) => {
    const { showSnackbar } = useSnackbar();
    const { request } = useApi();
    
    const [currentPassword, setCurrentPassword] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    
    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [touchedPassword, setTouchedPassword] = useState(false);

    // Limpiar el formulario cada vez que se abre el diálogo
    useEffect(() => {
        if (open) {
            setCurrentPassword('');
            setPassword('');
            setConfirmPassword('');
            setShowCurrentPassword(false);
            setShowPassword(false);
            setTouchedPassword(false);
        }
    }, [open]);

    const passwordRegex = /^(?=.*[0-9])(?=.*[a-z])(?=.*[A-Z])(?=.*[@#$%^&+=._\-!/()*])(?=\S+$).{8,}$/;
    
    const isPasswordValid = passwordRegex.test(password);
    const passwordsMatch = password === confirmPassword;

    // isDirty: solo true si el usuario ha empezado a escribir algo
    const isDirty = currentPassword.length > 0 || password.length > 0 || confirmPassword.length > 0;

    const passwordErrorMsg = touchedPassword && !isPasswordValid 
        ? "Debe contener mín. 8 caracteres, mayúscula, minúscula, número, símbolo y sin espacios" 
        : "";

    const handleSubmit = async () => {
        setTouchedPassword(true);

        if (!currentPassword) {
            showSnackbar('Debes introducir tu contraseña actual', 'error');
            return;
        }

        if (!passwordsMatch) {
            showSnackbar('Las contraseñas no coinciden', 'error');
            return;
        }

        if (!isPasswordValid) {
            showSnackbar('La nueva contraseña no cumple los requisitos de seguridad', 'error');
            return;
        }

        try {
            setLoading(true);
            await request('/api/users/me/password', { 
                method: 'PUT', 
                body: JSON.stringify({ currentPassword, newPassword: password }) 
            });
            showSnackbar('Contraseña actualizada correctamente', 'success');
            onClose();
        } catch (error: any) {
            showSnackbar(error.message || 'Error al cambiar la contraseña', 'error');
        } finally {
            setLoading(false);
        }
    };

    const togglePasswordVisibility = () => setShowPassword(!showPassword);
    const toggleCurrentPasswordVisibility = () => setShowCurrentPassword(!showCurrentPassword);

    const isFormValid = !!currentPassword && !!password && !!confirmPassword && passwordsMatch && isPasswordValid;

    return (
        <FormDialogWrapper
            open={open}
            onClose={onClose}
            title="Cambiar Contraseña"
            icon={<LockIcon />}
            loading={loading}
            isDirty={isDirty}
            isValid={isFormValid}
            onSubmit={handleSubmit}
            submitText="Guardar"
            maxWidth="xs"
        >
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Por favor, introduce tu contraseña actual y la nueva contraseña. La nueva debe cumplir los requisitos de seguridad.
            </Typography>

            <TextField
                fullWidth
                margin="normal"
                label="Contraseña Actual"
                type={showCurrentPassword ? 'text' : 'password'}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
                disabled={loading}
                InputProps={{
                    startAdornment: (<InputAdornment position="start"><LockIcon fontSize="small" color="action" /></InputAdornment>),
                    endAdornment: (
                        <InputAdornment position="end">
                            <Tooltip title={showCurrentPassword ? "Ocultar contraseña" : "Mostrar contraseña"}>
                                <IconButton onClick={toggleCurrentPasswordVisibility} edge="end" size="small">
                                    {showCurrentPassword ? <VisibilityOffIcon fontSize="small" /> : <VisibilityIcon fontSize="small" />}
                                </IconButton>
                            </Tooltip>
                        </InputAdornment>
                    )
                }}
            />

            <TextField
                fullWidth
                margin="normal"
                label="Nueva Contraseña"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => {
                    setPassword(e.target.value);
                    setTouchedPassword(true);
                }}
                required
                disabled={loading}
                error={!!passwordErrorMsg}
                helperText={passwordErrorMsg || "Mín. 8 caracteres, 1 mayúscula, 1 minúscula, 1 número y 1 símbolo"}
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
            <TextField
                fullWidth
                margin="normal"
                label="Repetir Contraseña"
                type={showPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                disabled={loading}
                error={password !== confirmPassword && confirmPassword.length > 0}
                helperText={password !== confirmPassword && confirmPassword.length > 0 ? "Las contraseñas no coinciden" : ""}
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
        </FormDialogWrapper>
    );
};

export default ChangePasswordDialog;
