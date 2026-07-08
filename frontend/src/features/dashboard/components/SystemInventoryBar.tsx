import { Paper, Stack, Divider, Box, Typography } from '@mui/material';
import MeetingRoomIcon from '@mui/icons-material/MeetingRoom';
import PeopleIcon from '@mui/icons-material/People';
import HistoryIcon from '@mui/icons-material/History';

/**
 * Propiedades del componente SystemInventoryBar.
 */
interface SystemInventoryBarProps {
    totals: {
        totalSpaces: number;
        totalUsers: number;
        totalReservationsHistorical: number;
    };
    isGlobal?: boolean;
}

/**
 * Componente modular diseñado para exhibir un resumen cuantitativo del inventario total del sistema.
 * Dependiendo del parámetro `isGlobal`, presenta las estadísticas generales de uso o información más concisa adaptada al usuario.
 *
 * @param props - Propiedades del componente.
 * @param props.totals - Objeto con los recuentos totales a mostrar (espacios, usuarios, reservas históricas).
 * @param props.isGlobal - (Opcional) Indica si la vista es global para todo el sistema. Por defecto es `true`.
 * @returns Elemento de React con la barra de inventario.
 */
const SystemInventoryBar = ({ totals, isGlobal = true }: SystemInventoryBarProps) => {
    if (!isGlobal) {
        return (
            <Paper 
                elevation={0} 
                sx={{ 
                    p: 2, 
                    borderRadius: 3, 
                    bgcolor: '#eef2ff', 
                    border: '1px solid #e0e7ff',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 2
                }}
            >
                <HistoryIcon color="primary" />
                <Typography variant="body1">
                    Has realizado un total de <strong>{totals.totalReservationsHistorical || 0}</strong> reservas históricas en el sistema.
                </Typography>
            </Paper>
        );
    }

    return (
        <Paper 
            elevation={0} 
            sx={{ 
                p: 2, 
                borderRadius: 3, 
                bgcolor: '#f8f9fa', 
                border: '1px solid #eee',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-around',
                flexWrap: 'wrap',
                gap: 3
            }}
        >
            <Stack direction="row" spacing={1.5} alignItems="center">
                <MeetingRoomIcon sx={{ color: 'primary.main' }} />
                <Box>
                    <Typography variant="h6" fontWeight="bold" lineHeight={1}>{totals.totalSpaces || 0}</Typography>
                    <Typography variant="caption" color="text.secondary" fontWeight="bold">ESPACIOS TOTALES</Typography>
                </Box>
            </Stack>
            
            <Divider orientation="vertical" flexItem sx={{ display: { xs: 'none', sm: 'block' } }} />
            
            <Stack direction="row" spacing={1.5} alignItems="center">
                <PeopleIcon sx={{ color: 'success.main' }} />
                <Box>
                    <Typography variant="h6" fontWeight="bold" lineHeight={1}>{totals.totalUsers || 0}</Typography>
                    <Typography variant="caption" color="text.secondary" fontWeight="bold">USUARIOS ACTIVOS</Typography>
                </Box>
            </Stack>
            
            <Divider orientation="vertical" flexItem sx={{ display: { xs: 'none', sm: 'block' } }} />
            
            <Stack direction="row" spacing={1.5} alignItems="center">
                <HistoryIcon sx={{ color: 'warning.main' }} />
                <Box>
                    <Typography variant="h6" fontWeight="bold" lineHeight={1}>{totals.totalReservationsHistorical || 0}</Typography>
                    <Typography variant="caption" color="text.secondary" fontWeight="bold">RESERVAS HISTÓRICAS</Typography>
                </Box>
            </Stack>
        </Paper>
    );
};

export default SystemInventoryBar;
