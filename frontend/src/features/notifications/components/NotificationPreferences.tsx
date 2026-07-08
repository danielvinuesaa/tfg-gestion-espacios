import { useState, useEffect, useMemo } from 'react';
import {
    Box,
    Typography,
    Switch,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    CircularProgress,
    Alert,
    Button,
    Divider,
    Stack,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions
} from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import EmailIcon from '@mui/icons-material/Email';
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive';
import { useSnackbar } from '../../../context/SnackbarContext';
import { useApi } from '../../../shared/utils/api';
import { useAuth } from '../../../context/AuthContext';

/**
 * Interfaz que define las preferencias de notificación de un usuario, separando
 * la recepción por canales (interno del sistema frente a correo electrónico) para diferentes eventos.
 */
interface Preferences {
    id: number;
    internalOnCreated: boolean;
    emailOnCreated: boolean;
    internalOnStatusChange: boolean;
    emailOnStatusChange: boolean;
    internalOnReminder: boolean;
    emailOnReminder: boolean;
    internalOnApprovalReminder: boolean;
    emailOnApprovalReminder: boolean;
    internalOnSystem: boolean;
    emailOnSystem: boolean;
}

/**
 * Configuración para definir visualmente cada fila de la tabla de preferencias.
 */
interface PreferenceRowConfig {
    label: string;
    description: string;
    internalField: keyof Preferences;
    emailField: keyof Preferences;
    visible: boolean;
}

/**
 * Componente que renderiza el panel de gestión de preferencias de notificaciones.
 * Permite al usuario activar o desactivar la recepción de avisos para diversos eventos
 * tanto a través del sistema interno como por correo electrónico, adaptando las opciones disponibles según los permisos de su rol.
 *
 * @returns Elemento de React con la interfaz de configuración de preferencias.
 */
