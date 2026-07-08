import { Grid, Card, CardContent, Typography, Stack, Avatar, Box } from '@mui/material';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import MeetingRoomIcon from '@mui/icons-material/MeetingRoom';
import PeopleIcon from '@mui/icons-material/People';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';

/**
 * Componente auxiliar para representar de forma individual un Indicador Clave de Rendimiento (KPI).
 *
 * @param props - Propiedades de la tarjeta KPI.
 * @param props.title - Título o métrica a mostrar.
 * @param props.value - Valor numérico del indicador.
 * @param props.growth - Porcentaje de crecimiento o decremento respecto al periodo anterior.
 * @param props.icon - Componente de icono a mostrar en la tarjeta.
 * @param props.color - Color principal aplicado al icono y a su fondo.
 * @param props.isPercentage - Indica si el valor debe formatearse con el símbolo de porcentaje.
 * @returns Elemento de React que representa una tarjeta KPI.
 */
const KPICard = ({ title, value, growth, icon: Icon, color, isPercentage }: any) => (
    <Card sx={{ 
        height: '100%', 
        borderRadius: 4, 
        boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
        border: '1px solid #f0f0f0',
        overflow: 'hidden',
        position: 'relative'
    }}>
        <CardContent sx={{ p: 3 }}>
            <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                <Box>
                    <Typography variant="subtitle2" color="text.secondary" fontWeight="600" gutterBottom>
                        {title}
                    </Typography>
                    <Typography variant="h4" fontWeight="bold">
                        {(value || 0).toLocaleString()}{isPercentage ? '%' : ''}
                    </Typography>
                </Box>
                <Avatar sx={{ bgcolor: `${color}15`, color: color, borderRadius: 2, width: 48, height: 48 }}>
                    <Icon />
                </Avatar>
            </Stack>
            
            <Stack direction="row" spacing={0.5} alignItems="center" mt={2}>
                {(growth || 0) >= 0 ? 
                    <TrendingUpIcon sx={{ fontSize: 16, color: '#10b981' }} /> : 
                    <TrendingDownIcon sx={{ fontSize: 16, color: '#ef4444' }} />
                }
                <Typography variant="caption" sx={{ color: (growth || 0) >= 0 ? '#10b981' : '#ef4444', fontWeight: 'bold' }}>
                    {(growth || 0) >= 0 ? '+' : ''}{growth || 0}%
                </Typography>
                <Typography variant="caption" color="text.secondary">
                    vs periodo anterior
                </Typography>
            </Stack>
        </CardContent>
    </Card>
);

/**
 * Propiedades del componente KPISection.
 */
interface KPISectionProps {
    stats: {
        totalReservations: number;
        totalSpaces: number;
        totalUsers: number;
        reservationsGrowth: number;
        spacesGrowth: number;
        usersGrowth: number;
    };
    customLabels?: {
        reservations?: string;
        spaces?: string;
        users?: string;
    };
    customIcons?: {
        reservations?: any;
        spaces?: any;
        users?: any;
    };
    isPercentage?: boolean;
}

/**
 * Sección del cuadro de mando dedicada a la visualización agrupada de Indicadores Claves de Rendimiento (KPIs).
 *
 * @param props - Propiedades del componente.
 * @param props.stats - Objeto que contiene las estadísticas globales y sus respectivos crecimientos.
 * @param props.customLabels - Etiquetas personalizadas para sustituir los títulos por defecto.
 * @param props.customIcons - Iconos personalizados para los diferentes indicadores.
 * @param props.isPercentage - Indicador global para formatear el tercer KPI como porcentaje.
 * @returns Elemento de React con la cuadrícula de tarjetas KPI.
 */
const KPISection = ({ stats, customLabels, customIcons, isPercentage }: KPISectionProps) => (
    <Grid container spacing={3} mb={5}>
        <Grid item xs={12} sm={6} md={4}>
            <KPICard 
                title={customLabels?.reservations || "SOLICITUDES DE RESERVA"} 
                value={stats.totalReservations} 
                growth={stats.reservationsGrowth} 
                icon={customIcons?.reservations || CalendarMonthIcon}
                color="#6366f1"
            />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
            <KPICard 
                title={customLabels?.spaces || "USUARIOS CON ACTIVIDAD"} 
                value={stats.totalSpaces} 
                growth={stats.spacesGrowth} 
                icon={customIcons?.spaces || PeopleIcon}
                color="#10b981"
            />
        </Grid>
        <Grid item xs={12} md={4}>
            <KPICard 
                title={customLabels?.users || "RATIO DE USO DE ESPACIOS"} 
                value={stats.totalUsers} 
                growth={stats.usersGrowth} 
                icon={customIcons?.users || MeetingRoomIcon}
                color="#f59e0b"
                isPercentage={isPercentage ?? true}
            />
        </Grid>
    </Grid>
);

export default KPISection;
