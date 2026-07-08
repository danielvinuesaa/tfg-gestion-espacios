import { useAuth } from '../../../context/AuthContext';
import {
    Container,
    Typography,
    Grid,
    Box,
    CircularProgress,
    Stack,
    Fade,
    Alert,
    Button
} from '@mui/material';
import PeopleIcon from '@mui/icons-material/People';
import MeetingRoomIcon from '@mui/icons-material/MeetingRoom';
import AssignmentIcon from '@mui/icons-material/Assignment';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import RefreshIcon from '@mui/icons-material/Refresh';

// Hooks y Componentes modularizados
import { useDashboardStats } from '../hooks/useDashboardStats';
import SystemInventoryBar from '../components/SystemInventoryBar';
import DashboardHeader from '../components/DashboardHeader';
import KPISection from '../components/KPISection';
import WeeklyActivityChart from '../components/WeeklyActivityChart';
import OccupancyByTypeChart from '../components/OccupancyByTypeChart';
import StatusDistributionChart from '../components/StatusDistributionChart';
import TopSpacesChart from '../components/TopSpacesChart';
import RecentActivity from '../components/RecentActivity';
import UpcomingEvents from '../components/UpcomingEvents';
import PageLoader from '../../../shared/components/PageLoader';

/**
 * Genera la configuración dinámica de etiquetas e iconos a utilizar en el panel, 
 * variando según el nivel de privilegios del usuario.
 *
 * @param isGlobal - Indica si el usuario posee acceso global (vista de administrador).
 * @returns Un objeto que contiene los textos e iconos correspondientes a la vista.
 */
const getDashboardConfig = (isGlobal: boolean) => ({
    labels: isGlobal ? {
        reservations: "SOLICITUDES DE RESERVA",
        spaces: "USUARIOS CON ACTIVIDAD",
        users: "RATIO DE USO DE ESPACIOS"
    } : {
        reservations: "MIS SOLICITUDES",
        spaces: "TIEMPO EN EL AULA (h)",
        users: "TASA DE APROBACIÓN"
    },
    icons: isGlobal ? {
        reservations: AssignmentIcon,
        spaces: PeopleIcon,
        users: MeetingRoomIcon
    } : {
        reservations: AssignmentIcon,
        spaces: AccessTimeIcon,
        users: CheckCircleIcon
    }
});

/**
 * Componente principal de la página del Panel de Control (Dashboard).
 * Gestiona la obtención y orquestación de datos estadísticos para mostrarlos
 * de manera estructurada a través de distintos componentes visuales (gráficos, listas y KPIs),
 * adaptando su contenido en función de los permisos del usuario activo.
 *
 * @returns Un elemento JSX que compone la vista completa del panel de control.
 */
const DashboardPage = () => {
    const { hasPermission, user } = useAuth();
    const canSeeGlobal = hasPermission('GENERAR_INFORMES') || user?.role === 'ADMIN';

    const {
        stats, loading, refreshing, error,
        dateRange, setDateRange, refresh
    } = useDashboardStats();

    const config = getDashboardConfig(canSeeGlobal);

    if (loading && !stats) {
        return <PageLoader message="Cargando inteligencia de datos..." />;
    }

    if (error) {
        return (
            <Container sx={{ mt: 8 }}>
                <Alert 
                    severity="error" 
                    variant="filled" 
                    action={<Button color="inherit" size="small" onClick={() => refresh()} startIcon={<RefreshIcon />}>Reintentar</Button>}
                >
                    {error}
                </Alert>
            </Container>
        );
    }

    if (!stats) return null;

    return (
        <Container maxWidth="xl" sx={{ mt: 2, mb: 6 }}>
            {/* Título y Resumen del Inventario */}
            <Box sx={{ mb: 4 }}>
                <Typography variant="h4" fontWeight="800" color="text.primary" gutterBottom>
                    {canSeeGlobal ? "Dashboard de Análisis" : "Mi Actividad"}
                </Typography>
                
                <SystemInventoryBar 
                    totals={stats.systemTotals} 
                    isGlobal={canSeeGlobal} 
                />
            </Box>

            {/* Controles de Rango de Fechas */}
            <DashboardHeader 
                dateRange={dateRange} 
                onDateRangeChange={setDateRange} 
            />

            {/* Indicador de actualización de fondo */}
            <Box sx={{ height: 16, mb: 1, mt: 1 }}>
                <Fade in={refreshing}>
                    <Stack direction="row" spacing={1} alignItems="center" justifyContent="center">
                        <CircularProgress size={12} thickness={5} />
                        <Typography variant="caption" color="text.secondary">Sincronizando periodo...</Typography>
                    </Stack>
                </Fade>
            </Box>
            
            {/* KPIs Dinámicos */}
            <KPISection 
                stats={{
                    totalReservations: stats.periodActivity.reservationsCount,
                    totalSpaces: stats.periodActivity.activeUsersCount,
                    totalUsers: stats.periodActivity.occupancyRatio,
                    reservationsGrowth: stats.periodActivity.reservationsGrowth,
                    spacesGrowth: stats.periodActivity.usersGrowth,
                    usersGrowth: 0
                }}
                customLabels={config.labels}
                customIcons={config.icons}
            />

            {/* Gráficos y Listas de Actividad */}
            <Grid container spacing={3}>
                <Grid item xs={12}>
                    <WeeklyActivityChart data={stats.periodActivity.weeklyActivity} />
                </Grid>

                {canSeeGlobal ? (
                    <>
                        <Grid item xs={12} lg={7}>
                            <OccupancyByTypeChart data={stats.periodActivity.occupancyByType} />
                        </Grid>
                        <Grid item xs={12} lg={5}>
                            <StatusDistributionChart data={stats.periodActivity.reservationsByStatus} />
                        </Grid>
                        <Grid item xs={12} lg={6}>
                            <UpcomingEvents events={stats.upcomingEvents} />
                        </Grid>
                        <Grid item xs={12} lg={6}>
                            <RecentActivity activities={stats.recentActivity} isDashboard={true} />
                        </Grid>
                        <Grid item xs={12}>
                            <TopSpacesChart data={stats.periodActivity.reservationsBySpace} />
                        </Grid>
                    </>
                ) : (
                    <>
                        <Grid item xs={12}>
                            <StatusDistributionChart data={stats.periodActivity.reservationsByStatus} />
                        </Grid>
                        <Grid item xs={12} lg={6}>
                            <UpcomingEvents events={stats.upcomingEvents} />
                        </Grid>
                        <Grid item xs={12} lg={6}>
                            <RecentActivity activities={stats.recentActivity} isDashboard={true} />
                        </Grid>
                    </>
                )}
            </Grid>
        </Container>
    );
};

export default DashboardPage;