const NotificationPreferences = () => {
    const { request } = useApi();
    const { showSnackbar } = useSnackbar();
    const { hasPermission, user } = useAuth();
    
    const [prefs, setPrefs] = useState<Preferences | null>(null);
    const [initialPrefsHash, setInitialPrefsHash] = useState('');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [resetting, setResetting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [openConfirmReset, setOpenConfirmReset] = useState(false);

    // --- Lógica de Visibilidad Profesional ---
    const isAdmin = user?.role === 'ADMIN';
    const canRequest = hasPermission('SOLICITAR_RESERVA');
    const canManage = isAdmin || hasPermission('APROBAR_RESERVA') || hasPermission('APROBAR_ASIGNATURAS_GESTIONADAS');

    const preferenceRows: any[] = useMemo(() => [
        {
            label: "Confirmación de Solicitud",
            description: "Aviso de confirmación que recibes al enviar una nueva petición de reserva",
            internalField: 'internalOnCreated',
            emailField: 'emailOnCreated',
            visible: canRequest
        },
        {
            label: "Cambios de Estado",
            description: "Notificaciones sobre la aprobación, rechazo o cancelación de tus solicitudes",
            internalField: 'internalOnStatusChange',
            emailField: 'emailOnStatusChange',
            visible: canRequest
        },
        {
            label: "Recordatorios de Inicio",
            description: "Avisos automáticos poco antes del inicio de tus reservas confirmadas",
            internalField: 'internalOnReminder',
            emailField: 'emailOnReminder',
            visible: canRequest
        },
        {
            label: "Alertas de Gestión (Tiempo Real)",
            description: "Notificaciones inmediatas cuando entran nuevas solicitudes que debes gestionar",
            internalField: 'internalOnSystem',
            emailField: 'emailOnSystem',
            visible: canManage
        },
        {
            label: "Recordatorios de Pendientes (Diario)",
            description: "Resumen diario de solicitudes que llevan más de 48h esperando tu gestión",
            internalField: 'internalOnApprovalReminder',
            emailField: 'emailOnApprovalReminder',
            visible: canManage
        }
    ].filter(row => row.visible), [canRequest, canManage]);

    const fetchPreferences = async () => {
        try {
            const data = await request('/api/notifications/preferences');
            setPrefs(data);
            setInitialPrefsHash(JSON.stringify(data));
            setError(null);
        } catch (err) {
            setError("Error al cargar preferencias");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPreferences();
    }, [request]);

    const isDirty = useMemo(() => {
        if (!prefs) return false;
        return JSON.stringify(prefs) !== initialPrefsHash;
    }, [prefs, initialPrefsHash]);

    const handleToggle = (field: keyof Preferences) => {
        if (!prefs) return;
        setPrefs({ ...prefs, [field]: !prefs[field] });
    };

    const handleSave = async () => {
        if (!prefs) return;
        setSaving(true);
        try {
            const data = await request('/api/notifications/preferences', {
                method: 'PUT',
                body: JSON.stringify(prefs)
            });
            setPrefs(data);
            setInitialPrefsHash(JSON.stringify(data));
            showSnackbar("Preferencias guardadas correctamente");
        } catch (err) {
            // Error gestionado por useApi
        } finally {
            setSaving(false);
        }
    };

    const handleReset = async () => {
        setResetting(true);
        try {
            const data = await request('/api/notifications/preferences/reset', {
                method: 'POST'
            });
            setPrefs(data);
            setInitialPrefsHash(JSON.stringify(data));
            showSnackbar("Valores restaurados por defecto");
            setOpenConfirmReset(false);
        } catch (err) {
            // Error gestionado por useApi
        } finally {
            setResetting(false);
        }
    };

    if (loading) return <Box sx={{ p: 4, textAlign: 'center' }}><CircularProgress /></Box>;
    if (error) return <Alert severity="error">{error}</Alert>;

    return (
        <Box sx={{ p: 3 }}>
            <Typography variant="h6" fontWeight="bold" gutterBottom>
                Preferencias de Notificación
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Configura cómo quieres recibir avisos según el tipo de evento. Solo verás las opciones disponibles para tu perfil.
            </Typography>

            <TableContainer component={Paper} elevation={0} variant="outlined" sx={{ borderRadius: 2 }}>
                <Table>
                    <TableHead>
                        <TableRow sx={{ bgcolor: '#f8f9fa' }}>
                            <TableCell><strong>Tipo de Evento</strong></TableCell>
                            <TableCell align="center"><Stack direction="row" spacing={1} justifyContent="center" alignItems="center"><NotificationsActiveIcon fontSize="small" /> <strong>Interna</strong></Stack></TableCell>
                            <TableCell align="center"><Stack direction="row" spacing={1} justifyContent="center" alignItems="center"><EmailIcon fontSize="small" /> <strong>Email</strong></Stack></TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {preferenceRows.map((row) => (
                            <TableRow key={row.internalField} hover>
                                <TableCell>
                                    <Typography variant="subtitle2">{row.label}</Typography>
                                    <Typography variant="caption" color="text.secondary">{row.description}</Typography>
                                </TableCell>
                                <TableCell align="center">
                                    <Switch 
                                        checked={prefs?.[row.internalField] as boolean} 
                                        onChange={() => handleToggle(row.internalField)} 
                                        color="primary"
                                    />
                                </TableCell>
                                <TableCell align="center">
                                    <Switch 
                                        checked={prefs?.[row.emailField] as boolean} 
                                        onChange={() => handleToggle(row.emailField)} 
                                        color="primary"
                                    />
                                </TableCell>
                            </TableRow>
                        ))}
                        {preferenceRows.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={3} align="center" sx={{ py: 4 }}>
                                    <Typography variant="body2" color="text.secondary">
                                        No hay eventos notificables disponibles para tu nivel de permisos.
                                    </Typography>
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </TableContainer>

            <Box sx={{ mt: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Button
                    variant="outlined"
                    color="warning"
                    startIcon={<RestartAltIcon />}
                    onClick={() => setOpenConfirmReset(true)}
                    sx={{ borderRadius: 2, fontWeight: 'bold' }}
                >
                    Restaurar valores
                </Button>
                
                <Button
                    variant="contained"
                    startIcon={saving ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />}
                    onClick={handleSave}
                    disabled={saving || !isDirty}
                    sx={{ borderRadius: 2, px: 4, fontWeight: 'bold' }}
                >
                    {saving ? 'Guardando...' : 'Guardar Preferencias'}
                </Button>
            </Box>

            {/* Diálogo de Confirmación de Reset */}
            <Dialog 
                open={openConfirmReset} 
                onClose={() => setOpenConfirmReset(false)}
                maxWidth="xs"
                fullWidth
                PaperProps={{ sx: { borderRadius: 3 } }}
            >
                <DialogTitle sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: 1.5, 
                    bgcolor: '#fff9c4', 
                    color: '#f57f17', 
                    fontWeight: 'bold' 
                }}>
                    <WarningAmberIcon /> ¿Restaurar ajustes?
                </DialogTitle>
                <Divider />
                <DialogContent sx={{ mt: 2 }}>
                    <Typography variant="body1">
                        Se volverán a activar los canales recomendados por defecto. Podrás volver a cambiarlos en cualquier momento.
                    </Typography>
                </DialogContent>
                <DialogActions sx={{ p: 2, bgcolor: '#f8f9fa', borderTop: '1px solid #eee' }}>
                    <Button onClick={() => setOpenConfirmReset(false)} color="inherit" sx={{ fontWeight: 'bold' }}>
                        Cancelar
                    </Button>
                    <Button 
                        onClick={handleReset} 
                        variant="contained" 
                        color="warning"
                        disabled={resetting}
                        startIcon={resetting ? <CircularProgress size={20} color="inherit" /> : <RestartAltIcon />}
                        sx={{ fontWeight: 'bold', borderRadius: 2 }}
                    >
                        {resetting ? 'Restaurando...' : 'Confirmar Restauración'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default NotificationPreferences;
