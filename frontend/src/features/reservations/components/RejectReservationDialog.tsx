import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { 
    Dialog, DialogTitle, DialogContent, DialogActions, 
    Button, TextField, Typography, Box, Chip, Alert, CircularProgress, Divider
} from '@mui/material';
import type { Reservation } from '../../../shared/types';
import { useApi } from '../../../shared/utils/api';
import EventBusyIcon from '@mui/icons-material/EventBusy';
import InfoIcon from '@mui/icons-material/Info';

/**
 * Propiedades del componente {@link RejectReservationDialog}.
 */
interface RejectReservationDialogProps {
    /** Indica si el diálogo está abierto y visible. */
    open: boolean;
    /** La reserva que se encuentra en proceso de rechazo. */
    reservation: Reservation | null;
    /** Función para manejar el cierre del diálogo. */
    handleClose: () => void;
    /** Función que se ejecuta tras rechazar exitosamente la reserva. */
    onSuccess: (message: string) => void;
}

const COMMON_REASONS = [
    "Conflicto con horario lectivo reglado",
    "Falta de disponibilidad técnica/personal",
    "Evento prioritario de la facultad",
    "Solicitud fuera de plazo",
    "Mantenimiento programado de la sala",
    "Propósito no compatible con el espacio"
];

/**
 * Diálogo profesional para la gestión de rechazos de reserva.
 * Sincronizado con TanStack Query para actualización instantánea de la UI.
 * Permite seleccionar motivos estandarizados o redactar uno personalizado
 * para notificar adecuadamente al solicitante.
 * 
 * @param props - Propiedades necesarias para renderizar el diálogo de rechazo.
 * @returns Componente JSX que representa el diálogo de rechazo de reserva.
 */
const RejectReservationDialog = ({ open, reservation, handleClose, onSuccess }: RejectReservationDialogProps) => {
    const { request } = useApi();
    const queryClient = useQueryClient();
    const [reason, setReason] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleReject = async () => {
        if (!reservation) return;
        if (!reason.trim()) { setError("Debes indicar un motivo para el rechazo."); return; }

        setLoading(true);
        setError(null);

        try {
            await request(`/api/reservations/${reservation.id}/status`, {
                method: 'PATCH',
                body: JSON.stringify({ status: 'RECHAZADA', rejectionReason: reason.trim() })
            });

            // INVALIDACIÓN: Actualizamos la caché global de reservas y estadísticas
            queryClient.invalidateQueries({ queryKey: ['/api/reservations'] });
            queryClient.invalidateQueries({ queryKey: ['/api/stats'] });

            onSuccess('La reserva ha sido rechazada y se ha notificado al usuario.');
            handleClose();
            setReason('');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Error desconocido');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog 
            open={open} onClose={handleClose} fullWidth maxWidth="sm"
            PaperProps={{ sx: { borderRadius: 3, boxShadow: '0 12px 40px rgba(0,0,0,0.12)' } }}
        >
            <DialogTitle sx={{ bgcolor: '#fff5f5', color: '#c53030', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 1.5, borderBottom: '1px solid #fed7d7' }}>
                <EventBusyIcon /> Confirmar Rechazo de Reserva
            </DialogTitle>
            
            <DialogContent sx={{ mt: 2.5 }}>
                <Box sx={{ mb: 3 }}>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>USUARIO SOLICITANTE</Typography>
                    <Typography variant="body1" fontWeight="bold">{reservation?.user.name} ({reservation?.user.email})</Typography>
                </Box>

                <Alert icon={<InfoIcon fontSize="small" />} severity="warning" sx={{ mb: 3, borderRadius: 2 }}>
                    El usuario recibirá una notificación por correo electrónico con el motivo que indiques a continuación.
                </Alert>

                <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1.5 }}>MOTIVOS FRECUENTES (SELECCIONAR UNO):</Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 3 }}>
                    {COMMON_REASONS.map((r) => (
                        <Chip key={r} label={r} onClick={() => setReason(r)} color={reason === r ? "error" : "default"} variant={reason === r ? "filled" : "outlined"} />
                    ))}
                </Box>

                <Divider sx={{ mb: 3 }}><Typography variant="caption" color="text.disabled" fontWeight="bold">O REDACTAR OTRO MOTIVO</Typography></Divider>

                <TextField
                    autoFocus label="Motivo del rechazo" required fullWidth multiline rows={4}
                    placeholder="Describe detalladamente por qué se deniega el uso del espacio..."
                    value={reason} onChange={(e) => { setReason(e.target.value); setError(null); }}
                    error={!!error && !reason} helperText={error && !reason ? error : ""}
                />
            </DialogContent>

            <DialogActions sx={{ p: 3, bgcolor: '#f8f9fa', borderTop: '1px solid #edf2f7' }}>
                <Button onClick={handleClose} color="inherit" sx={{ fontWeight: 'bold' }}>Cancelar</Button>
                <Box sx={{ flexGrow: 1 }} />
                <Button 
                    onClick={handleReject} color="error" variant="contained" 
                    disabled={loading || !reason.trim()} startIcon={loading && <CircularProgress size={18} color="inherit" />}
                    sx={{ px: 4, borderRadius: 2, fontWeight: 'bold' }}
                >
                    {loading ? 'Procesando...' : 'Rechazar Reserva'}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default RejectReservationDialog;
